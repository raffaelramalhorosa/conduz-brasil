import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useInstructorBookings, BookingWithDetails } from '@/hooks/useInstructorBookings';
import { ConfirmAppointmentModalV2 } from './ConfirmAppointmentModalV2';
import { RejectAppointmentModal } from './RejectAppointmentModal';
import { Skeleton } from '@/components/ui/skeleton';

export function PendingRequests() {
  const { bookings, loading, confirmBooking, rejectBooking, filterByStatus } = useInstructorBookings();
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const pendingBookings = filterByStatus('pending').slice(0, 4);

  const handleAcceptClick = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setConfirmModalOpen(true);
  };

  const handleRejectClick = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setRejectModalOpen(true);
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Solicitações Pendentes</CardTitle>
          <Link to="/admin/agendamentos" className="text-sm text-primary hover:underline">
            Ver todas
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            renderSkeleton()
          ) : pendingBookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma solicitação pendente
            </p>
          ) : (
            pendingBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={booking.student.avatar_url || undefined} 
                    alt={booking.student.full_name} 
                  />
                  <AvatarFallback>
                    {booking.student.full_name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {booking.student.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Quer agendar {booking.duration_hours}h de Cat. {booking.license_category}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {booking.requested_at
                      ? formatDistanceToNow(new Date(booking.requested_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })
                      : 'Agora'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                    onClick={() => handleAcceptClick(booking)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                    onClick={() => handleRejectClick(booking)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

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
