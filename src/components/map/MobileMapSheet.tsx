import { useState } from 'react';
import { List, Map, X, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MapInstructorCard } from './MapInstructorCard';
import { NearbyInstructor } from '@/hooks/useNearbyInstructors';

interface MobileMapSheetProps {
  instructors: NearbyInstructor[];
  loading: boolean;
  selectedInstructor: NearbyInstructor | null;
  onSelectInstructor: (instructor: NearbyInstructor) => void;
  searchRadius: number;
  onRadiusChange: (radius: number) => void;
  filters: {
    onlineOnly: boolean;
    categories: string[];
    minRating: number;
  };
  onFilterChange: (filters: { onlineOnly?: boolean; categories?: string[]; minRating?: number }) => void;
}

const RADIUS_OPTIONS = [5, 10, 20, 50];
const CATEGORIES = ['A', 'B', 'AB', 'C', 'D', 'E'];

export const MobileMapSheet = ({
  instructors,
  loading,
  selectedInstructor,
  onSelectInstructor,
  searchRadius,
  onRadiusChange,
  filters,
  onFilterChange,
}: MobileMapSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const filteredInstructors = instructors.filter((instructor) => {
    if (filters.onlineOnly && !instructor.is_online) return false;
    if (filters.categories.length > 0) {
      const hasCategory = instructor.categories?.some((cat) =>
        filters.categories.includes(cat)
      );
      if (!hasCategory) return false;
    }
    if ((instructor.average_rating || 0) < filters.minRating) return false;
    return true;
  });

  return (
    <>
      {/* Floating button */}
      <Button
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] shadow-lg gap-2"
        onClick={() => setIsOpen(true)}
      >
        <List className="w-4 h-4" />
        Ver Lista ({filteredInstructors.length})
        <ChevronUp className="w-4 h-4" />
      </Button>

      {/* Bottom Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-left">
              {filteredInstructors.length} instrutor{filteredInstructors.length !== 1 ? 'es' : ''} encontrado{filteredInstructors.length !== 1 ? 's' : ''}
            </SheetTitle>
          </SheetHeader>

          {/* Filters */}
          <div className="p-4 border-b space-y-3">
            {/* Radius */}
            <div className="flex gap-2">
              {RADIUS_OPTIONS.map((radius) => (
                <Button
                  key={radius}
                  variant={searchRadius === radius ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => onRadiusChange(radius)}
                >
                  {radius}km
                </Button>
              ))}
            </div>

            {/* Filter badges */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={filters.onlineOnly ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => onFilterChange({ onlineOnly: !filters.onlineOnly })}
              >
                <div className={`w-2 h-2 rounded-full mr-1.5 ${filters.onlineOnly ? 'bg-green-400' : 'bg-green-500'}`} />
                Online
              </Badge>

              {CATEGORIES.slice(0, 4).map((cat) => (
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
                  {cat}
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

          {/* List */}
          <ScrollArea className="h-[calc(85vh-180px)]">
            <div className="p-4 space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 border rounded-lg animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-muted rounded" />
                        <div className="h-3 w-1/2 bg-muted rounded" />
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredInstructors.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum instrutor encontrado
                </p>
              ) : (
                filteredInstructors.map((instructor) => (
                  <MapInstructorCard
                    key={instructor.id}
                    instructor={instructor}
                    isSelected={selectedInstructor?.id === instructor.id}
                    onSelect={() => {
                      onSelectInstructor(instructor);
                      setIsOpen(false);
                    }}
                    onHover={() => {}}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};
