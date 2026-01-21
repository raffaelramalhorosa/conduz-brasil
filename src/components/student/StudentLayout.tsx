import { Outlet } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export function StudentLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <NavBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
