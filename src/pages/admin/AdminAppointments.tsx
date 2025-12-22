import { useState } from 'react';
import { Eye, Filter, CheckCircle, Loader2 } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useInstructorBookings, BookingWithDetails } from '@/hooks/useInstructorBookings';
import { BookingCard } from '@/components/admin/BookingCard';
import { ConfirmAppointmentModalV2 } from '@/components/admin/ConfirmAppointmentModalV2';
import { RejectAppointmentModal } from '@/components/admin/RejectAppointmentModal';

const statusStyles: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
  confirmed: { label: 'Confirmada', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  completed: { label: 'Concluída', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  cancelled_by_instructor: { label: 'Recusada', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
  cancelled_by_student: { label: 'Cancelada pelo aluno', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
  in_progress: { label: 'Em Andamento', className: 'bg-purple-100 text-purple-700 hover:bg-purple-100' },
  no_show_student: { label: 'Aluno não compareceu', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
  no_show_instructor: { label: 'Instrutor não compareceu', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
};

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

  const renderTable = (appointments: BookingWithDetails[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data/Hora</TableHead>
          <TableHead>Aluno</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Veículo</TableHead>
          <TableHead>Local</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
              Nenhum agendamento encontrado
            </TableCell>
          </TableRow>
        ) : (
          appointments.map((booking) => (
            <TableRow key={booking.id} className="hover:bg-muted/50">
              <TableCell>
                <div>
                  <p className="font-medium">
                    {format(new Date(booking.scheduled_date), 'dd/MM/yyyy', {
                      locale: ptBR,
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">{booking.start_time}</p>
                </div>
              </TableCell>
              <TableCell className="font-medium">{booking.student.full_name}</TableCell>
              <TableCell>
                <Badge variant="outline">Cat. {booking.license_category}</Badge>
              </TableCell>
              <TableCell className="text-sm">
                {booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : '-'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                {booking.pickup_address}
              </TableCell>
              <TableCell className="font-medium text-green-600">
                R$ {booking.instructor_amount.toFixed(2).replace('.', ',')}
              </TableCell>
              <TableCell>
                <Badge className={cn(statusStyles[booking.status]?.className || '')}>
                  {statusStyles[booking.status]?.label || booking.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const renderPendingCards = () => {
    const pending = filterBookings('pending');

    if (pending.length === 0) {
      return (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-2">Nenhuma solicitação pendente</h3>
          <p className="text-muted-foreground">
            Você está em dia! Novas solicitações aparecerão aqui.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {pending.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            hasConflict={checkScheduleConflict(booking)}
            onAccept={handleAcceptClick}
            onReject={handleRejectClick}
            onWhatsApp={handleWhatsApp}
          />
        ))}
      </div>
    );
  };

  const renderSkeletons = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-24 w-full" />
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div>
        <AdminHeader title="Agendamentos" />

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Solicitações de Aulas</h1>
              <p className="text-muted-foreground">
                Gerencie as solicitações dos seus alunos
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por nome do aluno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-40">
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
                  <SelectTrigger className="w-full sm:w-40">
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
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Mais Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs & Content */}
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b px-4">
                <TabsList className="bg-transparent h-auto p-0 gap-4">
                  <TabsTrigger
                    value="pending"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-4"
                  >
                    Pendentes
                    {pendingCount > 0 && (
                      <Badge className="ml-2 bg-orange-500 text-white hover:bg-orange-500">
                        {pendingCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="confirmed"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-4"
                  >
                    Confirmadas
                    {confirmedCount > 0 && (
                      <Badge className="ml-2 bg-green-500 text-white hover:bg-green-500">
                        {confirmedCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-4"
                  >
                    Concluídas
                  </TabsTrigger>
                  <TabsTrigger
                    value="cancelled"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-4"
                  >
                    Canceladas
                  </TabsTrigger>
                </TabsList>
              </div>

              {loading ? (
                <div className="p-6">
                  {activeTab === 'pending' ? (
                    renderSkeletons()
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <TabsContent value="pending" className="mt-0 p-6">
                    {renderPendingCards()}
                  </TabsContent>
                  <TabsContent value="confirmed" className="mt-0">
                    {renderTable(filterBookings('confirmed'))}
                  </TabsContent>
                  <TabsContent value="completed" className="mt-0">
                    {renderTable(filterBookings('completed'))}
                  </TabsContent>
                  <TabsContent value="cancelled" className="mt-0">
                    {renderTable(filterBookings('cancelled'))}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </Card>
        </div>
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
    </>
  );
}
