import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function PagamentoSucesso() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const [loading, setLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;

    const checkStatus = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('payment_status')
        .eq('id', bookingId)
        .single();

      if (data?.payment_status === 'paid') {
        setIsPaid(true);
        setLoading(false);
        return;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        setIsPaid(false);
        setLoading(false);
        return;
      }

      setTimeout(checkStatus, 3000);
    };

    checkStatus();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6 space-y-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Verificando pagamento...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-6 space-y-6">
          {isPaid ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Pagamento confirmado!</h1>
                <p className="text-muted-foreground">
                  Sua aula está agendada. Você receberá uma confirmação em breve.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Pagamento em processamento</h1>
                <p className="text-muted-foreground">
                  Seu pagamento está sendo processado. Aguarde a confirmação.
                </p>
              </div>
            </>
          )}
          <Button onClick={() => navigate('/aluno/aulas')} className="w-full">
            Voltar aos agendamentos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
