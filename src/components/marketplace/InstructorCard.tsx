import { useNavigate } from "react-router-dom";
import { Star, MapPin, ShieldCheck, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Instructor } from "@/types";

interface InstructorCardProps {
  instructor: Instructor;
}

const InstructorCard = ({ instructor }: InstructorCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Left Area - Photo & Badges */}
        <div className="flex md:flex-col items-center gap-3 md:gap-2">
          <div className="relative">
            <img
              src={instructor.photo}
              alt={instructor.name}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-border"
            />
            {instructor.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                <ShieldCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex md:flex-col gap-1">
            {instructor.isVerified && (
              <Badge
                variant="secondary"
                className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                Verificado
              </Badge>
            )}
            <Badge
              variant="outline"
              className="text-xs flex items-center gap-1"
            >
              {instructor.type === "school" ? (
                <>
                  <Building2 className="w-3 h-3" />
                  Autoescola
                </>
              ) : (
                <>
                  <User className="w-3 h-3" />
                  Autônomo
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Center Area - Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground truncate">
            {instructor.name}
          </h3>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{instructor.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({instructor.totalReviews} avaliações)
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{instructor.distance.toFixed(1)}km de você</span>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {instructor.categories.map((cat) => (
              <Badge key={cat} className="bg-primary/10 text-primary hover:bg-primary/20">
                CAT {cat}
              </Badge>
            ))}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
            {instructor.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {instructor.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-normal"
              >
                {tag}
              </Badge>
            ))}
            {instructor.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs font-normal">
                +{instructor.tags.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* Right Area - Price & Actions */}
        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-border md:text-right md:min-w-[140px]">
          <div>
            <p className="text-2xl font-bold text-foreground">
              R$ {instructor.pricePerLesson}
              <span className="text-sm font-normal text-muted-foreground">
                /aula
              </span>
            </p>
            {instructor.minPrice && (
              <p className="text-xs text-muted-foreground">
                A partir de R$ {instructor.minPrice}
              </p>
            )}
          </div>
          <div className="flex md:flex-col gap-2 w-full md:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 md:flex-none"
              onClick={() => navigate(`/instrutores/${instructor.id}`)}
            >
              Ver Perfil
            </Button>
            <Button 
              size="sm" 
              className="flex-1 md:flex-none"
              onClick={() => navigate(`/instrutores/${instructor.id}`)}
            >
              Agendar Aula
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorCard;
