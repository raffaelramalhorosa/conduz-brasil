import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crosshair, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useNearbyInstructors, NearbyInstructor } from '@/hooks/useNearbyInstructors';
import { useIsMobile } from '@/hooks/use-mobile';
import { InstructorMap } from '@/components/map/InstructorMap';
import { MapSidebar } from '@/components/map/MapSidebar';
import { MobileMapSheet } from '@/components/map/MobileMapSheet';
import { toast } from 'sonner';

const InstructorsMap = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { location, error: locationError, loading: locationLoading, getCurrentLocation } = useUserLocation();

  const [searchRadius, setSearchRadius] = useState(10);
  const [selectedInstructor, setSelectedInstructor] = useState<NearbyInstructor | null>(null);
  const [hoveredInstructorId, setHoveredInstructorId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    onlineOnly: false,
    categories: [] as string[],
    minRating: 0,
  });

  const { instructors, loading, error } = useNearbyInstructors({
    lat: location?.lat || null,
    lng: location?.lng || null,
    radiusKm: searchRadius,
    minRating: 0,
    maxResults: 100,
  });

  // Request location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Show location error
  useEffect(() => {
    if (locationError) {
      toast.error(locationError);
    }
  }, [locationError]);

  // Show fetch error
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleFilterChange = (newFilters: { onlineOnly?: boolean; categories?: string[]; minRating?: number }) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Mobile Header */}
      {isMobile && (
        <header className="h-14 border-b bg-background flex items-center px-4 gap-3 z-[1000]">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold">Instrutores no Mapa</h1>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crosshair className="w-4 h-4" />
              )}
            </Button>
          </div>
        </header>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="w-[400px] flex-shrink-0">
            <MapSidebar
              instructors={instructors}
              loading={loading}
              locationLoading={locationLoading}
              selectedInstructor={selectedInstructor}
              hoveredInstructorId={hoveredInstructorId}
              searchRadius={searchRadius}
              onRadiusChange={setSearchRadius}
              onSelectInstructor={setSelectedInstructor}
              onHoverInstructor={setHoveredInstructorId}
              onGetLocation={getCurrentLocation}
              hasLocation={!!location}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          <InstructorMap
            userLocation={location}
            instructors={instructors}
            selectedInstructor={selectedInstructor}
            hoveredInstructorId={hoveredInstructorId}
            searchRadius={searchRadius}
            onSelectInstructor={setSelectedInstructor}
          />

          {/* Mobile bottom sheet */}
          {isMobile && (
            <MobileMapSheet
              instructors={instructors}
              loading={loading}
              selectedInstructor={selectedInstructor}
              onSelectInstructor={setSelectedInstructor}
              searchRadius={searchRadius}
              onRadiusChange={setSearchRadius}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          )}

          {/* No location warning */}
          {!location && !locationLoading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-background border rounded-lg shadow-lg p-4 max-w-sm">
              <p className="text-sm text-muted-foreground mb-2">
                Ative sua localização para encontrar instrutores próximos
              </p>
              <Button size="sm" onClick={getCurrentLocation} className="w-full">
                <Crosshair className="w-4 h-4 mr-2" />
                Ativar localização
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorsMap;
