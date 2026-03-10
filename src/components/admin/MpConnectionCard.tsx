import { CheckCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMpConnection } from '@/hooks/useMpConnection';
import { Skeleton } from '@/components/ui/skeleton';

export function MpConnectionCard() {
  const { isConnected, loading, mpEmail, startOAuth, disconnect } = useMpConnection();

  if (loading) {
    return (
      <div className="bg-instructor-dark-secondary rounded-xl border border-border p-4">
        <Skeleton className="h-16 w-full bg-muted" />
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="bg-instructor-dark-secondary rounded-xl border border-border p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-400/10 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-sm text-white">Mercado Pago conectado</p>
            {mpEmail && (
              <p className="text-xs text-muted-foreground">{mpEmail}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnect}
          className="border-red-500/40 text-red-400 hover:bg-red-500/10 bg-transparent"
        >
          Desconectar
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-instructor-dark-secondary rounded-xl border border-border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm text-white">Configure seu recebimento</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Conecte sua conta do Mercado Pago para receber pelas suas aulas.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        onClick={startOAuth}
        className="gap-2 shrink-0 bg-orange-500 hover:bg-orange-600 text-white"
      >
        <CreditCard className="h-4 w-4" />
        Conectar Mercado Pago
      </Button>
    </div>
  );
}
