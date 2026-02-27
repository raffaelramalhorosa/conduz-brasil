import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { Instructor } from "@/types";

interface MobileInstructorCardProps {
  instructor: Instructor;
}

const MobileInstructorCard = ({ instructor }: MobileInstructorCardProps) => {
  return (
    <Link to={`/instrutores/${instructor.id}`}>
      <div className="flex gap-3 p-4 border-b border-border/40 active:bg-accent/30 transition-colors">
        {/* Photo */}
        <div className="relative shrink-0">
          <img
            src={instructor.photo}
            alt={instructor.name}
            className="w-16 h-16 rounded-xl object-cover"
            loading="lazy"
          />
          {instructor.isVerified && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-background" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-semibold text-sm truncate text-foreground">{instructor.name}</h3>
            {instructor.type === "school" && (
              <span className="shrink-0 px-1.5 py-0.5 rounded bg-secondary/15 text-secondary text-[10px] font-bold">
                Autoescola
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-1">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium text-foreground">
              {instructor.rating > 0 ? instructor.rating.toFixed(1) : "Novo"}
            </span>
            {instructor.totalReviews > 0 && (
              <span className="text-xs text-muted-foreground">({instructor.totalReviews})</span>
            )}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {instructor.categories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium"
              >
                Cat {cat}
              </span>
            ))}
            {instructor.tags.slice(0, 1).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]"
              >
                {tag}
              </span>
            ))}
          </div>

        </div>

        {/* Price */}
        <div className="shrink-0 text-right flex flex-col justify-center">
          {instructor.pricePerLesson ? (
            <>
              <p className="text-[10px] text-muted-foreground">a partir de</p>
              <p className="text-base font-bold text-primary">
                R${instructor.pricePerLesson}
              </p>
              <p className="text-[10px] text-muted-foreground">/aula</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">A consultar</p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default MobileInstructorCard;
