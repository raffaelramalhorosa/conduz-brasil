import { useEffect, useState } from 'react';
import { FileText, Eye, Search } from 'lucide-react';
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

interface InstructorWithDocs {
  id: string;
  user_id: string;
  business_name: string | null;
  is_driving_school: boolean | null;
  verification_status: string | null;
  cnh_front_url: string | null;
  cnh_back_url: string | null;
  instructor_license_url: string | null;
  business_license_url: string | null;
  created_at: string | null;
  profile?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export default function DocumentsList() {
  const [instructors, setInstructors] = useState<InstructorWithDocs[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      const { data: instructorData, error } = await supabase
        .from('instructor_profiles')
        .select('id, user_id, business_name, is_driving_school, verification_status, cnh_front_url, cnh_back_url, instructor_license_url, business_license_url, created_at')
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
      console.error('Error fetching instructors:', error);
      toast.error('Erro ao carregar lista de documentos');
    } finally {
      setLoading(false);
    }
  };

  const getDocCount = (instructor: InstructorWithDocs) => {
    let count = 0;
    if (instructor.cnh_front_url) count++;
    if (instructor.cnh_back_url) count++;
    if (instructor.instructor_license_url) count++;
    if (instructor.business_license_url) count++;
    return count;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejeitado</Badge>;
      default:
        return <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30">Pendente</Badge>;
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
      <div className="min-h-screen bg-zinc-950">
        <SystemAdminHeader title="Documentos" subtitle="Visualizar documentos enviados" />
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <SystemAdminHeader 
        title="Documentos" 
        subtitle="Visualizar documentos enviados pelos instrutores"
      />

      <div className="p-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Buscar por nome, email ou empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-yellow-400"
          />
        </div>

        {/* List */}
        {filteredInstructors.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
              <h3 className="text-lg font-medium text-white">Nenhum documento encontrado</h3>
              <p className="text-zinc-400">
                {search ? 'Tente uma busca diferente.' : 'Nenhum instrutor cadastrado ainda.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredInstructors.map((instructor) => (
              <Card key={instructor.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-yellow-400">
                      <AvatarImage src={instructor.profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-yellow-400/20 text-yellow-400 font-bold">
                        {instructor.profile?.full_name?.slice(0, 2).toUpperCase() || 'IN'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white truncate">
                          {instructor.profile?.full_name || 'Nome não informado'}
                        </h3>
                        {getStatusBadge(instructor.verification_status)}
                      </div>
                      <p className="text-sm text-zinc-400 truncate">
                        {instructor.profile?.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{getDocCount(instructor)}</p>
                        <p className="text-xs text-zinc-500">documentos</p>
                      </div>

                      <Button asChild size="sm" className="bg-yellow-400 text-zinc-900 hover:bg-yellow-500">
                        <Link to={`/system-admin/documentos/${instructor.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Docs
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
    </div>
  );
}
