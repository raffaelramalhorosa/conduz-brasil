import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, isToday, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { CalendarioBookingDetail } from './CalendarioBookingDetail';

export interface BookingCalendario {
  id: string;
  title: string;
  subtitle: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  status: string;
  color: string;
  metadata: {
    studentName?: string;
    instructorName?: string;
    licenseCat?: string;
    totalPrice?: number;
    pickupAddress?: string;
    schoolFee?: number;
    instructorAmount?: number;
    bookingId?: string;
  };
}

export interface CalendarioAulasProps {
  bookings: BookingCalendario[];
  view: 'day' | 'week';
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewChange: (view: 'day' | 'week') => void;
  onBookingClick: (booking: BookingCalendario) => void;
  userRole: 'student' | 'instructor' | 'driving_school';
  loading?: boolean;
}

const HOUR_HEIGHT = 60; // px per hour
const START_HOUR = 6;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const DAY_NAMES_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function getBlockStyle(startTime: string, endTime: string) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const topOffset = (startMin - START_HOUR * 60) * (HOUR_HEIGHT / 60);
  const height = Math.max((endMin - startMin) * (HOUR_HEIGHT / 60), 30);
  return { top: topOffset, height };
}

function getStatusColor(status: string): { bg: string; border: string; text: string; pulse?: boolean } {
  switch (status) {
    case 'pending':
      return { bg: 'bg-yellow-400/20', border: 'border-yellow-500', text: 'text-yellow-700 dark:text-yellow-300' };
    case 'confirmed':
      return { bg: 'bg-blue-400/20', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-300' };
    case 'in_progress':
      return { bg: 'bg-orange-400/20', border: 'border-orange-500', text: 'text-orange-700 dark:text-orange-300', pulse: true };
    case 'completed':
      return { bg: 'bg-green-400/20', border: 'border-green-500', text: 'text-green-700 dark:text-green-300' };
    case 'no_show':
    case 'no_show_student':
    case 'no_show_instructor':
      return { bg: 'bg-red-400/20', border: 'border-red-500', text: 'text-red-700 dark:text-red-300' };
    default: // cancelled
      return { bg: 'bg-gray-400/10', border: 'border-gray-400', text: 'text-gray-400' };
  }
}

function NowLine() {
  const [now, setNow] = useState(new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Scroll now-line into view on mount
    ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, []);

  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < START_HOUR * 60 || minutes > END_HOUR * 60) return null;
  const top = (minutes - START_HOUR * 60) * (HOUR_HEIGHT / 60);

  return (
    <div
      ref={ref}
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top }}
    >
      <div className="flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
        <div className="flex-1 h-[2px] bg-red-500" />
      </div>
    </div>
  );
}

function EventBlock({ booking, onClick, compact }: { booking: BookingCalendario; onClick: () => void; compact?: boolean }) {
  const { top, height } = getBlockStyle(booking.startTime, booking.endTime);
  const colors = getStatusColor(booking.status);
  const isCancelled = booking.status.startsWith('cancelled');
  const isSmall = height < 50;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className={`absolute left-1 right-1 rounded-md border-l-[3px] px-2 py-1 cursor-pointer transition-shadow hover:shadow-md overflow-hidden text-left
        ${colors.bg} ${colors.border} ${colors.text}
        ${isCancelled ? 'opacity-50 line-through' : ''}
        ${colors.pulse ? 'animate-pulse' : ''}
      `}
      style={{ top, height, minHeight: 28 }}
    >
      {isSmall ? (
        <p className="text-[10px] font-medium truncate leading-tight">{booking.startTime} {booking.title}</p>
      ) : (
        <>
          <p className={`font-semibold truncate ${compact ? 'text-[10px]' : 'text-xs'}`}>
            🚗 {booking.title}
          </p>
          {!compact && height > 45 && (
            <p className="text-[10px] truncate opacity-80">{booking.subtitle}</p>
          )}
          {!compact && height > 60 && (
            <p className="text-[10px] opacity-60">{booking.startTime} - {booking.endTime}</p>
          )}
        </>
      )}
    </motion.button>
  );
}

