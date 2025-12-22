import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Eye, FileText, User } from 'lucide-react';
import { SystemAdminHeader } from '@/components/system-admin/SystemAdminHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

interface InstructorProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  is_driving_school: boolean | null;
  cpf: string | null;
  cnpj: string | null;
  city: string | null;
  state: string | null;
  cnh_front_url: string | null;
  cnh_back_url: string | null;
  instructor_license_url: string | null;
  business_license_url: string | null;
  verification_status: string | null;
  created_at: string | null;
  profile?: {
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
}

export default function PendingInstructors() {
  const [instructors, setInstructors] = useState<InstructorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorProfile | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingInstructors();
  }, []);

  const fetchPendingInstructors = async () => {
    try {
      // Fetch all instructor profiles (RLS may limit what we see)
      const { data: instructorData, error: instructorError } = await supabase
        .from('instructor_profiles')
        .select('*')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (instructorError) throw instructorError;

      // Fetch profiles for each instructor
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
      console.error('Error fetching pending instructors:', error);
      toast.error('Erro ao carregar instrutores pendentes');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedInstructor || !actionType) return;

    setProcessing(true);
    try {
      const newStatus = actionType === 'approve' ? 'approved' : 'rejected';
      
      const { error } = await supabase
        .from('instructor_profiles')
        .update({ 
          verification_status: newStatus,
          is_active: actionType === 'approve',
        })
        .eq('id', selectedInstructor.id);

      if (error) throw error;

      toast.success(
        actionType === 'approve' 
          ? 'Instrutor aprovado com sucesso!' 
          : 'Instrutor rejeitado.'
      );

      // Refresh the list
      fetchPendingInstructors();
      setSelectedInstructor(null);
      setActionType(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error updating instructor:', error);
      toast.error('Erro ao atualizar status do instrutor');
    } finally {
      setProcessing(false);
    }
  };

  const openDialog = (instructor: InstructorProfile, type: 'approve' | 'reject') => {
    setSelectedInstructor(instructor);
    setActionType(type);
  };

  if (loading) {
    return (
      <div>
        <SystemAdminHeader 
          title="Cadastros Pendentes" 
          subtitle="Instrutores aguardando aprovação"
        />
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <SystemAdminHeader 
        title="Cadastros Pendentes" 
        subtitle={`${instructors.length} instrutor(es) aguardando aprovação`}
      />

      <div className="p-6 space-y-4">
        {instructors.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum cadastro pendente</h3>
              <p className="text-muted-foreground">
                Todos os instrutores foram revisados.
              </p>
            </CardContent>
          </Card>
        ) : (
          instructors.map((instructor) => (
            <Card key={instructor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <Avatar className="h-16 w-16 border-2 border-border">
                    <AvatarImage src={instructor.profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {instructor.profile?.full_name?.slice(0, 2).toUpperCase() || 'IN'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">
                        {instructor.profile?.full_name || 'Nome não informado'}
                      </h3>
                      <Badge variant="outline">
                        {instructor.is_driving_school ? 'Autoescola' : 'Instrutor'}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-2">
                      {instructor.profile?.email}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {instructor.business_name && (
                        <span>🏢 {instructor.business_name}</span>
                      )}
                      {instructor.city && instructor.state && (
                        <span>📍 {instructor.city}, {instructor.state}</span>
                      )}
                      {instructor.profile?.phone && (
                        <span>📞 {instructor.profile.phone}</span>
                      )}
                      {instructor.cpf && (
                        <span>📄 CPF: {instructor.cpf}</span>
                      )}
                    </div>

                    {/* Documents indicators */}
                    <div className="flex gap-2 mt-3">
                      {instructor.cnh_front_url && (
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="h-3 w-3" />
                          CNH Frente
                        </Badge>
                      )}
                      {instructor.cnh_back_url && (
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="h-3 w-3" />
                          CNH Verso
                        </Badge>
                      )}
                      {instructor.instructor_license_url && (
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="h-3 w-3" />
                          Credencial
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/system-admin/documentos/${instructor.id}`, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Documentos
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => openDialog(instructor, 'approve')}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openDialog(instructor, 'reject')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedInstructor && !!actionType} onOpenChange={() => {
        setSelectedInstructor(null);
        setActionType(null);
        setRejectionReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Aprovar Instrutor' : 'Rejeitar Instrutor'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? `Tem certeza que deseja aprovar ${selectedInstructor?.profile?.full_name}? O instrutor poderá começar a receber aulas.`
                : `Tem certeza que deseja rejeitar ${selectedInstructor?.profile?.full_name}?`
              }
            </DialogDescription>
          </DialogHeader>

          {actionType === 'reject' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo da rejeição (opcional)</label>
              <Textarea
                placeholder="Informe o motivo da rejeição..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedInstructor(null);
                setActionType(null);
                setRejectionReason('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {processing ? 'Processando...' : actionType === 'approve' ? 'Aprovar' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
