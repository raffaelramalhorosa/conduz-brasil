import { CheckCircle, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMpConnection } from '@/hooks/useMpConnection';
import { Skeleton } from '@/components/ui/skeleton';

export function MpConnectionCard() {
  const { isConnected, loading, mpEmail, startOAuth, disconnect } = useMpConnection();

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isConnected) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Mercado Pago conectado</p>
              {mpEmail && (
                <p className="text-xs text-muted-foreground">{mpEmail}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={disconnect}
            className="text-muted-foreground hover:text-destructive"
          >
            Desconectar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">Configure seu recebimento</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Conecte sua conta do Mercado Pago para receber pelas suas aulas.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={startOAuth}
          className="gap-2 shrink-0"
        >
          <CreditCard className="h-4 w-4" />
          Conectar Mercado Pago
        </Button>
      </CardContent>
    </Card>
  );
}
