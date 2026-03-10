import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, Calendar, Search, List, CalendarDays, CalendarRange, LayoutGrid, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useInstructorBookings, BookingWithDetails } from '@/hooks/useInstructorBookings';
import { useAutoescolaData } from '@/hooks/useAutoescolaData';
import { useAuth } from '@/contexts/AuthContext';
import { AppointmentCard } from '@/components/admin/AppointmentCard';
import { AppointmentTableView } from '@/components/admin/AppointmentTableView';
import { ConfirmAppointmentModalV2 } from '@/components/admin/ConfirmAppointmentModalV2';
import { RejectAppointmentModal } from '@/components/admin/RejectAppointmentModal';
import { BookingDetailsModal } from '@/components/admin/BookingDetailsModal';
import { ChatModal } from '@/components/chat/ChatModal';
import { CalendarioAulas } from '@/components/calendario/CalendarioAulas';
import { useCalendarioBookings } from '@/hooks/useCalendarioBookings';
import { InstructorCombobox } from '@/components/admin/InstructorCombobox';
import { formatTimeHHMM } from '@/lib/timeFormatter';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDashboardSettings } from '@/contexts/DashboardSettingsContext';
import type { BookingCalendario } from '@/components/calendario/CalendarioAulas';

type ViewMode = 'list' | 'day' | 'week';
type ListDisplayMode = 'cards' | 'table';

