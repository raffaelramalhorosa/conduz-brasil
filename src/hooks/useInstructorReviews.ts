import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Review {
  id: string;
  studentName: string;
  studentPhoto: string | null;
  rating: number;
  teachingRating: number | null;
  punctualityRating: number | null;
  vehicleRating: number | null;
  valueRating: number | null;
  date: string;
  comment: string | null;
  instructorReply: string | null;
}

interface UseInstructorReviewsResult {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: { stars: number; count: number; percentage: number }[];
  refetch: () => void;
}

export const useInstructorReviews = (instructorId: string): UseInstructorReviewsResult => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    if (!instructorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch reviews with student profile info
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          overall_rating,
          teaching_rating,
          punctuality_rating,
          vehicle_rating,
          value_rating,
          comment,
          instructor_response,
          created_at,
          student_id
        `)
        .eq('instructor_id', instructorId)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Fetch student profiles for each review
      const studentIds = [...new Set(reviewsData?.map(r => r.student_id) || [])];
      
      const { data: studentProfiles } = await supabase
        .from('student_profiles')
        .select('id, user_id')
        .in('id', studentIds);

      const userIds = studentProfiles?.map(sp => sp.user_id) || [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      // Map student_id to profile info
      const studentProfileMap = new Map(studentProfiles?.map(sp => [sp.id, sp.user_id]));
      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      const formattedReviews: Review[] = (reviewsData || []).map(review => {
        const userId = studentProfileMap.get(review.student_id);
        const profile = userId ? profileMap.get(userId) : null;

        return {
          id: review.id,
          studentName: profile?.full_name || 'Aluno',
          studentPhoto: profile?.avatar_url || null,
          rating: review.overall_rating,
          teachingRating: review.teaching_rating,
          punctualityRating: review.punctuality_rating,
          vehicleRating: review.vehicle_rating,
          valueRating: review.value_rating,
          date: review.created_at,
          comment: review.comment,
          instructorReply: review.instructor_response,
        };
      });

      setReviews(formattedReviews);
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [instructorId]);

  // Calculate stats
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  const ratingBreakdown = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => r.rating === stars).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { stars, count, percentage };
  });

  return {
    reviews,
    loading,
    error,
    averageRating,
    totalReviews,
    ratingBreakdown,
    refetch: fetchReviews,
  };
};
