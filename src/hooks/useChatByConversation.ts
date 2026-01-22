import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatMessage {
  id: string;
  conversation_id: string | null;
  booking_id: string | null;
  sender_id: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export function useChatByConversation(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, booking_id, sender_id, message, is_read, read_at, created_at')
        .match({ conversation_id: conversationId })
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Map data adding conversation_id
      const mappedData: ChatMessage[] = (data || []).map(row => ({
        ...row,
        conversation_id: conversationId,
      }));
      
      setMessages(mappedData);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  const sendMessage = async (messageText: string, bookingContext?: string) => {
    if (!conversationId || !user || !messageText.trim()) return false;

    setSending(true);
    try {
      const insertData: Record<string, unknown> = {
        conversation_id: conversationId,
        sender_id: user.id,
        message: messageText.trim(),
      };
      
      if (bookingContext) {
        insertData.booking_id = bookingContext;
      }

      const { error } = await supabase.from('chat_messages').insert(insertData as any);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    } finally {
      setSending(false);
    }
  };

  const markAsRead = useCallback(async () => {
    if (!conversationId || !user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true, read_at: new Date().toISOString() } as any)
        .match({ conversation_id: conversationId, is_read: false })
        .neq('sender_id', user.id);
      
      if (error) console.error('Error marking as read:', error);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  };
}
