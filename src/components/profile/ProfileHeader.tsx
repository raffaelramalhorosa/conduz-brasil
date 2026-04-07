import { Share2, ShieldCheck, Star, MapPin, Calendar, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { InstructorProfile } from "@/types";
import { toast } from "sonner";

interface ProfileHeaderProps {
  profile: InstructorProfile;
  onBooking?: () => void;
}

const ProfileHeader = ({ profile, onBooking }: ProfileHeaderProps) => {
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile.name,
          text: `Confira o perfil de ${profile.name} no Conduz Brasil`,
          url,
        });
        return;
      } catch (e) {
        // User cancelled or share failed, fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência!');
    } catch {
      // Fallback for environments where clipboard API is blocked
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const openWhatsApp = () => {
    const phone = profile.contact?.whatsapp;
    if (!phone) {
      toast.error('Número de telefone não disponível');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá! Vi seu perfil no Conduz Brasil e gostaria de saber mais sobre suas aulas.`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const minPrice = profile.pricing?.[0]?.singleLesson || 100;

  return (
    <div className="relative">
      {/* Hero Section with Cover Photo */}
      <div className="relative w-full h-[200px] sm:h-[280px] md:h-[400px] lg:h-[450px] overflow-hidden">
        {/* Cover Image */}
        <img
          src={profile.coverPhoto}
          alt="Capa do perfil"
          className="w-full h-full object-cover"
        />
        
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        
        {/* Content Container */}
        <div className="absolute inset-0 flex items-end">
          <div className="container-custom w-full pb-8">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end">
              
              {/* Profile Photo */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-2xl border-4 border-white/20 overflow-hidden bg-card shadow-2xl ring-4 ring-white/10">
                  <img
                    src={profile.profilePhoto}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {profile.isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-xl p-2 shadow-lg border-2 border-white/20">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="flex-1 min-w-0 space-y-4">
                {/* Name and Categories */}
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                    {profile.name}
                  </h1>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profile.categories.map((cat) => (
                      <Badge
                        key={cat}
                        className="bg-white/20 text-white border-white/30 backdrop-blur-sm hover:bg-white/30 text-sm px-3 py-1"
                      >
                        Categoria {cat}
                      </Badge>
                    ))}
                    {profile.isVerified && (
                      <Badge className="bg-green-500/90 text-white border-green-400/50 backdrop-blur-sm text-sm px-3 py-1">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        Verificado
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-white/90">
                  {/* Rating */}
                  <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-bold text-white">
                      {profile.rating.toFixed(1)}
                    </span>
                    <span className="text-white/70 text-sm">
                      ({profile.totalReviews} avaliações)
                    </span>
                  </div>

                  {/* Location */}
                  {profile.location?.address && (
                    <div className="flex items-center gap-1.5 text-white/80">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">
                        {profile.location.address.split(',').slice(0, 2).join(',')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop: Share button only (booking is in the fixed card) */}
              <div className="hidden lg:flex items-end shrink-0">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleShare}
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Share button floating */}
      <Button 
        variant="outline" 
        size="icon"
        onClick={handleShare}
        className="md:hidden absolute top-4 right-4 bg-black/30 border-white/30 text-white hover:bg-black/50 hover:text-white backdrop-blur-sm z-10"
      >
        <Share2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ProfileHeader;