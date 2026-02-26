import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { InstructorHeader } from '../instructor/InstructorHeader';
import { InstructorSidebar } from '../instructor/InstructorSidebar';
import { DashboardSettingsProvider, useDashboardSettings } from '@/contexts/DashboardSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PendingApprovalGate from '@/components/auth/PendingApprovalGate';

function loadGoogleFont(font: string) {
  const id = `google-font-${font.replace(/\s/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s/g, '+')}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

function AdminLayoutInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, user } = useAuth();
  const { settings } = useDashboardSettings();
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

  // Apply CSS custom properties globally on document root so sidebar/header/all pages pick them up
  useEffect(() => {
    if (!isDrivingSchool || !settings) return;
    const root = document.documentElement;
    root.style.setProperty('--school-primary', settings.primary_color || '#FF8C00');
    root.style.setProperty('--school-secondary', settings.secondary_color || '#1a1a2e');
    root.style.setProperty('--school-accent', settings.accent_color || '#F59E0B');
    root.style.setProperty('--school-bg', settings.background_color || '#0f0f23');
    root.style.setProperty('--school-font', settings.font_family || 'Inter');
    root.style.setProperty('--school-logo-url', settings.logo_url || '');
    root.style.setProperty('--school-text', (settings as any).text_color || '#F8FAFC');

    return () => {
      root.style.removeProperty('--school-primary');
      root.style.removeProperty('--school-secondary');
      root.style.removeProperty('--school-accent');
      root.style.removeProperty('--school-bg');
      root.style.removeProperty('--school-font');
      root.style.removeProperty('--school-logo-url');
      root.style.removeProperty('--school-text');
    };
  }, [isDrivingSchool, settings]);

  // Load custom Google Font
  useEffect(() => {
    if (isDrivingSchool && settings?.font_family && settings.font_family !== 'Inter') {
      loadGoogleFont(settings.font_family);
    }
  }, [isDrivingSchool, settings?.font_family]);

  const containerStyle: React.CSSProperties = isDrivingSchool && settings ? {
    fontFamily: settings.font_family || 'Inter',
    backgroundColor: settings.background_color || undefined,
  } : {};

  const verificationStatus = instructorProfile?.verification_status ?? null;

  return (
    <PendingApprovalGate
      verificationStatus={verificationStatus}
      userName={profile?.full_name}
    >
      <div className="min-h-screen bg-instructor-dark-primary" style={containerStyle}>
        <InstructorHeader
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          logoUrl={isDrivingSchool ? settings?.logo_url : undefined}
        />
        <InstructorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isDrivingSchool={isDrivingSchool} />
        
        <main className="lg:ml-[240px] pt-[70px] min-h-screen">
          <Outlet />
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
