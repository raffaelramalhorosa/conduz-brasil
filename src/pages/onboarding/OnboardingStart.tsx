import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Info, Loader2, ArrowRight, User, FileText, DollarSign, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const OnboardingStart = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { loadProgress, isLoading } = useOnboarding();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('instructor_profiles')
      .select('verification_status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data?.verification_status === 'approved') {
      navigate('/dashboard');
    }
  };

  const handleStart = async () => {
    await loadProgress();
    navigate('/onboarding-instrutor/dados-basicos');
  };

  const steps = [
    {
      number: 1,
      title: 'Dados Básicos',
      description: 'Informações pessoais e endereço',
      icon: User,
      active: true,
    },
    {
      number: 2,
      title: 'Documentação',
      description: 'CNH e credenciamento como instrutor',
      icon: FileText,
      active: false,
    },
    {
      number: 3,
      title: 'Veículos',
      description: 'Cadastre os veículos para as aulas',
      icon: Car,
      active: false,
    },
    {
      number: 4,
      title: 'Preços e Horários',
      description: 'Defina seus valores e disponibilidade',
      icon: DollarSign,
      active: false,
    },
    {
      number: 5,
      title: 'Revisão e Envio',
      description: 'Confirme seus dados e aguarde aprovação',
      icon: CheckCircle,
      active: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-card rounded-2xl shadow-xl p-8 md:p-12 border">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center">
            <Car className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>

        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Bem-vindo, {profile?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Vamos configurar seu perfil de instrutor
          </p>
        </div>

        {/* Passos */}
        <div className="space-y-4 mb-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex items-start gap-4 p-4 rounded-lg ${
                step.active ? 'bg-primary/10' : 'bg-muted/50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted-foreground/30 text-muted-foreground'
                }`}
              >
                <span className="font-bold text-sm">{step.number}</span>
              </div>
              <div>
                <h3 className="font-bold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground font-medium mb-1">
                ⏱️ Leva cerca de 10 minutos
              </p>
              <p className="text-xs text-muted-foreground">
                Seu perfil será analisado em até 48 horas. Você receberá uma
                notificação quando for aprovado.
              </p>
            </div>
          </div>
        </div>

        {/* Botão */}
        <Button
          onClick={handleStart}
          disabled={isLoading}
          className="w-full py-6 text-lg font-bold"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Carregando...
            </>
          ) : (
            <>
              Começar Cadastro
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Seus dados estão seguros e protegidos
        </p>
      </div>
    </div>
  );
};

export default OnboardingStart;
