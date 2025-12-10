import { useState } from 'react';
import { Search, Crosshair, Loader2, MapPin, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MapInstructorCard } from './MapInstructorCard';
import { NearbyInstructor } from '@/hooks/useNearbyInstructors';

interface MapSidebarProps {
  instructors: NearbyInstructor[];
  loading: boolean;
  locationLoading: boolean;
  selectedInstructor: NearbyInstructor | null;
  hoveredInstructorId: string | null;
  searchRadius: number;
  onRadiusChange: (value: number) => void;
  onSelectInstructor: (instructor: NearbyInstructor) => void;
  onHoverInstructor: (id: string | null) => void;
  onGetLocation: () => void;
  hasLocation: boolean;
  filters: {
    onlineOnly: boolean;
    categories: string[];
    minRating: number;
  };
  onFilterChange: (filters: { onlineOnly?: boolean; categories?: string[]; minRating?: number }) => void;
}

const CATEGORIES = ['A', 'B', 'AB', 'C', 'D', 'E'];
const RADIUS_OPTIONS = [5, 10, 20, 50];

export const MapSidebar = ({
  instructors,
  loading,
  locationLoading,
  selectedInstructor,
  hoveredInstructorId,
  searchRadius,
  onRadiusChange,
  onSelectInstructor,
  onHoverInstructor,
  onGetLocation,
  hasLocation,
  filters,
  onFilterChange,
}: MapSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInstructors = instructors.filter((instructor) => {
    // Online filter
    if (filters.onlineOnly && !instructor.is_online) return false;

    // Category filter
    if (filters.categories.length > 0) {
      const hasCategory = instructor.categories?.some((cat) =>
        filters.categories.includes(cat)
      );
      if (!hasCategory) return false;
    }

    // Rating filter
    if ((instructor.average_rating || 0) < filters.minRating) return false;

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return instructor.full_name.toLowerCase().includes(query);
    }

    return true;
  });

  return (
    <div className="h-full flex flex-col bg-background border-r">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Location Button */}
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={onGetLocation}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Crosshair className="w-4 h-4" />
          )}
          {hasLocation ? 'Atualizar localização' : 'Usar minha localização'}
        </Button>

        {/* Radius Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Raio de busca</span>
            <span className="font-medium">{searchRadius} km</span>
          </div>
          <div className="flex gap-2">
            {RADIUS_OPTIONS.map((radius) => (
              <Button
                key={radius}
                variant={searchRadius === radius ? 'default' : 'outline'}
                size="sm"
                className="flex-1 h-8"
                onClick={() => onRadiusChange(radius)}
              >
                {radius}km
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b">
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={filters.onlineOnly ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => onFilterChange({ onlineOnly: !filters.onlineOnly })}
          >
            <div className={`w-2 h-2 rounded-full mr-1.5 ${filters.onlineOnly ? 'bg-green-400' : 'bg-green-500'}`} />
            Disponíveis
          </Badge>

          {CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant={filters.categories.includes(cat) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                const newCategories = filters.categories.includes(cat)
                  ? filters.categories.filter((c) => c !== cat)
                  : [...filters.categories, cat];
                onFilterChange({ categories: newCategories });
              }}
            >
              Cat. {cat}
            </Badge>
          ))}

          <Badge
            variant={filters.minRating >= 4.5 ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => onFilterChange({ minRating: filters.minRating >= 4.5 ? 0 : 4.5 })}
          >
            ★ 4.5+
          </Badge>
        </div>
      </div>

      {/* Results Count */}
      <div className="px-4 py-2 border-b bg-muted/30">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filteredInstructors.length}</span>
          {' '}instrutor{filteredInstructors.length !== 1 ? 'es' : ''} encontrado{filteredInstructors.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Instructor List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 border rounded-lg">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredInstructors.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                {!hasLocation
                  ? 'Ative sua localização para encontrar instrutores próximos'
                  : 'Nenhum instrutor encontrado. Tente aumentar o raio de busca.'}
              </p>
            </div>
          ) : (
            filteredInstructors.map((instructor) => (
              <MapInstructorCard
                key={instructor.id}
                instructor={instructor}
                isSelected={selectedInstructor?.id === instructor.id}
                onSelect={() => onSelectInstructor(instructor)}
                onHover={(hovering) => onHoverInstructor(hovering ? instructor.id : null)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
