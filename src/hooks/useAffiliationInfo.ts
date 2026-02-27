import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AffiliationInfo {
  user_id: string;
  is_affiliated: boolean;
  driving_school_name: string | null;
  driving_school_logo: string | null;
  driving_school_id: string;
}

export interface AffiliationEntry {
  driving_school_id: string;
  driving_school_name: string | null;
  driving_school_logo: string | null;
  status: string;
}

export interface AffiliationInfoMulti {
  user_id: string;
  affiliations: AffiliationEntry[];
  is_affiliated: boolean;
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
// Returns multi-affiliation data
export function useInstructorAffiliation(instructorProfileId: string | null) {
  return useQuery({
    queryKey: ['instructor-affiliation', instructorProfileId],
    queryFn: async (): Promise<AffiliationInfoMulti | null> => {
      if (!instructorProfileId) return null;

      const { data: profile } = await supabase
        .from('instructor_profiles')
        .select('user_id')
        .eq('id', instructorProfileId)
        .maybeSingle();

      if (!profile?.user_id) return null;

      // Fetch ALL active affiliations
      const { data: affiliations, error } = await supabase
        .from('driving_school_instructors')
        .select('driving_school_id, status')
        .eq('linked_user_id', profile.user_id)
        .eq('status', 'active');

      if (error || !affiliations || affiliations.length === 0) {
        return { user_id: profile.user_id, affiliations: [], is_affiliated: false };
      }

      // Fetch school names and logos
      const schoolIds = affiliations.map(a => a.driving_school_id);
      const { data: schoolProfiles } = await supabase
        .from('instructor_profiles')
        .select('id, user_id')
        .in('id', schoolIds);

      const schoolUserIds = (schoolProfiles || []).map(p => p.user_id);
      const { data: schoolNames } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', schoolUserIds);

      const nameMap = new Map((schoolNames || []).map(s => [s.id, s]));
      const profileMap = new Map((schoolProfiles || []).map(p => [p.id, p.user_id]));

      const enriched: AffiliationEntry[] = affiliations.map(a => {
        const userId = profileMap.get(a.driving_school_id);
        const school = userId ? nameMap.get(userId) : null;
        return {
          driving_school_id: a.driving_school_id,
          driving_school_name: school?.full_name || null,
          driving_school_logo: school?.avatar_url || null,
          status: a.status,
        };
      });

      return { user_id: profile.user_id, affiliations: enriched, is_affiliated: enriched.length > 0 };
    },
    enabled: !!instructorProfileId,
    staleTime: 60_000,
  });
}
