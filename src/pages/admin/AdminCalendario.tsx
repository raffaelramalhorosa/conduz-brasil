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
import { useDashboardSettings } from '@/contexts/DashboardSettingsContext';
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
  const { settings } = useDashboardSettings();

  // Filter bookings by instructor if driving school — use exact name match
  const filteredBookings = instructorFilter === 'all'
    ? bookings
    : bookings.filter(b => {
        const filterName = instrutores.find(i => i.id === instructorFilter)?.nome || '';
        return b.metadata.instructorName?.toLowerCase() === filterName.toLowerCase();
      });

  const customColors = settings ? {
    primaryColor: settings.primary_color || '#FF8C00',
    secondaryColor: settings.secondary_color || '#1a1a2e',
    accentColor: settings.accent_color || '#F59E0B',
  } : undefined;

  const handleBookingClick = (booking: BookingCalendario) => {
    // Detail handled internally by calendar
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CalendarIcon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Calendário</h1>
        </div>
        <p className="text-muted-foreground">
          Visualize suas aulas em formato de agenda
        </p>
      </div>

      {/* Instructor filter for driving schools */}
      {isDrivingSchool && instrutores.length > 0 && (
        <div className="mb-4">
          <Select value={instructorFilter} onValueChange={setInstructorFilter}>
            <SelectTrigger className="w-full sm:w-64 bg-card border-border text-foreground">
              <SelectValue placeholder="Filtrar por instrutor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Todos os instrutores
              </SelectItem>
              {instrutores.filter(i => i.visivel).map((inst) => (
                <SelectItem key={inst.id} value={inst.id}>
                  {inst.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4">
        <CalendarioAulas
          bookings={filteredBookings}
          view={view}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onViewChange={setView}
          onBookingClick={handleBookingClick}
          userRole={role}
          loading={loading}
          customColors={customColors}
        />
      </div>
    </div>
  );
}
