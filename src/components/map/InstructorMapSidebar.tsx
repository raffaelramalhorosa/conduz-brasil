import { Star, MapPin, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export interface MapInstructor {
  id: string;
  name: string;
  avatar_url: string | null;
  latitude: number;
  longitude: number;
  average_rating: number;
  total_reviews: number;
  categories: string[];
  distance_km: number;
  bio: string | null;
  is_online: boolean;
  user_id: string;
}

interface Props {
  instructors: MapInstructor[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function InstructorMapSidebar({ instructors, loading, selectedId, onSelect }: Props) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (instructors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-2">Nenhum instrutor encontrado</h3>
        <p className="text-muted-foreground text-sm">
          Tente aumentar o raio de busca ou mude a localização.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground mb-2">
          {instructors.length} instrutor{instructors.length !== 1 ? 'es' : ''} encontrado{instructors.length !== 1 ? 's' : ''}
        </p>
        <AnimatePresence>
          {instructors.map((inst, i) => (
            <motion.div
              key={inst.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                id={`sidebar-card-${inst.id}`}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedId === inst.id ? 'ring-2 ring-primary shadow-md' : ''
                }`}
                onClick={() => onSelect(inst.id)}
              >
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {inst.avatar_url ? (
                        <img src={inst.avatar_url} alt={inst.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">
                          {inst.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{inst.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{inst.average_rating?.toFixed(1) || '0.0'}</span>
                        <span>({inst.total_reviews || 0})</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {inst.categories?.slice(0, 3).map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          {inst.distance_km?.toFixed(1)} km
                        </span>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                          <Link to={`/instrutores/${inst.id}`}>Ver Perfil</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}
