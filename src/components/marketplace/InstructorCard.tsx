import { useNavigate } from "react-router-dom";
import { Star, MapPin, ShieldCheck, Building2, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Instructor } from "@/types";

interface InstructorCardProps {
  instructor: Instructor;
  showDistance?: boolean;
}

const InstructorCard = ({ instructor, showDistance = false }: InstructorCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="group bg-card border border-border/50 rounded-xl p-5 md:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5">
      <div className="flex flex-col md:flex-row gap-5 md:gap-6">
        {/* Left Area - Photo & Badges */}
        <div className="flex md:flex-col items-center gap-3 md:gap-3">
          <div className="relative">
            <img
              src={instructor.photo}
              alt={instructor.name}
              className="w-18 h-18 md:w-22 md:h-22 rounded-2xl object-cover border-2 border-border shadow-md group-hover:shadow-lg transition-shadow"
            />
            {instructor.isVerified && (
              <div className="absolute -bottom-1.5 -right-1.5 bg-green-500 rounded-full p-1.5 shadow-lg ring-2 ring-card">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
          <div className="flex md:flex-col gap-1.5 md:mt-1">
            {instructor.isVerified && (
              <Badge
                variant="secondary"
                className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0"
              >
                Verificado
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-xs flex items-center gap-1 border-0",
                instructor.type === "school" 
                  ? "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400" 
                  : "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
              )}
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
          <h3 className="text-lg font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {instructor.name}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-foreground">{instructor.rating.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">
                ({instructor.totalReviews} avaliações)
              </span>
            </div>
            {showDistance && instructor.distance > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-medium">{instructor.distance.toFixed(1)}km</span>
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {instructor.categories.map((cat) => (
              <Badge 
                key={cat} 
                className="bg-primary/10 text-primary hover:bg-primary/20 font-semibold border-0 shadow-sm"
              >
                CAT {cat}
              </Badge>
            ))}
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
            {instructor.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {instructor.tags.slice(0, 4).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-normal bg-muted/50 text-muted-foreground hover:bg-muted border-0"
              >
                {tag}
              </Badge>
            ))}
            {instructor.tags.length > 4 && (
              <Badge variant="secondary" className="text-xs font-normal bg-muted/50 text-muted-foreground border-0">
                +{instructor.tags.length - 4}
              </Badge>
            )}
          </div>
        </div>

        {/* Right Area - Price & Actions */}
        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-border/50 md:text-right md:min-w-[150px]">
          <div className="flex flex-col items-start md:items-end">
            {instructor.pricePerLesson ? (
              <>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  <span className="text-primary">R$</span> {instructor.pricePerLesson}
                </p>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  por aula
                </span>
                {instructor.minPrice && instructor.minPrice !== instructor.pricePerLesson && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                    A partir de R$ {instructor.minPrice}
                  </p>
                )}
              </>
            ) : (
              <div className="text-center md:text-right">
                <p className="text-lg font-semibold text-muted-foreground">
                  A consultar
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Entre em contato
                </p>
              </div>
            )}
          </div>
          <div className="flex md:flex-col gap-2 w-full md:w-auto md:mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 md:flex-none gap-1 hover:bg-muted transition-colors"
              onClick={() => navigate(`/instrutores/${instructor.id}`)}
            >
              Ver Perfil
            </Button>
            <Button 
              size="sm" 
              className="flex-1 md:flex-none gap-1 shadow-md hover:shadow-lg transition-all group/btn"
              onClick={() => navigate(`/instrutores/${instructor.id}`)}
            >
              Agendar Aula
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorCard;
