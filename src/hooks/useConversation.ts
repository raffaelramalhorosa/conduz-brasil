import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Conversation {
  id: string;
  student_id: string;
  instructor_id: string;
  created_at: string;
  updated_at: string;
}

export function useConversation() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  /**
   * Get or create a conversation between the current student and an instructor
   * Returns the conversation_id
   */
  const getOrCreateConversation = useCallback(async (
    studentProfileId: string,
    instructorProfileId: string
  ): Promise<string | null> => {
    if (!user) return null;

    setLoading(true);
    try {
      // First, try to find existing conversation using raw query
      const { data: existing, error: findError } = await (supabase
        .from('conversations' as any)
        .select('id')
        .eq('student_id', studentProfileId)
        .eq('instructor_id', instructorProfileId)
        .maybeSingle() as any);

      if (findError) {
        console.error('Error finding conversation:', findError);
        return null;
      }

      if (existing) {
        return existing.id;
      }

      // Create new conversation
      const { data: newConv, error: createError } = await (supabase
        .from('conversations' as any)
        .insert({
          student_id: studentProfileId,
          instructor_id: instructorProfileId,
        })
        .select('id')
        .single() as any);

      if (createError) {
        // Handle unique constraint violation (race condition)
        if (createError.code === '23505') {
          // Fetch the existing one
          const { data: retryFind } = await (supabase
            .from('conversations' as any)
            .select('id')
            .eq('student_id', studentProfileId)
            .eq('instructor_id', instructorProfileId)
            .single() as any);
          return retryFind?.id || null;
        }
        console.error('Error creating conversation:', createError);
        return null;
      }

      return newConv?.id || null;
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Find conversation by booking (using the booking's student/instructor)
   */
  const getConversationByBooking = useCallback(async (
    bookingId: string
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      // Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('student_id, instructor_id')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        console.error('Error fetching booking:', bookingError);
        return null;
      }

      // Find or create conversation for this pair
      return await getOrCreateConversation(booking.student_id, booking.instructor_id);
    } catch (error) {
      console.error('Error in getConversationByBooking:', error);
      return null;
    }
  }, [user, getOrCreateConversation]);

  /**
   * Get all conversations for current user
   */
  const getMyConversations = useCallback(async (): Promise<Conversation[]> => {
    if (!user) return [];

    try {
      const { data, error } = await (supabase
        .from('conversations' as any)
        .select('*')
        .order('updated_at', { ascending: false }) as any);

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      return (data as unknown as Conversation[]) || [];
    } catch (error) {
      console.error('Error in getMyConversations:', error);
      return [];
    }
  }, [user]);

  return {
    loading,
    getOrCreateConversation,
    getConversationByBooking,
    getMyConversations,
  };
}
