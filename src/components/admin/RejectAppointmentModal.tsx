import { useState } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { BookingWithDetails } from '@/hooks/useInstructorBookings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RejectAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithDetails | null;
  onReject: (bookingId: string, reason: string, message?: string) => Promise<boolean>;
}

const rejectReasons = [
  { value: 'schedule_conflict', label: 'Conflito de horário' },
  { value: 'unavailable', label: 'Não estarei disponível' },
  { value: 'vehicle_issue', label: 'Problema com veículo' },
  { value: 'location_far', label: 'Local muito distante' },
  { value: 'other', label: 'Outro motivo' },
];

export function RejectAppointmentModal({
  open,
  onOpenChange,
  booking,
  onReject,
}: RejectAppointmentModalProps) {
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  if (!booking) return null;

  const formattedDate = format(new Date(booking.scheduled_date), "dd/MM/yyyy", {
    locale: ptBR,
  });

  // Helper to get real booking ID (strip slot suffix for package bookings)
  const getRealBookingId = (bookingId: string): string => {
    if (bookingId.includes('-slot-')) {
      return bookingId.split('-slot-')[0];
    }
    return bookingId;
  };

  const handleReject = async () => {
    if (!reason) return;

    setIsRejecting(true);
    // Use real booking ID (without slot suffix) for database operations
    const realBookingId = getRealBookingId(booking.id);
    const success = await onReject(realBookingId, reason, message || undefined);

    if (success) {
      onOpenChange(false);
      // Reset form
      setReason('');
      setMessage('');
    }
    setIsRejecting(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setReason('');
    setMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-6 w-6 text-destructive" />
            Recusar Solicitação
          </DialogTitle>
          <DialogDescription>
            Por favor, informe o motivo da recusa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Summary */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Aluno: </span>
              <span className="font-medium">{booking.student.full_name}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Data: </span>
              <span className="font-medium">
                {formattedDate} às {booking.start_time}
              </span>
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Motivo da recusa *</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {rejectReasons.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="text-sm cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Message */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Mensagem para o aluno (opcional)
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explique o motivo ou sugira uma alternativa..."
              className="resize-none text-sm"
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/300 caracteres
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              ⚠️ Recusas frequentes podem impactar sua avaliação e visibilidade
              na plataforma.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isRejecting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={!reason || isRejecting}
          >
            {isRejecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              'Confirmar Recusa'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