export default function AdminAppointments() {
  const { profile, user } = useAuth();
  const isDrivingSchool = profile?.user_type === 'driving_school';
  const isInstructor = profile?.user_type === 'instructor';
  const isMobile = useIsMobile();
  const [isAffiliatedInstructor, setIsAffiliatedInstructor] = useState(false);

  // Dashboard settings for custom colors
  const { settings: dashSettings } = useDashboardSettings();

  // View mode: list, day, week
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [listDisplayMode, setListDisplayMode] = useState<ListDisplayMode>('cards');

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const calendarRole = isDrivingSchool ? 'driving_school' : 'instructor';
  const { bookings: calendarBookings, loading: calendarLoading } = useCalendarioBookings(
    calendarRole as 'instructor' | 'driving_school'
  );

  // Check if the current instructor is affiliated to a driving school
  useEffect(() => {
    if (!isInstructor || !user) return;
    const checkAffiliation = async () => {
      const { data } = await supabase
        .from('driving_school_instructors')
        .select('id')
        .eq('linked_user_id', user.id)
        .eq('status', 'active')
        .eq('is_account_linked', true)
        .maybeSingle();
      setIsAffiliatedInstructor(!!data);
    };
    checkAffiliation();
  }, [isInstructor, user]);
  
  const {
    bookings,
    loading,
    confirmBooking,
    rejectBooking,
    cancelBooking,
    completeBooking,
    filterByStatus,
    checkScheduleConflict,
    pendingCount,
    confirmedCount,
  } = useInstructorBookings();

  // Fetch driving school instructors for filtering
  const { instrutores, loading: loadingInstrutores } = useAutoescolaData();

  const instructorOptions = useMemo(() =>
    instrutores.filter(i => i.visivel).map(i => ({
      id: i.id,
      name: i.nome,
      photoUrl: i.fotoPerfil || null,
    })),
    [instrutores]
  );

  const [activeTab, setActiveTab] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [instructorFilter, setInstructorFilter] = useState<string>('all');

  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatBooking, setChatBooking] = useState<BookingWithDetails | null>(null);
  const [markingCompleteId, setMarkingCompleteId] = useState<string | null>(null);

  // Filter calendar bookings by instructor
  const filteredCalendarBookings = instructorFilter === 'all'
    ? calendarBookings
    : calendarBookings.filter(b => b.metadata.instructorName?.includes(
        instrutores.find(i => i.id === instructorFilter)?.nome || ''
      ));

  // Apply custom colors to calendar events
  const themedCalendarBookings = useMemo(() => {
    if (!isDrivingSchool || !dashSettings) return filteredCalendarBookings;
    // We pass custom colors via CSS variables, the calendar component picks them up
    return filteredCalendarBookings;
  }, [filteredCalendarBookings, isDrivingSchool, dashSettings]);

  const filterBookings = (status: string) => {
    return filterByStatus(status).filter((booking) => {
      const matchesSearch = booking.student.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === 'all' || booking.license_category === categoryFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const bookingDate = new Date(booking.scheduled_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (dateFilter === 'today') {
          const todayStr = today.toISOString().split('T')[0];
          if (booking.scheduled_date !== todayStr) matchesDate = false;
        } else if (dateFilter === 'week') {
          const weekFromNow = new Date(today);
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          if (bookingDate < today || bookingDate > weekFromNow) matchesDate = false;
        } else if (dateFilter === 'month') {
          const monthFromNow = new Date(today);
          monthFromNow.setMonth(monthFromNow.getMonth() + 1);
          if (bookingDate < today || bookingDate > monthFromNow) matchesDate = false;
        }
      }

      let matchesInstructor = true;
      if (isDrivingSchool && instructorFilter !== 'all') {
        const instructor = instrutores.find(i => i.id === instructorFilter);
        if (instructor) {
          matchesInstructor = instructor.veiculosVinculados.includes(booking.vehicle.id);
        }
      }

      return matchesSearch && matchesCategory && matchesDate && matchesInstructor;
    });
  };

  const handleAcceptClick = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setConfirmModalOpen(true);
  };

  const handleRejectClick = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setRejectModalOpen(true);
  };

  const handleDetailsClick = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setDetailsModalOpen(true);
  };

  const handleChatOpen = (booking: BookingWithDetails) => {
    setChatBooking(booking);
    setChatModalOpen(true);
  };

  const handleMarkComplete = async (booking: BookingWithDetails) => {
    setMarkingCompleteId(booking.id);
    await completeBooking(booking.id);
    setMarkingCompleteId(null);
  };

  const handleCalendarBookingClick = (booking: BookingCalendario) => {};

  // Custom CSS variables for calendar theming
  const calendarThemeStyle = isDrivingSchool && dashSettings ? {
    '--school-primary': dashSettings.primary_color,
    '--school-secondary': dashSettings.secondary_color,
    '--school-accent': dashSettings.accent_color,
  } as React.CSSProperties : undefined;

  const renderContent = (
    appointments: BookingWithDetails[], 
    variant: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  ) => {
    if (listDisplayMode === 'table') {
      return (
        <AppointmentTableView
          bookings={appointments}
          variant={variant}
          isAffiliatedInstructor={isAffiliatedInstructor}
          onAccept={handleAcceptClick}
          onReject={handleRejectClick}
          onChat={handleChatOpen}
          onDetails={handleDetailsClick}
          onMarkComplete={variant === 'confirmed' ? handleMarkComplete : undefined}
          isMarkingCompleteId={markingCompleteId}
          checkConflict={variant === 'pending' ? checkScheduleConflict : undefined}
        />
      );
    }

    if (appointments.length === 0) {
      return (
        <div className="text-center py-16 bg-muted/50 rounded-xl border border-border">
          <CheckCircle className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {variant === 'pending' && 'Nenhuma solicitação pendente'}
            {variant === 'confirmed' && 'Nenhuma aula confirmada'}
            {variant === 'completed' && 'Nenhuma aula concluída'}
            {variant === 'cancelled' && 'Nenhuma aula cancelada'}
          </h3>
          <p className="text-muted-foreground">
            {variant === 'pending' && 'Você está em dia! Novas solicitações aparecerão aqui.'}
            {variant === 'confirmed' && 'Aulas confirmadas aparecerão aqui.'}
            {variant === 'completed' && 'Aulas finalizadas aparecerão aqui.'}
            {variant === 'cancelled' && 'Aulas canceladas aparecerão aqui.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {appointments.map((booking) => (
          <AppointmentCard
            key={booking.id}
            booking={booking}
            variant={variant}
            hasConflict={variant === 'pending' ? checkScheduleConflict(booking) : false}
            isAffiliatedInstructor={isAffiliatedInstructor && !!booking.is_affiliated_booking}
            onAccept={handleAcceptClick}
            onReject={handleRejectClick}
            onChat={handleChatOpen}
            onDetails={handleDetailsClick}
            onMarkComplete={variant === 'confirmed' ? handleMarkComplete : undefined}
            isMarkingComplete={markingCompleteId === booking.id}
          />
        ))}
      </div>
    );
  };

  const renderSkeletons = () => (
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-lg" />
            <Skeleton className="h-9 flex-1 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="p-3 sm:p-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Agendamentos</h1>
            </div>
            {/* View mode toggle */}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as ViewMode)}
              className="bg-card border border-border rounded-lg p-1"
            >
              <ToggleGroupItem
                value="list"
                aria-label="Visualização em lista"
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-muted-foreground px-3 py-1.5 text-xs gap-1.5"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Lista</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="day"
                aria-label="Visualização por dia"
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-muted-foreground px-3 py-1.5 text-xs gap-1.5"
              >
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Dia</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="week"
                aria-label="Visualização por semana"
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-muted-foreground px-3 py-1.5 text-xs gap-1.5"
              >
                <CalendarRange className="h-4 w-4" />
                <span className="hidden sm:inline">Semana</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie as solicitações e aulas dos seus alunos
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {viewMode === 'list' && (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome do aluno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50"
                />
              </div>
            )}
            
            {isDrivingSchool && instructorOptions.length > 0 && (
              <InstructorCombobox
                instructors={instructorOptions}
                value={instructorFilter}
                onValueChange={setInstructorFilter}
                placeholder="Todos os instrutores"
                className="w-full sm:w-64"
              />
            )}
            
            {viewMode === 'list' && (
              <>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-muted border-border text-foreground">
                    <SelectValue placeholder="Data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as datas</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="month">Este mês</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-muted border-border text-foreground">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="A">Cat. A</SelectItem>
                    <SelectItem value="B">Cat. B</SelectItem>
                    <SelectItem value="AB">Cat. AB</SelectItem>
                    <SelectItem value="C">Cat. C</SelectItem>
                    <SelectItem value="D">Cat. D</SelectItem>
                    <SelectItem value="E">Cat. E</SelectItem>
                  </SelectContent>
                </Select>

                {/* Card/Table sub-toggle */}
                <ToggleGroup
                  type="single"
                  value={listDisplayMode}
                  onValueChange={(v) => v && setListDisplayMode(v as ListDisplayMode)}
                  className="bg-muted border border-border rounded-lg p-0.5"
                >
                  <ToggleGroupItem
                    value="cards"
                    aria-label="Cards"
                    className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-muted-foreground px-2.5 py-1.5 text-xs"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="table"
                    aria-label="Tabela"
                    className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-muted-foreground px-2.5 py-1.5 text-xs"
                  >
                    <LayoutList className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </>
            )}
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'list' ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card border border-border p-1 h-auto mb-6">
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground px-4 py-2"
              >
                Pendentes
                {pendingCount > 0 && (
                  <Badge className="ml-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="confirmed"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground px-4 py-2"
              >
                Confirmadas
                {confirmedCount > 0 && (
                  <Badge className="ml-2 bg-green-500/20 text-green-400 hover:bg-green-500/20 text-xs">
                    {confirmedCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground px-4 py-2"
              >
                Concluídas
              </TabsTrigger>
              <TabsTrigger
                value="cancelled"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground px-4 py-2"
              >
                Canceladas
              </TabsTrigger>
              <TabsTrigger
                value="no_show"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground px-4 py-2"
              >
                Ausências
                {filterByStatus('no_show').length > 0 && (
                  <Badge className="ml-2 bg-red-500/20 text-red-400 hover:bg-red-500/20 text-xs">
                    {filterByStatus('no_show').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {loading ? (
              renderSkeletons()
            ) : (
              <>
                <TabsContent value="pending" className="mt-0">
                  {renderContent(filterBookings('pending'), 'pending')}
                </TabsContent>
                <TabsContent value="confirmed" className="mt-0">
                  {renderContent(filterBookings('confirmed'), 'confirmed')}
                </TabsContent>
                <TabsContent value="completed" className="mt-0">
                  {renderContent(filterBookings('completed'), 'completed')}
                </TabsContent>
                <TabsContent value="cancelled" className="mt-0">
                  {renderContent(filterBookings('cancelled'), 'cancelled')}
                </TabsContent>
                <TabsContent value="no_show" className="mt-0">
                  {renderContent(filterByStatus('no_show') as any, 'cancelled')}
                </TabsContent>
              </>
            )}
          </Tabs>
        ) : (
          <div
            className="bg-card border border-border rounded-xl p-4"
            style={calendarThemeStyle}
          >
            <CalendarioAulas
              bookings={themedCalendarBookings}
              view={viewMode === 'day' ? 'day' : 'week'}
              currentDate={calendarDate}
              onDateChange={setCalendarDate}
              onViewChange={(v) => setViewMode(v)}
              onBookingClick={handleCalendarBookingClick}
              userRole={calendarRole}
              loading={calendarLoading}
              customColors={isDrivingSchool && dashSettings ? {
                primaryColor: dashSettings.primary_color,
                secondaryColor: dashSettings.secondary_color,
                accentColor: dashSettings.accent_color,
              } : undefined}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmAppointmentModalV2
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        booking={selectedBooking}
        onConfirm={confirmBooking}
      />

      <RejectAppointmentModal
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        booking={selectedBooking}
        onReject={rejectBooking}
      />

      <BookingDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        booking={selectedBooking}
        onChat={handleChatOpen}
        onCancelBooking={cancelBooking}
      />

      <ChatModal
        open={chatModalOpen}
        onOpenChange={setChatModalOpen}
        bookingId={chatBooking?.id || null}
        otherParticipant={chatBooking ? {
          id: chatBooking.student.id,
          name: chatBooking.student.full_name,
          avatar: chatBooking.student.avatar_url,
        } : null}
        lessonInfo={chatBooking ? `${format(new Date(chatBooking.scheduled_date), "dd/MM/yyyy", { locale: ptBR })} às ${formatTimeHHMM(chatBooking.start_time)}` : undefined}
      />
    </>
  );
}
