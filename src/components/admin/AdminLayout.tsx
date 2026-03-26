import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import { InstructorHeader } from '../instructor/InstructorHeader';
import { InstructorSidebar } from '../instructor/InstructorSidebar';
import { DashboardSettingsProvider, useDashboardSettings } from '@/contexts/DashboardSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PendingApprovalGate from '@/components/auth/PendingApprovalGate';
import { applySchoolTheme, clearSchoolTheme } from '@/lib/schoolTheme';

// Rotas isentas do guard de assinatura
const SUBSCRIPTION_EXEMPT_PATHS = ['/admin/assinaturas'];

function AdminLayoutInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, user } = useAuth();
  const location = useLocation();
  const { settings, isLoading: settingsLoading } = useDashboardSettings();
  const isDrivingSchool = profile?.user_type === 'driving_school';

  const { data: instructorProfile } = useQuery({
    queryKey: ['instructor-profile-verification', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('instructor_profiles')
        .select('verification_status')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Apply full theme (school vars + shadcn overrides) via centralized utility
  useEffect(() => {
    if (!settings) return;

    applySchoolTheme({
      primary_color: settings.primary_color || '#FF8C00',
      secondary_color: settings.secondary_color || '#1a1a2e',
      accent_color: settings.accent_color || '#F59E0B',
      background_color: settings.background_color || '#0f0f23',
    });

    return () => {
      clearSchoolTheme();
    };
  }, [settings]);

  const containerStyle: React.CSSProperties = {
    fontFamily: "'Roboto', sans-serif",
  };

  const verificationStatus = instructorProfile?.verification_status ?? null;

  // Wait for settings AND font to load before rendering dashboard
  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <PendingApprovalGate
      verificationStatus={verificationStatus}
      userName={profile?.full_name}
    >
      <div className="min-h-screen bg-background" style={containerStyle}>
        <InstructorHeader
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          logoUrl={isDrivingSchool ? settings?.logo_url : undefined}
        />
        <InstructorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isDrivingSchool={isDrivingSchool} />
        
        <main className="lg:ml-[240px] pt-[70px] min-h-screen overflow-x-hidden">
          {SUBSCRIPTION_EXEMPT_PATHS.includes(location.pathname) ? (
            <Outlet />
          ) : (
            <SubscriptionGuard>
              <Outlet />
            </SubscriptionGuard>
          )}
        </main>
      </div>
    </PendingApprovalGate>
  );
}

export function AdminLayout() {
  return (
    <DashboardSettingsProvider>
      <AdminLayoutInner />
    </DashboardSettingsProvider>
  );
}
