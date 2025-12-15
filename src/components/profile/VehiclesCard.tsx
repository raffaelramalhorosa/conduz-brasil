import { Car } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InstructorProfile } from "@/types";

interface VehiclesCardProps {
  profile: InstructorProfile;
}

const VehiclesCard = ({ profile }: VehiclesCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5 text-primary" />
          Veículos Disponíveis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-4">
          {profile.vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-video overflow-hidden bg-muted">
                <img
                  src={vehicle.photo}
                  alt={vehicle.model}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-foreground">
                    {vehicle.model}
                  </h4>
                  <Badge variant="secondary" className="shrink-0">
                    CAT {vehicle.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ano {vehicle.year}
                </p>
                <div className="flex flex-wrap gap-1">
                  {vehicle.features.map((feature, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs font-normal"
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehiclesCard;
