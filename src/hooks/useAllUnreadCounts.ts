import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAllUnreadCounts() {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchUnreadCounts = useCallback(async () => {
    if (!user) {
      setUnreadCounts({});
      setTotalUnread(0);
      return;
    }

    try {
      // Fetch all unread messages not sent by the current user
      const { data, error } = await supabase
        .from('chat_messages')
        .select('conversation_id')
        .eq('is_read', false)
        .neq('sender_id', user.id)
        .not('conversation_id', 'is', null);

      if (error) throw error;

      // Count messages per conversation
      const counts: Record<string, number> = {};
      (data || []).forEach((msg) => {
        if (msg.conversation_id) {
          counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1;
        }
      });

      setUnreadCounts(counts);
      setTotalUnread(Object.values(counts).reduce((a, b) => a + b, 0));
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('all-unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          // Refetch counts on any change
          fetchUnreadCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchUnreadCounts]);

  return {
    unreadCounts,
    totalUnread,
    refetch: fetchUnreadCounts,
  };
}
