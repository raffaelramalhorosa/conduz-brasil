import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Star, MapPin } from 'lucide-react';
import { NearbyInstructor } from '@/hooks/useNearbyInstructors';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface InstructorMapMarkerProps {
  instructor: NearbyInstructor;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
}

// Create custom marker icons
const createMarkerIcon = (isOnline: boolean, isSelected: boolean, isHovered: boolean) => {
  const size = isSelected || isHovered ? 40 : 32;
  const color = isOnline ? '#10b981' : '#3b82f6';
  const borderColor = isOnline ? '#059669' : '#2563eb';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid ${borderColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
        transform: ${isSelected || isHovered ? 'scale(1.1)' : 'scale(1)'};
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export const InstructorMapMarker = ({
  instructor,
  isSelected,
  isHovered,
  onSelect,
}: InstructorMapMarkerProps) => {
  const navigate = useNavigate();
  const icon = createMarkerIcon(
    instructor.is_online || false,
    isSelected,
    isHovered
  );

  return (
    <Marker
      position={[instructor.latitude, instructor.longitude]}
      icon={icon}
      eventHandlers={{
        click: onSelect,
      }}
    >
      <Popup className="instructor-popup" maxWidth={280} minWidth={250}>
        <div className="p-1">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={instructor.avatar_url || '/placeholder.svg'}
              alt={instructor.full_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-background"
            />
            <div>
              <h3 className="font-bold text-foreground">{instructor.full_name}</h3>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{instructor.average_rating?.toFixed(1) || '0.0'}</span>
                <span className="text-muted-foreground text-sm">
                  ({instructor.total_reviews || 0})
                </span>
              </div>
            </div>
          </div>

          {instructor.is_online && (
            <div className="flex items-center gap-1.5 text-green-600 text-sm mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Disponível agora</span>
            </div>
          )}

          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {instructor.distance_km} km de distância
          </p>

          <div className="flex flex-wrap gap-1 mb-3">
            {instructor.categories?.map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs">
                Cat. {cat}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/instrutor/${instructor.user_id}`)}
            >
              Ver Perfil
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => navigate(`/instrutor/${instructor.user_id}`)}
            >
              Agendar
            </Button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};
