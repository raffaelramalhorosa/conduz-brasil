import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { InstructorHeader } from './InstructorHeader';
import { InstructorSidebar } from './InstructorSidebar';

export function InstructorDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-instructor-dark-primary">
      <InstructorHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <InstructorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <main className="lg:ml-[240px] pt-[70px] min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
