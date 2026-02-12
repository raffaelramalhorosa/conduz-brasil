import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AffiliationInfo {
  user_id: string;
  is_affiliated: boolean;
  driving_school_name: string | null;
  driving_school_logo: string | null;
  driving_school_id: string;
}

export function useAffiliationInfo(userIds: string[]) {
  return useQuery({
    queryKey: ['affiliation-info', userIds.sort().join(',')],
    queryFn: async (): Promise<Map<string, AffiliationInfo>> => {
      if (userIds.length === 0) return new Map();

      const { data, error } = await supabase.rpc('get_affiliation_info' as any, {
        p_user_ids: userIds,
      });

      if (error) {
        console.error('Error fetching affiliation info:', error);
        return new Map();
      }

      const map = new Map<string, AffiliationInfo>();
      (data || []).forEach((item: any) => {
        map.set(item.user_id, {
          user_id: item.user_id,
          is_affiliated: item.is_affiliated,
          driving_school_name: item.driving_school_name,
          driving_school_logo: item.driving_school_logo,
          driving_school_id: item.driving_school_id,
        });
      });
      return map;
    },
    enabled: userIds.length > 0,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

// Hook to get affiliation info for a single instructor by their instructor_profile ID
export function useInstructorAffiliation(instructorProfileId: string | null) {
  return useQuery({
    queryKey: ['instructor-affiliation', instructorProfileId],
    queryFn: async (): Promise<AffiliationInfo | null> => {
      if (!instructorProfileId) return null;

      // First get the user_id from instructor_profiles
      const { data: profile } = await supabase
        .from('instructor_profiles')
        .select('user_id')
        .eq('id', instructorProfileId)
        .maybeSingle();

      if (!profile?.user_id) return null;

      const { data, error } = await supabase.rpc('get_affiliation_info' as any, {
        p_user_ids: [profile.user_id],
      });

      if (error || !data || data.length === 0) return null;

      const item = data[0] as any;
      return {
        user_id: item.user_id,
        is_affiliated: item.is_affiliated,
        driving_school_name: item.driving_school_name,
        driving_school_logo: item.driving_school_logo,
        driving_school_id: item.driving_school_id,
      };
    },
    enabled: !!instructorProfileId,
    staleTime: 60_000,
  });
}
