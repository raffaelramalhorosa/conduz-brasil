import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { InstructorHeader } from '../instructor/InstructorHeader';
import { InstructorSidebar } from '../instructor/InstructorSidebar';
import { DashboardSettingsProvider } from '@/contexts/DashboardSettingsContext';

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <DashboardSettingsProvider>
      <div className="min-h-screen bg-instructor-dark-primary">
        <InstructorHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <InstructorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content */}
        <main className="lg:ml-[240px] pt-[70px] min-h-screen">
          <Outlet />
        </main>
      </div>
    </DashboardSettingsProvider>
  );
}
