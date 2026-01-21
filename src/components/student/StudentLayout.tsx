import { Outlet, useLocation } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { PageTransition } from '@/components/PageTransition';

export function StudentLayout() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <NavBar />
      <main className="flex-1 container-custom py-6">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}
