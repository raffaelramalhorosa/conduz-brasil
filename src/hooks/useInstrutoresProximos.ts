import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { InstrutorNoMapa } from '@/types/map';

export function useInstrutoresProximos(
  lat: number | null,
  lng: number | null,
  raioKm: number,
  minRating: number,
  maxResults = 50
) {
  return useQuery({
    queryKey: ['instrutores-proximos', lat, lng, raioKm, minRating, maxResults],
    queryFn: async (): Promise<InstrutorNoMapa[]> => {
      if (!lat || !lng) return [];

      const { data, error } = await supabase.rpc('nearby_instructors', {
        user_lat: lat,
        user_lng: lng,
        radius_km: raioKm,
        min_rating: minRating > 0 ? minRating : undefined,
        max_results: maxResults,
      });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        id: d.id,
        user_id: d.user_id,
        full_name: d.full_name || 'Instrutor',
        avatar_url: d.avatar_url,
        latitude: d.latitude,
        longitude: d.longitude,
        average_rating: d.average_rating || 0,
        total_reviews: d.total_reviews || 0,
        is_online: d.is_online || false,
        distance_km: d.distance_km || 0,
        bio: d.bio,
        categories: d.categories || [],
      }));
    },
    enabled: lat !== null && lng !== null,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
