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
import { useDrivingSchoolInstrutores } from '@/hooks/useDrivingSchoolInstrutores';
import type { FiltrosMapa, InstrutorNoMapa, InstrutorAutoescolaNoMapa } from '@/types/map';
import MapSearchBar from '@/components/map/MapSearchBar';
import MapInstructorCarousel from '@/components/map/MapInstructorCarousel';
import MapActionButtons from '@/components/map/MapActionButtons';
import SearchAreaButton from '@/components/map/SearchAreaButton';
import MapLegend from '@/components/map/MapLegend';
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

function createDrivingSchoolInstructorIcon() {
  const size = 28;
  return L.divIcon({
    html: `<div style="position:relative;width:${size}px;height:${size}px;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.2));">
      <div style="background:#60A5FA;width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
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

  return `<div style="min-width:180px;max-width:min(280px, calc(100vw - 32px));">
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

function buildDSInstructorPopupHtml(inst: InstrutorAutoescolaNoMapa) {
  const avatar = inst.photo_url
    ? `<img src="${inst.photo_url}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" onerror="this.style.display='none'" />`
    : `<div style="width:40px;height:40px;border-radius:50%;background:#60A5FA;display:flex;align-items:center;justify-content:center;"><span style="font-weight:700;color:white;font-size:14px;">${inst.instructor_name.charAt(0)}</span></div>`;
  const badges = (inst.license_categories || []).map(c =>
    `<span style="background:#EFF6FF;color:#3B82F6;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:500;">${c}</span>`
  ).join('');
  const dist = inst.distance_km < 1
    ? `${Math.round(inst.distance_km * 1000)} m`
    : `${inst.distance_km.toFixed(1)} km`;
  const schoolLink = inst.driving_school_id
    ? `<a href="/instrutores/${inst.driving_school_id}" style="display:block;text-align:center;padding:6px 12px;border:1.5px solid #3B82F6;color:#3B82F6;border-radius:8px;text-decoration:none;font-size:12px;font-weight:500;margin-top:8px;transition:all .2s;" onmouseover="this.style.background='#3B82F6';this.style.color='white'" onmouseout="this.style.background='transparent';this.style.color='#3B82F6'">Ver Autoescola →</a>`
    : '';

  return `<div style="max-width:260px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      ${avatar}
      <div>
        <div style="font-weight:600;font-size:14px;color:#1a1a2e;">${inst.instructor_name}</div>
        <div style="font-size:12px;color:#3B82F6;">🏢 ${inst.driving_school_name || 'Autoescola'}</div>
      </div>
    </div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px;">${badges}</div>
    <div style="font-size:12px;color:#6B7280;margin-bottom:6px;">📍 ${dist} de você</div>
    <div style="font-size:11px;color:#9CA3AF;border-top:1px solid #F3F4F6;padding-top:6px;">
      Instrutor vinculado à autoescola ${inst.driving_school_name || ''}
    </div>
    ${schoolLink}
  </div>`;
}

export default function PublicInstructorMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const dsMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const geo = useGeolocation(true);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [showDrivingSchoolTeam, setShowDrivingSchoolTeam] = useState(true);
  const [mapVersion, setMapVersion] = useState(0);
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

  const { data: rawDSInstructors = [], isLoading: isDSLoading } = useDrivingSchoolInstrutores(
    queryCenter?.[0] ?? null,
    queryCenter?.[1] ?? null,
    filters.raioKm,
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

  const dsInstructors = useMemo(() => {
    if (!showDrivingSchoolTeam) return [];
    let result = rawDSInstructors;
    if (filters.categorias.length > 0) {
      result = result.filter(i => filters.categorias.some(c => (i.license_categories || []).includes(c)));
    }
    return result;
  }, [rawDSInstructors, showDrivingSchoolTeam, filters.categorias]);

  // Combined count for result display
  const totalResultCount = instructors.length + dsInstructors.length;

  // Determine initial center from geolocation
  useEffect(() => {
    if (center) return;
    if (geo.latitude && geo.longitude) {
      setCenter([geo.latitude, geo.longitude]);
    } else if (!geo.isLoading && (geo.error || !geo.isSupported)) {
      // Only fall back when geo definitively failed (denied, timeout, unsupported)
      setCenter(BELO_HORIZONTE);
      toast.info('Ative a localização para encontrar instrutores perto de você');
    }
  }, [geo.latitude, geo.longitude, geo.isLoading, geo.error, geo.isSupported, center]);

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

    // Markers layer groups
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    const dsMarkersLayer = L.layerGroup().addTo(map);
    dsMarkersLayerRef.current = dsMarkersLayer;

    // Signal to marker effects that the map (and its layers) is ready
    setMapVersion(v => v + 1);

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

    setSearchCenter(null);
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      dsMarkersLayerRef.current = null;
    };
  }, [center]);

  // Draw radius circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !queryCenter) return;
    if (radiusCircleRef.current) radiusCircleRef.current.remove();
    radiusCircleRef.current = L.circle(queryCenter, {
      radius: filters.raioKm * 1000,
      color: '#FF8C00',
      fillColor: '#FF8C00',
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: '6 4',
    }).addTo(map);
  }, [queryCenter, filters.raioKm]);

  // Update instructor markers
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
      marker.on('click', () => setSelectedId(inst.id));
    });
  }, [instructors, mapVersion]);

  // Update driving school instructor markers
  useEffect(() => {
    const layer = dsMarkersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    dsInstructors.forEach((inst) => {
      if (!inst.latitude || !inst.longitude) return;
      // Apply small random offset if location matches the school exactly
      const latOffset = (Math.random() - 0.5) * 0.002;
      const lngOffset = (Math.random() - 0.5) * 0.002;
      const icon = createDrivingSchoolInstructorIcon();
      const marker = L.marker([inst.latitude + latOffset, inst.longitude + lngOffset], { icon })
        .addTo(layer)
        .bindPopup(buildDSInstructorPopupHtml(inst), {
          className: 'custom-instructor-popup',
          maxWidth: 280,
          closeButton: true,
        });
      marker.on('click', () => setSelectedId(`ds-${inst.id}`));
    });
  }, [dsInstructors, mapVersion]);

  // Handle card select → fly to marker
  const handleCardSelect = useCallback((id: string) => {
    setSelectedId(id);

    // Check if it's a driving school instructor
    if (id.startsWith('ds-')) {
      const dsId = id.replace('ds-', '');
      const inst = dsInstructors.find(i => i.id === dsId);
      if (inst && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([inst.latitude, inst.longitude], 15, { duration: 0.8 });
      }
      return;
    }

    const inst = instructors.find(i => i.id === id);
    if (inst && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([inst.latitude, inst.longitude], 15, { duration: 0.8 });
      markersLayerRef.current?.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          const pos = layer.getLatLng();
          if (Math.abs(pos.lat - inst.latitude) < 0.0001 && Math.abs(pos.lng - inst.longitude) < 0.0001) {
            layer.openPopup();
          }
        }
      });
    }
  }, [instructors, dsInstructors]);

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

  // Build combined items for carousel
  const combinedCarouselItems = useMemo(() => {
    const items: Array<{ type: 'instructor'; data: InstrutorNoMapa } | { type: 'ds-instructor'; data: InstrutorAutoescolaNoMapa }> = [];
    instructors.forEach(i => items.push({ type: 'instructor', data: i }));
    dsInstructors.forEach(i => items.push({ type: 'ds-instructor', data: i }));
    items.sort((a, b) => {
      const distA = a.type === 'instructor' ? a.data.distance_km : a.data.distance_km;
      const distB = b.type === 'instructor' ? b.data.distance_km : b.data.distance_km;
      return distA - distB;
    });
    return items;
  }, [instructors, dsInstructors]);

  return (
    <>
      <title>Encontre Instrutores Perto de Você | Conduz Brasil</title>
      <meta name="description" content="Veja instrutores de autoescola no mapa, compare avaliações e agende sua aula." />
      <NavBar />
      <div className="relative" style={{ height: `calc(100vh - ${NAVBAR_HEIGHT}px)`, width: '100vw' }}>
        {!center ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <div ref={mapRef} className="h-full w-full" />
        )}

        <MapSearchBar
          filters={filters}
          onFiltersChange={setFilters}
          onLocationSelect={handleLocationSelect}
          resultCount={totalResultCount}
          showDrivingSchoolTeam={showDrivingSchoolTeam}
          onToggleDrivingSchoolTeam={() => setShowDrivingSchoolTeam(prev => !prev)}
        />

        <SearchAreaButton visible={showSearchArea} onClick={handleSearchArea} />

        <MapActionButtons
          onRecenter={handleRecenter}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />

        <MapLegend />

        <MapInstructorCarousel
          instructors={instructors}
          dsInstructors={dsInstructors}
          loading={isLoading}
          selectedId={selectedId}
          onSelect={handleCardSelect}
          onIncreaseRadius={handleIncreaseRadius}
        />
      </div>
    </>
  );
}
