import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadByConversation(conversationId: string | null) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!conversationId || !user) {
      setUnreadCount(0);
      return;
    }

    try {
      // Use match for simpler type inference
      const { count, error } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .match({ conversation_id: conversationId, is_read: false })
        .neq('sender_id', user.id);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`unread-conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Only increment if the message is from someone else
          if (payload.new.sender_id !== user.id) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // If message was marked as read, refetch count
          if (payload.new.is_read && !payload.old.is_read) {
            fetchUnreadCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, fetchUnreadCount]);

  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    unreadCount,
    refetch: fetchUnreadCount,
    resetUnreadCount,
  };
}
