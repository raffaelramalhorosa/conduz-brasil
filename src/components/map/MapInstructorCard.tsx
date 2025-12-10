import { Star, MapPin, Circle } from 'lucide-react';
import { NearbyInstructor } from '@/hooks/useNearbyInstructors';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MapInstructorCardProps {
  instructor: NearbyInstructor;
  isSelected: boolean;
  onSelect: () => void;
  onHover: (hovering: boolean) => void;
}

export const MapInstructorCard = ({
  instructor,
  isSelected,
  onSelect,
  onHover,
}: MapInstructorCardProps) => {
  return (
    <div
      className={cn(
        "p-3 border rounded-lg cursor-pointer transition-all duration-200",
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={instructor.avatar_url || '/placeholder.svg'}
            alt={instructor.full_name}
            className="w-14 h-14 rounded-full object-cover border-2 border-background"
          />
          {instructor.is_online && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">{instructor.full_name}</h3>
            {instructor.is_online && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">
                Online
              </Badge>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-1">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">
              {instructor.average_rating?.toFixed(1) || '0.0'}
            </span>
            <span className="text-xs text-muted-foreground">
              ({instructor.total_reviews || 0})
            </span>
          </div>

          {/* Distance */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="w-3 h-3" />
            <span>{instructor.distance_km} km de você</span>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1">
            {instructor.categories?.slice(0, 3).map((cat) => (
              <Badge
                key={cat}
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5"
              >
                Cat. {cat}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
