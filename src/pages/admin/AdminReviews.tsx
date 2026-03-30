import { useState, useEffect, useMemo } from 'react';
import { Star, MessageSquare, Filter, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReviewData {
  id: string;
  studentName: string;
  studentPhoto: string;
  instructorName: string;
  instructorPhoto: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  teachingRating: number | null;
  punctualityRating: number | null;
  vehicleRating: number | null;
  valueRating: number | null;
  positiveTags: string[] | null;
}

const StarRating = ({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) => {
  const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${starSize} ${
            i < rating
              ? 'fill-instructor-accent text-instructor-accent'
              : 'fill-transparent text-instructor-text-muted'
          }`}
        />
      ))}
    </div>
  );
};

export default function AdminReviews() {
  const { user, profile } = useAuth();
  const isDrivingSchool = profile?.user_type === 'driving_school';
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [starFilter, setStarFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    if (!user) return;

    try {
      const { data: instructorProfile } = await supabase
        .from('instructor_profiles')
        .select('id, is_driving_school')
        .eq('user_id', user.id)
        .single();

      if (!instructorProfile) {
        setLoading(false);
        return;
      }

      // Build list of instructor IDs to query
      let allInstructorIds = [instructorProfile.id];

      if (instructorProfile.is_driving_school) {
        // Get affiliated instructor profile IDs
        const { data: dsi } = await supabase
          .from('driving_school_instructors')
          .select('linked_user_id')
          .eq('driving_school_id', instructorProfile.id)
          .eq('status', 'active')
          .eq('is_account_linked', true);

        const affiliatedUserIds = (dsi || []).map(i => i.linked_user_id).filter(Boolean) as string[];

        if (affiliatedUserIds.length > 0) {
          const { data: affProfiles } = await supabase
            .from('instructor_profiles')
            .select('id')
            .in('user_id', affiliatedUserIds);

          allInstructorIds = [instructorProfile.id, ...(affProfiles || []).map(p => p.id)];
        }
      }

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          overall_rating,
          comment,
          created_at,
          teaching_rating,
          punctuality_rating,
          vehicle_rating,
          value_rating,
          positive_tags,
          instructor_id,
          student_profiles!inner (
            user_id,
            profiles!inner (
              full_name,
              avatar_url
            )
          )
        `)
        .in('instructor_id', allInstructorIds)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Fetch instructor profiles for all unique instructor_ids in reviews
        const uniqueInstructorIds = [...new Set(data.map((r: any) => r.instructor_id))];
        
        let instructorMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
        
        if (uniqueInstructorIds.length > 0) {
          const { data: instrProfiles } = await supabase
            .from('instructor_profiles')
            .select('id, user_id')
            .in('id', uniqueInstructorIds);
          
          if (instrProfiles && instrProfiles.length > 0) {
            const instrUserIds = instrProfiles.map(p => p.user_id);
            const { data: instrUsers } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', instrUserIds);
            
            if (instrUsers) {
              const userMap = new Map(instrUsers.map(u => [u.id, u]));
              instrProfiles.forEach(ip => {
                const userData = userMap.get(ip.user_id);
                if (userData) {
                  instructorMap[ip.id] = {
                    full_name: userData.full_name,
                    avatar_url: userData.avatar_url,
                  };
                }
              });
            }
          }
        }

        const mappedReviews: ReviewData[] = data.map((review: any) => ({
          id: review.id,
          studentName: review.student_profiles?.profiles?.full_name || 'Aluno Anônimo',
          studentPhoto: review.student_profiles?.profiles?.avatar_url || '',
          instructorName: instructorMap[review.instructor_id]?.full_name || 'Instrutor',
          instructorPhoto: instructorMap[review.instructor_id]?.avatar_url || '',
          rating: review.overall_rating,
          comment: review.comment,
          createdAt: review.created_at,
          teachingRating: review.teaching_rating,
          punctualityRating: review.punctuality_rating,
          vehicleRating: review.vehicle_rating,
          valueRating: review.value_rating,
          positiveTags: review.positive_tags,
        }));

        setReviews(mappedReviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate month options for the last 12 months
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options;
  }, []);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      if (monthFilter !== 'all') {
        const reviewMonth = format(new Date(review.createdAt), 'yyyy-MM');
        if (reviewMonth !== monthFilter) return false;
      }
      if (starFilter !== 'all') {
        if (review.rating !== parseInt(starFilter)) return false;
      }
      return true;
    });
  }, [reviews, monthFilter, starFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    if (reviews.length === 0) return { average: 0, total: 0, distribution: [0, 0, 0, 0, 0] };
    
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / total;
    
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      distribution[r.rating - 1]++;
    });
    
    return { average, total, distribution };
  }, [reviews]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64 bg-instructor-dark-secondary" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 bg-instructor-dark-secondary" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 bg-instructor-dark-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-instructor-text-primary">Avaliações</h1>
        <p className="text-sm sm:text-base text-instructor-text-secondary">
          {isDrivingSchool ? 'Veja o feedback dos alunos sobre sua equipe' : 'Veja o feedback dos seus alunos'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-instructor-dark-secondary rounded-xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-instructor-text-secondary">Média Geral</p>
            <Star className="w-5 h-5 text-instructor-accent fill-instructor-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-instructor-text-primary">
              {stats.average.toFixed(1)}
            </span>
            <span className="text-instructor-text-muted">/ 5.0</span>
          </div>
        </div>

        <div className="bg-instructor-dark-secondary rounded-xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-instructor-text-secondary">Total de Avaliações</p>
            <MessageSquare className="w-5 h-5 text-instructor-accent" />
          </div>
          <span className="text-3xl font-bold text-instructor-text-primary">
            {stats.total}
          </span>
        </div>

        <div className="bg-instructor-dark-secondary rounded-xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-instructor-text-secondary">Distribuição</p>
          </div>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star - 1];
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-instructor-text-muted w-3">{star}</span>
                  <Star className="w-3 h-3 text-instructor-accent fill-instructor-accent" />
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-instructor-accent rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-instructor-text-muted w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-instructor-dark-secondary rounded-xl border border-white/5 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-instructor-text-secondary">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-full sm:w-[200px] bg-instructor-dark-tertiary border-white/10 text-instructor-text-primary">
              <Calendar className="w-4 h-4 mr-2 text-instructor-text-muted" />
              <SelectValue placeholder="Todos os meses" />
            </SelectTrigger>
            <SelectContent className="bg-instructor-dark-tertiary border-white/10">
              <SelectItem value="all">Todos os meses</SelectItem>
              {monthOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={starFilter} onValueChange={setStarFilter}>
            <SelectTrigger className="w-full sm:w-[160px] bg-instructor-dark-tertiary border-white/10 text-instructor-text-primary">
              <Star className="w-4 h-4 mr-2 text-instructor-text-muted" />
              <SelectValue placeholder="Todas estrelas" />
            </SelectTrigger>
            <SelectContent className="bg-instructor-dark-tertiary border-white/10">
              <SelectItem value="all">Todas estrelas</SelectItem>
              <SelectItem value="5">5 estrelas</SelectItem>
              <SelectItem value="4">4 estrelas</SelectItem>
              <SelectItem value="3">3 estrelas</SelectItem>
              <SelectItem value="2">2 estrelas</SelectItem>
              <SelectItem value="1">1 estrela</SelectItem>
            </SelectContent>
          </Select>

          {(monthFilter !== 'all' || starFilter !== 'all') && (
            <button 
              onClick={() => { setMonthFilter('all'); setStarFilter('all'); }}
              className="text-sm text-instructor-accent hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-instructor-dark-secondary rounded-xl border border-white/5 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-instructor-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-bold text-instructor-text-primary mb-2">
            {reviews.length === 0 ? 'Nenhuma avaliação recebida' : 'Nenhuma avaliação encontrada'}
          </h3>
          <p className="text-instructor-text-secondary">
            {reviews.length === 0 
              ? 'Quando seus alunos avaliarem suas aulas, elas aparecerão aqui'
              : 'Tente ajustar os filtros para ver mais resultados'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div 
              key={review.id} 
              className="bg-instructor-dark-secondary rounded-xl border border-white/5 p-6 transition-all hover:border-white/10"
            >
              {/* Header: Instructor evaluated + rating */}
              {isDrivingSchool && (
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border-2 border-orange-500/30">
                      <AvatarImage src={review.instructorPhoto} alt={review.instructorName} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-xs font-bold">
                        {review.instructorName.substring(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-instructor-text-primary truncate">{review.instructorName}</p>
                      <p className="text-[10px] text-instructor-text-muted">Instrutor avaliado</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
              )}

              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 border-2 border-white/10">
                  <AvatarImage src={review.studentPhoto} alt={review.studentName} />
                  <AvatarFallback className="bg-instructor-dark-tertiary text-instructor-text-primary">
                    {review.studentName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-instructor-text-primary truncate">
                        {review.studentName}
                      </h4>
                      <p className="text-sm text-instructor-text-muted">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    {!isDrivingSchool && <StarRating rating={review.rating} />}
                  </div>
                  
                  {review.comment && (
                    <p className="mt-3 text-instructor-text-secondary leading-relaxed">
                      "{review.comment}"
                    </p>
                  )}
                  
                  {/* Rating Details */}
                  {(review.teachingRating || review.punctualityRating || review.vehicleRating || review.valueRating) && (
                    <div className="mt-4 flex flex-wrap gap-4 text-sm">
                      {review.teachingRating && (
                        <div className="flex items-center gap-2">
                          <span className="text-instructor-text-muted">Didática:</span>
                          <StarRating rating={review.teachingRating} size="sm" />
                        </div>
                      )}
                      {review.punctualityRating && (
                        <div className="flex items-center gap-2">
                          <span className="text-instructor-text-muted">Pontualidade:</span>
                          <StarRating rating={review.punctualityRating} size="sm" />
                        </div>
                      )}
                      {review.vehicleRating && (
                        <div className="flex items-center gap-2">
                          <span className="text-instructor-text-muted">Veículo:</span>
                          <StarRating rating={review.vehicleRating} size="sm" />
                        </div>
                      )}
                      {review.valueRating && (
                        <div className="flex items-center gap-2">
                          <span className="text-instructor-text-muted">Custo-benefício:</span>
                          <StarRating rating={review.valueRating} size="sm" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Positive Tags */}
                  {review.positiveTags && review.positiveTags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {review.positiveTags.map((tag, idx) => (
                        <Badge 
                          key={idx} 
                          className="bg-instructor-accent/20 text-instructor-accent hover:bg-instructor-accent/30 border-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
