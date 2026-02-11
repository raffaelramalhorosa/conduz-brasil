import { useRef, useEffect, useCallback } from 'react';
import { MapPinOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { InstrutorNoMapa } from '@/types/map';
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
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onIncreaseRadius: () => void;
}

export default function MapInstructorCarousel({ instructors, loading, selectedId, onSelect, onIncreaseRadius }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

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

  if (instructors.length === 0) {
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
          {instructors.map((inst) => (
            <motion.div
              key={inst.id}
              id={`map-card-${inst.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`min-w-[260px] md:min-w-[300px] max-w-[280px] md:max-w-[340px] flex-shrink-0 snap-start bg-white rounded-2xl shadow-lg cursor-pointer transition-all duration-300 ${
                selectedId === inst.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelect(inst.id)}
            >
              <div className="p-3 md:p-4">
                {/* Top row */}
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

                {/* Separator */}
                <div className="h-px bg-border my-2.5" />

                {/* Bottom row */}
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
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
