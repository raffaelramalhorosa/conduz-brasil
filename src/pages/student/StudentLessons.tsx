import { useState, useEffect } from 'react';
import { Calendar, Clock, History, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LessonCard } from '@/components/student/LessonCard';
import { ConversationChatModal } from '@/components/chat/ConversationChatModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ReviewForm from '@/components/profile/ReviewForm';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useConversation } from '@/hooks/useConversation';
import type { StudentLesson } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LessonWithInstructor extends StudentLesson {
  instructorUserId?: string;
  instructorProfileId?: string;
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
        const mappedLessons: LessonWithInstructor[] = data.map((booking: any) => ({
          id: booking.id,
          instructorName: booking.instructor_profiles?.profiles?.full_name || 'Instrutor',
          instructorPhoto: booking.instructor_profiles?.profiles?.avatar_url || '',
          instructorRating: booking.instructor_profiles?.average_rating || 0,
          instructorReviews: booking.instructor_profiles?.total_reviews || 0,
          instructorUserId: booking.instructor_profiles?.user_id,
          instructorProfileId: booking.instructor_profiles?.id,
          category: booking.license_category,
          vehicle: booking.vehicles ? `${booking.vehicles.brand} ${booking.vehicles.model}` : 'Veículo',
          date: booking.scheduled_date,
          time: booking.start_time.slice(0, 5),
          duration: booking.duration_hours,
          location: booking.pickup_address,
          price: booking.total_price,
          status: booking.status as 'confirmed' | 'pending' | 'completed' | 'cancelled',
          hasReviewed: booking.reviews && booking.reviews.length > 0,
        }));

        setLessons(mappedLessons);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingLessons = lessons.filter((l) => l.status === 'confirmed');
  const pendingLessons = lessons.filter((l) => l.status === 'pending');
  const historyLessons = lessons.filter((l) => l.status === 'completed');

  const handleCancelClick = (lesson: LessonWithInstructor) => {
    setLessonToCancel(lesson);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!lessonToCancel) return;
    
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled_by_student',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Cancelado pelo aluno'
        })
        .eq('id', lessonToCancel.id);

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
    // Get or create conversation based on booking
    const convId = await getConversationByBooking(lesson.id);
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
    // Atualiza o estado local imediatamente para feedback instantâneo
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
    
    // Refetch para garantir dados atualizados
    await fetchLessons();
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
            upcomingLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onCancel={() => handleCancelClick(lesson)}
                onChat={() => handleChat(lesson)}
                onDetails={handleDetails}
              />
            ))
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
            pendingLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onCancel={() => handleCancelClick(lesson)}
              />
            ))
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
                onReview={() => handleReview(lesson)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Chat Modal - Now conversation-based */}
      <ConversationChatModal
        open={chatOpen}
        onOpenChange={setChatOpen}
        conversationId={conversationId}
        otherParticipant={selectedLesson ? {
          id: selectedLesson.instructorUserId || '',
          name: selectedLesson.instructorName,
          avatar: selectedLesson.instructorPhoto,
        } : null}
        contextLabel={selectedLesson ? `Agendamento de ${format(new Date(selectedLesson.date), "dd/MM", { locale: ptBR })}` : undefined}
        bookingContext={selectedLesson?.id}
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
              bookingId={lessonToReview.id}
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
            <AlertDialogTitle>Cancelar aula?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a cancelar sua aula com{' '}
              <span className="font-semibold">{lessonToCancel?.instructorName}</span> no dia{' '}
              <span className="font-semibold">
                {lessonToCancel && format(new Date(lessonToCancel.date), "dd 'de' MMMM", { locale: ptBR })}
              </span> às{' '}
              <span className="font-semibold">{lessonToCancel?.time}</span>.
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
