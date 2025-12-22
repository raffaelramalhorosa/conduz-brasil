import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, ExternalLink, CheckCircle, XCircle, User, Download } from 'lucide-react';
import { SystemAdminHeader } from '@/components/system-admin/SystemAdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
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

interface InstructorWithProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  is_driving_school: boolean | null;
  cpf: string | null;
  cnpj: string | null;
  cnh_number: string | null;
  instructor_license: string | null;
  city: string | null;
  state: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  zipcode: string | null;
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

export default function InstructorDocuments() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [instructor, setInstructor] = useState<InstructorWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchInstructor(id);
    }
  }, [id]);

  const fetchInstructor = async (instructorId: string) => {
    try {
      const { data: instructorData, error: instructorError } = await supabase
        .from('instructor_profiles')
        .select('*')
        .eq('id', instructorId)
        .single();

      if (instructorError) throw instructorError;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, phone, avatar_url')
        .eq('id', instructorData.user_id)
        .single();

      setInstructor({
        ...instructorData,
        profile: profileData || undefined,
      });
    } catch (error) {
      console.error('Error fetching instructor:', error);
      toast.error('Erro ao carregar dados do instrutor');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!instructor || !actionType) return;

    setProcessing(true);
    try {
      const newStatus = actionType === 'approve' ? 'approved' : 'rejected';
      
      const { error } = await supabase
        .from('instructor_profiles')
        .update({ 
          verification_status: newStatus,
          is_active: actionType === 'approve',
        })
        .eq('id', instructor.id);

      if (error) throw error;

      toast.success(
        actionType === 'approve' 
          ? 'Instrutor aprovado com sucesso!' 
          : 'Instrutor rejeitado.'
      );

      navigate('/system-admin/pendentes');
    } catch (error) {
      console.error('Error updating instructor:', error);
      toast.error('Erro ao atualizar status do instrutor');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 text-white">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const DocumentCard = ({ 
    title, 
    url, 
    description 
  }: { 
    title: string; 
    url: string | null; 
    description: string;
  }) => (
    <Card className={url ? 'hover:shadow-md transition-shadow cursor-pointer' : 'opacity-50'}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {url ? (
          <div className="space-y-3">
            <div 
              className="aspect-[3/2] bg-muted rounded-lg overflow-hidden cursor-pointer"
              onClick={() => setPreviewImage(url)}
            >
              <img 
                src={url} 
                alt={title}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => setPreviewImage(url)}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Visualizar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open(url, '_blank')}
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="aspect-[3/2] bg-muted rounded-lg flex items-center justify-center">
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div>
        <SystemAdminHeader title="Carregando..." />
        <div className="p-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div>
        <SystemAdminHeader title="Instrutor não encontrado" />
        <div className="p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Instrutor não encontrado</h3>
              <Button className="mt-4" onClick={() => navigate('/system-admin/pendentes')}>
                Voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SystemAdminHeader 
        title="Documentos do Instrutor" 
        subtitle="Revise os documentos enviados"
      />

      <div className="p-6 space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        {/* Instructor Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={instructor.profile?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {instructor.profile?.full_name?.slice(0, 2).toUpperCase() || 'IN'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold">
                    {instructor.profile?.full_name || 'Nome não informado'}
                  </h2>
                  {getStatusBadge(instructor.verification_status)}
                  <Badge variant="outline">
                    {instructor.is_driving_school ? 'Autoescola' : 'Instrutor'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{instructor.profile?.email || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Telefone:</span>
                    <p className="font-medium">{instructor.profile?.phone || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CPF:</span>
                    <p className="font-medium">{instructor.cpf || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CNH:</span>
                    <p className="font-medium">{instructor.cnh_number || '-'}</p>
                  </div>
                  {instructor.is_driving_school && (
                    <div>
                      <span className="text-muted-foreground">CNPJ:</span>
                      <p className="font-medium">{instructor.cnpj || '-'}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Credencial:</span>
                    <p className="font-medium">{instructor.instructor_license || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Endereço:</span>
                    <p className="font-medium">
                      {instructor.street ? (
                        `${instructor.street}, ${instructor.number} - ${instructor.neighborhood}, ${instructor.city}/${instructor.state}`
                      ) : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {instructor.verification_status === 'pending' && (
                <div className="flex flex-col gap-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setActionType('approve')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setActionType('reject')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Documentos Enviados</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DocumentCard 
              title="CNH - Frente" 
              url={instructor.cnh_front_url} 
              description="Não enviado"
            />
            <DocumentCard 
              title="CNH - Verso" 
              url={instructor.cnh_back_url} 
              description="Não enviado"
            />
            <DocumentCard 
              title="Credencial de Instrutor" 
              url={instructor.instructor_license_url} 
              description="Não enviado"
            />
            {instructor.is_driving_school && (
              <DocumentCard 
                title="Alvará / Licença" 
                url={instructor.business_license_url} 
                description="Não enviado"
              />
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Visualização do Documento</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="flex justify-center">
              <img 
                src={previewImage} 
                alt="Documento" 
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => window.open(previewImage!, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir em nova aba
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={!!actionType} onOpenChange={() => {
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
                ? `Tem certeza que deseja aprovar ${instructor.profile?.full_name}?`
                : `Tem certeza que deseja rejeitar ${instructor.profile?.full_name}?`
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
