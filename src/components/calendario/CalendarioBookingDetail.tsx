import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, Car, DollarSign, User, Building2, GraduationCap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { BookingCalendario } from './CalendarioAulas';

interface CalendarioBookingDetailProps {
  booking: BookingCalendario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: 'student' | 'instructor' | 'driving_school';
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: string }> = {
    pending: { label: 'Pendente', variant: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    confirmed: { label: 'Confirmada', variant: 'bg-blue-100 text-blue-800 border-blue-300' },
    in_progress: { label: 'Em andamento', variant: 'bg-orange-100 text-orange-800 border-orange-300' },
    completed: { label: 'Concluída', variant: 'bg-green-100 text-green-800 border-green-300' },
    cancelled_by_student: { label: 'Cancelada pelo aluno', variant: 'bg-gray-100 text-gray-600 border-gray-300' },
    cancelled_by_instructor: { label: 'Cancelada pelo instrutor', variant: 'bg-gray-100 text-gray-600 border-gray-300' },
  };
  const info = map[status] || { label: status, variant: 'bg-gray-100 text-gray-600 border-gray-300' };
  return <Badge className={`${info.variant} border`}>{info.label}</Badge>;
}

function DetailContent({ booking, userRole }: { booking: BookingCalendario; userRole: string }) {
  const meta = booking.metadata;

  return (
    <div className="space-y-5 py-2">
      {/* Status */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Status</span>
        {getStatusBadge(booking.status)}
      </div>

      <Separator />

      {/* Participants */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Participantes</h3>
        
        {/* Instructor */}
        {meta.instructorName && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {meta.instructorAvatar ? (
                <img src={meta.instructorAvatar} className="w-10 h-10 rounded-full object-cover" alt="" />
              ) : (
                meta.instructorName.charAt(0)
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{meta.instructorName}</p>
              <p className="text-xs text-muted-foreground">Instrutor</p>
            </div>
            <GraduationCap className="w-4 h-4 text-orange-400" />
          </div>
        )}

        {/* Student */}
        {meta.studentName && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {meta.studentAvatar ? (
                <img src={meta.studentAvatar} className="w-10 h-10 rounded-full object-cover" alt="" />
              ) : (
                meta.studentName.charAt(0)
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{meta.studentName}</p>
              <p className="text-xs text-muted-foreground">Aluno</p>
            </div>
            <User className="w-4 h-4 text-blue-400" />
          </div>
        )}
      </div>

      <Separator />

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Data</p>
            <p className="text-sm font-medium">{booking.date.split('-').reverse().join('/')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Horário</p>
            <p className="text-sm font-medium">{booking.startTime} - {booking.endTime}</p>
          </div>
        </div>
      </div>

      {/* Category */}
      {meta.licenseCat && (
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Categoria</p>
            <p className="text-sm font-medium">Cat. {meta.licenseCat}</p>
          </div>
        </div>
      )}

      {/* Address */}
      {meta.pickupAddress && (
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Local de encontro</p>
            <p className="text-sm font-medium">{meta.pickupAddress}</p>
          </div>
        </div>
      )}

      <Separator />

      {/* Pricing */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Financeiro</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
          {meta.totalPrice != null && (
            <div className="flex justify-between text-sm">
              <span>Valor total</span>
              <span className="font-semibold">R$ {meta.totalPrice.toFixed(2)}</span>
            </div>
          )}
          {(userRole === 'driving_school' && meta.schoolFee != null) && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> Taxa autoescola</span>
              <span className="font-medium text-primary">R$ {meta.schoolFee.toFixed(2)}</span>
            </div>
          )}
          {(userRole !== 'student' && meta.instructorAmount != null) && (
            <div className="flex justify-between text-sm">
              <span>Valor instrutor</span>
              <span className="font-medium text-green-600">R$ {meta.instructorAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CalendarioBookingDetail({ booking, open, onOpenChange, userRole }: CalendarioBookingDetailProps) {
  const isMobile = useIsMobile();

  if (!booking) return null;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-left">🚗 {booking.title}</SheetTitle>
          </SheetHeader>
          <DetailContent booking={booking} userRole={userRole} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>🚗 {booking.title}</DialogTitle>
        </DialogHeader>
        <DetailContent booking={booking} userRole={userRole} />
      </DialogContent>
    </Dialog>
  );
}
