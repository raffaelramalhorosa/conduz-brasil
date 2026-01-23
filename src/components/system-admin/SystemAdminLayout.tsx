import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { SystemAdminSidebar } from './SystemAdminSidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

export function SystemAdminLayout() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Desktop Sidebar */}
      {!isMobile && <SystemAdminSidebar />}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 md:hidden bg-zinc-900 text-white hover:bg-zinc-800"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-zinc-900 border-zinc-800">
            <SystemAdminSidebar />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <main className={isMobile ? 'pt-16' : 'ml-64'}>
        <Outlet />
      </main>
    </div>
  );
}
