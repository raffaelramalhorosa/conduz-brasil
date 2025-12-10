import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NearbyInstructor {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  latitude: number;
  longitude: number;
  average_rating: number | null;
  total_reviews: number | null;
  is_online: boolean | null;
  distance_km: number;
  categories: string[] | null;
}

interface UseNearbyInstructorsParams {
  lat: number | null;
  lng: number | null;
  radiusKm?: number;
  minRating?: number;
  maxResults?: number;
}

export const useNearbyInstructors = ({
  lat,
  lng,
  radiusKm = 10,
  minRating = 0,
  maxResults = 100,
}: UseNearbyInstructorsParams) => {
  const [instructors, setInstructors] = useState<NearbyInstructor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInstructors = useCallback(async () => {
    if (!lat || !lng) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('nearby_instructors', {
        user_lat: lat,
        user_lng: lng,
        radius_km: radiusKm,
        min_rating: minRating,
        max_results: maxResults,
      });

      if (rpcError) throw rpcError;

      setInstructors(data || []);
    } catch (err) {
      console.error('Error fetching nearby instructors:', err);
      setError('Erro ao buscar instrutores próximos');
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radiusKm, minRating, maxResults]);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  return { instructors, loading, error, refetch: fetchInstructors };
};
