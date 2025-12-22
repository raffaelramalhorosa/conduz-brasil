import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Documentacao = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, updateData, saveProgress, isSaving } = useOnboarding();
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const uploadFile = async (file: File, fieldName: string) => {
    if (!user) return null;

    setUploading(prev => ({ ...prev, [fieldName]: true }));

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${fieldName}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('instructor-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('instructor-documents')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro ao fazer upload',
        description: 'Tente novamente',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: keyof typeof data
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file, fieldName);
    if (url) {
      updateData({ [fieldName]: url });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.cnh_number?.trim()) {
      newErrors.cnh_number = 'Número da CNH é obrigatório';
    }

    if (!data.cnh_front_url) {
      newErrors.cnh_front_url = 'CNH (frente) é obrigatória';
    }

    if (!data.cnh_back_url) {
      newErrors.cnh_back_url = 'CNH (verso) é obrigatória';
    }

    if (!data.instructor_license?.trim()) {
      newErrors.instructor_license = 'Número do credenciamento é obrigatório';
    }

    if (!data.instructor_license_url) {
      newErrors.instructor_license_url = 'Documento de credenciamento é obrigatório';
    }

    if (data.is_driving_school && !data.business_license_url) {
      newErrors.business_license_url = 'Alvará de funcionamento é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) {
      toast({
        title: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    await saveProgress();
    navigate('/onboarding-instrutor/informacoes-profissionais');
  };

  const FileUploadBox = ({
    label,
    fieldName,
    accept = 'image/*,.pdf',
    currentUrl,
  }: {
    label: string;
    fieldName: keyof typeof data;
    accept?: string;
    currentUrl: string | null;
  }) => (
    <div>
      <Label className="mb-2 block">{label} *</Label>
      <label
        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition ${
          errors[fieldName]
            ? 'border-destructive bg-destructive/5'
            : currentUrl
            ? 'border-green-500 bg-green-50'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }`}
      >
        <div className="flex flex-col items-center justify-center py-4">
          {uploading[fieldName] ? (
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          ) : currentUrl ? (
            <>
              <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
              <p className="text-sm text-green-600 font-medium">Arquivo enviado</p>
              <p className="text-xs text-muted-foreground mt-1">Clique para substituir</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Clique para enviar</p>
              <p className="text-xs text-muted-foreground">PDF ou imagem</p>
            </>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept={accept}
          onChange={(e) => handleFileChange(e, fieldName)}
          disabled={uploading[fieldName]}
        />
      </label>
      {errors[fieldName] && (
        <p className="text-sm text-destructive mt-1">{errors[fieldName]}</p>
      )}
    </div>
  );

  return (
    <OnboardingLayout step={2}>
      <div className="bg-card rounded-xl border p-6 md:p-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Documentação</h2>
        <p className="text-muted-foreground mb-8">
          Envie os documentos necessários para verificação
        </p>

        {/* Aviso */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8 flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Documentos necessários</p>
            <p className="text-sm text-muted-foreground mt-1">
              Seus documentos serão verificados em até 48h úteis. Você receberá uma
              notificação por email quando a análise for concluída.
            </p>
          </div>
        </div>

        {/* CNH */}
        <div className="space-y-4 mb-8">
          <h3 className="font-medium text-foreground">CNH - Carteira Nacional de Habilitação</h3>

          <div>
            <Label htmlFor="cnh_number">Número do Registro *</Label>
            <Input
              id="cnh_number"
              value={data.cnh_number}
              onChange={(e) => updateData({ cnh_number: e.target.value })}
              placeholder="00000000000"
              className={errors.cnh_number ? 'border-destructive' : ''}
            />
            {errors.cnh_number && (
              <p className="text-sm text-destructive mt-1">{errors.cnh_number}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileUploadBox
              label="CNH (Frente)"
              fieldName="cnh_front_url"
              currentUrl={data.cnh_front_url}
            />
            <FileUploadBox
              label="CNH (Verso)"
              fieldName="cnh_back_url"
              currentUrl={data.cnh_back_url}
            />
          </div>
        </div>

        {/* Credenciamento */}
        <div className="space-y-4 mb-8">
          <h3 className="font-medium text-foreground">Credenciamento como Instrutor</h3>

          <div>
            <Label htmlFor="instructor_license">Número do Credenciamento (Detran) *</Label>
            <Input
              id="instructor_license"
              value={data.instructor_license}
              onChange={(e) => updateData({ instructor_license: e.target.value })}
              placeholder="000000"
              className={errors.instructor_license ? 'border-destructive' : ''}
            />
            {errors.instructor_license && (
              <p className="text-sm text-destructive mt-1">{errors.instructor_license}</p>
            )}
          </div>

          <FileUploadBox
            label="Certidão de Credenciamento"
            fieldName="instructor_license_url"
            currentUrl={data.instructor_license_url}
          />
        </div>

        {/* Alvará (apenas autoescolas) */}
        {data.is_driving_school && (
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Documentos da Empresa</h3>
            <FileUploadBox
              label="Alvará de Funcionamento"
              fieldName="business_license_url"
              currentUrl={data.business_license_url}
            />
          </div>
        )}

        {/* Dicas */}
        <div className="bg-muted/50 rounded-lg p-4 mt-8">
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-primary" />
            Dicas para aprovação rápida
          </h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Envie fotos nítidas e bem iluminadas</li>
            <li>• Certifique-se de que todos os dados estão legíveis</li>
            <li>• A CNH deve estar dentro da validade</li>
            <li>• Use arquivos PDF ou imagens em alta resolução</li>
          </ul>
        </div>
      </div>

      {/* Ações */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/onboarding-instrutor/dados-basicos')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Button onClick={handleNext} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Continuar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default Documentacao;
