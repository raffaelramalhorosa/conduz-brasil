import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useMpConnection() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mpEmail, setMpEmail] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: ip } = await supabase
        .from('instructor_profiles')
        .select('id, is_driving_school')
        .eq('user_id', user.id)
        .single();

      if (!ip) {
        setLoading(false);
        return;
      }

      const field = ip.is_driving_school ? 'driving_school_id' : 'instructor_id';
      const { data } = await supabase
        .from('mp_connected_accounts')
        .select('id, is_active, mp_email')
        .eq(field, ip.id)
        .eq('is_active', true)
        .maybeSingle();

      setIsConnected(!!data);
      setMpEmail(data?.mp_email || null);
    } catch (err) {
      console.error('Error checking MP connection:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const startOAuth = async () => {
    if (!user) return;

    const { data, error } = await supabase.functions.invoke('mp-oauth-url', {
      body: { user_id: user.id },
    });

    if (error || !data?.oauth_url) {
      console.error('Failed to get OAuth URL:', error);
      return;
    }

    window.location.href = data.oauth_url;
  };

  const disconnect = async () => {
    if (!user) return;

    try {
      const { data: ip } = await supabase
        .from('instructor_profiles')
        .select('id, is_driving_school')
        .eq('user_id', user.id)
        .single();

      if (!ip) return;

      const field = ip.is_driving_school ? 'driving_school_id' : 'instructor_id';
      await supabase
        .from('mp_connected_accounts')
        .update({ is_active: false, disconnected_at: new Date().toISOString() })
        .eq(field, ip.id);

      setIsConnected(false);
      setMpEmail(null);
    } catch (err) {
      console.error('Error disconnecting MP:', err);
    }
  };

  return {
    isConnected,
    loading,
    mpEmail,
    startOAuth,
    disconnect,
    recheckConnection: checkConnection,
  };
}
