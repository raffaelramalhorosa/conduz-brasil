import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MapPin, Car, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface InstructorLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  city: string | null;
  neighborhood: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  is_online: boolean | null;
  profile: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

function FitBounds({ instructors }: { instructors: InstructorLocation[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (instructors.length > 0) {
      const validInstructors = instructors.filter(i => i.latitude && i.longitude);
      if (validInstructors.length > 0) {
        const bounds = new LatLngBounds(
          validInstructors.map(i => [i.latitude, i.longitude] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [instructors, map]);
  
  return null;
}

export default function InstructorMap() {
  const [instructors, setInstructors] = useState<InstructorLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Default to São Paulo
          setUserLocation([-23.5505, -46.6333]);
        }
      );
    } else {
      setUserLocation([-23.5505, -46.6333]);
    }

    fetchInstructors();
  }, []);

  async function fetchInstructors() {
    try {
      const { data, error } = await supabase
        .from('instructor_profiles')
        .select(`
          id,
          user_id,
          latitude,
          longitude,
          city,
          neighborhood,
          average_rating,
          total_reviews,
          is_online,
          profile:profiles!instructor_profiles_user_id_fkey(full_name, avatar_url)
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .eq('is_active', true)
        .eq('verification_status', 'approved');

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(item => ({
        ...item,
        profile: Array.isArray(item.profile) ? item.profile[0] : item.profile
      }));
      
      setInstructors(transformedData);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !userLocation) {
    return (
      <div className="p-6">
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mapa de Instrutores</h1>
            <p className="text-muted-foreground">
              {instructors.length} instrutor{instructors.length !== 1 ? 'es' : ''} encontrado{instructors.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/instrutores">
              <MapPin className="h-4 w-4 mr-2" />
              Ver Lista
            </Link>
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={userLocation}
          zoom={13}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <FitBounds instructors={instructors} />
          
          {/* User location marker */}
          {userLocation && (
            <Marker 
              position={userLocation}
              icon={new Icon({
                iconUrl: 'data:image/svg+xml;base64,' + btoa(`
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" width="32" height="32">
                    <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="white" stroke-width="2"/>
                    <circle cx="12" cy="12" r="4" fill="white"/>
                  </svg>
                `),
                iconSize: [32, 32],
                iconAnchor: [16, 16],
              })}
            >
              <Popup>
                <div className="text-center">
                  <Navigation className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="font-medium">Sua localização</p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Instructor markers */}
          {instructors.map((instructor) => (
            <Marker
              key={instructor.id}
              position={[instructor.latitude, instructor.longitude]}
              icon={defaultIcon}
            >
              <Popup>
                <Card className="border-0 shadow-none min-w-[200px]">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        {instructor.profile?.avatar_url ? (
                          <img
                            src={instructor.profile.avatar_url}
                            alt={instructor.profile?.full_name || 'Instrutor'}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Car className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        {instructor.is_online && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {instructor.profile?.full_name || 'Instrutor'}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{instructor.average_rating?.toFixed(1) || '0.0'}</span>
                          <span>({instructor.total_reviews || 0})</span>
                        </div>
                        {instructor.neighborhood && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {instructor.neighborhood}
                            {instructor.city && `, ${instructor.city}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button size="sm" className="w-full mt-3" asChild>
                      <Link to={`/instrutores/${instructor.id}`}>
                        Ver Perfil
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow" />
              <span>Sua localização</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={markerIcon} alt="Marker" className="h-6" />
              <span>Instrutor</span>
            </div>
          </div>
        </div>

        {/* No instructors message */}
        {instructors.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-[1000]">
            <Card className="max-w-md">
              <CardContent className="p-6 text-center">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Nenhum instrutor encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Não encontramos instrutores com localização cadastrada na sua região.
                </p>
                <Button asChild>
                  <Link to="/instrutores">Ver Todos os Instrutores</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
