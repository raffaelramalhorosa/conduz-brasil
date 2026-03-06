import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Balance {
  available_balance: number;
  pending_balance: number;
  total_withdrawn: number;
}

export function useBalance() {
  const { profile } = useAuth();
  const [balance, setBalance] = useState<Balance>({ available_balance: 0, pending_balance: 0, total_withdrawn: 0 });
  const [loading, setLoading] = useState(true);
  const [entityId, setEntityId] = useState<string | null>(null);
  const [isSchool, setIsSchool] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profile?.id) return;
      const { data } = await supabase
        .from('instructor_profiles')
        .select('id, is_driving_school')
        .eq('user_id', profile.id)
        .maybeSingle();
      if (data) {
        setEntityId(data.id);
        setIsSchool(!!data.is_driving_school);
      }
    };
    fetchProfile();
  }, [profile?.id]);

  const fetchBalance = useCallback(async () => {
    if (!entityId) { setLoading(false); return; }
    setLoading(true);
    try {
      const fn = isSchool ? 'get_school_balance' : 'get_instructor_balance';
      const paramName = isSchool ? 'p_school_id' : 'p_instructor_id';
      const { data, error } = await supabase.rpc(fn as any, { [paramName]: entityId });
      if (error) throw error;
      if (data) setBalance(data as unknown as Balance);
    } catch (err) {
      console.error('Error fetching balance:', err);
    } finally {
      setLoading(false);
    }
  }, [entityId, isSchool]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance, refreshKey]);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  return { balance, loading, entityId, isSchool, refresh, refreshKey };
}
