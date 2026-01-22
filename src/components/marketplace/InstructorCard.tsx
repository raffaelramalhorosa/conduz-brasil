import { useNavigate } from "react-router-dom";
import { Star, ShieldCheck, Building2, User, ChevronRight, MapPin } from "lucide-react";
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
    <div className="group bg-card border border-border/40 rounded-lg p-3 md:p-4 transition-all duration-200 hover:border-primary/30 hover:bg-accent/30">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Left Column - Photo & Identity */}
        <div className="shrink-0 flex items-center gap-3">
          <div className="relative">
            <img
              src={instructor.photo}
              alt={instructor.name}
              className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover border border-border/50"
            />
            {instructor.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 ring-2 ring-card">
                <ShieldCheck className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          
          {/* Identity Info - Visible on md+ */}
          <div className="hidden md:flex flex-col min-w-[140px]">
            <h3 className="font-semibold text-foreground truncate max-w-[140px] group-hover:text-primary transition-colors text-sm">
              {instructor.name}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground text-xs">{instructor.rating.toFixed(1)}</span>
              <span className="text-muted-foreground text-xs">({instructor.totalReviews})</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-5 flex items-center gap-0.5 border-0",
                  instructor.type === "school" 
                    ? "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400" 
                    : "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                )}
              >
                {instructor.type === "school" ? (
                  <>
                    <Building2 className="w-2.5 h-2.5" />
                    Autoescola
                  </>
                ) : (
                  <>
                    <User className="w-2.5 h-2.5" />
                    Autônomo
                  </>
                )}
              </Badge>
              {instructor.isVerified && (
                <Badge className="text-[10px] px-1.5 py-0 h-5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                  Verificado
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Center Column - Details (Hidden on mobile) */}
        <div className="hidden lg:flex flex-1 flex-col min-w-0 border-l border-border/30 pl-4">
          {/* Categories & Tags Row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {instructor.categories.map((cat) => (
              <Badge 
                key={cat} 
                className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary hover:bg-primary/20 font-semibold border-0"
              >
                CAT {cat}
              </Badge>
            ))}
            {instructor.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5 font-normal bg-muted/60 text-muted-foreground border-0"
              >
                {tag}
              </Badge>
            ))}
            {instructor.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{instructor.tags.length - 3}</span>
            )}
          </div>
          
          {/* Description */}
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {instructor.description}
          </p>
          
          {showDistance && instructor.distance > 0 && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 text-primary" />
              <span>{instructor.distance.toFixed(1)} km de você</span>
            </div>
          )}
        </div>

        {/* Mobile Center - Name & Rating */}
        <div className="flex-1 md:hidden min-w-0">
          <h3 className="font-semibold text-foreground truncate text-sm group-hover:text-primary transition-colors">
            {instructor.name}
          </h3>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-foreground text-xs">{instructor.rating.toFixed(1)}</span>
            <span className="text-muted-foreground text-xs">({instructor.totalReviews})</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {instructor.categories.slice(0, 2).map((cat) => (
              <Badge 
                key={cat} 
                className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0"
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {/* Right Column - Price & Actions */}
        <div className="shrink-0 flex items-center gap-2 md:gap-3 md:border-l md:border-border/30 md:pl-4">
          <div className="text-right">
            {instructor.pricePerLesson ? (
              <>
                <p className="text-lg md:text-xl font-bold text-foreground whitespace-nowrap">
                  <span className="text-primary text-sm md:text-base">R$</span> {instructor.pricePerLesson}
                </p>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  /aula
                </span>
              </>
            ) : (
              <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                A consultar
              </p>
            )}
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-3 text-xs hover:bg-muted transition-colors"
              onClick={() => navigate(`/instrutores/${instructor.id}`)}
            >
              Ver Perfil
            </Button>
            <Button 
              size="sm" 
              className="h-8 px-3 text-xs gap-1 group/btn"
              onClick={() => navigate(`/instrutores/${instructor.id}`)}
            >
              Agendar
              <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
            </Button>
          </div>
          
          {/* Mobile Action */}
          <Button 
            size="sm" 
            className="md:hidden h-8 px-3 text-xs gap-1"
            onClick={() => navigate(`/instrutores/${instructor.id}`)}
          >
            Ver
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstructorCard;
