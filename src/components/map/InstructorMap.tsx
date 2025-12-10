import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, Circle, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NearbyInstructor } from '@/hooks/useNearbyInstructors';
import { InstructorMapMarker } from './InstructorMapMarker';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface InstructorMapProps {
  userLocation: { lat: number; lng: number } | null;
  instructors: NearbyInstructor[];
  selectedInstructor: NearbyInstructor | null;
  hoveredInstructorId: string | null;
  searchRadius: number;
  onSelectInstructor: (instructor: NearbyInstructor) => void;
}

// Component to handle map view changes
const MapController = ({
  center,
  selectedInstructor,
}: {
  center: { lat: number; lng: number } | null;
  selectedInstructor: NearbyInstructor | null;
}) => {
  const map = useMap();
  const hasSetInitialView = useRef(false);

  useEffect(() => {
    if (selectedInstructor) {
      map.flyTo([selectedInstructor.latitude, selectedInstructor.longitude], 15, {
        duration: 0.5,
      });
    }
  }, [selectedInstructor, map]);

  useEffect(() => {
    if (center && !hasSetInitialView.current) {
      map.flyTo([center.lat, center.lng], 13, { duration: 0.5 });
      hasSetInitialView.current = true;
    }
  }, [center, map]);

  return null;
};

// User location marker
const UserLocationMarker = ({ position }: { position: { lat: number; lng: number } }) => {
  const userIcon = L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background-color: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return <Marker position={[position.lat, position.lng]} icon={userIcon} />;
};

export const InstructorMap = ({
  userLocation,
  instructors,
  selectedInstructor,
  hoveredInstructorId,
  searchRadius,
  onSelectInstructor,
}: InstructorMapProps) => {
  // Default center (São Paulo)
  const defaultCenter: [number, number] = [-23.5505, -46.6333];
  const center = userLocation
    ? [userLocation.lat, userLocation.lng] as [number, number]
    : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="h-full w-full"
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController center={userLocation} selectedInstructor={selectedInstructor} />

      {/* User location marker */}
      {userLocation && <UserLocationMarker position={userLocation} />}

      {/* Search radius circle */}
      {userLocation && (
        <Circle
          center={[userLocation.lat, userLocation.lng]}
          radius={searchRadius * 1000}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.08,
            weight: 2,
            dashArray: '5, 10',
          }}
        />
      )}

      {/* Instructor markers */}
      {instructors.map((instructor) => (
        <InstructorMapMarker
          key={instructor.id}
          instructor={instructor}
          isSelected={selectedInstructor?.id === instructor.id}
          isHovered={hoveredInstructorId === instructor.id}
          onSelect={() => onSelectInstructor(instructor)}
        />
      ))}
    </MapContainer>
  );
};
