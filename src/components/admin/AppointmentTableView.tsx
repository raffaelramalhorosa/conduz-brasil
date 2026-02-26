import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Check, X, Eye, CheckCircle, Loader2, MessageCircle,
  ArrowLeftRight, Building2, AlertTriangle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { BookingWithDetails } from '@/hooks/useInstructorBookings';
import { formatBookingDate, formatSimpleAddress } from '@/lib/addressFormatter';
import { formatTimeRange } from '@/lib/timeFormatter';
import { cn } from '@/lib/utils';

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

interface AppointmentTableViewProps {
  bookings: BookingWithDetails[];
  variant: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  isAffiliatedInstructor?: boolean;
  onAccept?: (booking: BookingWithDetails) => void;
  onReject?: (booking: BookingWithDetails) => void;
  onChat?: (booking: BookingWithDetails) => void;
  onDetails?: (booking: BookingWithDetails) => void;
  onMarkComplete?: (booking: BookingWithDetails) => void;
  isMarkingCompleteId?: string | null;
  checkConflict?: (booking: BookingWithDetails) => boolean;
}

export function AppointmentTableView({
  bookings,
  variant,
  isAffiliatedInstructor = false,
  onAccept,
  onReject,
  onChat,
  onDetails,
  onMarkComplete,
  isMarkingCompleteId,
  checkConflict,
}: AppointmentTableViewProps) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 bg-muted/50 rounded-xl border border-border">
        <CheckCircle className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          {variant === 'pending' && 'Nenhuma solicitação pendente'}
          {variant === 'confirmed' && 'Nenhuma aula confirmada'}
          {variant === 'completed' && 'Nenhuma aula concluída'}
          {variant === 'cancelled' && 'Nenhuma aula cancelada'}
        </h3>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">Participantes</TableHead>
            <TableHead className="text-muted-foreground">Data / Horário</TableHead>
            <TableHead className="text-muted-foreground hidden md:table-cell">Categoria</TableHead>
            <TableHead className="text-muted-foreground hidden lg:table-cell">Local</TableHead>
            <TableHead className="text-muted-foreground text-right">Valor</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-muted-foreground text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            const statusStyle = statusStyles[booking.status] || { label: booking.status, className: 'bg-muted text-muted-foreground' };
            const bookingDate = formatBookingDate(booking.scheduled_date);
            const hasConflict = variant === 'pending' && checkConflict?.(booking);
            const isAffiliated = isAffiliatedInstructor && !!booking.is_affiliated_booking;

            return (
              <TableRow key={booking.id} className="border-border hover:bg-muted/30">
                {/* Participants */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {booking.instructor && (
                      <>
                        <Avatar className="h-7 w-7 border border-orange-500/30">
                          <AvatarImage src={booking.instructor.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-[10px] font-bold">
                            {booking.instructor.full_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <ArrowLeftRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                      </>
                    )}
                    <Avatar className="h-7 w-7 border border-primary/30">
                      <AvatarImage src={booking.student.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                        {booking.student.full_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate max-w-[140px]">
                        {booking.student.full_name}
                      </p>
                      {booking.instructor && (
                        <p className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                          {booking.instructor.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Date / Time */}
                <TableCell>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {format(bookingDate, "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeRange(booking.start_time, booking.end_time)} · {booking.duration_hours}h
                    </p>
                  </div>
                </TableCell>

                {/* Category */}
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline" className="text-xs border-border text-foreground">
                    Cat. {booking.license_category}
                  </Badge>
                  {booking.vehicle && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[100px]">
                      {booking.vehicle.model}
                    </p>
                  )}
                </TableCell>

                {/* Location */}
                <TableCell className="hidden lg:table-cell">
                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {formatSimpleAddress(booking.pickup_address)}
                  </p>
                </TableCell>

                {/* Value */}
                <TableCell className="text-right">
                  <p className="text-sm font-bold text-green-400">
                    R$ {booking.instructor_amount.toFixed(0)}
                  </p>
                  {booking.is_affiliated_booking && Number(booking.school_fee) > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      total: R$ {booking.total_price.toFixed(0)}
                    </p>
                  )}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge className={cn("border text-[10px] px-2 py-0.5 w-fit", statusStyle.className)}>
                      {statusStyle.label}
                    </Badge>
                    {booking.slotIndex && booking.totalSlots && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-2 py-0.5 w-fit">
                        {booking.slotIndex}/{booking.totalSlots}
                      </Badge>
                    )}
                    {hasConflict && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400">
                        <AlertTriangle className="h-3 w-3" /> Conflito
                      </span>
                    )}
                    {isAffiliated && variant === 'pending' && (
                      <span className="flex items-center gap-1 text-[10px] text-blue-400">
                        <Building2 className="h-3 w-3" /> Autoescola
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {variant === 'pending' && !isAffiliated && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={!!hasConflict}
                          onClick={() => onAccept?.(booking)}
                          className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onReject?.(booking)}
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {variant === 'confirmed' && onMarkComplete && (
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isMarkingCompleteId === booking.id}
                        onClick={() => onMarkComplete(booking)}
                        className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                      >
                        {isMarkingCompleteId === booking.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {onChat && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onChat(booking)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDetails?.(booking)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
