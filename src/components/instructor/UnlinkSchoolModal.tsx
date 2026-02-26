import { useState } from 'react';
import { AlertTriangle, Loader2, ShieldAlert, KeyRound } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UnlinkSchoolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolName: string;
  onSuccess: () => void;
}

export function UnlinkSchoolModal({ open, onOpenChange, schoolName, onSuccess }: UnlinkSchoolModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'confirm' | 'password'>('confirm');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProceedToPassword = () => {
    setStep('password');
  };

  const handleUnlink = async () => {
    if (!password.trim() || !user?.email) return;
    setLoading(true);

    try {
      // Re-autenticar o usuário com a senha informada
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (authError) {
        toast.error('Senha incorreta. Tente novamente.');
        setLoading(false);
        return;
      }

      // Senha correta — desvincular
      const { error: unlinkError } = await supabase
        .from('driving_school_instructors')
        .update({
          status: 'inactive',
          is_account_linked: false,
        })
        .eq('linked_user_id', user.id)
        .eq('status', 'active');

      if (unlinkError) throw unlinkError;

      toast.success('Desvinculação realizada com sucesso!');
      onSuccess();
      handleClose(false);
    } catch (err) {
      console.error('Erro ao desvincular:', err);
      toast.error('Erro ao desvincular. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep('confirm');
      setPassword('');
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
                Novos agendamentos via autoescola não serão mais possíveis
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldAlert className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                Aulas já confirmadas serão mantidas
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
              <Button variant="destructive" onClick={handleProceedToPassword}>
                Continuar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <KeyRound className="h-6 w-6 text-destructive" />
                </div>
                <DialogTitle>Confirme sua identidade</DialogTitle>
              </div>
              <DialogDescription>
                Para confirmar a desvinculação, digite sua senha.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-2">
                <Label htmlFor="unlink-password">Senha</Label>
                <Input
                  id="unlink-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlink()}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setStep('confirm')}>
                Voltar
              </Button>
              <Button variant="destructive" onClick={handleUnlink} disabled={loading || !password.trim()}>
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
