import { CreditCard } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMpConnection } from '@/hooks/useMpConnection';

interface MpRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MpRequiredModal({ open, onOpenChange }: MpRequiredModalProps) {
  const { startOAuth } = useMpConnection();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Conecte o Mercado Pago para aceitar aulas
          </AlertDialogTitle>
          <AlertDialogDescription>
            Para que o aluno possa pagar e você receba, é necessário conectar sua conta do Mercado Pago.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Agora não</AlertDialogCancel>
          <AlertDialogAction onClick={startOAuth} className="gap-2">
            <CreditCard className="h-4 w-4" />
            Conectar agora
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
