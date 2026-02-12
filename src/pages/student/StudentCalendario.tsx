import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { CalendarioAulas } from '@/components/calendario/CalendarioAulas';
import { useCalendarioBookings } from '@/hooks/useCalendarioBookings';
import { useIsMobile } from '@/hooks/use-mobile';
import type { BookingCalendario } from '@/components/calendario/CalendarioAulas';

export default function StudentCalendario() {
  const isMobile = useIsMobile();
  const [view, setView] = useState<'day' | 'week'>(isMobile ? 'day' : 'week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { bookings, loading } = useCalendarioBookings('student');

  const handleBookingClick = (booking: BookingCalendario) => {
    // Detail handled internally
  };

  return (
    <div className="container py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Calendário</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Visualize suas aulas em formato de agenda
        </p>
      </div>

      <CalendarioAulas
        bookings={bookings}
        view={view}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onViewChange={setView}
        onBookingClick={handleBookingClick}
        userRole="student"
        loading={loading}
      />
    </div>
  );
}
