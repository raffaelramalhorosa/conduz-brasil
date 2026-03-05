import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function PagamentoPendente() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-6 space-y-6">
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Pagamento em processamento</h1>
            <p className="text-muted-foreground">
              Você receberá uma confirmação em breve assim que o pagamento for aprovado.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/aluno/aulas')} className="w-full">
            Voltar aos agendamentos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
