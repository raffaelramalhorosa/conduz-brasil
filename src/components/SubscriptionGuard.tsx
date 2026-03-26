import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

function BlockScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isSchool = profile?.user_type === 'driving_school';
  const price = isSchool ? 'R$199/mês' : 'R$22/mês';
  const planName = isSchool ? 'Plano Autoescola' : 'Plano Instrutor';

  const benefits = isSchool
    ? [
        'Gerencie até 15 instrutores ativos',
        'Painel financeiro completo',
        'Agendamentos ilimitados',
        'Suporte prioritário',
      ]
    : [
        'Alunos ilimitados',
        'Calendário de aulas',
        'Recebimentos via Mercado Pago',
        'Suporte dedicado',
      ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
        {/* Ícone cadeado */}
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Lock className="w-9 h-9 text-amber-500" />
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Seu período gratuito encerrou
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Assine o Conduz Brasil para continuar oferecendo aulas pela plataforma
          </p>
        </div>

        {/* Card do plano */}
        <Card className="w-full border-amber-500/20 bg-card">
          <CardContent className="pt-6 pb-6 space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                {planName}
              </p>
              <p className="text-4xl font-bold text-amber-500">{price}</p>
            </div>

            <ul className="space-y-2 text-left">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <Button
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold h-11"
          onClick={() => navigate('/admin/assinaturas')}
        >
          Assinar Agora
        </Button>

        {/* Suporte */}
        <a
          href="mailto:atendimento@r3d3s.com.br"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Headphones className="w-3.5 h-3.5" />
          Falar com suporte
        </a>
      </div>
    </div>
  );
}

function GuardSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { hasAccess, loading } = useSubscriptionAccess();

  if (loading) return <GuardSkeleton />;
  if (!hasAccess) return <BlockScreen />;
  return <>{children}</>;
}
