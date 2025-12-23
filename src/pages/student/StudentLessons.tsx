import { useState, useEffect } from 'react';
import { Calendar, Clock, History, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LessonCard } from '@/components/student/LessonCard';
import { ChatModal } from '@/components/chat/ChatModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReviewForm from '@/components/profile/ReviewForm';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { StudentLesson } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LessonWithInstructor extends StudentLesson {
  instructorUserId?: string;
  instructorProfileId?: string;
}

export default function StudentLessons() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [lessons, setLessons] = useState<LessonWithInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonWithInstructor | null>(null);
  
  // Review state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [lessonToReview, setLessonToReview] = useState<LessonWithInstructor | null>(null);

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

  const handleCancel = () => {
    toast.error('Aula cancelada com sucesso');
    fetchLessons();
  };

  const handleChat = (lesson: LessonWithInstructor) => {
    setSelectedLesson(lesson);
    setChatOpen(true);
  };

  const handleDetails = () => {
    toast.info('Abrindo detalhes da aula...');
  };

  const handleReview = (lesson: LessonWithInstructor) => {
    setLessonToReview(lesson);
    setReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    setReviewModalOpen(false);
    setLessonToReview(null);
    fetchLessons();
    toast.success('Avaliação enviada com sucesso!');
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
                onCancel={handleCancel}
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
                onCancel={handleCancel}
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

      {/* Chat Modal */}
      <ChatModal
        open={chatOpen}
        onOpenChange={setChatOpen}
        bookingId={selectedLesson?.id || null}
        otherParticipant={selectedLesson ? {
          id: selectedLesson.instructorUserId || '',
          name: selectedLesson.instructorName,
          avatar: selectedLesson.instructorPhoto,
        } : null}
        lessonInfo={selectedLesson ? `${format(new Date(selectedLesson.date), "dd/MM/yyyy", { locale: ptBR })} às ${selectedLesson.time}` : undefined}
      />

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Avaliar Aula</DialogTitle>
          </DialogHeader>
          {lessonToReview && lessonToReview.instructorProfileId && (
            <ReviewForm
              instructorId={lessonToReview.instructorProfileId}
              bookingId={lessonToReview.id}
              onSuccess={handleReviewSuccess}
              onCancel={() => setReviewModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
