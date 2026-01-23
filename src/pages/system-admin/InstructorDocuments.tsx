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
  razao_social: string | null;
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
  // Instructor documents
  cnh_front_url: string | null;
  cnh_back_url: string | null;
  instructor_license_url: string | null;
  business_license_url: string | null;
  // Driving school documents
  license_url: string | null;
  vehicle_photo_url: string | null;
  crlv_url: string | null;
  verification_status: string | null;
  created_at: string | null;
  profile?: {
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
}

// Helper function to check if URL is a PDF
const isPdfUrl = (url: string | null): boolean => {
  if (!url) return false;
  const lowercaseUrl = url.toLowerCase();
  return lowercaseUrl.endsWith('.pdf') || lowercaseUrl.includes('.pdf?');
};

// Helper function to check if URL is an image
const isImageUrl = (url: string | null): boolean => {
  if (!url) return false;
  const lowercaseUrl = url.toLowerCase();
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  return imageExtensions.some(ext => lowercaseUrl.includes(ext));
};

export default function InstructorDocuments() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [instructor, setInstructor] = useState<InstructorWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | null>(null);

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
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejeitado</Badge>;
      default:
        return <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30">Pendente</Badge>;
    }
  };

  const openPreview = (url: string) => {
    if (isPdfUrl(url)) {
      setPreviewType('pdf');
    } else {
      setPreviewType('image');
    }
    setPreviewUrl(url);
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewType(null);
  };

  const DocumentCard = ({ 
    title, 
    url, 
    description 
  }: { 
    title: string; 
    url: string | null; 
    description: string;
  }) => {
    const isPdf = isPdfUrl(url);
    const isImage = isImageUrl(url);
    
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-white">
            <FileText className="h-4 w-4 text-yellow-400" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {url ? (
            <div className="space-y-3">
              <div 
                className="aspect-[3/2] bg-zinc-800 rounded-lg overflow-hidden cursor-pointer border border-zinc-700"
                onClick={() => openPreview(url)}
              >
                {isPdf ? (
                  // PDF Preview using iframe
                  <iframe
                    src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-full"
                    title={title}
                  />
                ) : isImage ? (
                  // Image Preview
                  <img 
                    src={url} 
                    alt={title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                    onError={(e) => {
                      // Fallback for failed image load - might be PDF
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `
                        <div class="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-zinc-400">
                          <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                          <span class="text-sm">Clique para visualizar</span>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  // Unknown file type - try iframe first (for PDFs without extension)
                  <iframe
                    src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-full"
                    title={title}
                  />
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10"
                  onClick={() => openPreview(url)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Visualizar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  onClick={() => window.open(url, '_blank')}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            // Empty state placeholder
            <div className="aspect-[3/2] bg-zinc-800 rounded-lg flex flex-col items-center justify-center border border-zinc-700">
              <FileText className="h-10 w-10 text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-500">{description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <SystemAdminHeader title="Carregando..." />
        <div className="p-6">
          <Skeleton className="h-64 w-full bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <SystemAdminHeader title="Instrutor não encontrado" />
        <div className="p-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
              <h3 className="text-lg font-medium text-white">Instrutor não encontrado</h3>
              <Button 
                className="mt-4 bg-yellow-400 text-zinc-900 hover:bg-yellow-500" 
                onClick={() => navigate('/system-admin/pendentes')}
              >
                Voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Format CNPJ with mask
  const formatCnpj = (cnpj: string | null) => {
    if (!cnpj) return '-';
    const numbers = cnpj.replace(/\D/g, '');
    if (numbers.length !== 14) return cnpj;
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const isDrivingSchool = instructor.is_driving_school === true;

  return (
    <div className="min-h-screen bg-zinc-950">
      <SystemAdminHeader 
        title={isDrivingSchool ? "Documentos da Autoescola" : "Documentos do Instrutor"}
        subtitle="Revise os documentos enviados"
      />

      <div className="p-6 space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        {/* User Info - Conditional rendering based on type */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-2 border-yellow-400">
                <AvatarImage src={instructor.profile?.avatar_url || ''} />
                <AvatarFallback className="bg-yellow-400/20 text-yellow-400 text-xl font-bold">
                  {isDrivingSchool 
                    ? (instructor.business_name?.slice(0, 2).toUpperCase() || 'AE')
                    : (instructor.profile?.full_name?.slice(0, 2).toUpperCase() || 'IN')
                  }
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-white">
                    {isDrivingSchool
                      ? (instructor.business_name || instructor.razao_social || 'Autoescola não informada')
                      : (instructor.profile?.full_name || 'Nome não informado')
                    }
                  </h2>
                  {getStatusBadge(instructor.verification_status)}
                  <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700">
                    {isDrivingSchool ? 'Autoescola' : 'Instrutor Autônomo'}
                  </Badge>
                </div>

                {/* Conditional fields based on user type */}
                {isDrivingSchool ? (
                  // Driving School fields
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500">CNPJ:</span>
                      <p className="font-medium text-yellow-400 text-base">{formatCnpj(instructor.cnpj)}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Email:</span>
                      <p className="font-medium text-white">{instructor.profile?.email || '-'}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Telefone/WhatsApp:</span>
                      <p className="font-medium text-white">{instructor.profile?.phone || '-'}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Razão Social:</span>
                      <p className="font-medium text-white">{instructor.razao_social || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-500">Endereço:</span>
                      <p className="font-medium text-white">
                        {instructor.street ? (
                          `${instructor.street}, ${instructor.number} - ${instructor.neighborhood}, ${instructor.city}/${instructor.state}`
                        ) : '-'}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Instructor fields
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500">Email:</span>
                      <p className="font-medium text-white">{instructor.profile?.email || '-'}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Telefone:</span>
                      <p className="font-medium text-white">{instructor.profile?.phone || '-'}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">CPF:</span>
                      <p className="font-medium text-white">{instructor.cpf || '-'}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">CNH:</span>
                      <p className="font-medium text-white">{instructor.cnh_number || '-'}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Credencial:</span>
                      <p className="font-medium text-white">{instructor.instructor_license || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-500">Endereço:</span>
                      <p className="font-medium text-white">
                        {instructor.street ? (
                          `${instructor.street}, ${instructor.number} - ${instructor.neighborhood}, ${instructor.city}/${instructor.state}`
                        ) : '-'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {instructor.verification_status === 'pending' && (
                <div className="flex flex-col gap-2">
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setActionType('approve')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
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

        {/* Documents - Conditional rendering based on user type */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Documentos Enviados</h3>
          
          {isDrivingSchool ? (
            // Driving School Documents (3 cards)
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <DocumentCard 
                title="Licença de Funcionamento" 
                url={instructor.license_url} 
                description="Aguardando envio"
              />
              <DocumentCard 
                title="Foto do Veículo" 
                url={instructor.vehicle_photo_url} 
                description="Aguardando envio"
              />
              <DocumentCard 
                title="CRLV (Documento do Veículo)" 
                url={instructor.crlv_url} 
                description="Aguardando envio"
              />
            </div>
          ) : (
            // Instructor Documents (3-4 cards)
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <DocumentCard 
                title="CNH - Frente" 
                url={instructor.cnh_front_url} 
                description="Aguardando envio"
              />
              <DocumentCard 
                title="CNH - Verso" 
                url={instructor.cnh_back_url} 
                description="Aguardando envio"
              />
              <DocumentCard 
                title="Credencial de Instrutor" 
                url={instructor.instructor_license_url} 
                description="Aguardando envio"
              />
            </div>
          )}
        </div>
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={closePreview}>
        <DialogContent className="max-w-5xl max-h-[90vh] bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Visualização do Documento</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex justify-center overflow-auto">
              {previewType === 'pdf' || !isImageUrl(previewUrl) ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] rounded-lg border border-zinc-700"
                  title="Documento PDF"
                />
              ) : (
                <img 
                  src={previewUrl} 
                  alt="Documento" 
                  className="max-h-[70vh] object-contain rounded-lg"
                />
              )}
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10"
              onClick={() => window.open(previewUrl!, '_blank')}
            >
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
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionType === 'approve' ? 'Aprovar Instrutor' : 'Rejeitar Instrutor'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {actionType === 'approve' 
                ? `Tem certeza que deseja aprovar ${instructor.profile?.full_name}?`
                : `Tem certeza que deseja rejeitar ${instructor.profile?.full_name}?`
              }
            </DialogDescription>
          </DialogHeader>

          {actionType === 'reject' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Motivo da rejeição (opcional)</label>
              <Textarea
                placeholder="Informe o motivo da rejeição..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
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
              className={actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {processing ? 'Processando...' : actionType === 'approve' ? 'Aprovar' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
