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
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookingWithDetails } from '@/hooks/useInstructorBookings';
import { formatBookingDate, formatSimpleAddress } from '@/lib/addressFormatter';
import { formatTimeRange } from '@/lib/timeFormatter';

interface BookingCardProps {
  booking: BookingWithDetails;
  hasConflict: boolean;
  onAccept: (booking: BookingWithDetails) => void;
  onReject: (booking: BookingWithDetails) => void;
  onWhatsApp: (booking: BookingWithDetails) => void;
}

export function BookingCard({
  booking,
  hasConflict,
  onAccept,
  onReject,
  onWhatsApp,
}: BookingCardProps) {
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

  const requestedAgo = booking.requested_at
    ? formatDistanceToNow(new Date(booking.requested_at), {
        addSuffix: true,
        locale: ptBR,
      })
    : '';

  return (
    <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-muted">
            <AvatarImage
              src={booking.student.avatar_url || undefined}
              alt={booking.student.full_name}
            />
            <AvatarFallback className="text-lg">
              {booking.student.full_name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div>
            <h3 className="text-lg font-bold">{booking.student.full_name}</h3>

            {booking.student.previous_classes > 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{booking.student.previous_classes} aulas com você</span>
                {booking.student.average_rating && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      {booking.student.average_rating.toFixed(1)}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary">
                Novo aluno
              </Badge>
            )}

            {requestedAgo && (
              <p className="text-xs text-muted-foreground mt-1">
                Solicitado {requestedAgo}
              </p>
            )}
          </div>
        </div>

        {isUrgent() && (
          <Badge variant="destructive" className="shrink-0">
            🔥 Urgente
          </Badge>
        )}
      </div>

      {/* Lesson Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Data</p>
            <p className="font-medium">{formattedDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Horário</p>
            <p className="font-medium">
              {formatTimeRange(booking.start_time, booking.end_time)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Categoria</p>
            <div className="flex items-center gap-2">
              <span className="font-medium">Cat. {booking.license_category}</span>
              {booking.vehicle && (
                <span className="text-xs text-muted-foreground">
                  {booking.vehicle.model}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Você recebe</p>
            <p className="font-medium text-green-600">
              R$ {booking.instructor_amount.toFixed(2).replace('.', ',')}
            </p>
            {(booking.is_affiliated_booking && Number(booking.school_fee) > 0) || booking.platform_fee > 0 ? (
              <p className="text-xs text-muted-foreground">
                (Bruto: R$ {booking.total_price.toFixed(2).replace('.', ',')})
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Pickup Location */}
      <div className="flex items-start gap-2 mb-4 p-3 bg-primary/5 rounded-lg">
        <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Local de partida</p>
          <p className="text-sm text-muted-foreground">{formatSimpleAddress(booking.pickup_address)}</p>
          {booking.pickup_latitude && booking.pickup_longitude && (
            <button
              onClick={openMapsDirection}
              className="text-xs text-primary hover:underline mt-1 flex items-center gap-1"
            >
              <Navigation className="h-3 w-3" />
              Ver no mapa / Como chegar
            </button>
          )}
        </div>
      </div>

      {/* Student Message */}
      {booking.student_message && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
          <p className="text-sm text-muted-foreground mb-1 font-medium">
            Mensagem do aluno:
          </p>
          <p className="text-sm">{booking.student_message}</p>
        </div>
      )}

      {/* Schedule Conflict Warning */}
      {hasConflict && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border-l-4 border-yellow-500">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                ⚠️ Conflito de Horário
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-200 mt-1">
                Você já tem uma aula confirmada neste horário. Verifique seu
                calendário antes de aceitar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={() => onAccept(booking)}
          disabled={hasConflict}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="h-5 w-5 mr-2" />
          Aceitar Aula
        </Button>

        <Button
          variant="outline"
          onClick={() => onReject(booking)}
          className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
        >
          <X className="h-5 w-5 mr-2" />
          Recusar
        </Button>

        <Button
          variant="outline"
          onClick={() => onWhatsApp(booking)}
          className="bg-green-500 hover:bg-green-600 text-white border-0"
          title="Contatar via WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
