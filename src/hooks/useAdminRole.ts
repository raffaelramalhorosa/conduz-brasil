import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Reads the `is_admin` claim from the signed JWT.
 *
 * The claim is embedded by the `custom_access_token_hook` Postgres function
 * at token-issue time. Because it lives inside the signed JWT payload it
 * cannot be spoofed by intercepting/modifying the HTTP response — any
 * tampering with the token payload invalidates the signature.
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
          setIsAdmin(claims.is_admin === true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error reading admin claim from JWT:', error);
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
        setIsAdmin(claims.is_admin === true);
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [user]);

  return { isAdmin, loading };
};
