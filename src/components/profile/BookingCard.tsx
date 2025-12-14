import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar, MessageCircle, Clock, CheckCircle, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import BookingModal from "./BookingModal";
import type { InstructorProfile } from "@/data/mockInstructorProfile";

interface BookingCardProps {
  profile: InstructorProfile;
  instructorId?: string;
}

const BookingCard = ({ profile, instructorId }: BookingCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile: userProfile } = useAuth();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const minPrice = profile.pricing?.basePrice || 100;

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
    
    // Abrir modal
    setBookingModalOpen(true);
  };

  const openWhatsApp = (phone?: string) => {
    if (!phone) {
      toast.error('Número de telefone não disponível');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá! Vi seu perfil no AutoConnect e gostaria de saber mais sobre suas aulas.`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <>
      <Card className="sticky top-24 shadow-md">
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

          {/* WhatsApp Button */}
          <Button
            onClick={() => openWhatsApp(profile.contact?.whatsapp)}
            variant="outline"
            className="w-full py-5 border-2 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 font-medium"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Contato via WhatsApp
          </Button>

          {/* Quick Info */}
          <div className="mt-6 pt-6 border-t border-border space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Responde em {profile.stats?.responseTime || '~2h'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="w-4 h-4" />
              <span>{profile.stats?.acceptanceRate || '95%'} de taxa de aceitação</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{profile.totalReviews || 0} aulas realizadas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Modal */}
      <BookingModal
        profile={profile}
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        instructorId={instructorId || profile.id}
      />
    </>
  );
};

export default BookingCard;
