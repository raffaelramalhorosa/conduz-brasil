import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar, MessageCircle, Users, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import BookingModal from "./BookingModal";
import { ConversationChatModal } from "@/components/chat/ConversationChatModal";
import { useConversation } from "@/hooks/useConversation";
import { supabase } from "@/integrations/supabase/client";
import type { InstructorProfile } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BookingCardProps {
  profile: InstructorProfile;
  instructorId?: string;
}

export interface BookingCardRef {
  openModal: () => void;
}

interface LinkedInstructor {
  id: string;
  name: string;
  email: string;
  photo_url: string | null;
  status: string;
}

const BookingCard = forwardRef<BookingCardRef, BookingCardProps>(
  ({ profile, instructorId }, ref) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, profile: userProfile } = useAuth();
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [chatModalOpen, setChatModalOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [studentProfileId, setStudentProfileId] = useState<string | null>(null);
    const [loadingChat, setLoadingChat] = useState(false);
    const { getOrCreateConversation } = useConversation();
    
    // Driving school specific
    const [instructorSelectorOpen, setInstructorSelectorOpen] = useState(false);
    const [linkedInstructors, setLinkedInstructors] = useState<LinkedInstructor[]>([]);
    const [selectedInstructor, setSelectedInstructor] = useState<LinkedInstructor | null>(null);
    const [loadingInstructors, setLoadingInstructors] = useState(false);

    const isDrivingSchool = profile.type === 'school';
    const minPrice = profile.pricing?.[0]?.singleLesson || 100;

    // Fetch linked instructors for driving schools
    useEffect(() => {
      const fetchLinkedInstructors = async () => {
        if (!isDrivingSchool || !instructorId) return;

        setLoadingInstructors(true);
        try {
          const { data, error } = await supabase
            .from('driving_school_instructors')
            .select('id, name, email, photo_url, status')
            .eq('driving_school_id', instructorId)
            .eq('status', 'active');

          if (error) throw error;
          setLinkedInstructors(data || []);
        } catch (error) {
          console.error('Error fetching linked instructors:', error);
        } finally {
          setLoadingInstructors(false);
        }
      };

      fetchLinkedInstructors();
    }, [isDrivingSchool, instructorId]);

    // Fetch student profile ID when user changes
    useEffect(() => {
      const fetchStudentProfile = async () => {
        if (!user || userProfile?.user_type !== 'student') {
          setStudentProfileId(null);
          return;
        }

        try {
          const { data } = await supabase
            .from('student_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();
          
          setStudentProfileId(data?.id || null);
        } catch (error) {
          console.error('Error fetching student profile:', error);
        }
      };

      fetchStudentProfile();
    }, [user, userProfile]);

    const handleOpenBookingModal = () => {
      // Verificar se está logado
      if (!user) {
        toast.info('Faça login para agendar uma aula', {
          action: {
            label: 'Fazer Login',
            onClick: () => navigate('/login', { 
              state: { from: location.pathname } 
            })
          }
        });
        return;
      }
      
      // Verificar se é aluno
      if (userProfile?.user_type !== 'student') {
        toast.error('Apenas alunos podem agendar aulas');
        return;
      }
      
      // For driving schools with linked instructors, show selector first
      if (isDrivingSchool && linkedInstructors.length > 0) {
        setInstructorSelectorOpen(true);
        return;
      }
      
      // Abrir modal
      setBookingModalOpen(true);
    };

    const handleSelectInstructor = (instructor: LinkedInstructor) => {
      setSelectedInstructor(instructor);
      setInstructorSelectorOpen(false);
      setBookingModalOpen(true);
    };

    const handleOpenChat = async () => {
      // Verificar se está logado
      if (!user) {
        toast.info('Faça login para enviar mensagem', {
          action: {
            label: 'Fazer Login',
            onClick: () => navigate('/login', { 
              state: { from: location.pathname } 
            })
          }
        });
        return;
      }
      
      // Verificar se é aluno
      if (userProfile?.user_type !== 'student') {
        toast.error('Apenas alunos podem enviar mensagens para instrutores');
        return;
      }

      if (!studentProfileId || !instructorId) {
        toast.error('Erro ao carregar dados do perfil');
        return;
      }

      setLoadingChat(true);

      try {
        // Get or create conversation
        const convId = await getOrCreateConversation(studentProfileId, instructorId);
        
        if (convId) {
          setConversationId(convId);
          setChatModalOpen(true);
        } else {
          toast.error('Erro ao iniciar conversa');
        }
      } catch (error) {
        console.error('Error opening chat:', error);
        toast.error('Erro ao abrir chat');
      } finally {
        setLoadingChat(false);
      }
    };

    // Expose openModal method via ref
    useImperativeHandle(ref, () => ({
      openModal: handleOpenBookingModal
    }));

    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    return (
      <>
        {/* Desktop: Static card in sidebar (no longer sticky/fixed) */}
        <div className="hidden lg:block w-full">
          <Card className="shadow-md">
            <CardContent className="p-6">
              {/* Price Section */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-1">A partir de</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    R$ {minPrice?.toFixed(0)}
                  </span>
                  <span className="text-muted-foreground">/aula</span>
                </div>
              </div>

              {/* Main Booking Button */}
              <Button
                onClick={handleOpenBookingModal}
                className="w-full py-6 text-lg font-bold mb-3 shadow-md hover:shadow-lg transition-all"
                size="lg"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Agendar Aula
              </Button>

              {/* Chat Button (replaced WhatsApp) */}
              <Button
                onClick={handleOpenChat}
                variant="outline"
                className="w-full py-5 border-2 border-primary text-primary hover:bg-primary/10 font-medium"
                disabled={loadingChat}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {loadingChat ? 'Abrindo...' : 'Enviar Mensagem'}
              </Button>

              {/* Quick Stats - Unique to booking context */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">
                      {profile.stats?.acceptanceRate || '95%'}
                    </p>
                    <p className="text-xs text-muted-foreground">Aceitação</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">
                      {profile.stats?.responseTime || '~2h'}
                    </p>
                    <p className="text-xs text-muted-foreground">Resposta</p>
                  </div>
                </div>
              </div>

              {/* Driving School Indicator */}
              {isDrivingSchool && linkedInstructors.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{linkedInstructors.length} instrutor(es) disponível(is)</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mobile: fixed bottom bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <div className="p-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">A partir de</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-foreground">
                  R$ {minPrice?.toFixed(0)}
                </span>
                <span className="text-sm text-muted-foreground">/aula</span>
              </div>
            </div>
            <Button
              onClick={handleOpenChat}
              variant="outline"
              size="icon"
              className="shrink-0 border-primary text-primary hover:bg-primary/10"
              disabled={loadingChat}
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
            <Button
              onClick={handleOpenBookingModal}
              className="shrink-0 px-6 font-bold"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Agendar
            </Button>
          </div>
        </div>

        {/* Instructor Selector Dialog for Driving Schools */}
        <Dialog open={instructorSelectorOpen} onOpenChange={setInstructorSelectorOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Escolha um instrutor
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto">
              {linkedInstructors.map((instructor) => (
                <button
                  key={instructor.id}
                  onClick={() => handleSelectInstructor(instructor)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/50 transition-colors text-left"
                >
                  <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                    <AvatarImage src={instructor.photo_url || undefined} alt={instructor.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(instructor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                      {instructor.name}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {instructor.email}
                    </p>
                  </div>
                  <ChevronDown className="w-5 h-5 text-muted-foreground -rotate-90" />
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Booking Modal */}
        <BookingModal
          profile={profile}
          open={bookingModalOpen}
          onOpenChange={setBookingModalOpen}
          instructorId={instructorId}
          selectedLinkedInstructor={selectedInstructor}
        />

        {/* Chat Modal */}
        <ConversationChatModal
          open={chatModalOpen}
          onOpenChange={setChatModalOpen}
          conversationId={conversationId}
          otherParticipant={{
            id: instructorId || profile.id,
            name: profile.name,
            avatar: profile.profilePhoto,
          }}
        />
      </>
    );
  }
);

BookingCard.displayName = "BookingCard";

export default BookingCard;
