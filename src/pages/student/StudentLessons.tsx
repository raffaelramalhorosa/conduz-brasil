import { useState, useEffect } from 'react';
import { Calendar, Clock, History, Loader2, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LessonCard } from '@/components/student/LessonCard';
import { ConversationChatModal } from '@/components/chat/ConversationChatModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ReviewForm from '@/components/profile/ReviewForm';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useConversation } from '@/hooks/useConversation';
import type { StudentLesson } from '@/types';
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ScheduledSlot {
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface LessonWithInstructor extends StudentLesson {
  instructorUserId?: string;
  instructorProfileId?: string;
  bookingId?: string; // Reference to original booking
  slotIndex?: number; // Position in package (1-10)
  totalSlots?: number; // Total slots in package
  packageType?: string;
}

export default function StudentLessons() {
  const { user } = useAuth();
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
  
  // Cancel state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [lessonToCancel, setLessonToCancel] = useState<LessonWithInstructor | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLessons();
    }
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
          license_category,
          package_type,
          package_lessons_count,
          scheduled_slots,
          instructor_profiles!inner (
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
          ),
          reviews (
            id
          )
        `)
        .eq('student_id', studentProfile.id)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      if (data) {
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
            hasReviewed: booking.reviews && booking.reviews.length > 0,
            bookingId: booking.id,
            packageType: booking.package_type,
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
    return l.status === 'confirmed' && isAfter(lessonDate, today);
  });
  
  const pendingLessons = lessons.filter((l) => l.status === 'pending');
  
  const historyLessons = lessons.filter((l) => {
    const lessonDate = parseISO(l.date);
    return l.status === 'completed' || (l.status !== 'pending' && l.status !== 'cancelled' && isBefore(lessonDate, today));
  });

  const handleCancelClick = (lesson: LessonWithInstructor) => {
    setLessonToCancel(lesson);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!lessonToCancel) return;
    
    setCancelling(true);
    try {
      // Get the actual booking ID (might be from a slot)
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

  const handleReviewSuccess = async () => {
    if (lessonToReview) {
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
            historyLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                slotInfo={lesson.slotIndex && lesson.totalSlots ? {
                  current: lesson.slotIndex,
                  total: lesson.totalSlots
                } : undefined}
                onReview={() => handleReview(lesson)}
              />
            ))
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
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Avaliar Aula com {lessonToReview?.instructorName}</DialogTitle>
          </DialogHeader>
          {lessonToReview && lessonToReview.instructorProfileId ? (
            <ReviewForm
              instructorId={lessonToReview.instructorProfileId}
              bookingId={lessonToReview.bookingId || lessonToReview.id.split('_slot_')[0]}
              onSuccess={handleReviewSuccess}
              onCancel={() => setReviewModalOpen(false)}
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
    </div>
  );
}