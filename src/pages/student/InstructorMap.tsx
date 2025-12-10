import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MapPin, Car, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
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
  business_name: string | null;
  bio: string | null;
  profile: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export default function InstructorMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
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
        () => {
          // Default to São Paulo
          setUserLocation([-23.5505, -46.6333]);
        }
      );
    } else {
      setUserLocation([-23.5505, -46.6333]);
    }

    fetchInstructors();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !userLocation || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(userLocation, 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // User location marker
    const userIcon = L.divIcon({
      html: `<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      className: 'user-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker(userLocation, { icon: userIcon })
      .addTo(map)
      .bindPopup('<div class="text-center"><b>Sua localização</b></div>');

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation]);

  // Add instructor markers
  useEffect(() => {
    if (!mapInstanceRef.current || instructors.length === 0) return;

    const map = mapInstanceRef.current;
    const markers: L.Marker[] = [];

    instructors.forEach((instructor) => {
      if (!instructor.latitude || !instructor.longitude) return;

      const displayName = instructor.profile?.full_name || instructor.business_name || `Instrutor - ${instructor.neighborhood || instructor.city || 'SP'}`;

      const popupContent = `
        <div style="min-width: 200px; padding: 8px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: #f3f4f6; display: flex; align-items: center; justify-content: center; overflow: hidden;">
              ${instructor.profile?.avatar_url 
                ? `<img src="${instructor.profile.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" />`
                : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8c-.1.3-.1.6-.1.9v4.2c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><circle cx="17" cy="17" r="2"></circle></svg>`
              }
            </div>
            <div style="flex: 1;">
              <h3 style="font-weight: 600; margin: 0 0 4px 0;">${displayName}</h3>
              <div style="display: flex; align-items: center; gap: 4px; color: #6b7280; font-size: 14px;">
                <span style="color: #fbbf24;">★</span>
                <span>${instructor.average_rating?.toFixed(1) || '0.0'}</span>
                <span>(${instructor.total_reviews || 0})</span>
              </div>
            </div>
          </div>
          ${instructor.neighborhood ? `<p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">📍 ${instructor.neighborhood}${instructor.city ? `, ${instructor.city}` : ''}</p>` : ''}
          <a href="/instrutores/${instructor.id}" style="display: block; background: #2563eb; color: white; text-align: center; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">Ver Perfil</a>
        </div>
      `;

      const marker = L.marker([instructor.latitude, instructor.longitude])
        .addTo(map)
        .bindPopup(popupContent);

      markers.push(marker);
    });

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      markers.forEach(marker => marker.remove());
    };
  }, [instructors]);

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
          business_name,
          bio
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .eq('is_active', true)
        .eq('verification_status', 'approved');

      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        ...item,
        profile: null // Mock data doesn't have profiles
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
    <div className="h-screen flex flex-col">
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
        <div ref={mapRef} className="h-full w-full" style={{ minHeight: '500px' }} />

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
