import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadMessages(bookingId: string | null) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Helper to extract real booking ID (strip slot suffix)
  const getRealBookingId = (id: string | null): string | null => {
    if (!id) return null;
    if (id.includes('-slot-')) {
      return id.split('-slot-')[0];
    }
    return id;
  };

  const realBookingId = getRealBookingId(bookingId);

  const fetchUnreadCount = useCallback(async () => {
    if (!realBookingId || !user) {
      setUnreadCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('booking_id', realBookingId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [realBookingId, user]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!realBookingId || !user) return;

    const channel = supabase
      .channel(`unread-${realBookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `booking_id=eq.${realBookingId}`,
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
          filter: `booking_id=eq.${realBookingId}`,
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
  }, [realBookingId, user, fetchUnreadCount]);

  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    unreadCount,
    refetch: fetchUnreadCount,
    resetUnreadCount,
  };
}
