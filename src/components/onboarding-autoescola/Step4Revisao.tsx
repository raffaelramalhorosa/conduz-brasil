import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  FileText, 
  Users, 
  CheckCircle, 
  XCircle,
  MapPin,
  Phone,
  Mail,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useDrivingSchoolOnboarding } from '@/contexts/DrivingSchoolOnboardingContext';
import { useToast } from '@/hooks/use-toast';
import { DrivingSchoolOnboardingLayout } from './DrivingSchoolOnboardingLayout';

interface ChecklistItemProps {
  title: string;
  isComplete: boolean;
  items: string[];
}

function ChecklistItem({ title, isComplete, items }: ChecklistItemProps) {
  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        isComplete ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      }`}>
        {isComplete ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <XCircle className="w-5 h-5" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-medium">{title}</h4>
        <ul className="mt-1 text-sm text-muted-foreground">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Step4Revisao() {
  const { data, updateData, submitOnboarding, isSaving } = useDrivingSchoolOnboarding();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check completion status
  const isStep1Complete = !!(
    data.businessName &&
    data.razaoSocial &&
    data.cnpj &&
    data.phone &&
    data.zipcode &&
    data.street &&
    data.number &&
    data.neighborhood &&
    data.city &&
    data.state
  );

  const isStep2Complete = !!(
    data.licenseUrl &&
    data.vehiclePhotoUrl &&
    data.crlvUrl
  );

  const isStep3Complete = true; // Instructors are optional

  const allTermsAccepted = data.termsAccepted && data.privacyAccepted;
  const canSubmit = isStep1Complete && isStep2Complete && allTermsAccepted;

  const handleSubmit = async () => {
    console.log('[Step4Revisao] handleSubmit chamado', {
      canSubmit,
      isStep1Complete,
      isStep2Complete,
      termsAccepted: data.termsAccepted,
      privacyAccepted: data.privacyAccepted,
    });

    if (!canSubmit) {
      console.warn('[Step4Revisao] canSubmit=false, abortando');
      toast({
        title: 'Não é possível enviar',
        description: 'Preencha todos os dados e aceite os termos.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    console.log('[Step4Revisao] chamando submitOnboarding...');
    const success = await submitOnboarding();
    console.log('[Step4Revisao] submitOnboarding retornou:', success);
    setIsSubmitting(false);

    if (success) {
      navigate('/onboarding-autoescola/sucesso');
    } else {
      toast({
        title: 'Erro ao enviar cadastro',
        description: 'Não foi possível finalizar seu cadastro. Seus documentos estão salvos — volte ao primeiro passo e verifique os dados, ou tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    navigate('/onboarding-autoescola/documentacao');
  };

  return (
    <DrivingSchoolOnboardingLayout step={3}>
      <div className="space-y-6">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Revisão do Cadastro</CardTitle>
            <CardDescription>
              Confira se todas as informações estão corretas antes de enviar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Business Info Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">{data.businessName || 'Nome não informado'}</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Razão Social:</span>
                  <p>{data.razaoSocial || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CNPJ:</span>
                  <p>{data.cnpj || '-'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{data.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{data.email || '-'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span>
                  {data.street ? (
                    `${data.street}, ${data.number}${data.complement ? ` - ${data.complement}` : ''}, ${data.neighborhood}, ${data.city} - ${data.state}, ${data.zipcode}`
                  ) : (
                    'Endereço não informado'
                  )}
                </span>
              </div>
            </div>

            <Separator />

            {/* Checklist */}
            <div className="space-y-3">
              <h4 className="font-semibold">Status do cadastro</h4>

              <ChecklistItem
                title="Dados Básicos"
                isComplete={isStep1Complete}
                items={[
                  isStep1Complete 
                    ? 'Todas as informações preenchidas' 
                    : 'Faltam informações obrigatórias'
                ]}
              />

              <ChecklistItem
                title="Documentação"
                isComplete={isStep2Complete}
                items={[
                  data.licenseUrl ? '✓ Licença de Funcionamento' : '✗ Licença de Funcionamento',
                  data.vehiclePhotoUrl ? '✓ Foto do Veículo' : '✗ Foto do Veículo',
                  data.crlvUrl ? '✓ CRLV do Veículo' : '✗ CRLV do Veículo',
                ]}
              />

            </div>

            <Separator />

            {/* Terms */}
            <div className="space-y-4">
              <h4 className="font-semibold">Termos e Condições</h4>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={data.termsAccepted}
                    onCheckedChange={(checked) => updateData({ termsAccepted: !!checked })}
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    Li e aceito os <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Termos de Uso</a> da plataforma
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="privacy"
                    checked={data.privacyAccepted}
                    onCheckedChange={(checked) => updateData({ privacyAccepted: !!checked })}
                  />
                  <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                    Li e aceito a <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Política de Privacidade</a>
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="fee"
                    checked={true}
                    disabled
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <p className="font-medium mb-1">Importante</p>
                <p>
                  Após o envio, sua autoescola passará por uma análise de documentos que pode levar até 48 horas úteis.
                  Você receberá uma notificação por e-mail com o resultado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4">
        <div className="max-w-4xl mx-auto flex justify-between">
          <Button variant="outline" onClick={handleBack} size="lg">
            ← Voltar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit || isSubmitting || isSaving}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting || isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Enviar Cadastro
              </>
            )}
          </Button>
        </div>
      </div>
    </DrivingSchoolOnboardingLayout>
  );
}
