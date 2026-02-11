import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import L from 'leaflet';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useGeolocation } from '@/hooks/useGeolocation';
import MapFilters, { type MapFilterValues } from '@/components/map/MapFilters';
import InstructorMapSidebar, { type MapInstructor } from '@/components/map/InstructorMapSidebar';
import NavBar from '@/components/NavBar';
import 'leaflet/dist/leaflet.css';

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

const SAO_PAULO: [number, number] = [-23.5505, -46.6333];

function createInstructorIcon(isSchool: boolean) {
  const color = isSchool ? '#2563eb' : '#FF8C00';
  return L.divIcon({
    html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8c-.1.3-.1.6-.1.9v4.2c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
    </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

export default function PublicInstructorMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const geo = useGeolocation(true);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [instructors, setInstructors] = useState<MapInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<MapFilterValues>({
    radiusKm: 20,
    categories: [],
    minRating: 0,
  });

  // Determine initial center
  useEffect(() => {
    if (center) return;
    if (geo.latitude && geo.longitude) {
      setCenter([geo.latitude, geo.longitude]);
    } else if (!geo.isLoading && !geo.latitude) {
      setCenter(SAO_PAULO);
    }
  }, [geo.latitude, geo.longitude, geo.isLoading, center]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !center) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current).setView(center, 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // User marker
    const userIcon = L.divIcon({
      html: `<div style="background:#3b82f6;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
      className: '',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    L.marker(center, { icon: userIcon }).addTo(map).bindPopup('<b>Você está aqui</b>');

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [center]);

  // Fetch instructors
  const fetchInstructors = useCallback(async () => {
    if (!center) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('nearby_instructors', {
        user_lat: center[0],
        user_lng: center[1],
        radius_km: filters.radiusKm,
        min_rating: filters.minRating > 0 ? filters.minRating : undefined,
        max_results: 100,
      });
      if (error) throw error;

      let results: MapInstructor[] = (data || []).map((d: any) => ({
        id: d.id,
        name: d.full_name || 'Instrutor',
        avatar_url: d.avatar_url,
        latitude: d.latitude,
        longitude: d.longitude,
        average_rating: d.average_rating || 0,
        total_reviews: d.total_reviews || 0,
        categories: d.categories || [],
        distance_km: d.distance_km || 0,
        bio: d.bio,
        is_online: d.is_online || false,
        user_id: d.user_id,
      }));

      // Client-side category filter
      if (filters.categories.length > 0) {
        results = results.filter((inst) =>
          filters.categories.some((cat) => inst.categories.includes(cat))
        );
      }

      setInstructors(results);
    } catch (err) {
      console.error('Error fetching instructors:', err);
      toast.error('Erro ao buscar instrutores');
    } finally {
      setLoading(false);
    }
  }, [center, filters]);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  // Update markers on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    instructors.forEach((inst) => {
      if (!inst.latitude || !inst.longitude) return;

      const icon = createInstructorIcon(false);
      const popup = `
        <div style="min-width:200px;padding:4px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="width:40px;height:40px;border-radius:50%;background:#f3f4f6;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${inst.avatar_url
                ? `<img src="${inst.avatar_url}" style="width:100%;height:100%;object-fit:cover;"/>`
                : `<span style="font-weight:700;color:#6b7280;font-size:16px;">${inst.name.charAt(0)}</span>`}
            </div>
            <div>
              <h4 style="font-weight:600;margin:0;">${inst.name}</h4>
              <div style="display:flex;align-items:center;gap:4px;font-size:13px;color:#6b7280;">
                <span style="color:#fbbf24;">★</span> ${inst.average_rating?.toFixed(1)} (${inst.total_reviews})
              </div>
            </div>
          </div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">
            ${inst.categories.map((c) => `<span style="background:#f3f4f6;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:500;">${c}</span>`).join('')}
          </div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">📍 a ${inst.distance_km?.toFixed(1)} km de você</div>
          <a href="/instrutores/${inst.id}" style="display:block;background:#FF8C00;color:white;text-align:center;padding:8px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:500;">Ver Perfil</a>
        </div>
      `;

      const marker = L.marker([inst.latitude, inst.longitude], { icon })
        .addTo(map)
        .bindPopup(popup);

      marker.on('click', () => {
        setSelectedId(inst.id);
        const card = document.getElementById(`sidebar-card-${inst.id}`);
        card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      markersRef.current.set(inst.id, marker);
    });
  }, [instructors]);

  // Handle sidebar selection
  const handleSelectInstructor = useCallback((id: string) => {
    setSelectedId(id);
    const marker = markersRef.current.get(id);
    if (marker && mapInstanceRef.current) {
      const pos = marker.getLatLng();
      mapInstanceRef.current.setView(pos, 15, { animate: true });
      marker.openPopup();
    }
  }, []);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&countrycodes=br&limit=1`,
        { headers: { 'User-Agent': 'ConduzBrasil/1.0' } }
      );
      const data = await res.json();
      if (data.length === 0) {
        toast.error('Endereço não encontrado');
        return;
      }
      const newCenter: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      setCenter(newCenter);
      mapInstanceRef.current?.setView(newCenter, 13, { animate: true });
    } catch {
      toast.error('Erro ao buscar endereço');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  return (
    <>
      <title>Encontre Instrutores de Autoescola Perto de Você | Conduz Brasil</title>
      <meta name="description" content="Encontre instrutores de autoescola e autoescolas perto de você no mapa interativo da Conduz Brasil. Busque por localização, categoria e avaliação." />
      <NavBar />
      <div className="h-[calc(100vh-64px)] flex flex-col">
        <MapFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={handleSearch}
          filters={filters}
          onFiltersChange={setFilters}
          isSearching={isSearching}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - desktop */}
          <div className="hidden md:block w-[350px] border-r overflow-hidden">
            <InstructorMapSidebar
              instructors={instructors}
              loading={loading}
              selectedId={selectedId}
              onSelect={handleSelectInstructor}
            />
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            {!center ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <div ref={mapRef} className="h-full w-full" />
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border text-sm">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow" />
                  <span>Sua localização</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full" style={{ background: '#FF8C00', border: '2px solid white' }} />
                  <span>Instrutor</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile bottom list - simplified */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 z-[1000] bg-background border-t max-h-[40vh] overflow-auto">
            <InstructorMapSidebar
              instructors={instructors}
              loading={loading}
              selectedId={selectedId}
              onSelect={handleSelectInstructor}
            />
          </div>
        </div>
      </div>
    </>
  );
}
