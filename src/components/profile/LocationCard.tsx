import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { InstructorProfile } from "@/types";

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

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const { lat, lng } = profile.location.coordinates;
    
    // Initialize map
    mapInstanceRef.current = L.map(mapRef.current, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    }).setView([lat, lng], 14);

    // Add tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapInstanceRef.current);

    // Add marker
    L.marker([lat, lng]).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [profile.location.coordinates]);

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
        <div 
          ref={mapRef} 
          className="aspect-video w-full rounded-lg overflow-hidden z-0"
          style={{ minHeight: "200px" }}
        />

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
