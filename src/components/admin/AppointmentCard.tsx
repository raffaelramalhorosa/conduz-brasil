import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  Car,
  DollarSign,
  MapPin,
  Check,
  X,
  MessageCircle,
  AlertTriangle,
  Star,
  Navigation,
  Eye,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookingWithDetails } from '@/hooks/useInstructorBookings';
import { formatBookingDate, formatSimpleAddress } from '@/lib/addressFormatter';
import { formatTimeHHMM, formatTimeRange } from '@/lib/timeFormatter';
import { ChatButton } from '@/components/chat/ChatButton';
import { cn } from '@/lib/utils';

// Dark theme status styles
const statusStyles: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  confirmed: { label: 'Confirmada', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  completed: { label: 'Concluída', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  cancelled_by_instructor: { label: 'Recusada', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  cancelled_by_student: { label: 'Cancelada', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  in_progress: { label: 'Em Andamento', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  no_show_student: { label: 'Não compareceu', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  no_show_instructor: { label: 'Não compareceu', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

interface AppointmentCardProps {
  booking: BookingWithDetails;
  variant: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  hasConflict?: boolean;
  onAccept?: (booking: BookingWithDetails) => void;
  onReject?: (booking: BookingWithDetails) => void;
  onWhatsApp?: (booking: BookingWithDetails) => void;
  onChat?: (booking: BookingWithDetails) => void;
  onDetails?: (booking: BookingWithDetails) => void;
}

export function AppointmentCard({
  booking,
  variant,
  hasConflict = false,
  onAccept,
  onReject,
  onWhatsApp,
  onChat,
  onDetails,
}: AppointmentCardProps) {
  const isUrgent = () => {
    const date = formatBookingDate(booking.scheduled_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return differenceInDays(date, today) <= 1;
  };

  const openMapsDirection = () => {
    if (booking.pickup_latitude && booking.pickup_longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${booking.pickup_latitude},${booking.pickup_longitude}`,
        '_blank'
      );
    }
  };

  // Use formatBookingDate to properly parse the date string without timezone issues
  const bookingDate = formatBookingDate(booking.scheduled_date);
  const formattedDate = format(bookingDate, "dd 'de' MMMM", {
    locale: ptBR,
  });
  const formattedDateShort = format(bookingDate, "dd/MM/yyyy", {
    locale: ptBR,
  });

  const requestedAgo = booking.requested_at
    ? formatDistanceToNow(new Date(booking.requested_at), {
        addSuffix: true,
        locale: ptBR,
      })
    : '';

  const statusStyle = statusStyles[booking.status] || { label: booking.status, className: 'bg-gray-500/20 text-gray-400' };

  return (
    <div className="bg-instructor-dark-secondary border border-white/10 rounded-xl p-6 hover:border-instructor-accent/30 transition-all duration-200">
      {/* Header - Student Info & Status */}
      <div className="flex items-start justify-between gap-4 mb-5">
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

          <div className="space-y-1">
            <h3 className="text-white font-semibold text-lg leading-tight">{booking.student.full_name}</h3>
            {booking.student.previous_classes > 0 ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{booking.student.previous_classes} aulas com você</span>
                {booking.student.average_rating && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-instructor-accent fill-instructor-accent" />
                      {booking.student.average_rating.toFixed(1)}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <Badge className="bg-instructor-accent/20 text-instructor-accent border-instructor-accent/30 text-xs">
                Novo aluno
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <Badge className={cn("border text-xs px-2.5 py-1", statusStyle.className)}>
            {statusStyle.label}
          </Badge>
          {variant === 'pending' && isUrgent() && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs px-2.5 py-1">
              🔥 Urgente
            </Badge>
          )}
        </div>
      </div>

      {/* Lesson Details Grid - Improved spacing */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 p-4 bg-white/5 rounded-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="h-4 w-4 text-instructor-accent" />
            <span className="text-[11px] uppercase tracking-wider font-medium">Data</span>
          </div>
          <p className="text-white font-semibold pl-6">{formattedDateShort}</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="h-4 w-4 text-instructor-accent" />
            <span className="text-[11px] uppercase tracking-wider font-medium">Horário</span>
          </div>
          <p className="text-white font-semibold pl-6">
            {formatTimeRange(booking.start_time, booking.end_time)}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-gray-500">
            <Car className="h-4 w-4 text-instructor-accent" />
            <span className="text-[11px] uppercase tracking-wider font-medium">Categoria</span>
          </div>
          <div className="pl-6">
            <p className="text-white font-semibold">Cat. {booking.license_category}</p>
            {booking.vehicle && (
              <p className="text-gray-400 text-xs mt-0.5">{booking.vehicle.model}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-gray-500">
            <DollarSign className="h-4 w-4 text-green-400" />
            <span className="text-[11px] uppercase tracking-wider font-medium">Valor</span>
          </div>
          <p className="text-green-400 font-bold text-lg pl-6">
            R$ {booking.instructor_amount.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      {/* Pickup Location - Highlighted section */}
      <div className="flex items-start gap-3 mb-5 p-4 bg-instructor-accent/10 rounded-xl border border-instructor-accent/20">
        <div className="p-2 bg-instructor-accent/20 rounded-lg shrink-0">
          <MapPin className="h-5 w-5 text-instructor-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-1 font-medium">Local de partida</p>
          <p className="text-white font-medium">{formatSimpleAddress(booking.pickup_address)}</p>
          {booking.pickup_latitude && booking.pickup_longitude && (
            <button
              onClick={openMapsDirection}
              className="text-xs text-instructor-accent hover:underline mt-2 flex items-center gap-1.5 font-medium"
            >
              <Navigation className="h-3.5 w-3.5" />
              Ver no mapa / Como chegar
            </button>
          )}
        </div>
      </div>

      {/* Student Message (only for pending) */}
      {variant === 'pending' && booking.student_message && (
        <div className="mb-5 p-4 bg-white/5 rounded-xl border-l-3 border-instructor-accent">
          <p className="text-xs text-gray-400 mb-1.5 font-medium">Mensagem do aluno:</p>
          <p className="text-gray-300 text-sm leading-relaxed">{booking.student_message}</p>
        </div>
      )}

      {/* Schedule Conflict Warning */}
      {hasConflict && variant === 'pending' && (
        <div className="mb-5 p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-400">
                Conflito de Horário
              </p>
              <p className="text-xs text-amber-300/70 mt-1">
                Você já tem uma aula confirmada neste horário. Verifique sua agenda antes de aceitar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Request Time */}
      {variant === 'pending' && requestedAgo && (
        <p className="text-xs text-gray-500 mb-4">
          Solicitado {requestedAgo}
        </p>
      )}

      {/* Actions - Aligned and consistent */}
      <div className="flex items-center gap-3 pt-2">
        {variant === 'pending' && (
          <>
            <Button
              onClick={() => onAccept?.(booking)}
              disabled={hasConflict}
              className="flex-1 bg-instructor-accent hover:bg-instructor-accent/90 text-instructor-dark-primary font-semibold h-11"
            >
              <Check className="h-4 w-4 mr-2" />
              Aceitar
            </Button>

            <Button
              variant="outline"
              onClick={() => onReject?.(booking)}
              className="flex-1 bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-11"
            >
              <X className="h-4 w-4 mr-2" />
              Recusar
            </Button>

            <Button
              variant="outline"
              onClick={() => onWhatsApp?.(booking)}
              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30 h-11 w-11 p-0"
              title="Contatar via WhatsApp"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </>
        )}

        {(variant === 'confirmed' || variant === 'completed') && (
          <>
            {onChat && (
              <ChatButton
                bookingId={booking.id}
                onClick={() => onChat(booking)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/10 h-11"
              />
            )}
            <Button
              variant="outline"
              onClick={() => onDetails?.(booking)}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white border-white/10 h-11"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>
            {variant === 'confirmed' && (
              <Button
                variant="outline"
                onClick={() => onWhatsApp?.(booking)}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30 h-11 w-11 p-0"
                title="Contatar via WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            )}
          </>
        )}

        {variant === 'cancelled' && (
          <Button
            variant="outline"
            onClick={() => onDetails?.(booking)}
            className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 border-white/10 h-11"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
        )}
      </div>
    </div>
  );
}