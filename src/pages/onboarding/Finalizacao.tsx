import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  User,
  FileText,
  Briefcase,
  AlertCircle,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const Finalizacao = () => {
  const navigate = useNavigate();
  const { data, submitOnboarding, isLoading } = useOnboarding();
  const { toast } = useToast();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedFee, setAcceptedFee] = useState(false);

  const checklistItems = [
    {
      icon: User,
      title: 'Dados Básicos',
      description: data.is_driving_school
        ? `${data.business_name} - CNPJ: ${data.cnpj}`
        : `CPF: ${data.cpf}`,
      complete: !!(data.cpf || data.cnpj) && !!data.street,
      path: '/onboarding-instrutor/dados-basicos',
    },
    {
      icon: FileText,
      title: 'Documentação',
      description: `CNH e Credenciamento ${data.is_driving_school ? '+ Alvará' : ''}`,
      complete:
        !!data.cnh_front_url &&
        !!data.cnh_back_url &&
        !!data.instructor_license_url &&
        (!data.is_driving_school || !!data.business_license_url),
      path: '/onboarding-instrutor/documentacao',
    },
    {
      icon: Briefcase,
      title: 'Informações Profissionais',
      description: `${data.specialties.length} especialidade(s), ${data.availability.length} horário(s)`,
      complete:
        data.bio.length >= 50 &&
        data.specialties.length > 0 &&
        data.availability.length > 0,
      path: '/onboarding-instrutor/informacoes-profissionais',
    },
  ];

  const allComplete = checklistItems.every((item) => item.complete);
  const canSubmit = allComplete && acceptedTerms && acceptedPrivacy && acceptedFee;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      await submitOnboarding();
      toast({
        title: 'Cadastro enviado com sucesso!',
        description: 'Você receberá uma notificação quando seu perfil for aprovado.',
      });
      navigate('/onboarding-instrutor/sucesso');
    } catch (error) {
      toast({
        title: 'Erro ao enviar cadastro',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  };

  return (
    <OnboardingLayout step={4}>
      <div className="bg-card rounded-xl border p-6 md:p-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Revisão e Finalização
        </h2>
        <p className="text-muted-foreground mb-8">
          Revise suas informações antes de enviar
        </p>

        {/* Checklist */}
        <div className="space-y-4 mb-8">
          {checklistItems.map((item, index) => (
            <div
              key={index}
              className={`flex items-center gap-4 p-4 rounded-lg border ${
                item.complete
                  ? 'border-green-200 bg-green-50'
                  : 'border-destructive/30 bg-destructive/5'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.complete
                    ? 'bg-green-100 text-green-600'
                    : 'bg-destructive/10 text-destructive'
                }`}
              >
                {item.complete ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <item.icon className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              {!item.complete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(item.path)}
                >
                  Completar
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Aviso sobre veículos */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-900 font-medium mb-1">
                Próximo passo: Cadastrar Veículos
              </p>
              <p className="text-xs text-amber-800">
                Após a aprovação do seu perfil, você precisará cadastrar pelo menos um
                veículo no seu dashboard para começar a receber solicitações de aulas.
              </p>
            </div>
          </div>
        </div>

        {/* Termos */}
        <div className="space-y-4 mb-8">
          <h3 className="font-medium text-foreground">Termos e Condições</h3>

          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
              className="mt-1"
            />
            <div>
              <p className="text-sm text-foreground">
                Li e aceito os{' '}
                <a href="/termos" className="text-primary hover:underline">
                  Termos de Uso
                </a>
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={acceptedPrivacy}
              onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
              className="mt-1"
            />
            <div>
              <p className="text-sm text-foreground">
                Li e aceito a{' '}
                <a href="/privacidade" className="text-primary hover:underline">
                  Política de Privacidade
                </a>
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={acceptedFee}
              onCheckedChange={(checked) => setAcceptedFee(checked as boolean)}
              className="mt-1"
            />
            <div>
              <p className="text-sm text-foreground">
                Estou ciente da taxa de serviço de{' '}
                <span className="font-bold">12%</span> sobre cada aula realizada
              </p>
            </div>
          </label>
        </div>

        {/* Aviso */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground font-medium">Próximos passos</p>
            <p className="text-sm text-muted-foreground mt-1">
              Após o envio, seus documentos serão analisados em até 48 horas.
              Você receberá um email quando seu perfil for aprovado.
            </p>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/onboarding-instrutor/informacoes-profissionais')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Button onClick={handleSubmit} disabled={!canSubmit || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Cadastro
              </>
            )}
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default Finalizacao;
