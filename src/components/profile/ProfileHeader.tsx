import { Share2, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { InstructorProfile } from "@/data/mockInstructorProfile";

interface ProfileHeaderProps {
  profile: InstructorProfile;
}

const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: profile.name,
        text: `Confira o perfil de ${profile.name} no AutoConnect`,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="relative">
      {/* Cover Photo */}
      <div className="w-full h-48 md:h-72 overflow-hidden">
        <img
          src={profile.coverPhoto}
          alt="Capa do perfil"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Profile Container */}
      <div className="container-custom">
        <div className="relative -mt-16 md:-mt-20 pb-6 border-b border-border">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:items-end">
            {/* Profile Photo */}
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background overflow-hidden bg-card">
                <img
                  src={profile.profilePhoto}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {profile.isVerified && (
                <div className="absolute bottom-2 right-2 bg-green-500 rounded-full p-2">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pb-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                    {profile.name}
                  </h1>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.categories.map((cat) => (
                      <Badge
                        key={cat}
                        className="bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        Categoria {cat}
                      </Badge>
                    ))}
                    {profile.isVerified && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Verificado
                      </Badge>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-semibold text-foreground">
                        {profile.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      ({profile.totalReviews} avaliações)
                    </span>
                  </div>
                </div>

                {/* Share Button */}
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
