import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CancelPaidLessonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  instructorName: string;
  amount: number;
  hoursUntil: number;
  isLoading?: boolean;
}

export function CancelPaidLessonModal({
  open,
  onOpenChange,
  onConfirm,
  instructorName,
  amount,
  hoursUntil,
  isLoading = false,
}: CancelPaidLessonModalProps) {
  const willRefund = hoursUntil >= 24;
  const handleClose = () => {
    if (!isLoading) onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 w-full max-w-md bg-card rounded-2xl border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`${willRefund ? 'bg-primary/5' : 'bg-destructive/5'} border-b p-5 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 ${willRefund ? 'bg-primary/10' : 'bg-destructive/10'} rounded-lg`}>
                  <AlertTriangle className={`h-5 w-5 ${willRefund ? 'text-primary' : 'text-destructive'}`} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Cancelar Aula</h2>
                  <p className="text-sm text-muted-foreground">
                    {willRefund ? 'Com reembolso' : 'Sem reembolso'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {willRefund ? (
                <>
                  <p className="text-sm text-foreground">
                    Você receberá um reembolso total de <strong>R$ {amount.toFixed(2)}</strong>.
                  </p>
                  <p className="text-sm text-foreground">
                    Deseja cancelar a aula com <strong>{instructorName}</strong>?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    O valor será estornado em até 10 dias úteis.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-foreground">
                    Cancelamentos com menos de 24h de antecedência <strong>não são reembolsáveis</strong>.
                  </p>
                  <p className="text-sm text-foreground">
                    O valor de <strong>R$ {amount.toFixed(2)}</strong> não será devolvido.
                  </p>
                  <p className="text-sm text-foreground">
                    Deseja cancelar mesmo assim?
                  </p>
                </>
              )}
            </div>

            <div className="border-t p-4 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 h-11"
              >
                Não
              </Button>
              <Button
                variant={willRefund ? 'default' : 'destructive'}
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 h-11 font-semibold"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isLoading
                  ? 'Cancelando...'
                  : willRefund
                    ? 'Sim, cancelar'
                    : 'Sim, cancelar sem reembolso'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
