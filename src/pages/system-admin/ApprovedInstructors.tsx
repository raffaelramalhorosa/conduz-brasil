import { useEffect, useState } from 'react';
import { CheckCircle, Eye, Search, User } from 'lucide-react';
import { SystemAdminHeader } from '@/components/system-admin/SystemAdminHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface InstructorProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  is_driving_school: boolean | null;
  city: string | null;
  state: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  created_at: string | null;
  profile?: {
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
}

export default function ApprovedInstructors() {
  const [instructors, setInstructors] = useState<InstructorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchApprovedInstructors();
  }, []);

  const fetchApprovedInstructors = async () => {
    try {
      const { data: instructorData, error } = await supabase
        .from('instructor_profiles')
        .select('id, user_id, business_name, is_driving_school, city, state, average_rating, total_reviews, created_at')
        .eq('verification_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedData = await Promise.all(
        (instructorData || []).map(async (instructor) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email, phone, avatar_url')
            .eq('id', instructor.user_id)
            .single();

          return {
            ...instructor,
            profile: profileData || undefined,
          };
        })
      );

      setInstructors(enrichedData);
    } catch (error) {
      console.error('Error fetching approved instructors:', error);
      toast.error('Erro ao carregar instrutores aprovados');
    } finally {
      setLoading(false);
    }
  };

  const filteredInstructors = instructors.filter((instructor) => {
    const searchLower = search.toLowerCase();
    return (
      instructor.profile?.full_name?.toLowerCase().includes(searchLower) ||
      instructor.profile?.email?.toLowerCase().includes(searchLower) ||
      instructor.business_name?.toLowerCase().includes(searchLower) ||
      instructor.city?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div>
        <SystemAdminHeader title="Instrutores Aprovados" />
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <SystemAdminHeader 
        title="Instrutores Aprovados" 
        subtitle={`${instructors.length} instrutor(es) ativos na plataforma`}
      />

      <div className="p-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, empresa ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* List */}
        {filteredInstructors.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum instrutor encontrado</h3>
              <p className="text-muted-foreground">
                {search ? 'Tente uma busca diferente.' : 'Nenhum instrutor aprovado ainda.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredInstructors.map((instructor) => (
              <Card key={instructor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-green-500">
                      <AvatarImage src={instructor.profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-green-500/10 text-green-600">
                        {instructor.profile?.full_name?.slice(0, 2).toUpperCase() || 'IN'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">
                          {instructor.profile?.full_name || 'Nome não informado'}
                        </h3>
                        <Badge className="bg-green-500 text-white gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Aprovado
                        </Badge>
                        <Badge variant="outline">
                          {instructor.is_driving_school ? 'Autoescola' : 'Instrutor'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span>{instructor.profile?.email}</span>
                        {instructor.city && instructor.state && (
                          <span>📍 {instructor.city}, {instructor.state}</span>
                        )}
                        {instructor.average_rating && instructor.average_rating > 0 && (
                          <span>⭐ {instructor.average_rating.toFixed(1)} ({instructor.total_reviews} avaliações)</span>
                        )}
                      </div>
                    </div>

                    <Button asChild size="sm" variant="outline">
                      <Link to={`/system-admin/documentos/${instructor.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
