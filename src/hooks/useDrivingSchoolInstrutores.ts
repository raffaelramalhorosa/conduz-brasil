import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { InstrutorAutoescolaNoMapa } from '@/types/map';

export function useDrivingSchoolInstrutores(
  lat: number | null,
  lng: number | null,
  raioKm: number,
  maxResults = 100
) {
  return useQuery({
    queryKey: ['driving-school-instrutores', lat, lng, raioKm, maxResults],
    queryFn: async (): Promise<InstrutorAutoescolaNoMapa[]> => {
      if (!lat || !lng) return [];

      const { data, error } = await supabase.rpc('nearby_driving_school_instructors' as any, {
        user_lat: lat,
        user_lng: lng,
        radius_km: raioKm,
        max_results: maxResults,
      });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        id: d.id,
        driving_school_id: d.driving_school_id,
        driving_school_name: d.driving_school_name,
        driving_school_logo: d.driving_school_logo,
        instructor_name: d.instructor_name,
        photo_url: d.photo_url,
        bio: d.bio,
        phone: d.phone,
        license_categories: d.license_categories || [],
        latitude: d.latitude,
        longitude: d.longitude,
        distance_km: d.distance_km || 0,
      }));
    },
    enabled: lat !== null && lng !== null,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
