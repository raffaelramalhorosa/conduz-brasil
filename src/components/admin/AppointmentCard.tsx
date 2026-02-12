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
  AlertTriangle,
  Star,
  Eye,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookingWithDetails } from '@/hooks/useInstructorBookings';
import { formatBookingDate, formatSimpleAddress } from '@/lib/addressFormatter';
import { formatTimeRange } from '@/lib/timeFormatter';
import { ChatButton } from '@/components/chat/ChatButton';
import { cn } from '@/lib/utils';
import { Building2 } from 'lucide-react';

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
  isAffiliatedInstructor?: boolean;
  onAccept?: (booking: BookingWithDetails) => void;
  onReject?: (booking: BookingWithDetails) => void;
  onChat?: (booking: BookingWithDetails) => void;
  onDetails?: (booking: BookingWithDetails) => void;
  onMarkComplete?: (booking: BookingWithDetails) => void;
  isMarkingComplete?: boolean;
}

export function AppointmentCard({
  booking,
  variant,
  hasConflict = false,
  isAffiliatedInstructor = false,
  onAccept,
  onReject,
  onChat,
  onDetails,
  onMarkComplete,
  isMarkingComplete,
}: AppointmentCardProps) {
  const isUrgent = () => {
    const date = formatBookingDate(booking.scheduled_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return differenceInDays(date, today) <= 1;
  };

  // Use formatBookingDate to properly parse the date string without timezone issues
  const bookingDate = formatBookingDate(booking.scheduled_date);
  const formattedDateShort = format(bookingDate, "dd/MM/yyyy", { locale: ptBR });
  const formattedWeekday = format(bookingDate, "EEE", { locale: ptBR });

  const requestedAgo = booking.requested_at
    ? formatDistanceToNow(new Date(booking.requested_at), {
        addSuffix: true,
        locale: ptBR,
      })
    : '';

  const statusStyle = statusStyles[booking.status] || { label: booking.status, className: 'bg-gray-500/20 text-gray-400' };

  return (
    <div className="bg-instructor-dark-secondary border border-white/10 rounded-xl hover:border-instructor-accent/30 transition-all duration-200 overflow-hidden">
      {/* Compact Header */}
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-11 w-11 border-2 border-instructor-accent/30 shrink-0">
              <AvatarImage
                src={booking.student.avatar_url || undefined}
                alt={booking.student.full_name}
              />
              <AvatarFallback className="bg-instructor-accent/20 text-instructor-accent font-semibold">
                {booking.student.full_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <h3 className="text-white font-semibold truncate">{booking.student.full_name}</h3>
              {booking.student.previous_classes > 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span>{booking.student.previous_classes} aulas</span>
                  {booking.student.average_rating && (
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-instructor-accent fill-instructor-accent" />
                      {booking.student.average_rating.toFixed(1)}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-instructor-accent">Novo aluno</span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge className={cn("border text-[10px] px-2 py-0.5", statusStyle.className)}>
              {statusStyle.label}
            </Badge>
            {booking.slotIndex && booking.totalSlots && (
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-2 py-0.5">
                Aula {booking.slotIndex}/{booking.totalSlots}
              </Badge>
            )}
            {variant === 'pending' && isUrgent() && (
              <span className="text-[10px] text-red-400">🔥 Urgente</span>
            )}
          </div>
        </div>

        {/* Info Grid - Horizontal layout */}
        <div className="grid grid-cols-4 gap-3 p-3 bg-white/5 rounded-lg mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="h-3.5 w-3.5 text-instructor-accent" />
            </div>
            <p className="text-white font-semibold text-sm">{formattedDateShort}</p>
            <p className="text-[10px] text-gray-500 capitalize">{formattedWeekday}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3.5 w-3.5 text-instructor-accent" />
            </div>
            <p className="text-white font-semibold text-sm">
              {formatTimeRange(booking.start_time, booking.end_time)}
            </p>
            <p className="text-[10px] text-gray-500">{booking.duration_hours}h</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Car className="h-3.5 w-3.5 text-instructor-accent" />
            </div>
            <p className="text-white font-semibold text-sm">Cat. {booking.license_category}</p>
            {booking.vehicle && (
              <p className="text-[10px] text-gray-500 truncate">{booking.vehicle.model}</p>
            )}
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-green-400" />
            </div>
            <p className="text-green-400 font-bold text-base">
              R$ {booking.instructor_amount.toFixed(0)}
            </p>
            <p className="text-[10px] text-gray-500">líquido</p>
          </div>
        </div>

        {/* Pickup Location - Compact */}
        <div className="flex items-center gap-2 p-2.5 bg-instructor-accent/10 rounded-lg border border-instructor-accent/20 mb-4">
          <MapPin className="h-4 w-4 text-instructor-accent shrink-0" />
          <p className="text-sm text-white truncate flex-1">
            {formatSimpleAddress(booking.pickup_address)}
          </p>
        </div>

        {/* Schedule Conflict Warning */}
        {hasConflict && variant === 'pending' && (
          <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/30 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-400">
              Conflito de horário detectado
            </p>
          </div>
        )}

        {/* Affiliated instructor: pending bookings managed by school */}
        {isAffiliatedInstructor && variant === 'pending' && (
          <div className="flex items-center gap-2 p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/30 mb-4">
            <Building2 className="h-4 w-4 text-blue-400 shrink-0" />
            <p className="text-xs text-blue-400">
              Aguardando aprovação da autoescola
            </p>
          </div>
        )}

        {/* Request Time for pending */}
        {variant === 'pending' && requestedAgo && (
          <p className="text-[10px] text-gray-500 mb-3">
            Solicitado {requestedAgo}
          </p>
        )}
      </div>

      {/* Actions Footer */}
      <div className="px-5 pb-5 flex items-center gap-2">
        {variant === 'pending' && !isAffiliatedInstructor && (
          <>
            <Button
              onClick={() => onAccept?.(booking)}
              disabled={hasConflict}
              size="sm"
              className="flex-1 bg-instructor-accent hover:bg-instructor-accent/90 text-instructor-dark-primary font-semibold h-9"
            >
              <Check className="h-4 w-4 mr-1.5" />
              Aceitar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onReject?.(booking)}
              className="flex-1 bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 h-9"
            >
              <X className="h-4 w-4 mr-1.5" />
              Recusar
            </Button>
          </>
        )}

        {variant === 'pending' && isAffiliatedInstructor && (
          <>
            {onChat && (
              <ChatButton
                bookingId={booking.id}
                onClick={() => onChat(booking)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/10 h-9"
              />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDetails?.(booking)}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white border-white/10 h-9"
            >
              <Eye className="h-4 w-4 mr-1.5" />
              Detalhes
            </Button>
          </>
        )}

        {variant === 'confirmed' && (
          <>
            {onMarkComplete && (
              <Button
                onClick={() => onMarkComplete(booking)}
                disabled={isMarkingComplete}
                size="sm"
                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 h-9"
              >
                {isMarkingComplete ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                )}
                Concluir
              </Button>
            )}
            {onChat && (
              <ChatButton
                bookingId={booking.id}
                onClick={() => onChat(booking)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/10 h-9"
              />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDetails?.(booking)}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white border-white/10 h-9"
            >
              <Eye className="h-4 w-4 mr-1.5" />
              Detalhes
            </Button>
          </>
        )}

        {variant === 'completed' && (
          <>
            {onChat && (
              <ChatButton
                bookingId={booking.id}
                onClick={() => onChat(booking)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/10 h-9"
              />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDetails?.(booking)}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white border-white/10 h-9"
            >
              <Eye className="h-4 w-4 mr-1.5" />
              Ver Detalhes
            </Button>
          </>
        )}

        {variant === 'cancelled' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDetails?.(booking)}
            className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 border-white/10 h-9"
          >
            <Eye className="h-4 w-4 mr-1.5" />
            Ver Detalhes
          </Button>
        )}
      </div>
    </div>
  );
}