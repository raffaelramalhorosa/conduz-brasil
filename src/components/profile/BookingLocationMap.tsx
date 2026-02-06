import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGeocode } from '@/hooks/useGeocode';

interface BookingLocationMapProps {
  address: string;
  onAddressChange: (address: string) => void;
  onCoordsChange?: (coords: { lat: number; lng: number } | null) => void;
  instructorLocation?: { lat: number; lng: number };
  instructorAddress?: string;
}

const BookingLocationMap = ({ 
  address, 
  onAddressChange, 
  onCoordsChange,
  instructorLocation,
  instructorAddress
}: BookingLocationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const hasAutoSearched = useRef(false);
  
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [searchInput, setSearchInput] = useState(address);
  
  const { geocodeAddress, isGeocoding } = useGeocode();
  
  // Check if instructor has valid coordinates (not default São Paulo)
  const hasValidInstructorCoords = instructorLocation && 
    !(instructorLocation.lat === -23.55 && instructorLocation.lng === -46.63);

  // Default center - São Paulo
  const defaultCenter = hasValidInstructorCoords 
    ? instructorLocation 
    : { lat: -23.5505, lng: -46.6333 };

  // Create marker icon
  const createMarkerIcon = useCallback(() => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background: hsl(var(--primary));
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border: 3px solid white;
        ">
          <svg 
            style="transform: rotate(45deg); width: 16px; height: 16px; color: white;"
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
    });
  }, []);

  const updateMarkerPosition = useCallback((lat: number, lng: number, icon?: L.DivIcon) => {
    const map = mapInstance.current;
    if (!map) return;

    const markerIcon = icon || createMarkerIcon();

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon: markerIcon, draggable: true })
        .addTo(map);
      
      // Handle marker drag
      markerRef.current.on('dragend', async () => {
        const pos = markerRef.current?.getLatLng();
        if (pos) {
          setMarkerPosition({ lat: pos.lat, lng: pos.lng });
          onCoordsChange?.({ lat: pos.lat, lng: pos.lng });
          
          // Reverse geocode
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&addressdetails=1`
            );
            const data = await response.json();
            if (data.display_name) {
              onAddressChange(data.display_name);
              setSearchInput(data.display_name);
            }
          } catch (error) {
            console.error('Reverse geocode error:', error);
          }
        }
      });
    }

    setMarkerPosition({ lat, lng });
    onCoordsChange?.({ lat, lng });
    map.setView([lat, lng], 16);
  }, [createMarkerIcon, onAddressChange, onCoordsChange]);

  const handleSearch = useCallback(async (searchAddress?: string) => {
    const addressToSearch = searchAddress || searchInput;
    if (!addressToSearch.trim()) return;

    const result = await geocodeAddress(addressToSearch);
    
    if (result.latitude && result.longitude) {
      updateMarkerPosition(result.latitude, result.longitude);
      if (result.display_name) {
        onAddressChange(result.display_name);
        setSearchInput(result.display_name);
      } else {
        onAddressChange(addressToSearch);
      }
    }
  }, [searchInput, geocodeAddress, updateMarkerPosition, onAddressChange]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const customIcon = createMarkerIcon();

    // Create map
    mapInstance.current = L.map(mapContainer.current, {
      center: [defaultCenter.lat, defaultCenter.lng],
      zoom: 14,
      zoomControl: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    // Add click handler to place marker
    mapInstance.current.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      updateMarkerPosition(lat, lng, customIcon);
      
      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        );
        const data = await response.json();
        if (data.display_name) {
          onAddressChange(data.display_name);
          setSearchInput(data.display_name);
        }
      } catch (error) {
        console.error('Reverse geocode error:', error);
      }
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Auto-search instructor address on mount
  useEffect(() => {
    if (hasAutoSearched.current || !mapInstance.current) return;
    
    const autoSearch = async () => {
      hasAutoSearched.current = true;

      // Priority 1: Use existing address prop
      if (address) {
        handleSearch(address);
        return;
      }

      // Priority 2: Use valid instructor coordinates
      if (hasValidInstructorCoords && instructorLocation) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${instructorLocation.lat}&lon=${instructorLocation.lng}&addressdetails=1`
          );
          const data = await response.json();
          if (data.display_name && mapInstance.current) {
            setSearchInput(data.display_name);
            onAddressChange(data.display_name);
            updateMarkerPosition(instructorLocation.lat, instructorLocation.lng);
          }
        } catch (error) {
          console.error('Reverse geocode error:', error);
        }
        return;
      }

      // Priority 3: Use instructor address text
      if (instructorAddress) {
        try {
          const result = await geocodeAddress(instructorAddress);
          if (result.latitude && result.longitude && mapInstance.current) {
            const displayAddress = result.display_name || instructorAddress;
            setSearchInput(displayAddress);
            onAddressChange(displayAddress);
            updateMarkerPosition(result.latitude, result.longitude);
          }
        } catch (error) {
          console.error('Geocode instructor address error:', error);
        }
      }
    };

    // Small delay to ensure map is ready
    const timeoutId = setTimeout(autoSearch, 200);
    return () => clearTimeout(timeoutId);
  }, [address, instructorLocation, instructorAddress, hasValidInstructorCoords, handleSearch, updateMarkerPosition, geocodeAddress, onAddressChange]);

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              onAddressChange(e.target.value);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Digite o endereço e clique em buscar"
            className="pl-10"
            maxLength={200}
          />
        </div>
        <Button 
          type="button"
          variant="secondary"
          onClick={() => handleSearch()}
          disabled={isGeocoding}
          className="shrink-0"
        >
          {isGeocoding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </>
          )}
        </Button>
      </div>

      {/* Map container */}
      <div className="relative rounded-lg overflow-hidden border border-border">
        <div 
          ref={mapContainer} 
          className="h-64 w-full"
          style={{ zIndex: 0 }}
        />
        
        {/* Instructions overlay */}
        {!markerPosition && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 pointer-events-none">
            <div className="bg-background/95 px-4 py-2 rounded-lg shadow-lg text-sm text-muted-foreground">
              📍 Clique no mapa ou busque um endereço
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        💡 Dica: Você pode arrastar o marcador para ajustar a localização exata
      </p>
    </div>
  );
};

export default BookingLocationMap;