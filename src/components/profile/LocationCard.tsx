import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InstructorProfile } from "@/data/mockInstructorProfile";

interface LocationCardProps {
  profile: InstructorProfile;
}

const LocationCard = ({ profile }: LocationCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Localização e Área de Atendimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map Placeholder */}
        <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
          <img
            src={`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+2563eb(${profile.location.coordinates.lng},${profile.location.coordinates.lat})/${profile.location.coordinates.lng},${profile.location.coordinates.lat},12,0/800x400@2x?access_token=pk.eyJ1IjoiYXV0b2Nvbm5lY3QiLCJhIjoiY2xiMTIzNDU2In0.example`}
            alt="Mapa de localização"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to a gradient if map fails to load
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement!.classList.add("bg-gradient-to-br", "from-primary/10", "to-accent/10");
            }}
          />
        </div>

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