export function CalendarioAulas({
  bookings,
  view,
  currentDate,
  onDateChange,
  onViewChange,
  onBookingClick,
  userRole,
  loading,
}: CalendarioAulasProps) {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingCalendario | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Week start (Monday)
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const navigatePrev = () => {
    onDateChange(view === 'day' ? subDays(currentDate, 1) : subWeeks(currentDate, 1));
  };
  const navigateNext = () => {
    onDateChange(view === 'day' ? addDays(currentDate, 1) : addWeeks(currentDate, 1));
  };
  const goToday = () => onDateChange(new Date());

  const handleBookingClick = (booking: BookingCalendario) => {
    setSelectedBooking(booking);
    setDetailOpen(true);
    onBookingClick(booking);
  };

  // Filter bookings for a given date
  const getBookingsForDate = (date: Date) =>
    bookings.filter((b) => isSameDay(parseISO(b.date), date));

  const headerDateLabel = view === 'day'
    ? format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
    : `${format(weekDays[0], "dd", { locale: ptBR })} - ${format(weekDays[6], "dd 'de' MMMM", { locale: ptBR })}`;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={navigatePrev} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <AnimatePresence mode="wait">
            <motion.span
              key={headerDateLabel}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="text-sm sm:text-base font-semibold capitalize min-w-[180px] text-center"
            >
              {headerDateLabel}
            </motion.span>
          </AnimatePresence>
          <Button variant="ghost" size="icon" onClick={navigateNext} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday} className="text-xs h-7 px-2 ml-1">
            Hoje
          </Button>
        </div>

        <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
          <Button
            variant={view === 'day' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('day')}
            className={`text-xs h-7 px-3 ${view === 'day' ? 'bg-primary text-primary-foreground' : ''}`}
          >
            Dia
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('week')}
            className={`text-xs h-7 px-3 ${view === 'week' ? 'bg-primary text-primary-foreground' : ''}`}
          >
            Semana
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 border rounded-lg overflow-hidden bg-card">
        {view === 'week' && (
          /* Week header */
          <div className="flex border-b sticky top-0 z-10 bg-card">
            <div className="w-14 sm:w-16 flex-shrink-0 border-r" />
            {weekDays.map((day, i) => (
              <div
                key={i}
                className={`flex-1 min-w-[100px] text-center py-2 border-r last:border-r-0 ${
                  isToday(day) ? 'bg-primary/10' : ''
                }`}
              >
                <p className="text-[10px] sm:text-xs text-muted-foreground">{DAY_NAMES_SHORT[i]}</p>
                <p className={`text-sm sm:text-base font-semibold ${isToday(day) ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </p>
              </div>
            ))}
          </div>
        )}

        <div
          ref={scrollRef}
          className="overflow-auto"
          style={{ maxHeight: 'calc(100vh - 280px)' }}
        >
          <div className="flex relative">
            {/* Time column */}
            <div className="w-14 sm:w-16 flex-shrink-0 sticky left-0 z-10 bg-card border-r">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="relative border-b border-dashed border-border/50"
                  style={{ height: HOUR_HEIGHT }}
                >
                  <span className="absolute -top-2 left-1 sm:left-2 text-[10px] sm:text-xs text-muted-foreground">
                    {String(hour).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {view === 'day' ? (
              /* Day view - single column */
              <div className="flex-1 relative">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-dashed border-border/50"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}
                {isToday(currentDate) && <NowLine />}
                {getBookingsForDate(currentDate).map((booking) => (
                  <EventBlock
                    key={booking.id}
                    booking={booking}
                    onClick={() => handleBookingClick(booking)}
                  />
                ))}
              </div>
            ) : (
              /* Week view - 7 columns */
              <>
                {weekDays.map((day, colIdx) => (
                  <div
                    key={colIdx}
                    className={`flex-1 min-w-[100px] relative border-r last:border-r-0 ${
                      isToday(day) ? 'bg-primary/5' : ''
                    }`}
                  >
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="border-b border-dashed border-border/50"
                        style={{ height: HOUR_HEIGHT }}
                      />
                    ))}
                    {isToday(day) && <NowLine />}
                    {getBookingsForDate(day).map((booking) => (
                      <EventBlock
                        key={booking.id}
                        booking={booking}
                        onClick={() => handleBookingClick(booking)}
                        compact
                      />
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Mobile fade indicator for week view */}
          {view === 'week' && isMobile && (
            <div className="pointer-events-none fixed right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-card to-transparent z-20" />
          )}
        </div>
      </div>

      {/* Booking detail modal */}
      <CalendarioBookingDetail
        booking={selectedBooking}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        userRole={userRole}
      />
    </div>
  );
}
