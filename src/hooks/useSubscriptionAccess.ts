import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionAccess {
  hasAccess: boolean;
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'suspended' | 'no_subscription' | null;
  trialDaysRemaining: number | null;
  trialEndsAt: string | null;
  periodEnd: string | null;
  loading: boolean;
  error: string | null;
}

export function useSubscriptionAccess(): SubscriptionAccess {
  const { user, profile } = useAuth();

  const ownerType: 'instructor' | 'school' =
    profile?.user_type === 'driving_school' ? 'school' : 'instructor';

  const { data, isLoading, error } = useQuery({
    queryKey: ['subscription-access', user?.id, ownerType],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_subscription_access', {
        p_owner_id: user!.id,
        p_owner_type: ownerType,
      });
      if (error) throw error;
      return data as Record<string, unknown>;
    },
    enabled: !!user?.id && !!profile?.user_type && profile.user_type !== 'student',
    staleTime: 1000 * 60 * 5,       // considera fresco por 5 min
    refetchInterval: 1000 * 60 * 5, // polling a cada 5 min
    refetchOnWindowFocus: true,
  });

  if (!user || !profile || profile.user_type === 'student') {
    return { hasAccess: true, status: null, trialDaysRemaining: null, trialEndsAt: null, periodEnd: null, loading: false, error: null };
  }

  if (isLoading || !data) {
    return { hasAccess: true, status: null, trialDaysRemaining: null, trialEndsAt: null, periodEnd: null, loading: isLoading, error: null };
  }

  return {
    hasAccess: Boolean(data.has_access),
    status: (data.status ?? data.reason ?? null) as SubscriptionAccess['status'],
    trialDaysRemaining: typeof data.days_remaining === 'number' ? data.days_remaining : null,
    trialEndsAt: typeof data.trial_ends_at === 'string' ? data.trial_ends_at : null,
    periodEnd: typeof data.current_period_end === 'string' ? data.current_period_end : null,
    loading: false,
    error: error ? 'Não foi possível verificar sua assinatura.' : null,
  };
}
