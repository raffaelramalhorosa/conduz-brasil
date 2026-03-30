import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoShowReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  instructorName: string;
  amount: number;
  isLoading?: boolean;
}

export function NoShowReportModal({
  open,
  onOpenChange,
  onConfirm,
  instructorName,
  amount,
  isLoading = false,
}: NoShowReportModalProps) {
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
            className="relative z-10 w-full max-w-md bg-card rounded-2xl border shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-destructive/5 border-b p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Reportar Ausência</h2>
                  <p className="text-sm text-muted-foreground">Instrutor não compareceu</p>
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
              <p className="text-sm text-foreground">
                Confirma que o instrutor <strong>{instructorName}</strong> não compareceu à aula?
              </p>
              <p className="text-sm text-foreground">
                Um reembolso total de <strong>R$ {amount.toFixed(2)}</strong> será processado automaticamente.
              </p>
              <p className="text-xs text-muted-foreground">
                O valor será estornado em até 10 dias úteis.
              </p>
            </div>

            <div className="border-t p-4 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 h-11"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 h-11 font-semibold"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isLoading ? 'Processando...' : 'Confirmar Ausência'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
