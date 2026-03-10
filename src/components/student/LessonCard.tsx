import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Car, Star, ChevronRight, Package, CreditCard, Loader2, RotateCcw, AlertTriangle, Timer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChatButton } from '@/components/chat/ChatButton';
import type { StudentLesson } from '@/types';
import { cn } from '@/lib/utils';
import { differenceInDays, differenceInHours, parseISO } from 'date-fns';
import { formatBookingDate } from '@/lib/addressFormatter';
import { formatTimeHHMM } from '@/lib/timeFormatter';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LessonCardProps {
  lesson: StudentLesson & {
    paymentStatus?: string;
    studentProfileId?: string;
    bookingId?: string;
    paymentDeadline?: string;
  };
  slotInfo?: {
    current: number;
    total: number;
  };
  onCancel?: () => void;
  onChat?: () => void;
  onDetails?: () => void;
  onReview?: () => void;
  onRefundRequest?: () => void;
  onNoShow?: () => void;
}

const statusStyles = {
  confirmed: { label: 'Confirmada', className: 'bg-green-100 text-green-700' },
  pending: { label: 'Aguardando Confirmação', className: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Concluída', className: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
  cancelled_by_student: { label: 'Cancelada por você', className: 'bg-red-100 text-red-700' },
  cancelled_by_instructor: { label: 'Cancelada pelo instrutor', className: 'bg-red-100 text-red-700' },
};

export function LessonCard({ lesson, slotInfo, onCancel, onChat, onDetails, onReview, onRefundRequest, onNoShow }: LessonCardProps) {
  const [payingLoading, setPayingLoading] = useState(false);
  // Parse date properly to avoid timezone issues
  const lessonDate = formatBookingDate(lesson.date);
  const [hours, minutes] = lesson.time.split(':').map(Number);
  lessonDate.setHours(hours, minutes, 0, 0);
  
  const now = new Date();
  const daysUntil = differenceInDays(lessonDate, now);
  const hoursUntil = differenceInHours(lessonDate, now);

  const paymentStatus = (lesson as any).paymentStatus || 'unpaid';
  const studentProfileId = (lesson as any).studentProfileId;
  const bookingId = (lesson as any).bookingId || lesson.id.split('_slot_')[0];

  const paymentDeadline = (lesson as any).paymentDeadline;
  const isExpired = paymentStatus === 'expired';
  const isInProcess = paymentStatus === 'in_process';
  const needsPayment = lesson.status === 'confirmed' && paymentStatus !== 'paid' && !isExpired && !isInProcess;

  // Payment deadline countdown
  const [deadlineRemaining, setDeadlineRemaining] = useState('');
  useEffect(() => {
    if (paymentStatus !== 'awaiting_payment' || !paymentDeadline) return;
    const update = () => {
      const diff = new Date(paymentDeadline).getTime() - Date.now();
      if (diff <= 0) {
        setDeadlineRemaining('Expirado');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setDeadlineRemaining(`${h}h ${m}min restantes`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [paymentStatus, paymentDeadline]);

  const handlePayment = async () => {
    setPayingLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-mp-checkout', {
        body: {
          booking_id: bookingId,
          student_id: studentProfileId,
          amount: lesson.price,
          description: `Aula de direção — ${lesson.instructorName}`,
        },
      });

      if (error) throw error;

      // Handle specific error codes from the edge function
      if (data?.error === 'already_paid') {
        toast.error('Esta aula já foi paga ou tem um pagamento em processamento. Atualize a página para ver o status mais recente.');
        return;
      }
      if (data?.error === 'instructor_mp_not_connected') {
        toast.error('O instrutor ainda não configurou o recebimento via Mercado Pago. Sua reserva está confirmada, mas o pagamento só poderá ser realizado após o instrutor configurar a conta dele.');
        return;
      }
      if (data?.error === 'platform_mp_account_not_configured') {
        console.error('Platform MP account not configured');
        toast.error('O sistema de pagamento está em manutenção. Tente novamente em breve.');
        return;
      }

      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      toast.error(err.message || 'Erro ao iniciar pagamento. Tente novamente.');
    } finally {
      setPayingLoading(false);
    }
  };

  const getCountdown = () => {
    if (lesson.status !== 'confirmed') return null;
    if (daysUntil > 1) return `Sua aula é em ${daysUntil} dias`;
    if (daysUntil === 1) return 'Sua aula é amanhã';
    if (hoursUntil > 0) return `Sua aula é em ${hoursUntil} horas`;
    return 'Sua aula é hoje!';
  };

  // Format date using the properly parsed date
  const formattedDate = lessonDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Date/Time Highlight */}
          <div className="bg-primary/5 p-4 md:p-6 md:w-48 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r relative">
            {/* Slot indicator for packages */}
            {slotInfo && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-xs gap-1 bg-primary/10 text-primary">
                  <Package className="h-3 w-3" />
                  {slotInfo.current}/{slotInfo.total}
                </Badge>
              </div>
            )}
            <p className="text-sm text-muted-foreground capitalize">{formattedDate.split(',')[0]}</p>
            <p className="text-2xl font-bold text-primary">{formatTimeHHMM(lesson.time)}</p>
            <p className="text-sm text-muted-foreground">
              {lessonDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
            </p>
            {lesson.status === 'confirmed' && getCountdown() && (
              <Badge variant="secondary" className="mt-2 text-xs">
                {getCountdown()}
              </Badge>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              {/* Instructor Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                  <AvatarImage src={lesson.instructorPhoto} alt={lesson.instructorName} />
                  <AvatarFallback>{lesson.instructorName.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{lesson.instructorName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{lesson.instructorRating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({lesson.instructorReviews} avaliações)
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-1.5 shrink-0">
                <Badge className={cn((statusStyles[lesson.status as keyof typeof statusStyles] || statusStyles.cancelled).className)}>
                  {(statusStyles[lesson.status as keyof typeof statusStyles] || statusStyles.cancelled).label}
                </Badge>
                {isExpired && (
                  <Badge className="bg-red-100 text-red-700">Pagamento expirado</Badge>
                )}
                {paymentStatus === 'paid' && (
                  <Badge className="bg-green-100 text-green-700">Pago</Badge>
                )}
                {paymentStatus === 'awaiting_payment' && !isExpired && (
                  <Badge className="bg-yellow-100 text-yellow-700">Aguardando pagamento</Badge>
                )}
                {isInProcess && (
                  <Badge className="bg-yellow-100 text-yellow-700">Pagamento em processamento</Badge>
                )}
                {paymentStatus === 'refunded' && (
                  <Badge className="bg-muted text-muted-foreground">Reembolsado</Badge>
                )}
              </div>
            </div>

            {/* Lesson Details */}
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Car className="h-4 w-4 text-primary" />
                <span>
                  {lesson.vehicle} • <Badge variant="outline" className="text-xs">Cat. {lesson.category}</Badge>
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>Duração: {lesson.duration}h</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="line-clamp-1">{lesson.location}</span>
              </div>
            </div>

            {/* Pending Message */}
            {lesson.status === 'pending' && (
              <p className="mt-3 text-sm text-orange-600 bg-orange-50 p-2 rounded-lg">
                Aguardando resposta do instrutor...
              </p>
            )}

            {/* Payment deadline countdown */}
            {paymentStatus === 'awaiting_payment' && deadlineRemaining && !isExpired && (
              <div className="mt-3 flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded-lg">
                <Timer className="h-4 w-4" />
                <span>Prazo para pagamento: <strong>{deadlineRemaining}</strong></span>
              </div>
            )}

            {/* In process status */}
            {isInProcess && (
              <div className="mt-3 flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Pagamento em processamento</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 text-xs"
                  onClick={() => window.location.reload()}
                >
                  Verificar status
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              {/* Pay button - shown when confirmed but not yet paid */}
              {needsPayment && (
                <Button
                  size="sm"
                  onClick={handlePayment}
                  disabled={payingLoading}
                  className="gap-2"
                >
                  {payingLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  {payingLoading ? 'Processando...' : 'Pagar Aula'}
                </Button>
              )}
              {lesson.status === 'confirmed' && (
                <>
                  <ChatButton
                    bookingId={lesson.id.split('_slot_')[0]}
                    onClick={() => onChat?.()}
                    variant="outline"
                    size="sm"
                    className="gap-2 h-9 px-3"
                  />
                  <Button variant="outline" size="sm" onClick={onDetails} className="gap-2">
                    Detalhes
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Cancelar
                  </Button>
                </>
              )}
              {/* Refund request button for paid confirmed/completed lessons */}
              {paymentStatus === 'paid' && onRefundRequest && (lesson.status === 'confirmed' || lesson.status === 'completed') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefundRequest}
                  className="gap-1 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-4 w-4" />
                  Solicitar Reembolso
                </Button>
              )}
              {/* No-show report button - visible after lesson time has passed, only for paid lessons */}
              {paymentStatus === 'paid' && onNoShow && lesson.status === 'confirmed' && lessonDate < now && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNoShow}
                  className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Instrutor não compareceu
                </Button>
              )}
              {lesson.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Cancelar Solicitação
                </Button>
              )}
              {lesson.status === 'completed' && !lesson.hasReviewed && (
                <Button size="sm" onClick={onReview} className="gap-2">
                  <Star className="h-4 w-4" />
                  Avaliar Aula
                </Button>
              )}
              {lesson.status === 'completed' && lesson.hasReviewed && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 opacity-50 cursor-not-allowed"
                  disabled
                >
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  Avaliação Enviada
                </Button>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="bg-muted/30 p-4 md:p-6 md:w-32 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l">
            <p className="text-sm text-muted-foreground">Valor</p>
            <p className="text-xl font-bold text-foreground">
              R$ {lesson.price.toFixed(0)}
            </p>
            {slotInfo && (
              <p className="text-xs text-muted-foreground mt-1">por aula</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
