import { XCircle, CreditCard, ArrowLeft, RefreshCw, ShieldAlert, WifiOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const reasons = [
  { icon: ShieldAlert, label: 'Cartão recusado ou limite insuficiente' },
  { icon: WifiOff, label: 'Instabilidade temporária na conexão' },
  { icon: Clock, label: 'Sessão de pagamento expirada' },
];

export default function PagamentoErro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!bookingId) return;
    setRetrying(true);
    try {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, student_id, total_price, instructor_id, instructor_profiles!bookings_instructor_id_fkey(profiles:user_id(full_name))')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        toast.error('Não foi possível encontrar o agendamento.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-mp-checkout', {
        body: {
          booking_id: bookingId,
          student_id: booking.student_id,
          amount: booking.total_price,
          description: 'Aula de direção',
        },
      });

      if (error) throw error;
      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (err: any) {
      console.error('Retry payment error:', err);
      toast.error(err.message || 'Erro ao iniciar pagamento. Tente novamente.');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50/60 via-background to-orange-50/30 dark:from-red-950/10 dark:via-background dark:to-background p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Card principal */}
        <div className="bg-white dark:bg-card rounded-2xl border border-red-100 dark:border-red-900/30 shadow-xl shadow-red-100/40 dark:shadow-red-950/20 overflow-hidden">

          {/* Faixa superior */}
          <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-red-400 to-orange-400" />

          <div className="p-8 text-center space-y-6">

            {/* Ícone animado */}
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-red-100 dark:bg-red-900/30 animate-ping opacity-30 scale-110" />
                <div className="relative w-20 h-20 rounded-full bg-red-50 dark:bg-red-950/40 border-2 border-red-100 dark:border-red-800/50 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-500 dark:text-red-400" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            {/* Texto */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Pagamento não processado
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Não se preocupe — seu agendamento está salvo e nenhum valor foi cobrado.
                Você pode tentar novamente a qualquer momento.
              </p>
            </div>

            {/* Motivos possíveis */}
            <div className="bg-muted/50 dark:bg-muted/20 rounded-xl p-4 text-left space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                O que pode ter acontecido?
              </p>
              <ul className="space-y-2">
                {reasons.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2.5 text-sm text-foreground/70">
                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                      <Icon className="h-3 w-3 text-red-500 dark:text-red-400" />
                    </div>
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Ações */}
            <div className="space-y-2.5 pt-1">
              {bookingId && (
                <Button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="w-full h-11 gap-2 text-sm font-semibold"
                >
                  {retrying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {retrying ? 'Redirecionando...' : 'Tentar novamente'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate('/aluno/aulas')}
                className="w-full h-11 gap-2 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar aos agendamentos
              </Button>
            </div>
          </div>
        </div>

        {/* Rodapé de suporte */}
        <p className="text-center text-xs text-muted-foreground">
          Problema persistindo?{' '}
          <button
            onClick={() => navigate('/suporte')}
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Fale com o suporte
          </button>
        </p>
      </div>
    </div>
  );
}
