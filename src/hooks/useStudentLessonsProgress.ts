import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LessonProgress {
  completedLessons: number;
  totalHours: number;
  loading: boolean;
  error: string | null;
}

const MINIMUM_LESSONS = 2; // Minimum required by law
const RECOMMENDED_LESSONS = 10; // Recommended by platform

export function useStudentLessonsProgress(): LessonProgress & { 
  minLessons: number; 
  recommendedLessons: number;
  isLegallyReady: boolean;
  isFullyReady: boolean;
} {
  const { user } = useAuth();
  const [completedLessons, setCompletedLessons] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLessons() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First get the student profile ID
        const { data: studentProfile, error: profileError } = await supabase
          .from('student_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          // User might not have a student profile yet
          if (profileError.code === 'PGRST116') {
            setCompletedLessons(0);
            setTotalHours(0);
            setLoading(false);
            return;
          }
          throw profileError;
        }

        // Fetch completed bookings
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('id, duration_hours, completed_at')
          .eq('student_id', studentProfile.id)
          .eq('status', 'completed');

        if (bookingsError) throw bookingsError;

        const lessons = bookings?.length || 0;
        const hours = bookings?.reduce((sum, b) => sum + (b.duration_hours || 0), 0) || 0;

        setCompletedLessons(lessons);
        setTotalHours(hours);
      } catch (err) {
        console.error('Error fetching lesson progress:', err);
        setError('Não foi possível carregar o progresso das aulas');
      } finally {
        setLoading(false);
      }
    }

    fetchLessons();
  }, [user?.id]);

  return {
    completedLessons,
    totalHours,
    loading,
    error,
    minLessons: MINIMUM_LESSONS,
    recommendedLessons: RECOMMENDED_LESSONS,
    isLegallyReady: completedLessons >= MINIMUM_LESSONS,
    isFullyReady: completedLessons >= RECOMMENDED_LESSONS,
  };
}
