import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Car,
  MapPin,
  Navigation,
  Star,
  MessageCircle,
  Receipt,
  XCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BookingWithDetails } from '@/hooks/useInstructorBookings';
import { formatBookingDate, formatSimpleAddress } from '@/lib/addressFormatter';
import { formatTimeRange } from '@/lib/timeFormatter';
import { cn } from '@/lib/utils';
import { CancelBookingModal } from './CancelBookingModal';

const statusStyles: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  confirmed: { label: 'Confirmada', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  completed: { label: 'Concluída', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  cancelled_by_instructor: { label: 'Recusada', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  cancelled_by_student: { label: 'Cancelada', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  in_progress: { label: 'Em Andamento', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

interface BookingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithDetails | null;
  onChat?: (booking: BookingWithDetails) => void;
  onCancelBooking?: (bookingId: string, reason: string) => Promise<boolean>;
}

export function BookingDetailsModal({
  open,
  onOpenChange,
  booking,
  onChat,
  onCancelBooking,
}: BookingDetailsModalProps) {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  // Block body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onOpenChange]);

  if (!booking) return null;

  const bookingDate = formatBookingDate(booking.scheduled_date);
  const formattedDate = format(bookingDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const statusStyle = statusStyles[booking.status] || { label: booking.status, className: 'bg-gray-500/20 text-gray-400' };

  const openMapsDirection = () => {
    if (booking.pickup_latitude && booking.pickup_longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${booking.pickup_latitude},${booking.pickup_longitude}`,
        '_blank'
      );
    }
  };

  // Helper to get real booking ID (strip slot suffix for package bookings)
  const getRealBookingId = (bookingId: string): string => {
    if (bookingId.includes('-slot-')) {
      return bookingId.split('-slot-')[0];
    }
    return bookingId;
  };

  const handleCancelConfirm = async (reason: string): Promise<boolean> => {
    if (!onCancelBooking || !booking) return false;
    setIsCancelling(true);
    try {
      // Use real booking ID (without slot suffix) for database operations
      const realBookingId = getRealBookingId(booking.id);
      const success = await onCancelBooking(realBookingId, reason);
      if (success) {
        onOpenChange(false);
      }
      return success;
    } finally {
      setIsCancelling(false);
    }
  };

  // Determine if cancellation is allowed (only for pending or confirmed bookings)
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';

  return (
    <>
      <CancelBookingModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        onConfirm={handleCancelConfirm}
        studentName={booking.student.full_name}
        isLoading={isCancelling}
      />
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop with blur - click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal Container - centered via flexbox parent */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-hidden
                       bg-[#1A1A1A] rounded-2xl border border-white/10 shadow-2xl
                       flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Fixed */}
            <div className="shrink-0 bg-[#1A1A1A] border-b border-white/10 p-5 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-instructor-accent/30">
                  <AvatarImage
                    src={booking.student.avatar_url || undefined}
                    alt={booking.student.full_name}
                  />
                  <AvatarFallback className="bg-instructor-accent/20 text-instructor-accent font-semibold text-lg">
                    {booking.student.full_name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-bold text-white">{booking.student.full_name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {booking.student.previous_classes > 0 ? (
                      <span className="text-sm text-gray-400">
                        {booking.student.previous_classes} aulas anteriores
                        {booking.student.average_rating && (
                          <span className="inline-flex items-center gap-1 ml-2">
                            <Star className="h-3.5 w-3.5 text-instructor-accent fill-instructor-accent" />
                            {booking.student.average_rating.toFixed(1)}
                          </span>
                        )}
                      </span>
                    ) : (
                      <Badge className="bg-instructor-accent/20 text-instructor-accent border-instructor-accent/30 text-xs">
                        Novo aluno
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors -mt-1 -mr-1"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge className={cn("border text-sm px-3 py-1", statusStyle.className)}>
                  {statusStyle.label}
                </Badge>
                <span className="text-xs text-gray-500">
                  ID: {booking.id.slice(0, 8)}...
                </span>
              </div>

              {/* Date & Time Section */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Data e Horário
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-500 mb-0.5">Data</p>
                    <p className="text-white font-medium text-sm capitalize">{formattedDate}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 mb-0.5">Horário</p>
                    <p className="text-white font-semibold text-lg">
                      {formatTimeRange(booking.start_time, booking.end_time)}
                    </p>
                    <p className="text-[10px] text-gray-500">Duração: {booking.duration_hours}h</p>
                  </div>
                </div>
              </div>

              {/* Vehicle & Category */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Car className="h-3.5 w-3.5" />
                  Veículo e Categoria
                </h3>
                <div className="flex items-center gap-4">
                  <Badge className="bg-instructor-accent/20 text-instructor-accent border-instructor-accent/30 px-3 py-1.5">
                    Cat. {booking.license_category}
                  </Badge>
                  {booking.vehicle && (
                    <div>
                      <p className="text-white font-medium text-sm">{booking.vehicle.brand} {booking.vehicle.model}</p>
                      <p className="text-[10px] text-gray-500">{booking.vehicle.transmission}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pickup Location */}
              <div className="bg-instructor-accent/10 rounded-xl p-4 border border-instructor-accent/20 space-y-2">
                <h3 className="text-xs font-medium text-instructor-accent uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  Local de Partida
                </h3>
                <p className="text-white font-medium text-sm">{formatSimpleAddress(booking.pickup_address)}</p>
                <p className="text-xs text-gray-400">{booking.pickup_address}</p>
                {booking.pickup_latitude && booking.pickup_longitude && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openMapsDirection}
                    className="mt-2 bg-instructor-accent/20 hover:bg-instructor-accent/30 text-instructor-accent border-instructor-accent/30 h-8 text-xs"
                  >
                    <Navigation className="h-3.5 w-3.5 mr-1.5" />
                    Abrir no Google Maps
                  </Button>
                )}
              </div>

              {/* Student Message */}
              {booking.student_message && (
                <div className="bg-white/5 rounded-xl p-4 border-l-4 border-instructor-accent space-y-1">
                  <h3 className="text-xs font-medium text-gray-400">Mensagem do Aluno</h3>
                  <p className="text-white text-sm">{booking.student_message}</p>
                </div>
              )}

              {/* Financial Summary */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="h-3.5 w-3.5" />
                  Resumo Financeiro
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Valor bruto da aula</span>
                    <span className="text-white font-medium">
                      R$ {booking.total_price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Taxa da plataforma (12%)</span>
                    <span className="text-red-400">
                      - R$ {booking.platform_fee.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <Separator className="bg-white/10 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Valor líquido</span>
                    <span className="text-green-400 font-bold text-lg">
                      R$ {booking.instructor_amount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions - Fixed */}
            <div className="shrink-0 bg-[#1A1A1A] border-t border-white/10 p-4 flex gap-2">
              {canCancel && onCancelBooking && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelModalOpen(true)}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 h-10"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar Aula
                </Button>
              )}
              {onChat && (booking.status === 'confirmed' || booking.status === 'completed') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onChat(booking);
                    onOpenChange(false);
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/10 h-10"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-instructor-accent hover:bg-instructor-accent/90 text-instructor-dark-primary font-semibold h-10"
              >
                Fechar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}