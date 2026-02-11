import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useInstrutoresProximos } from '@/hooks/useInstrutoresProximos';
import type { FiltrosMapa, InstrutorNoMapa } from '@/types/map';
import MapSearchBar from '@/components/map/MapSearchBar';
import MapInstructorCarousel from '@/components/map/MapInstructorCarousel';
import MapActionButtons from '@/components/map/MapActionButtons';
import SearchAreaButton from '@/components/map/SearchAreaButton';
import NavBar from '@/components/NavBar';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const BELO_HORIZONTE: [number, number] = [-19.9191, -43.9386];
const NAVBAR_HEIGHT = 64;

function createInstructorIcon(isOnline: boolean, isDrivingSchool: boolean) {
  const size = isDrivingSchool ? 42 : 36;
  const color = isDrivingSchool ? '#3B82F6' : (isOnline ? '#FF8C00' : '#9CA3AF');
  const icon = isDrivingSchool
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8c-.1.3-.1.6-.1.9v4.2c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`;
  const onlineDot = isOnline && !isDrivingSchool
    ? `<div style="position:absolute;top:-2px;right:-2px;width:10px;height:10px;background:#22c55e;border-radius:50%;border:2px solid white;"></div>`
    : '';

  return L.divIcon({
    html: `<div style="position:relative;width:${size}px;height:${size}px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
      <div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;">
        ${icon}
      </div>
      ${onlineDot}
    </div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function buildPopupHtml(inst: InstrutorNoMapa) {
  const avatar = inst.avatar_url
    ? `<img src="${inst.avatar_url}" style="width:100%;height:100%;object-fit:cover;"/>`
    : `<span style="font-weight:700;color:white;font-size:16px;">${inst.full_name.charAt(0)}</span>`;
  const avatarBg = inst.avatar_url ? '' : 'background:#FF8C00;';
  const badges = inst.categories.map(c =>
    `<span style="background:#FFF7ED;color:#FF8C00;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:500;">${c}</span>`
  ).join('');
  const dist = inst.distance_km < 1
    ? `${Math.round(inst.distance_km * 1000)} m`
    : `${inst.distance_km.toFixed(1)} km`;
  const statusColor = inst.is_online ? '#22c55e' : '#9CA3AF';
  const statusText = inst.is_online ? 'Online agora' : 'Offline';

  return `<div style="min-width:220px;max-width:280px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
      <div style="width:44px;height:44px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;${avatarBg}">
        ${avatar}
      </div>
      <div>
        <h4 style="font-weight:600;margin:0;font-size:14px;color:#1a1a2e;">${inst.full_name}</h4>
        <div style="display:flex;align-items:center;gap:4px;font-size:12px;color:#6b7280;margin-top:2px;">
          <span style="color:#eab308;">★</span> ${inst.average_rating.toFixed(1)} (${inst.total_reviews} avaliações)
        </div>
      </div>
    </div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">${badges}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <span style="font-size:12px;color:#6b7280;">📍 ${dist} de você</span>
      <span style="display:flex;align-items:center;gap:4px;font-size:11px;color:${statusColor};">
        <span style="width:7px;height:7px;border-radius:50%;background:${statusColor};display:inline-block;"></span>
        ${statusText}
      </span>
    </div>
    <a href="/instrutores/${inst.id}" style="display:block;text-align:center;padding:8px 16px;border:1.5px solid #FF8C00;color:#FF8C00;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500;transition:all .2s;" onmouseover="this.style.background='#FF8C00';this.style.color='white'" onmouseout="this.style.background='transparent';this.style.color='#FF8C00'">Ver Perfil →</a>
  </div>`;
}

export default function PublicInstructorMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const geo = useGeolocation(true);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [filters, setFilters] = useState<FiltrosMapa>({
    raioKm: 20,
    minRating: 0,
    categorias: [],
    apenasOnline: false,
  });

  const queryCenter = searchCenter || center;
  const { data: rawInstructors = [], isLoading, refetch } = useInstrutoresProximos(
    queryCenter?.[0] ?? null,
    queryCenter?.[1] ?? null,
    filters.raioKm,
    filters.minRating,
  );

  // Apply client-side filters
  const instructors = useMemo(() => {
    let result = rawInstructors;
    if (filters.categorias.length > 0) {
      result = result.filter(i => filters.categorias.some(c => i.categories.includes(c)));
    }
    if (filters.apenasOnline) {
      result = result.filter(i => i.is_online);
    }
    return result;
  }, [rawInstructors, filters.categorias, filters.apenasOnline]);

  // Determine initial center from geolocation
  useEffect(() => {
    if (center) return;
    if (geo.latitude && geo.longitude) {
      setCenter([geo.latitude, geo.longitude]);
    } else if (!geo.isLoading && !geo.latitude) {
      setCenter(BELO_HORIZONTE);
      toast.info('Ative a localização para encontrar instrutores perto de você');
    }
  }, [geo.latitude, geo.longitude, geo.isLoading, center]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !center) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, { zoomControl: false }).setView(center, 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Markers layer group
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // User marker
    const userIcon = L.divIcon({
      html: `<div style="background:#3b82f6;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
      className: '',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    const userM = L.marker(center, { icon: userIcon }).addTo(map);
    userM.bindTooltip('Você está aqui', { permanent: true, direction: 'top', offset: [0, -10], className: 'user-tooltip' });
    userMarkerRef.current = userM;

    // Track map movement for "search this area" button
    let lastSearchCenter = center;
    map.on('moveend', () => {
      const c = map.getCenter();
      const dist = map.distance(L.latLng(lastSearchCenter), c) / 1000;
      setShowSearchArea(dist > 1);
    });

    // Store initial search center reference
    setSearchCenter(null);

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, [center]);

  // Draw radius circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !queryCenter) return;

    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
    }

    radiusCircleRef.current = L.circle(queryCenter, {
      radius: filters.raioKm * 1000,
      color: '#FF8C00',
      fillColor: '#FF8C00',
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: '6 4',
    }).addTo(map);
  }, [queryCenter, filters.raioKm]);

  // Update markers
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    instructors.forEach((inst) => {
      if (!inst.latitude || !inst.longitude) return;
      const icon = createInstructorIcon(inst.is_online, false);
      const marker = L.marker([inst.latitude, inst.longitude], { icon })
        .addTo(layer)
        .bindPopup(buildPopupHtml(inst), {
          className: 'custom-instructor-popup',
          maxWidth: 300,
          closeButton: true,
        });

      marker.on('click', () => {
        setSelectedId(inst.id);
      });
    });
  }, [instructors]);

  // Handle card select → fly to marker
  const handleCardSelect = useCallback((id: string) => {
    setSelectedId(id);
    const inst = instructors.find(i => i.id === id);
    if (inst && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([inst.latitude, inst.longitude], 15, { duration: 0.8 });
      // Open popup
      markersLayerRef.current?.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          const pos = layer.getLatLng();
          if (Math.abs(pos.lat - inst.latitude) < 0.0001 && Math.abs(pos.lng - inst.longitude) < 0.0001) {
            layer.openPopup();
          }
        }
      });
    }
  }, [instructors]);

  // Handle search area
  const handleSearchArea = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const c = map.getCenter();
    setSearchCenter([c.lat, c.lng]);
    setShowSearchArea(false);
  }, []);

  // Handle location select from geocoding
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setSearchCenter([lat, lng]);
    mapInstanceRef.current?.flyTo([lat, lng], 13, { duration: 0.8 });
    setShowSearchArea(false);
  }, []);

  // Recenter on GPS
  const handleRecenter = useCallback(() => {
    geo.requestLocation();
    if (geo.latitude && geo.longitude) {
      const pos: [number, number] = [geo.latitude, geo.longitude];
      setSearchCenter(null);
      setCenter(pos);
      mapInstanceRef.current?.flyTo(pos, 13, { duration: 0.8 });
      userMarkerRef.current?.setLatLng(pos);
    }
  }, [geo]);

  // Zoom controls
  const handleZoomIn = useCallback(() => mapInstanceRef.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => mapInstanceRef.current?.zoomOut(), []);

  // Increase radius
  const handleIncreaseRadius = useCallback(() => {
    setFilters(f => ({ ...f, raioKm: Math.min(f.raioKm + 10, 50) }));
  }, []);

  return (
    <>
      <title>Encontre Instrutores Perto de Você | Conduz Brasil</title>
      <meta name="description" content="Veja instrutores de autoescola no mapa, compare avaliações e agende sua aula." />
      <NavBar />
      <div className="relative" style={{ height: `calc(100vh - ${NAVBAR_HEIGHT}px)`, width: '100vw' }}>
        {/* Map container */}
        {!center ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <div ref={mapRef} className="h-full w-full" />
        )}

        {/* Overlays */}
        <MapSearchBar
          filters={filters}
          onFiltersChange={setFilters}
          onLocationSelect={handleLocationSelect}
          resultCount={instructors.length}
        />

        <SearchAreaButton visible={showSearchArea} onClick={handleSearchArea} />

        <MapActionButtons
          onRecenter={handleRecenter}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />

        <MapInstructorCarousel
          instructors={instructors}
          loading={isLoading}
          selectedId={selectedId}
          onSelect={handleCardSelect}
          onIncreaseRadius={handleIncreaseRadius}
        />
      </div>
    </>
  );
}
