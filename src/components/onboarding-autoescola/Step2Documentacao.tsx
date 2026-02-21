import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Image as ImageIcon, CheckCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDrivingSchoolOnboarding } from '@/contexts/DrivingSchoolOnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DrivingSchoolOnboardingLayout } from './DrivingSchoolOnboardingLayout';

interface DocumentCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  url: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
  acceptedFormats: string;
  isUploading: boolean;
}

function DocumentCard({
  title,
  description,
  icon,
  url,
  onUpload,
  onRemove,
  acceptedFormats,
  isUploading,
}: DocumentCardProps) {
  const inputId = `file-${title.replace(/\s/g, '-')}`;

  return (
    <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>

          {url ? (
            <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-700 dark:text-green-400 truncate">
                  Documento enviado
                </span>
              </div>
              <button
                onClick={onRemove}
                className="p-1 hover:bg-red-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ) : (
            <label
              htmlFor={inputId}
              className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg cursor-pointer transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {isUploading ? 'Enviando...' : 'Escolher arquivo'}
              </span>
              <input
                id={inputId}
                type="file"
                accept={acceptedFormats}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(file);
                  e.target.value = '';
                }}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Step2Documentacao() {
  const { data, updateData, saveProgress, isSaving, instructorProfileId } = useDrivingSchoolOnboarding();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [uploading, setUploading] = useState<Record<string, boolean>>({
    license: false,
    vehicle: false,
    crlv: false,
  });

  const uploadDocument = async (file: File, docType: 'license' | 'vehicle' | 'crlv'): Promise<string | null> => {
    if (!user) return null;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: 'Arquivo muito grande',
        description: 'Tamanho máximo: 10MB',
        variant: 'destructive',
      });
      return null;
    }

    const validTypes = {
      license: ['application/pdf', 'image/jpeg', 'image/png'],
      vehicle: ['image/jpeg', 'image/png'],
      crlv: ['application/pdf', 'image/jpeg', 'image/png'],
    };

    if (!validTypes[docType].includes(file.type)) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Verifique os formatos permitidos',
        variant: 'destructive',
      });
      return null;
    }

    setUploading(prev => ({ ...prev, [docType]: true }));

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${docType}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      toast({
        title: 'Documento enviado!',
        description: file.name,
      });

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Erro ao enviar documento',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(prev => ({ ...prev, [docType]: false }));
    }
  };

  const handleUpload = async (file: File, docType: 'license' | 'vehicle' | 'crlv') => {
    const url = await uploadDocument(file, docType);
    if (url) {
      const fieldMap = {
        license: 'licenseUrl',
        vehicle: 'vehiclePhotoUrl',
        crlv: 'crlvUrl',
      };
      updateData({ [fieldMap[docType]]: url });
    }
  };

  const validate = (): boolean => {
    if (!data.licenseUrl || !data.vehiclePhotoUrl || !data.crlvUrl) {
      toast({
        title: 'Documentos incompletos',
        description: 'Envie todos os documentos obrigatórios',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validate()) return;

    navigate('/onboarding-autoescola/revisao');
  };

  const handleBack = () => {
    navigate('/onboarding-autoescola/dados-basicos');
  };

  return (
    <DrivingSchoolOnboardingLayout step={2}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Documentação</CardTitle>
          <CardDescription>
            Envie os documentos necessários para aprovação da sua autoescola
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DocumentCard
            title="Licença de Funcionamento DETRAN"
            description="Documento que autoriza o funcionamento da autoescola (PDF ou imagem)"
            icon={<FileText className="w-6 h-6 text-primary" />}
            url={data.licenseUrl}
            onUpload={(file) => handleUpload(file, 'license')}
            onRemove={() => updateData({ licenseUrl: '' })}
            acceptedFormats=".pdf,.png,.jpg,.jpeg"
            isUploading={uploading.license}
          />

          <DocumentCard
            title="Foto do Veículo de Aula"
            description="Foto do veículo utilizado nas aulas práticas (JPG ou PNG)"
            icon={<ImageIcon className="w-6 h-6 text-primary" />}
            url={data.vehiclePhotoUrl}
            onUpload={(file) => handleUpload(file, 'vehicle')}
            onRemove={() => updateData({ vehiclePhotoUrl: '' })}
            acceptedFormats=".png,.jpg,.jpeg"
            isUploading={uploading.vehicle}
          />

          <DocumentCard
            title="CRLV do Veículo"
            description="Certificado de Registro e Licenciamento do Veículo (PDF ou imagem)"
            icon={<FileText className="w-6 h-6 text-primary" />}
            url={data.crlvUrl}
            onUpload={(file) => handleUpload(file, 'crlv')}
            onRemove={() => updateData({ crlvUrl: '' })}
            acceptedFormats=".pdf,.png,.jpg,.jpeg"
            isUploading={uploading.crlv}
          />

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-6">
            <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">
              📋 Dicas para aprovação rápida
            </h4>
            <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
              <li>• Envie documentos legíveis e atualizados</li>
              <li>• Fotos devem estar nítidas e sem cortes</li>
              <li>• PDFs devem estar completos, sem páginas faltando</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4">
        <div className="max-w-4xl mx-auto flex justify-between">
          <Button variant="outline" onClick={handleBack} size="lg">
            ← Voltar
          </Button>
          <Button onClick={handleNext} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Próxima Etapa →'
            )}
          </Button>
        </div>
      </div>
    </DrivingSchoolOnboardingLayout>
  );
}
