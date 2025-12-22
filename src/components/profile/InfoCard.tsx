import { ShieldCheck, Award, Calendar, Star, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InstructorProfile } from "@/types";

interface InfoCardProps {
  profile: InstructorProfile;
}

const InfoCard = ({ profile }: InfoCardProps) => {
  const experienceYears = profile.stats?.memberSince 
    ? new Date().getFullYear() - new Date(profile.stats.memberSince).getFullYear()
    : 0;

  return (
    <Card className="border-none shadow-sm bg-gradient-to-br from-muted/30 to-muted/10">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className="w-5 h-5 text-primary" />
          Credenciais e Distintivos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Verification Badge */}
        {profile.stats?.documentVerified && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <div className="p-2 rounded-full bg-green-500/10">
              <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-700 dark:text-green-300 text-sm">
                Identidade Verificada
              </p>
              <p className="text-xs text-green-600/80 dark:text-green-400/80">
                Documentos validados pela plataforma
              </p>
            </div>
          </div>
        )}

        {/* Member Since */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
          <div className="p-2 rounded-full bg-primary/10">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Membro desde</p>
            <p className="font-semibold text-foreground">
              {profile.stats?.memberSince || 'N/A'}
            </p>
          </div>
        </div>

        {/* Rating Highlight */}
        {profile.rating > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
            <div className="p-2 rounded-full bg-yellow-500/10">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Avaliação média</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">
                  {profile.rating.toFixed(1)}
                </p>
                <span className="text-xs text-muted-foreground">
                  ({profile.totalReviews} avaliações)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Specialties as Badges */}
        {profile.specialties && profile.specialties.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="w-4 h-4" />
              <span>Especialidades</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.specialties.slice(0, 4).map((specialty, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {specialty}
                </Badge>
              ))}
              {profile.specialties.length > 4 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{profile.specialties.length - 4} mais
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InfoCard;