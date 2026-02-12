import { useRef, useEffect, useCallback, useMemo } from 'react';
import { MapPinOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { InstrutorNoMapa, InstrutorAutoescolaNoMapa } from '@/types/map';
import { Skeleton } from '@/components/ui/skeleton';

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

interface Props {
  instructors: InstrutorNoMapa[];
  dsInstructors: InstrutorAutoescolaNoMapa[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onIncreaseRadius: () => void;
}

type CarouselItem =
  | { type: 'instructor'; data: InstrutorNoMapa }
  | { type: 'ds-instructor'; data: InstrutorAutoescolaNoMapa };

export default function MapInstructorCarousel({ instructors, dsInstructors, loading, selectedId, onSelect, onIncreaseRadius }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const items = useMemo<CarouselItem[]>(() => {
    const all: CarouselItem[] = [];
    instructors.forEach(i => all.push({ type: 'instructor', data: i }));
    dsInstructors.forEach(i => all.push({ type: 'ds-instructor', data: i }));
    all.sort((a, b) => a.data.distance_km - b.data.distance_km);
    return all;
  }, [instructors, dsInstructors]);

  const getItemId = (item: CarouselItem) =>
    item.type === 'ds-instructor' ? `ds-${item.data.id}` : item.data.id;

  // Scroll to selected card
  const scrollToCard = useCallback((id: string) => {
    const el = document.getElementById(`map-card-${id}`);
    if (el && scrollRef.current) {
      const container = scrollRef.current;
      const left = el.offsetLeft - container.offsetLeft - 16;
      container.scrollTo({ left, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (selectedId) scrollToCard(selectedId);
  }, [selectedId, scrollToCard]);

  if (loading) {
    return (
      <div className="absolute bottom-6 left-0 right-0 z-[1000] px-4">
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="min-w-[280px] md:min-w-[300px] h-[140px] rounded-2xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center max-w-[300px]">
          <MapPinOff className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Nenhum instrutor encontrado</p>
          <p className="text-xs text-muted-foreground mb-3">Nenhum instrutor encontrado nesta região</p>
          <button
            onClick={onIncreaseRadius}
            className="text-xs font-medium text-primary hover:underline"
          >
            Aumentar raio de busca
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 md:bottom-6 left-0 right-0 z-[1000]">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <AnimatePresence>
          {items.map((item) => {
            const itemId = getItemId(item);
            const isDS = item.type === 'ds-instructor';

            if (isDS) {
              const inst = item.data as InstrutorAutoescolaNoMapa;
              return (
                <motion.div
                  key={itemId}
                  id={`map-card-${itemId}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className={`min-w-[260px] md:min-w-[300px] max-w-[280px] md:max-w-[340px] flex-shrink-0 snap-start bg-white rounded-2xl shadow-lg cursor-pointer transition-all duration-300 overflow-hidden ${
                    selectedId === itemId ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => onSelect(itemId)}
                >
                  {/* Blue top stripe */}
                  <div className="h-1 bg-blue-500" />
                  <div className="p-3 md:p-4">
                    <div className="flex gap-3 items-start">
                      <div className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
                        style={{ background: inst.photo_url ? undefined : '#60A5FA' }}
                      >
                        {inst.photo_url ? (
                          <img src={inst.photo_url} alt={inst.instructor_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-white">{getInitials(inst.instructor_name)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[15px] truncate" style={{ color: '#1a1a2e' }}>
                          {inst.instructor_name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 mt-0.5">
                          🏢 {inst.driving_school_name || 'Autoescola'}
                        </div>
                        <span className="text-xs text-muted-foreground">📍 {formatDistance(inst.distance_km)}</span>
                      </div>
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                        Autoescola
                      </span>
                    </div>
                    <div className="h-px bg-border my-2.5" />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                        {(inst.license_categories || []).slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{ background: '#EFF6FF', color: '#3B82F6' }}
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                      {inst.driving_school_id && (
                        <Link
                          to={`/instrutores/${inst.driving_school_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0 ml-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors"
                        >
                          Ver Autoescola →
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            }

            // Regular instructor card
            const inst = item.data as InstrutorNoMapa;
            return (
              <motion.div
                key={itemId}
                id={`map-card-${itemId}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`min-w-[260px] md:min-w-[300px] max-w-[280px] md:max-w-[340px] flex-shrink-0 snap-start bg-white rounded-2xl shadow-lg cursor-pointer transition-all duration-300 ${
                  selectedId === itemId ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onSelect(itemId)}
              >
                <div className="p-3 md:p-4">
                  <div className="flex gap-3 items-start">
                    <div className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
                      style={{ background: inst.avatar_url ? undefined : '#FF8C00' }}
                    >
                      {inst.avatar_url ? (
                        <img src={inst.avatar_url} alt={inst.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-white">{getInitials(inst.full_name)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[15px] truncate" style={{ color: '#1a1a2e' }}>
                        {inst.full_name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <span className="text-yellow-500">★</span>
                        <span>{inst.average_rating.toFixed(1)}</span>
                        <span>({inst.total_reviews} avaliações)</span>
                      </div>
                      <span className="text-xs text-muted-foreground">📍 {formatDistance(inst.distance_km)}</span>
                    </div>
                  </div>
                  <div className="h-px bg-border my-2.5" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
                      <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                        {inst.categories.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{ background: '#FFF7ED', color: '#FF8C00' }}
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                      <span className={`flex items-center gap-1 text-[11px] flex-shrink-0 ${inst.is_online ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <span className={`w-2 h-2 rounded-full ${inst.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {inst.is_online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <Link
                      to={`/instrutores/${inst.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0 ml-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      Ver Perfil →
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
