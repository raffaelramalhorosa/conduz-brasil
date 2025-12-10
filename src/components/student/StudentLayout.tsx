import { Outlet } from 'react-router-dom';
import { StudentHeader } from './StudentHeader';
import Footer from '@/components/Footer';

export function StudentLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <StudentHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
