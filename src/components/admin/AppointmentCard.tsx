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
  CheckCircle2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookingWithDetails } from '@/hooks/useInstructorBookings';
import { formatBookingDate, formatSimpleAddress } from '@/lib/addressFormatter';
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
    <div className="bg-instructor-dark-secondary border border-white/10 rounded-xl p-5 hover:border-instructor-accent/30 transition-all duration-200">
      {/* Header - Student Info */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-instructor-accent/30">
            <AvatarImage
              src={booking.student.avatar_url || undefined}
              alt={booking.student.full_name}
            />
            <AvatarFallback className="bg-instructor-accent/20 text-instructor-accent font-semibold">
              {booking.student.full_name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <h3 className="text-white font-semibold">{booking.student.full_name}</h3>
            {booking.student.previous_classes > 0 ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{booking.student.previous_classes} aulas com você</span>
                {booking.student.average_rating && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-instructor-accent fill-instructor-accent" />
                      {booking.student.average_rating.toFixed(1)}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <Badge className="mt-1 bg-instructor-accent/20 text-instructor-accent border-instructor-accent/30 text-xs">
                Novo aluno
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {variant === 'pending' && isUrgent() && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
              🔥 Urgente
            </Badge>
          )}
          <Badge className={cn("border text-xs", statusStyle.className)}>
            {statusStyle.label}
          </Badge>
        </div>
      </div>

      {/* Lesson Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-white/5 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-instructor-accent shrink-0" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Data</p>
            <p className="text-sm text-white font-medium">{formattedDateShort}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-instructor-accent shrink-0" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Horário</p>
            <p className="text-sm text-white font-medium">
              {booking.start_time} - {booking.end_time}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-instructor-accent shrink-0" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Categoria</p>
            <p className="text-sm text-white font-medium">
              Cat. {booking.license_category}
              {booking.vehicle && (
                <span className="text-gray-400 ml-1">
                  • {booking.vehicle.model}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-400 shrink-0" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Valor</p>
            <p className="text-sm text-green-400 font-semibold">
              R$ {booking.instructor_amount.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>
      </div>

      {/* Pickup Location */}
      <div className="flex items-start gap-2 mb-4 p-3 bg-instructor-accent/10 rounded-lg border border-instructor-accent/20">
        <MapPin className="h-4 w-4 text-instructor-accent mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">Local de partida</p>
          <p className="text-sm text-white truncate">{formatSimpleAddress(booking.pickup_address)}</p>
          {booking.pickup_latitude && booking.pickup_longitude && (
            <button
              onClick={openMapsDirection}
              className="text-xs text-instructor-accent hover:underline mt-1 flex items-center gap-1"
            >
              <Navigation className="h-3 w-3" />
              Ver no mapa
            </button>
          )}
        </div>
      </div>

      {/* Student Message (only for pending) */}
      {variant === 'pending' && booking.student_message && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg border-l-2 border-instructor-accent">
          <p className="text-xs text-gray-400 mb-1">Mensagem do aluno:</p>
          <p className="text-sm text-gray-300">{booking.student_message}</p>
        </div>
      )}

      {/* Schedule Conflict Warning */}
      {hasConflict && variant === 'pending' && (
        <div className="mb-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400">
                Conflito de Horário
              </p>
              <p className="text-xs text-amber-300/70 mt-0.5">
                Você já tem uma aula confirmada neste horário.
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

      {/* Actions - Different for each variant */}
      <div className="flex gap-2 flex-wrap">
        {variant === 'pending' && (
          <>
            <Button
              onClick={() => onAccept?.(booking)}
              disabled={hasConflict}
              className="flex-1 bg-instructor-accent hover:bg-instructor-accent/90 text-instructor-dark-primary font-semibold"
            >
              <Check className="h-4 w-4 mr-2" />
              Aceitar
            </Button>

            <Button
              variant="outline"
              onClick={() => onReject?.(booking)}
              className="flex-1 bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <X className="h-4 w-4 mr-2" />
              Recusar
            </Button>

            <Button
              variant="outline"
              onClick={() => onWhatsApp?.(booking)}
              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30"
              title="WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </>
        )}

        {(variant === 'confirmed' || variant === 'completed') && (
          <>
            {onChat && (
              <ChatButton
                bookingId={booking.id}
                onClick={() => onChat(booking)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/10"
              />
            )}
            <Button
              variant="outline"
              onClick={() => onDetails?.(booking)}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white border-white/10"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>
            {variant === 'confirmed' && (
              <Button
                variant="outline"
                onClick={() => onWhatsApp?.(booking)}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30"
                title="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
          </>
        )}

        {variant === 'cancelled' && (
          <Button
            variant="outline"
            onClick={() => onDetails?.(booking)}
            className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 border-white/10"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
        )}
      </div>
    </div>
  );
}