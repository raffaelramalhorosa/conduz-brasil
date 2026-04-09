import { useState, useEffect } from 'react';
import { Calendar, Clock, History, Loader2, Package, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LessonCard } from '@/components/student/LessonCard';
import { RefundRequestModal } from '@/components/student/RefundRequestModal';
import { NoShowReportModal } from '@/components/student/NoShowReportModal';
import { CancelPaidLessonModal } from '@/components/student/CancelPaidLessonModal';
import { StudentCheckinModal } from '@/components/student/StudentCheckinModal';
import { DisputeModal } from '@/components/shared/DisputeModal';
import { ConversationChatModal } from '@/components/chat/ConversationChatModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ReviewForm from '@/components/profile/ReviewForm';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useConversation } from '@/hooks/useConversation';
import { useNavigate } from 'react-router-dom';
import type { StudentLesson } from '@/types';
import { format, parseISO, isAfter, isBefore, startOfDay, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ScheduledSlot {
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface LessonWithInstructor extends StudentLesson {
  instructorUserId?: string;
  instructorProfileId?: string;
  bookingId?: string;
  slotIndex?: number;
  totalSlots?: number;
  packageType?: string;
  paymentStatus?: string;
  studentProfileId?: string;
  paymentDeadline?: string;
  studentCheckinAt?: string | null;
}

export default function StudentLessons() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getConversationByBooking } = useConversation();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [lessons, setLessons] = useState<LessonWithInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonWithInstructor | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // Review state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [lessonToReview, setLessonToReview] = useState<LessonWithInstructor | null>(null);
  // Track which bookings already prompted a review this session (avoid re-opening)
  const [reviewedInSession, setReviewedInSession] = useState<Set<string>>(new Set());
  
  // Cancel state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [lessonToCancel, setLessonToCancel] = useState<LessonWithInstructor | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Refund request state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [lessonForRefund, setLessonForRefund] = useState<LessonWithInstructor | null>(null);
  const [requestingRefund, setRequestingRefund] = useState(false);

  // No-show state
  const [noShowModalOpen, setNoShowModalOpen] = useState(false);
  const [lessonNoShow, setLessonNoShow] = useState<LessonWithInstructor | null>(null);
  const [processingNoShow, setProcessingNoShow] = useState(false);

  // Cancel paid lesson state
  const [cancelPaidModalOpen, setCancelPaidModalOpen] = useState(false);
  const [lessonCancelPaid, setLessonCancelPaid] = useState<LessonWithInstructor | null>(null);
  const [cancelPaidHoursUntil, setCancelPaidHoursUntil] = useState(0);
  const [cancellingPaid, setCancellingPaid] = useState(false);

  // Checkin state
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [lessonForCheckin, setLessonForCheckin] = useState<LessonWithInstructor | null>(null);

  // Dispute state
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [lessonForDispute, setLessonForDispute] = useState<LessonWithInstructor | null>(null);

  useEffect(() => {
    if (user) {
      fetchLessons();
    }
  }, [user]);

  // Realtime subscription for booking changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('student-bookings-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          fetchLessons();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchLessons = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!studentProfile) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          scheduled_date,
          start_time,
          duration_hours,
          pickup_address,
          total_price,
          status,
          payment_status,
          payment_deadline,
          license_category,
          package_type,
          package_lessons_count,
          scheduled_slots,
          student_id,
          student_checkin_at,
          instructor_checkin_at,
          instructor_profiles!bookings_instructor_id_fkey (
            id,
            average_rating,
            total_reviews,
            user_id,
            profiles!inner (
              full_name,
              avatar_url
            )
          ),
          vehicles (
            brand,
            model
          )
        `)
        .eq('student_id', studentProfile.id)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      if (data) {
        // Fetch reviewed booking IDs separately for reliability
        const bookingIds = data.map((b: any) => b.id);
        const { data: reviewedData } = await supabase
          .from('reviews')
          .select('booking_id')
          .in('booking_id', bookingIds);
        const reviewedBookingIds = new Set((reviewedData || []).map((r: any) => r.booking_id));
        const expandedLessons: LessonWithInstructor[] = [];
        const today = startOfDay(new Date());

        data.forEach((booking: any) => {
          const baseLesson = {
            instructorName: booking.instructor_profiles?.profiles?.full_name || 'Instrutor',
            instructorPhoto: booking.instructor_profiles?.profiles?.avatar_url || '',
            instructorRating: booking.instructor_profiles?.average_rating || 0,
            instructorReviews: booking.instructor_profiles?.total_reviews || 0,
            instructorUserId: booking.instructor_profiles?.user_id,
            instructorProfileId: booking.instructor_profiles?.id,
            category: booking.license_category,
            vehicle: booking.vehicles ? `${booking.vehicles.brand} ${booking.vehicles.model}` : 'Veículo',
            location: booking.pickup_address,
            duration: booking.duration_hours || 1,
            hasReviewed: reviewedBookingIds.has(booking.id),
            bookingId: booking.id,
            packageType: booking.package_type,
            paymentStatus: booking.payment_status || 'unpaid',
            studentProfileId: booking.student_id,
            paymentDeadline: booking.payment_deadline,
            studentCheckinAt: booking.student_checkin_at || null,
          };

          // Parse scheduled_slots - may come as string or array from Supabase
          let scheduledSlots: ScheduledSlot[] | null = null;
          
          if (booking.scheduled_slots) {
            if (typeof booking.scheduled_slots === 'string') {
              try {
                scheduledSlots = JSON.parse(booking.scheduled_slots);
              } catch (e) {
                console.error('Error parsing scheduled_slots:', e);
              }
            } else if (Array.isArray(booking.scheduled_slots)) {
              scheduledSlots = booking.scheduled_slots;
            }
          }
          
          console.log('Booking:', booking.id, 'scheduled_slots:', scheduledSlots, 'length:', scheduledSlots?.length);
          
          if (scheduledSlots && Array.isArray(scheduledSlots) && scheduledSlots.length > 1) {
            // Package booking - expand each slot into individual lesson
            const totalSlots = scheduledSlots.length;
            const pricePerLesson = booking.total_price / totalSlots;

            scheduledSlots.forEach((slot, index) => {
              const slotDate = parseISO(slot.date);
              
              // Determine status based on slot status and date
              let lessonStatus: 'confirmed' | 'pending' | 'completed' | 'cancelled' = 'pending';
              
              if (slot.status === 'cancelled') {
                lessonStatus = 'cancelled';
              } else if (slot.status === 'completed') {
                lessonStatus = 'completed';
              } else if (booking.status === 'confirmed') {
                lessonStatus = isBefore(slotDate, today) ? 'completed' : 'confirmed';
              } else if (booking.status === 'pending') {
                lessonStatus = 'pending';
              } else if (booking.status.startsWith('cancelled')) {
                lessonStatus = 'cancelled';
              } else if (booking.status === 'completed') {
                lessonStatus = 'completed';
              }

              expandedLessons.push({
                ...baseLesson,
                id: `${booking.id}_slot_${index}`,
                date: slot.date,
                time: slot.time,
                price: pricePerLesson,
                status: lessonStatus,
                slotIndex: index + 1,
                totalSlots: totalSlots,
              });
            });
          } else {
            // Single lesson booking
            expandedLessons.push({
              ...baseLesson,
              id: booking.id,
              date: booking.scheduled_date,
              time: booking.start_time.slice(0, 5),
              price: booking.total_price,
              status: booking.status as 'confirmed' | 'pending' | 'completed' | 'cancelled',
              slotIndex: undefined,
              totalSlots: undefined,
            });
          }
        });

        // Sort by date (ascending for upcoming, descending for history)
        expandedLessons.sort((a, b) => {
          const dateA = parseISO(a.date);
          const dateB = parseISO(b.date);
          return dateA.getTime() - dateB.getTime();
        });

        setLessons(expandedLessons);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const today = startOfDay(new Date());
  
  // Filter lessons - now with proper date comparison
  const upcomingLessons = lessons.filter((l) => {
    const lessonDate = parseISO(l.date);
    return (l.status === 'confirmed' || l.status === 'in_progress') && !isBefore(lessonDate, today);
  });

  // In-progress lessons requiring student check-in
  const inProgressNeedingCheckin = upcomingLessons.filter(
    (l) => l.status === 'in_progress' && !l.studentCheckinAt
  );
  
  const pendingLessons = lessons.filter((l) => l.status === 'pending');
  
  const historyLessons = lessons.filter((l) => {
    const lessonDate = parseISO(l.date);
    return l.status === 'completed' || (l.status !== 'pending' && l.status !== 'cancelled' && isBefore(lessonDate, today));
  });

  const handleCancelClick = (lesson: LessonWithInstructor) => {
    const paymentStatus = lesson.paymentStatus;
    if (paymentStatus === 'paid') {
      // Use the paid cancellation modal with 24h logic
      const lessonDateTime = new Date(`${lesson.date}T${lesson.time}`);
      const hours = differenceInHours(lessonDateTime, new Date());
      setLessonCancelPaid(lesson);
      setCancelPaidHoursUntil(hours);
      setCancelPaidModalOpen(true);
    } else {
      setLessonToCancel(lesson);
      setCancelModalOpen(true);
    }
  };

  const handleConfirmCancel = async () => {
    if (!lessonToCancel) return;
    
    setCancelling(true);
    try {
      const actualBookingId = lessonToCancel.bookingId || lessonToCancel.id.split('_slot_')[0];
      
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled_by_student',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Cancelado pelo aluno'
        })
        .eq('id', actualBookingId);

      if (error) throw error;

      toast.success('Aula cancelada com sucesso');
      setCancelModalOpen(false);
      setLessonToCancel(null);
      await fetchLessons();
    } catch (error) {
      console.error('Error cancelling lesson:', error);
      toast.error('Erro ao cancelar aula. Tente novamente.');
    } finally {
      setCancelling(false);
    }
  };

  const handleRefundRequest = (lesson: LessonWithInstructor) => {
    setLessonForRefund(lesson);
    setRefundModalOpen(true);
  };

  const handleConfirmRefundRequest = async (reason: string) => {
    if (!lessonForRefund) return;
    setRequestingRefund(true);
    try {
      const actualBookingId = lessonForRefund.bookingId || lessonForRefund.id.split('_slot_')[0];
      
      const { error } = await supabase.from('refunds' as any).insert({
        booking_id: actualBookingId,
        student_id: lessonForRefund.studentProfileId,
        amount: lessonForRefund.price,
        reason,
        status: 'pending',
      } as any);

      if (error) throw error;
      toast.success('Solicitação enviada! Nossa equipe analisará em até 2 dias úteis.');
    } catch (err) {
      console.error('Error requesting refund:', err);
      toast.error('Erro ao solicitar reembolso.');
    } finally {
      setRequestingRefund(false);
    }
  };

  // No-show handlers
  const handleNoShowClick = (lesson: LessonWithInstructor) => {
    setLessonNoShow(lesson);
    setNoShowModalOpen(true);
  };

  const handleConfirmNoShow = async () => {
    if (!lessonNoShow) return;
    setProcessingNoShow(true);
    try {
      const actualBookingId = lessonNoShow.bookingId || lessonNoShow.id.split('_slot_')[0];
      const { error } = await supabase.functions.invoke('process-no-show', {
        body: {
          booking_id: actualBookingId,
          student_id: lessonNoShow.studentProfileId,
        },
      });

      if (error) throw error;
      toast.success('Reembolso processado! O valor será estornado em até 10 dias úteis.');
      setNoShowModalOpen(false);
      setLessonNoShow(null);
      await fetchLessons();
    } catch (err: any) {
      console.error('No-show error:', err);
      toast.error(err.message || 'Erro ao processar. Tente novamente.');
    } finally {
      setProcessingNoShow(false);
    }
  };

  // Cancel paid lesson handler
  const handleConfirmCancelPaid = async () => {
    if (!lessonCancelPaid) return;
    setCancellingPaid(true);
    try {
      const actualBookingId = lessonCancelPaid.bookingId || lessonCancelPaid.id.split('_slot_')[0];
      const willRefund = cancelPaidHoursUntil >= 24;

      // Cancel the booking
      await supabase.from('bookings').update({
        status: 'cancelled_by_student',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: willRefund ? 'Cancelado pelo aluno (com reembolso)' : 'Cancelado pelo aluno (sem reembolso)',
        payment_status: willRefund ? 'refunded' : 'paid',
      } as any).eq('id', actualBookingId);

      if (willRefund) {
        // Process refund via edge function
        const { error: refundError } = await supabase.functions.invoke('process-refund', {
          body: {
            booking_id: actualBookingId,
            student_id: lessonCancelPaid.studentProfileId,
            reason: 'student_cancellation_24h',
          },
        });

        if (refundError) {
          console.error('Refund error:', refundError);
          toast.error('Aula cancelada, mas houve erro no reembolso. Entre em contato com o suporte.');
        } else {
          // Create refund record
          await supabase.from('refunds' as any).insert({
            booking_id: actualBookingId,
            student_id: lessonCancelPaid.studentProfileId,
            amount: lessonCancelPaid.price,
            reason: 'student_cancellation_24h',
            status: 'approved',
          } as any);
          toast.success('Aula cancelada e reembolso processado! O valor volta em até 10 dias úteis.');
        }
      } else {
        // No refund - create rejected refund record
        await supabase.from('refunds' as any).insert({
          booking_id: actualBookingId,
          student_id: lessonCancelPaid.studentProfileId,
          amount: lessonCancelPaid.price,
          reason: 'student_cancellation_no_refund',
          status: 'rejected',
        } as any);
        toast('Aula cancelada. Cancelamentos com menos de 24h não são reembolsáveis.', { icon: '⚠️' });
      }

      // Notify instructor
      const { data: booking } = await supabase.from('bookings').select('instructor_id').eq('id', actualBookingId).single();
      if (booking?.instructor_id) {
        const { data: instrProfile } = await supabase.from('instructor_profiles').select('user_id').eq('id', booking.instructor_id).single();
        if (instrProfile) {
          await supabase.from('notifications').insert({
            user_id: instrProfile.user_id,
            type: 'booking_cancelled',
            title: 'Aula Cancelada',
            message: willRefund
              ? 'Uma aula foi cancelada pelo aluno.'
              : 'Uma aula foi cancelada pelo aluno sem direito a reembolso.',
            action_url: '/admin/agendamentos',
            booking_id: actualBookingId,
          });
        }
      }

      setCancelPaidModalOpen(false);
      setLessonCancelPaid(null);
      await fetchLessons();
    } catch (err: any) {
      console.error('Cancel paid error:', err);
      toast.error('Erro ao cancelar. Tente novamente.');
    } finally {
      setCancellingPaid(false);
    }
  };

  const handleChat = async (lesson: LessonWithInstructor) => {
    setSelectedLesson(lesson);
    const actualBookingId = lesson.bookingId || lesson.id.split('_slot_')[0];
    const convId = await getConversationByBooking(actualBookingId);
    setConversationId(convId);
    setChatOpen(true);
  };

  const handleDetails = () => {
    toast.info('Abrindo detalhes da aula...');
  };

  const handleReview = (lesson: LessonWithInstructor) => {
    setLessonToReview(lesson);
    setReviewModalOpen(true);
  };

  // Auto-open review modal when there's a completed lesson without a review
  useEffect(() => {
    if (lessons.length === 0 || reviewModalOpen) return;

    const pendingReview = lessons.find(
      (l) =>
        l.status === 'completed' &&
        !l.hasReviewed &&
        !reviewedInSession.has(l.bookingId || l.id)
    );

    if (pendingReview) {
      setLessonToReview(pendingReview);
      setReviewModalOpen(true);
    }
  }, [lessons]);

  const handleReviewSuccess = async () => {
    if (lessonToReview) {
      const bookingKey = lessonToReview.bookingId || lessonToReview.id;
      setReviewedInSession(prev => new Set(prev).add(bookingKey));
      setLessons(prev => prev.map(lesson =>
        lesson.id === lessonToReview.id
          ? { ...lesson, hasReviewed: true }
          : lesson
      ));
    }

    setReviewModalOpen(false);
    setLessonToReview(null);
    toast.success('Avaliação enviada com sucesso!');

    await fetchLessons();
  };

  // Get package summary for tab badges
  const getPackageSummary = (lessonsArray: LessonWithInstructor[]) => {
    const uniqueBookings = new Set(lessonsArray.map(l => l.bookingId || l.id));
    return {
      totalLessons: lessonsArray.length,
      totalBookings: uniqueBookings.size,
    };
  };

  if (loading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Minhas Aulas</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas aulas agendadas e veja seu histórico
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid mb-6">
          <TabsTrigger value="upcoming" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Próximas</span>
            {upcomingLessons.length > 0 && (
              <Badge className="ml-1 bg-green-500 text-white hover:bg-green-500">
                {upcomingLessons.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Aguardando</span>
            {pendingLessons.length > 0 && (
              <Badge className="ml-1 bg-orange-500 text-white hover:bg-orange-500">
                {pendingLessons.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingLessons.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">Nenhuma aula agendada</h3>
              <p className="text-muted-foreground mt-1">
                Busque um instrutor e agende sua primeira aula!
              </p>
            </div>
          ) : (
            <>
              {/* Check-in CTAs for in_progress lessons */}
              {inProgressNeedingCheckin.map((lesson) => (
                <div
                  key={`checkin-cta-${lesson.id}`}
                  className="flex items-center justify-between gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-300">Sua aula está em andamento!</p>
                      <p className="text-xs text-amber-300/70">Confirme sua presença com o código do instrutor</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 shrink-0"
                    onClick={() => {
                      setLessonForCheckin(lesson);
                      setCheckinModalOpen(true);
                    }}
                  >
                    Confirmar Presença
                  </Button>
                </div>
              ))}

              {/* Already checked-in in_progress lessons badge */}
              {upcomingLessons
                .filter((l) => l.status === 'in_progress' && l.studentCheckinAt)
                .map((lesson) => (
                  <div
                    key={`checkin-done-${lesson.id}`}
                    className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg mb-2"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                    <p className="text-sm text-green-300">
                      Você confirmou presença nesta aula. Aguarde a conclusão pelo instrutor.
                    </p>
                  </div>
                ))}

              {/* Summary for packages */}
              {getPackageSummary(upcomingLessons).totalLessons > getPackageSummary(upcomingLessons).totalBookings && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20 mb-4">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-sm text-foreground">
                    <strong>{upcomingLessons.length} aulas</strong> agendadas em{' '}
                    <strong>{getPackageSummary(upcomingLessons).totalBookings} pacote(s)</strong>
                  </span>
                </div>
              )}
              {upcomingLessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  slotInfo={lesson.slotIndex && lesson.totalSlots ? {
                    current: lesson.slotIndex,
                    total: lesson.totalSlots
                  } : undefined}
                  onCancel={() => handleCancelClick(lesson)}
                  onChat={() => handleChat(lesson)}
                  onDetails={handleDetails}
                  onRefundRequest={() => handleRefundRequest(lesson)}
                  onNoShow={() => handleNoShowClick(lesson)}
                />
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingLessons.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">Nenhuma solicitação pendente</h3>
              <p className="text-muted-foreground mt-1">
                Todas as suas solicitações foram respondidas!
              </p>
            </div>
          ) : (
            <>
              {getPackageSummary(pendingLessons).totalLessons > getPackageSummary(pendingLessons).totalBookings && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200 mb-4">
                  <Package className="h-5 w-5 text-orange-600" />
                  <span className="text-sm text-foreground">
                    <strong>{pendingLessons.length} aulas</strong> aguardando confirmação
                  </span>
                </div>
              )}
              {pendingLessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  slotInfo={lesson.slotIndex && lesson.totalSlots ? {
                    current: lesson.slotIndex,
                    total: lesson.totalSlots
                  } : undefined}
                  onCancel={() => handleCancelClick(lesson)}
                />
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {historyLessons.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">Nenhuma aula realizada</h3>
              <p className="text-muted-foreground mt-1">
                Seu histórico de aulas aparecerá aqui
              </p>
            </div>
          ) : (
            historyLessons.map((lesson) => {
              const daysSince = Math.floor(
                (Date.now() - parseISO(lesson.date).getTime()) / (1000 * 60 * 60 * 24)
              );
              const canDispute = lesson.status === 'completed' && daysSince < 7;
              return (
                <div key={lesson.id} className="space-y-2">
                  <LessonCard
                    lesson={lesson}
                    slotInfo={lesson.slotIndex && lesson.totalSlots ? {
                      current: lesson.slotIndex,
                      total: lesson.totalSlots
                    } : undefined}
                    onReview={() => handleReview(lesson)}
                  />
                  {canDispute && (
                    <div className="flex justify-end px-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5"
                        onClick={() => {
                          setLessonForDispute(lesson);
                          setDisputeModalOpen(true);
                        }}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Contestar Aula
                      </Button>
                    </div>
                  )}
                </div>
              );
            }))
          )}
        </TabsContent>
      </Tabs>

      {/* Chat Modal */}
      <ConversationChatModal
        open={chatOpen}
        onOpenChange={setChatOpen}
        conversationId={conversationId}
        otherParticipant={selectedLesson ? {
          id: selectedLesson.instructorUserId || '',
          name: selectedLesson.instructorName,
          avatar: selectedLesson.instructorPhoto,
        } : null}
        contextLabel={selectedLesson ? `Agendamento de ${format(parseISO(selectedLesson.date), "dd/MM", { locale: ptBR })}` : undefined}
        bookingContext={selectedLesson?.bookingId || selectedLesson?.id.split('_slot_')[0]}
      />

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={(open) => {
        // Allow closing manually; mark as seen in session so it doesn't reopen
        if (!open && lessonToReview) {
          const bookingKey = lessonToReview.bookingId || lessonToReview.id;
          setReviewedInSession(prev => new Set(prev).add(bookingKey));
        }
        setReviewModalOpen(open);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Como foi sua aula?</DialogTitle>
          </DialogHeader>

          {/* Instructor + lesson context header */}
          {lessonToReview && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border mb-1">
              {lessonToReview.instructorPhoto ? (
                <img
                  src={lessonToReview.instructorPhoto}
                  alt={lessonToReview.instructorName}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                  {lessonToReview.instructorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{lessonToReview.instructorName}</p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(lessonToReview.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  {' · '}{lessonToReview.time.slice(0, 5)} · {lessonToReview.category}
                </p>
              </div>
            </div>
          )}

          {lessonToReview && lessonToReview.instructorProfileId ? (
            <ReviewForm
              instructorId={lessonToReview.instructorProfileId}
              bookingId={lessonToReview.bookingId || lessonToReview.id.split('_slot_')[0]}
              onSuccess={handleReviewSuccess}
              onCancel={() => {
                const bookingKey = lessonToReview.bookingId || lessonToReview.id;
                setReviewedInSession(prev => new Set(prev).add(bookingKey));
                setReviewModalOpen(false);
              }}
            />
          ) : lessonToReview ? (
            <div className="text-center py-8 text-muted-foreground">
              Não foi possível carregar o formulário de avaliação.
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Modal */}
      <AlertDialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lessonToCancel?.totalSlots && lessonToCancel.totalSlots > 1 
                ? 'Cancelar pacote de aulas?' 
                : 'Cancelar aula?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lessonToCancel?.totalSlots && lessonToCancel.totalSlots > 1 ? (
                <>
                  Você está prestes a cancelar <strong>todo o pacote</strong> de{' '}
                  <span className="font-semibold">{lessonToCancel.totalSlots} aulas</span> com{' '}
                  <span className="font-semibold">{lessonToCancel.instructorName}</span>.
                  <br /><br />
                  <span className="text-destructive">Todas as {lessonToCancel.totalSlots} aulas serão canceladas.</span>
                </>
              ) : (
                <>
                  Você está prestes a cancelar sua aula com{' '}
                  <span className="font-semibold">{lessonToCancel?.instructorName}</span> no dia{' '}
                  <span className="font-semibold">
                    {lessonToCancel && format(parseISO(lessonToCancel.date), "dd 'de' MMMM", { locale: ptBR })}
                  </span> às{' '}
                  <span className="font-semibold">{lessonToCancel?.time}</span>.
                </>
              )}
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Confirmar Cancelamento'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Request Modal */}
      <RefundRequestModal
        open={refundModalOpen}
        onOpenChange={setRefundModalOpen}
        onConfirm={handleConfirmRefundRequest}
        isLoading={requestingRefund}
      />

      {/* No-Show Report Modal */}
      <NoShowReportModal
        open={noShowModalOpen}
        onOpenChange={setNoShowModalOpen}
        onConfirm={handleConfirmNoShow}
        instructorName={lessonNoShow?.instructorName || ''}
        amount={lessonNoShow?.price || 0}
        isLoading={processingNoShow}
      />

      {/* Cancel Paid Lesson Modal */}
      <CancelPaidLessonModal
        open={cancelPaidModalOpen}
        onOpenChange={setCancelPaidModalOpen}
        onConfirm={handleConfirmCancelPaid}
        instructorName={lessonCancelPaid?.instructorName || ''}
        amount={lessonCancelPaid?.price || 0}
        hoursUntil={cancelPaidHoursUntil}
        isLoading={cancellingPaid}
      />

      {/* Dispute Modal */}
      <DisputeModal
        open={disputeModalOpen}
        onOpenChange={setDisputeModalOpen}
        bookingId={lessonForDispute?.bookingId || lessonForDispute?.id.split('_slot_')[0] || ''}
        onSuccess={() => fetchLessons()}
      />

      {/* Student Check-in Modal */}
      <StudentCheckinModal
        open={checkinModalOpen}
        onOpenChange={setCheckinModalOpen}
        bookingId={lessonForCheckin?.bookingId || lessonForCheckin?.id.split('_slot_')[0] || ''}
        onSuccess={() => {
          setCheckinModalOpen(false);
          fetchLessons();
        }}
      />

      {/* Link to refunds page */}
      <div className="mt-6 text-center">
        <Button
          variant="ghost"
          onClick={() => navigate('/aluno/reembolsos')}
          className="gap-2 text-muted-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Ver meus reembolsos
        </Button>
      </div>
    </div>
  );
}