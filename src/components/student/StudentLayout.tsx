import { Outlet, useLocation } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { PageTransition } from '@/components/PageTransition';

export function StudentLayout() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <NavBar />
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
