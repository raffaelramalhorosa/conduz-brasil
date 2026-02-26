import { useState } from 'react';
import { AlertTriangle, Loader2, Mail, ShieldAlert } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UnlinkSchoolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolName: string;
  onSuccess: () => void;
}

export function UnlinkSchoolModal({ open, onOpenChange, schoolName, onSuccess }: UnlinkSchoolModalProps) {
  const [step, setStep] = useState<'confirm' | 'otp'>('confirm');
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-unlink-otp');
      if (error) throw error;
      setStep('otp');
      toast.success('Código enviado para seu email!');
    } catch (err) {
      toast.error('Erro ao enviar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('verify-unlink-otp', {
        body: { code: otpCode },
      });
      if (error) throw error;
      toast.success('Desvinculação realizada com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || 'Código inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep('confirm');
      setOtpCode('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'confirm' ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <DialogTitle>Desvincular da Autoescola</DialogTitle>
              </div>
              <DialogDescription>
                Você está prestes a se desvincular de <strong>{schoolName}</strong>. Isso significa:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldAlert className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                Você não aparecerá mais como instrutor desta autoescola
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldAlert className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                Agendamentos futuros vinculados à autoescola serão afetados
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldAlert className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                Essa ação não pode ser desfeita automaticamente
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleSendOTP} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                Enviar código de verificação
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Digite o código de verificação</DialogTitle>
              <DialogDescription>
                Enviamos um código de 6 dígitos para o seu email cadastrado. O código expira em 10 minutos.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-6">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setStep('confirm')}>
                Voltar
              </Button>
              <Button variant="destructive" onClick={handleVerifyOTP} disabled={loading || otpCode.length !== 6}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirmar desvinculação
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
