import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { InstructorHeader } from '../instructor/InstructorHeader';
import { InstructorSidebar } from '../instructor/InstructorSidebar';
import { DashboardSettingsProvider, useDashboardSettings } from '@/contexts/DashboardSettingsContext';
import { useAuth } from '@/contexts/AuthContext';

function AdminLayoutInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile } = useAuth();
  const { settings } = useDashboardSettings();
  const isDrivingSchool = profile?.user_type === 'driving_school';

  // Apply custom dashboard settings as CSS variables
  const customStyle = isDrivingSchool && settings ? {
    '--school-primary': settings.primary_color,
    '--school-secondary': settings.secondary_color,
    '--school-accent': settings.accent_color,
    '--school-bg': settings.background_color,
    '--school-font': settings.font_family,
    fontFamily: settings.font_family,
  } as React.CSSProperties : undefined;

  return (
    <div className="min-h-screen bg-instructor-dark-primary" style={customStyle}>
      <InstructorHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <InstructorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="lg:ml-[240px] pt-[70px] min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}

export function AdminLayout() {
  return (
    <DashboardSettingsProvider>
      <AdminLayoutInner />
    </DashboardSettingsProvider>
  );
}
