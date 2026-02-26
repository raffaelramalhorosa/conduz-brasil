import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Global hook that listens for new chat messages in real-time.
 * Shows a toast notification and invalidates unread counts.
 * Should be mounted once at layout level.
 */
export function useMessageNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('global-message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const newMsg = payload.new as any;

          // Ignore own messages
          if (newMsg.sender_id === user.id) return;

          try {
            // Fetch sender name
            const { data: sender } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', newMsg.sender_id)
              .single();

            const senderName = sender?.full_name || 'Alguém';
            const preview = newMsg.message?.length > 80
              ? newMsg.message.slice(0, 80) + '...'
              : newMsg.message;

            toast(`${senderName}: ${preview}`, {
              description: 'Nova mensagem recebida',
              duration: 5000,
            });

            // Persist notification (silently)
            try {
              await supabase.from('notifications').insert({
                user_id: user.id,
                type: 'new_message',
                title: `Nova mensagem de ${senderName}`,
                message: preview,
                action_url: newMsg.conversation_id
                  ? `/admin/mensagens`
                  : `/admin/mensagens`,
              });
            } catch {
              // Silently fail
            }
          } catch {
            // Silently fail
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
