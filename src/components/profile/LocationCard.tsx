import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { InstructorProfile } from "@/types";
import { useGeocode } from "@/hooks/useGeocode";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface LocationCardProps {
  profile: InstructorProfile;
}

const LocationCard = ({ profile }: LocationCardProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { geocodeAddress, isGeocoding } = useGeocode();
  
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingCoords, setIsLoadingCoords] = useState(false);

  const { lat, lng } = profile.location.coordinates;
  const hasValidCoordinates = lat !== 0 && lng !== 0 && lat !== -23.55 && lng !== -46.63;

  // Geocode address if coordinates are missing
  useEffect(() => {
    const fetchCoordinates = async () => {
      if (hasValidCoordinates) {
        setCoordinates({ lat, lng });
        return;
      }

      // Try to geocode the address
      if (profile.location.address && profile.location.address !== 'São Paulo, SP') {
        setIsLoadingCoords(true);
        try {
          const result = await geocodeAddress(profile.location.address);
          if (result.latitude && result.longitude) {
            setCoordinates({ lat: result.latitude, lng: result.longitude });
          }
        } catch (error) {
          console.error('Error geocoding address:', error);
        } finally {
          setIsLoadingCoords(false);
        }
      }
    };

    fetchCoordinates();
  }, [lat, lng, hasValidCoordinates, profile.location.address]);

  // Initialize map when coordinates are available
  useEffect(() => {
    if (!mapRef.current || !coordinates) return;
    
    // Clean up previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize map
    mapInstanceRef.current = L.map(mapRef.current, {
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: false,
      doubleClickZoom: true,
      touchZoom: true,
    }).setView([coordinates.lat, coordinates.lng], 15);

    // Add tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapInstanceRef.current);

    // Custom marker icon
    const customIcon = L.divIcon({
      html: `<div class="flex items-center justify-center w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>`,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    // Add marker
    L.marker([coordinates.lat, coordinates.lng], { icon: customIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`<strong>${profile.name}</strong><br/>${profile.location.address}`);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates, profile.name, profile.location.address]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Localização e Área de Atendimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map */}
        {isLoadingCoords || isGeocoding ? (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p className="text-sm">Carregando mapa...</p>
            </div>
          </div>
        ) : coordinates ? (
          <div 
            ref={mapRef} 
            className="aspect-video w-full rounded-lg overflow-hidden z-0"
            style={{ minHeight: "200px" }}
          />
        ) : (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Localização não disponível</p>
            </div>
          </div>
        )}

        {/* Address */}
        <div>
          <h4 className="font-semibold text-foreground mb-2">Endereço Base:</h4>
          <p className="text-muted-foreground">{profile.location.address}</p>
        </div>

        {/* Neighborhoods */}
        <div>
          <h4 className="font-semibold text-foreground mb-3">
            Bairros Atendidos:
          </h4>
          <div className="flex flex-wrap gap-2">
            {profile.location.neighborhoods.map((neighborhood) => (
              <Badge key={neighborhood} variant="secondary">
                {neighborhood}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationCard;
