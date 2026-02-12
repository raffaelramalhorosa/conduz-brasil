import { useState, useEffect } from 'react';
import { CheckCircle, Calendar, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { ConfirmAppointmentModalV2 } from '@/components/admin/ConfirmAppointmentModalV2';
import { RejectAppointmentModal } from '@/components/admin/RejectAppointmentModal';
import { BookingDetailsModal } from '@/components/admin/BookingDetailsModal';
import { ChatModal } from '@/components/chat/ChatModal';
import { formatTimeHHMM } from '@/lib/timeFormatter';
import { supabase } from '@/integrations/supabase/client';

export default function AdminAppointments() {
  const { profile, user } = useAuth();
  const isDrivingSchool = profile?.user_type === 'driving_school';
  const isInstructor = profile?.user_type === 'instructor';
  const [isAffiliatedInstructor, setIsAffiliatedInstructor] = useState(false);

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

  const filterBookings = (status: string) => {
    return filterByStatus(status).filter((booking) => {
      const matchesSearch = booking.student.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === 'all' || booking.license_category === categoryFilter;
      
      // Date filter
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

      // Instructor filter (for driving schools) - filter by vehicle linked to instructor
      let matchesInstructor = true;
      if (isDrivingSchool && instructorFilter !== 'all') {
        const instructor = instrutores.find(i => i.id === instructorFilter);
        if (instructor) {
          // Check if the booking's vehicle is linked to this instructor
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

  const renderCards = (
    appointments: BookingWithDetails[], 
    variant: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  ) => {
    if (appointments.length === 0) {
      return (
        <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
          <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {variant === 'pending' && 'Nenhuma solicitação pendente'}
            {variant === 'confirmed' && 'Nenhuma aula confirmada'}
            {variant === 'completed' && 'Nenhuma aula concluída'}
            {variant === 'cancelled' && 'Nenhuma aula cancelada'}
          </h3>
          <p className="text-gray-500">
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
        <div key={i} className="bg-instructor-dark-secondary border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-full bg-white/10" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32 bg-white/10" />
              <Skeleton className="h-3 w-20 bg-white/10" />
            </div>
            <Skeleton className="h-5 w-16 bg-white/10 rounded-full" />
          </div>
          <Skeleton className="h-20 w-full bg-white/10 rounded-lg" />
          <Skeleton className="h-10 w-full bg-white/10 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 bg-white/10 rounded-lg" />
            <Skeleton className="h-9 flex-1 bg-white/10 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8 text-instructor-accent" />
            <h1 className="text-2xl font-bold text-white">Agendamentos</h1>
          </div>
          <p className="text-gray-400">
            Gerencie as solicitações e aulas dos seus alunos
          </p>
        </div>

        {/* Filters - Dark themed */}
        <div className="bg-instructor-dark-secondary border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por nome do aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-instructor-accent/50"
              />
            </div>
            
            {/* Instructor Filter - Only for Driving Schools */}
            {isDrivingSchool && instrutores.length > 0 && (
              <Select value={instructorFilter} onValueChange={setInstructorFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
                  <Users className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Instrutor" />
                </SelectTrigger>
                <SelectContent className="bg-instructor-dark-secondary border-white/10">
                  <SelectItem value="all" className="text-white hover:bg-white/10">Todos os instrutores</SelectItem>
                  {instrutores.filter(i => i.visivel).map((instrutor) => (
                    <SelectItem 
                      key={instrutor.id} 
                      value={instrutor.id} 
                      className="text-white hover:bg-white/10"
                    >
                      {instrutor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Data" />
              </SelectTrigger>
              <SelectContent className="bg-instructor-dark-secondary border-white/10">
                <SelectItem value="all" className="text-white hover:bg-white/10">Todas as datas</SelectItem>
                <SelectItem value="today" className="text-white hover:bg-white/10">Hoje</SelectItem>
                <SelectItem value="week" className="text-white hover:bg-white/10">Esta semana</SelectItem>
                <SelectItem value="month" className="text-white hover:bg-white/10">Este mês</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="bg-instructor-dark-secondary border-white/10">
                <SelectItem value="all" className="text-white hover:bg-white/10">Todas</SelectItem>
                <SelectItem value="A" className="text-white hover:bg-white/10">Cat. A</SelectItem>
                <SelectItem value="B" className="text-white hover:bg-white/10">Cat. B</SelectItem>
                <SelectItem value="AB" className="text-white hover:bg-white/10">Cat. AB</SelectItem>
                <SelectItem value="C" className="text-white hover:bg-white/10">Cat. C</SelectItem>
                <SelectItem value="D" className="text-white hover:bg-white/10">Cat. D</SelectItem>
                <SelectItem value="E" className="text-white hover:bg-white/10">Cat. E</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabs & Content - Dark themed */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-instructor-dark-secondary border border-white/10 p-1 h-auto mb-6">
            <TabsTrigger
              value="pending"
              className="data-[state=active]:bg-instructor-accent data-[state=active]:text-instructor-dark-primary text-gray-400 px-4 py-2"
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
              className="data-[state=active]:bg-instructor-accent data-[state=active]:text-instructor-dark-primary text-gray-400 px-4 py-2"
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
              className="data-[state=active]:bg-instructor-accent data-[state=active]:text-instructor-dark-primary text-gray-400 px-4 py-2"
            >
              Concluídas
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="data-[state=active]:bg-instructor-accent data-[state=active]:text-instructor-dark-primary text-gray-400 px-4 py-2"
            >
              Canceladas
            </TabsTrigger>
          </TabsList>

          {loading ? (
            renderSkeletons()
          ) : (
            <>
              <TabsContent value="pending" className="mt-0">
                {renderCards(filterBookings('pending'), 'pending')}
              </TabsContent>
              <TabsContent value="confirmed" className="mt-0">
                {renderCards(filterBookings('confirmed'), 'confirmed')}
              </TabsContent>
              <TabsContent value="completed" className="mt-0">
                {renderCards(filterBookings('completed'), 'completed')}
              </TabsContent>
              <TabsContent value="cancelled" className="mt-0">
                {renderCards(filterBookings('cancelled'), 'cancelled')}
              </TabsContent>
            </>
          )}
        </Tabs>
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