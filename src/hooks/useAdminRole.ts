import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Reads the `is_admin` claim from the signed JWT.
 * Falls back to querying user_roles if the claim is not present
 * (e.g. when the custom_access_token_hook is not yet registered).
 */
export const useAdminRole = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const [, payload] = session.access_token.split('.');
          const claims = JSON.parse(atob(payload));

          if (typeof claims.is_admin === 'boolean') {
            // JWT claim present — use it (no DB roundtrip)
            setIsAdmin(claims.is_admin);
            setLoading(false);
            return;
          }
        }

        // Fallback: query user_roles directly
        const { data } = await supabase
          .from('user_roles' as any)
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        setIsAdmin(!!data);
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();

    // Re-check whenever the session refreshes (token rotation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      try {
        const [, payload] = session.access_token.split('.');
        const claims = JSON.parse(atob(payload));
        if (typeof claims.is_admin === 'boolean') {
          setIsAdmin(claims.is_admin);
          setLoading(false);
          return;
        }
      } catch {
        // ignore parse errors
      }
      // Fallback query on auth state change
      supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle()
        .then(({ data }) => {
          setIsAdmin(!!data);
          setLoading(false);
        });
    });

    return () => subscription.unsubscribe();
  }, [user]);

  return { isAdmin, loading };
};
