import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { CalendarioAulas } from '@/components/calendario/CalendarioAulas';
import { useCalendarioBookings } from '@/hooks/useCalendarioBookings';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAutoescolaData } from '@/hooks/useAutoescolaData';
import type { BookingCalendario } from '@/components/calendario/CalendarioAulas';

export default function AdminCalendario() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const isDrivingSchool = profile?.user_type === 'driving_school';
  const role = isDrivingSchool ? 'driving_school' : 'instructor';

  const [view, setView] = useState<'day' | 'week'>(isMobile ? 'day' : 'week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [instructorFilter, setInstructorFilter] = useState('all');

  const { bookings, loading } = useCalendarioBookings(role as 'instructor' | 'driving_school');
  const { instrutores } = useAutoescolaData();

  // Filter bookings by instructor if driving school
  const filteredBookings = instructorFilter === 'all'
    ? bookings
    : bookings.filter(b => b.metadata.instructorName?.includes(
        instrutores.find(i => i.id === instructorFilter)?.nome || ''
      ));

  const handleBookingClick = (booking: BookingCalendario) => {
    // Detail handled internally by calendar
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CalendarIcon className="h-7 w-7 text-instructor-accent" />
          <h1 className="text-2xl font-bold text-white">Calendário</h1>
        </div>
        <p className="text-gray-400">
          Visualize suas aulas em formato de agenda
        </p>
      </div>

      {/* Instructor filter for driving schools */}
      {isDrivingSchool && instrutores.length > 0 && (
        <div className="mb-4">
          <Select value={instructorFilter} onValueChange={setInstructorFilter}>
            <SelectTrigger className="w-full sm:w-64 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Filtrar por instrutor" />
            </SelectTrigger>
            <SelectContent className="bg-instructor-dark-secondary border-white/10">
              <SelectItem value="all" className="text-white hover:bg-white/10">
                Todos os instrutores
              </SelectItem>
              {instrutores.filter(i => i.visivel).map((inst) => (
                <SelectItem key={inst.id} value={inst.id} className="text-white hover:bg-white/10">
                  {inst.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="bg-instructor-dark-secondary border border-white/10 rounded-xl p-4 text-white">
        <CalendarioAulas
          bookings={filteredBookings}
          view={view}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onViewChange={setView}
          onBookingClick={handleBookingClick}
          userRole={role}
          loading={loading}
        />
      </div>
    </div>
  );
}
