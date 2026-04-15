import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { routes, getDashboardRoute } from '@/lib/routes';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserTypes?: ('student' | 'instructor' | 'driving_school')[];
  requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedUserTypes,
  requireOnboarding = true
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [onboardingStatus, setOnboardingStatus] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || !profile) {
        setCheckingOnboarding(false);
        return;
      }

      // Only check onboarding for instructors/driving schools
      if (profile.user_type !== 'instructor' && profile.user_type !== 'driving_school') {
        setOnboardingStatus(true); // Students don't need onboarding
        setCheckingOnboarding(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('instructor_profiles')
          .select('onboarding_completed, verification_status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking onboarding status:', error);
          setOnboardingStatus(false);
        } else if (data) {
          const completed = data.onboarding_completed;
          setOnboardingStatus(completed === true);
        } else {
          setOnboardingStatus(false);
        }
      } catch (err) {
        console.error('Exception checking onboarding:', err);
        setOnboardingStatus(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user, profile]);

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={routes.login} state={{ from: location.pathname }} replace />;
  }

  // Check email verification - OAuth users are already verified by provider
  const isVerifyRoute = location.pathname === '/verificar-email';
  const isOAuthUser = user?.app_metadata?.provider === 'google' || user?.app_metadata?.providers?.includes('google');
  const isConfirmed = !!user?.email_confirmed_at || isOAuthUser;
  if (!isVerifyRoute && user && !isConfirmed) {
    return <Navigate to="/verificar-email" state={{ email: user.email }} replace />;
  }

  if (allowedUserTypes && profile && !allowedUserTypes.includes(profile.user_type)) {
    // Redirect to appropriate dashboard based on user type
    const redirectPath = getDashboardRoute(profile.user_type);
    return <Navigate to={redirectPath} replace />;
  }

  // Check if instructor/driving_school needs to complete onboarding
  // Only redirect if onboarding is explicitly required AND not completed
  // Skip this check if the user's onboarding status is already true or null (loading)
  const isInstructorType = profile?.user_type === 'instructor' || profile?.user_type === 'driving_school';
  const isOnboardingRoute = location.pathname.startsWith('/onboarding-instrutor') || location.pathname.startsWith('/onboarding-autoescola');
  
  // Only force onboarding redirect if:
  // 1. requireOnboarding is true
  // 2. User is instructor type
  // 3. onboardingStatus is explicitly false (not null/undefined which means still checking)
  // 4. Not already on an onboarding route
  if (requireOnboarding && isInstructorType && onboardingStatus === false && !isOnboardingRoute) {
    // Redirect to appropriate onboarding based on user type
    const onboardingPath = profile?.user_type === 'driving_school' 
      ? '/onboarding-autoescola/dados-basicos' 
      : '/onboarding-instrutor';
    return <Navigate to={onboardingPath} replace />;
  }

  return <>{children}</>;
};
