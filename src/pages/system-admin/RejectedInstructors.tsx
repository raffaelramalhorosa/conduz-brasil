import { useEffect, useState } from 'react';
import { XCircle, Eye, Search, User, RefreshCw } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface InstructorProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  is_driving_school: boolean | null;
  city: string | null;
  state: string | null;
  created_at: string | null;
  profile?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export default function RejectedInstructors() {
  const [instructors, setInstructors] = useState<InstructorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorProfile | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRejectedInstructors();
  }, []);

  const fetchRejectedInstructors = async () => {
    try {
      const { data: instructorData, error } = await supabase
        .from('instructor_profiles')
        .select('id, user_id, business_name, is_driving_school, city, state, created_at')
        .eq('verification_status', 'rejected')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedData = await Promise.all(
        (instructorData || []).map(async (instructor) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url')
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
      console.error('Error fetching rejected instructors:', error);
      toast.error('Erro ao carregar instrutores rejeitados');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!selectedInstructor) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('instructor_profiles')
        .update({ 
          verification_status: 'pending',
          is_active: false,
        })
        .eq('id', selectedInstructor.id);

      if (error) throw error;

      toast.success('Instrutor movido para pendentes!');
      fetchRejectedInstructors();
      setSelectedInstructor(null);
    } catch (error) {
      console.error('Error reactivating instructor:', error);
      toast.error('Erro ao reativar instrutor');
    } finally {
      setProcessing(false);
    }
  };

  const filteredInstructors = instructors.filter((instructor) => {
    const searchLower = search.toLowerCase();
    return (
      instructor.profile?.full_name?.toLowerCase().includes(searchLower) ||
      instructor.profile?.email?.toLowerCase().includes(searchLower) ||
      instructor.business_name?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div>
        <SystemAdminHeader title="Instrutores Rejeitados" />
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
        title="Instrutores Rejeitados" 
        subtitle={`${instructors.length} instrutor(es) rejeitados`}
      />

      <div className="p-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou empresa..."
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
              <h3 className="text-lg font-medium">Nenhum instrutor rejeitado</h3>
              <p className="text-muted-foreground">
                {search ? 'Tente uma busca diferente.' : 'Nenhum instrutor foi rejeitado.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredInstructors.map((instructor) => (
              <Card key={instructor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-destructive">
                      <AvatarImage src={instructor.profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-destructive/10 text-destructive">
                        {instructor.profile?.full_name?.slice(0, 2).toUpperCase() || 'IN'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">
                          {instructor.profile?.full_name || 'Nome não informado'}
                        </h3>
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Rejeitado
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span>{instructor.profile?.email}</span>
                        {instructor.city && instructor.state && (
                          <span>📍 {instructor.city}, {instructor.state}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedInstructor(instructor)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Reavaliar
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/system-admin/documentos/${instructor.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reactivate Dialog */}
      <Dialog open={!!selectedInstructor} onOpenChange={() => setSelectedInstructor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reavaliar Instrutor</DialogTitle>
            <DialogDescription>
              Deseja mover {selectedInstructor?.profile?.full_name} de volta para a lista de pendentes para reavaliação?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInstructor(null)}>
              Cancelar
            </Button>
            <Button onClick={handleReactivate} disabled={processing}>
              {processing ? 'Processando...' : 'Mover para Pendentes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
