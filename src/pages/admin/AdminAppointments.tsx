import { useState } from 'react';
import { Filter, CheckCircle, Loader2, Calendar, Search } from 'lucide-react';
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
import { AppointmentCard } from '@/components/admin/AppointmentCard';
import { ConfirmAppointmentModalV2 } from '@/components/admin/ConfirmAppointmentModalV2';
import { RejectAppointmentModal } from '@/components/admin/RejectAppointmentModal';
import { ChatModal } from '@/components/chat/ChatModal';

export default function AdminAppointments() {
  const {
    bookings,
    loading,
    confirmBooking,
    rejectBooking,
    filterByStatus,
    checkScheduleConflict,
    pendingCount,
    confirmedCount,
  } = useInstructorBookings();

  const [activeTab, setActiveTab] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatBooking, setChatBooking] = useState<BookingWithDetails | null>(null);

  const filterBookings = (status: string) => {
    return filterByStatus(status).filter((booking) => {
      const matchesSearch = booking.student.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === 'all' || booking.license_category === categoryFilter;
      
      // Date filter
      if (dateFilter !== 'all') {
        const bookingDate = new Date(booking.scheduled_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (dateFilter === 'today') {
          const todayStr = today.toISOString().split('T')[0];
          if (booking.scheduled_date !== todayStr) return false;
        } else if (dateFilter === 'week') {
          const weekFromNow = new Date(today);
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          if (bookingDate < today || bookingDate > weekFromNow) return false;
        } else if (dateFilter === 'month') {
          const monthFromNow = new Date(today);
          monthFromNow.setMonth(monthFromNow.getMonth() + 1);
          if (bookingDate < today || bookingDate > monthFromNow) return false;
        }
      }

      return matchesSearch && matchesCategory;
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

  const handleWhatsApp = (booking: BookingWithDetails) => {
    if (booking.student.phone) {
      const message = encodeURIComponent(
        `Olá ${booking.student.full_name}! Vi sua solicitação de aula para ${format(
          new Date(booking.scheduled_date),
          "dd/MM/yyyy",
          { locale: ptBR }
        )} às ${booking.start_time}. Gostaria de confirmar alguns detalhes.`
      );
      const cleanPhone = booking.student.phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
    }
  };

  const handleChatOpen = (booking: BookingWithDetails) => {
    setChatBooking(booking);
    setChatModalOpen(true);
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {appointments.map((booking) => (
          <AppointmentCard
            key={booking.id}
            booking={booking}
            variant={variant}
            hasConflict={variant === 'pending' ? checkScheduleConflict(booking) : false}
            onAccept={handleAcceptClick}
            onReject={handleRejectClick}
            onWhatsApp={handleWhatsApp}
            onChat={handleChatOpen}
            onDetails={(b) => console.log('Details:', b)}
          />
        ))}
      </div>
    );
  };

  const renderSkeletons = () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-instructor-dark-secondary border border-white/10 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full bg-white/10" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-white/10" />
              <Skeleton className="h-3 w-24 bg-white/10" />
            </div>
          </div>
          <Skeleton className="h-20 w-full bg-white/10 rounded-lg" />
          <Skeleton className="h-12 w-full bg-white/10 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 bg-white/10" />
            <Skeleton className="h-10 flex-1 bg-white/10" />
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

      <ChatModal
        open={chatModalOpen}
        onOpenChange={setChatModalOpen}
        bookingId={chatBooking?.id || null}
        otherParticipant={chatBooking ? {
          id: chatBooking.student.id,
          name: chatBooking.student.full_name,
          avatar: chatBooking.student.avatar_url,
        } : null}
        lessonInfo={chatBooking ? `${format(new Date(chatBooking.scheduled_date), "dd/MM/yyyy", { locale: ptBR })} às ${chatBooking.start_time}` : undefined}
      />
    </>
  );
}