import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader2, CreditCard } from 'lucide-react';

export default function PagamentoErro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!bookingId) return;
    setRetrying(true);
    try {
      // Fetch booking to get needed data for checkout
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-6 space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Não foi possível processar o pagamento</h1>
            <p className="text-muted-foreground">
              Ocorreu um erro ao processar seu pagamento. Tente novamente.
            </p>
          </div>
          <div className="space-y-2">
            {bookingId && (
              <Button onClick={handleRetry} disabled={retrying} className="w-full gap-2">
                {retrying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {retrying ? 'Processando...' : 'Tentar novamente'}
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/aluno/aulas')} className="w-full">
              Voltar aos agendamentos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
