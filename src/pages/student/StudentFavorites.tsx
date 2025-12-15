import { useState, useEffect } from 'react';
import { Heart, Star, MapPin, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { FavoriteInstructor } from '@/types';

export default function StudentFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteInstructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('favorite_instructors')
        .eq('user_id', user.id)
        .single();

      if (!studentProfile?.favorite_instructors?.length) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('instructor_profiles')
        .select(`
          id,
          average_rating,
          total_reviews,
          city,
          neighborhood,
          profiles!inner (
            full_name,
            avatar_url
          ),
          vehicles (
            license_category
          ),
          pricing (
            single_class_price
          )
        `)
        .in('id', studentProfile.favorite_instructors);

      if (error) throw error;

      if (data) {
        const mappedFavorites: FavoriteInstructor[] = data.map((instructor: any) => {
          const categories = [...new Set(instructor.vehicles?.map((v: any) => v.license_category) || [])];
          const prices = instructor.pricing?.map((p: any) => p.single_class_price) || [];
          const minPrice = prices.length > 0 ? Math.min(...prices) : 100;

          return {
            id: instructor.id,
            name: instructor.profiles?.full_name || 'Instrutor',
            photo: instructor.profiles?.avatar_url || '',
            rating: instructor.average_rating || 0,
            reviews: instructor.total_reviews || 0,
            categories: categories as string[],
            pricePerLesson: minPrice,
            location: instructor.neighborhood 
              ? `${instructor.neighborhood}, ${instructor.city}` 
              : instructor.city || 'São Paulo',
          };
        });

        setFavorites(mappedFavorites);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    if (!user) return;

    try {
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('favorite_instructors')
        .eq('user_id', user.id)
        .single();

      const currentFavorites = studentProfile?.favorite_instructors || [];
      const updatedFavorites = currentFavorites.filter((fav: string) => fav !== id);

      await supabase
        .from('student_profiles')
        .update({ favorite_instructors: updatedFavorites })
        .eq('user_id', user.id);

      setFavorites((prev) => prev.filter((f) => f.id !== id));
      toast.success('Instrutor removido dos favoritos');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Erro ao remover favorito');
    }
  };

  if (loading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Favoritos</h1>
        <p className="text-muted-foreground mt-1">
          Instrutores que você salvou para agendar depois
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-lg">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium text-foreground">Nenhum favorito ainda</h3>
          <p className="text-muted-foreground mt-2 mb-6">
            Explore instrutores e adicione aos favoritos para acessá-los facilmente
          </p>
          <Button asChild>
            <Link to="/instrutores">Buscar Instrutores</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((instructor) => (
            <Card key={instructor.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                      <AvatarImage src={instructor.photo} alt={instructor.name} />
                      <AvatarFallback>{instructor.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{instructor.name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{instructor.rating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({instructor.reviews})
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleRemoveFavorite(instructor.id)}
                  >
                    <Heart className="h-5 w-5 fill-current" />
                  </Button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    {instructor.location}
                  </div>
                  <div className="flex items-center gap-2">
                    {instructor.categories.map((cat) => (
                      <Badge key={cat} variant="outline">
                        Cat. {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">A partir de</p>
                    <p className="text-xl font-bold text-primary">
                      R$ {instructor.pricePerLesson}
                      <span className="text-sm font-normal text-muted-foreground">/aula</span>
                    </p>
                  </div>
                  <Button asChild className="gap-2">
                    <Link to={`/instrutores/${instructor.id}`}>
                      <Calendar className="h-4 w-4" />
                      Agendar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
