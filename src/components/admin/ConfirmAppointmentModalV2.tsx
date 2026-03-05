import { useState } from 'react';
import { CheckCircle, Loader2, Phone, Calendar, Clock, MapPin, Car, Tag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BookingWithDetails } from '@/hooks/useInstructorBookings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatBookingDate, formatSimpleAddress } from '@/lib/addressFormatter';
import { formatTimeHHMM } from '@/lib/timeFormatter';
import { useMpConnection } from '@/hooks/useMpConnection';
import { MpRequiredModal } from './MpRequiredModal';

interface ConfirmAppointmentModalV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithDetails | null;
  onConfirm: (bookingId: string, message?: string) => Promise<boolean>;
}

export function ConfirmAppointmentModalV2({
  open,
  onOpenChange,
  booking,
  onConfirm,
}: ConfirmAppointmentModalV2Props) {
  const [message, setMessage] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [mpModalOpen, setMpModalOpen] = useState(false);
  const { isConnected: mpConnected, loading: mpLoading } = useMpConnection();

  if (!booking) return null;

  // Use formatBookingDate to properly parse the date without timezone issues
  const bookingDate = formatBookingDate(booking.scheduled_date);
  const formattedDate = format(
    bookingDate,
    "dd 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  );

  // Helper to get real booking ID (strip slot suffix for package bookings)
  const getRealBookingId = (bookingId: string): string => {
    if (bookingId.includes('-slot-')) {
      return bookingId.split('-slot-')[0];
    }
    return bookingId;
  };

  const handleConfirm = async () => {
    if (!confirmChecked) return;

    // Check MP connection before allowing confirm
    if (!mpConnected) {
      setMpModalOpen(true);
      return;
    }
    setIsConfirming(true);
    // Use real booking ID (without slot suffix) for database operations
    const realBookingId = getRealBookingId(booking.id);
    const success = await onConfirm(realBookingId, message || undefined);

    if (success) {
      onOpenChange(false);
      // Reset form
      setMessage('');
      setConfirmChecked(false);
    }
    setIsConfirming(false);
  };

  const handleWhatsAppClick = () => {
    if (booking.student.phone) {
      const cleanPhone = booking.student.phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setMessage('');
    setConfirmChecked(false);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Confirmar Agendamento
          </DialogTitle>
          <DialogDescription>
            Revise os detalhes antes de confirmar a aula
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student Info */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-background">
                <AvatarImage
                  src={booking.student.avatar_url || undefined}
                  alt={booking.student.full_name}
                />
                <AvatarFallback>
                  {booking.student.full_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{booking.student.full_name}</p>
                {booking.student.previous_classes > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {booking.student.previous_classes} aulas anteriores
                  </p>
                ) : (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Novo aluno
                  </Badge>
                )}
              </div>
            </div>
            {booking.student.phone && (
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 text-green-600 border-green-200 hover:bg-green-50"
                onClick={handleWhatsAppClick}
              >
                <Phone className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Booking Summary */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                <Tag className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <Badge className="mt-1 bg-primary/10 text-primary hover:bg-primary/10">
                    Cat. {booking.license_category}
                  </Badge>
                </div>
              </div>

              {booking.vehicle && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                  <Car className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Veículo</p>
                    <p className="font-medium">
                      {booking.vehicle.brand} {booking.vehicle.model}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                  <Calendar className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium">{formattedDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                  <Clock className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium">
                      {formatTimeHHMM(booking.start_time)} ({booking.duration_hours}h)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Local de partida</p>
                  <p className="font-medium text-sm">{formatSimpleAddress(booking.pickup_address)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Payment Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor da aula</span>
                <span>R$ {booking.total_price.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Taxa da plataforma
                  {booking.total_price > 0 && ` (${((booking.platform_fee / booking.total_price) * 100).toFixed(1).replace('.', ',')}%)`}
                </span>
                <span className="text-destructive">
                  - R$ {booking.platform_fee.toFixed(2).replace('.', ',')}
                </span>
              </div>
              {booking.is_affiliated_booking && Number(booking.school_fee) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Retenção autoescola
                    {booking.school_fee_rate && ` (${Number(booking.school_fee_rate).toFixed(0)}%)`}
                  </span>
                  <span className="text-destructive">
                    - R$ {Number(booking.school_fee).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between font-bold text-lg pt-2">
                <span>Você receberá</span>
                <span className="text-green-600">
                  R$ {booking.instructor_amount.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Mensagem para o aluno (opcional)
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex: Confirmo o horário! Te encontro no local combinado. Levar documento com foto."
              className="resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/500 caracteres
            </p>
          </div>

          {/* Confirmation Checkbox */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={confirmChecked}
                onCheckedChange={(checked) => setConfirmChecked(checked as boolean)}
                className="mt-1"
              />
              <div className="text-sm">
                <p className="font-medium">Confirmo minha disponibilidade</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Estou ciente que o aluno será notificado imediatamente e
                  cancelamentos após confirmação podem afetar minha avaliação.
                </p>
              </div>
            </label>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">💡 Lembretes importantes:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Chegue 5-10 minutos antes do horário</li>
              <li>• Verifique combustível e documentação do veículo</li>
              <li>• Confirme o local exato com o aluno se necessário</li>
              <li>• Em caso de imprevisto, avise com antecedência</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isConfirming}>
            Voltar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!confirmChecked || isConfirming}
            className="bg-green-600 hover:bg-green-700 text-white min-w-[180px]"
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Aula
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <MpRequiredModal open={mpModalOpen} onOpenChange={setMpModalOpen} />
    </>
  );
}
