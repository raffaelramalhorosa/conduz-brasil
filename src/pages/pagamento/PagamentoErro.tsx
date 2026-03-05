import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PagamentoErro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');

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
            <Button onClick={() => navigate('/aluno/aulas')} className="w-full">
              Voltar aos agendamentos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
