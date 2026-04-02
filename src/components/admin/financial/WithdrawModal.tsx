import { useState } from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface WithdrawModalProps {
  availableBalance: number;
  instructorId: string | null;
  schoolId?: string | null;
  isMpConnected: boolean;
  onStartMpOAuth: () => void;
  onSuccess: () => void;
}

export function WithdrawModal({ availableBalance, instructorId, schoolId, isMpConnected, onStartMpOAuth, onSuccess }: WithdrawModalProps) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<string>('pix');
  const [pixKey, setPixKey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canWithdraw = availableBalance > 0; // TODO: restaurar para >= 100 após testes

  const handleConfirm = async () => {
    if (method === 'pix' && !pixKey.trim()) {
      toast.error('Informe a chave Pix');
      return;
    }
    if (method === 'mp' && !isMpConnected) {
      toast.error('Conecte o Mercado Pago primeiro');
      return;
    }

    setSubmitting(true);
    try {
      const insertData: Record<string, unknown> = {
        amount: availableBalance,
        withdrawal_method: method,
        status: 'pending',
      };

      if (schoolId) {
        insertData.driving_school_id = schoolId;
      } else if (instructorId) {
        insertData.instructor_id = instructorId;
      }

      if (method === 'pix') {
        insertData.pix_key = pixKey;
      }

      const { data: inserted, error } = await supabase
        .from('withdrawals')
        .insert(insertData as any)
        .select('id')
        .single();

      if (error) throw error;

      // Call edge function to process the withdrawal atomically
      const amountCents = Math.round(availableBalance * 100);
      const { data: fnData, error: fnError } = await supabase.functions.invoke('process-withdrawal', {
        body: {
          withdrawal_id: inserted.id,
          amount_cents: amountCents,
          withdrawal_method: method,
          ...(method === 'pix' ? { pix_key: pixKey } : {}),
        },
      });

      if (fnError) {
        console.error('process-withdrawal error:', fnError);
        toast.error('Erro ao processar saque. Tente novamente.');
        return;
      }

      if (fnData?.error) {
        toast.error(fnData.error);
        return;
      }

      toast.success('Saque processado com sucesso! O valor será transferido em breve.');
      setOpen(false);
      setPixKey('');
      setMethod('pix');
      onSuccess();
    } catch (err) {
      console.error('Withdrawal error:', err);
      toast.error('Erro ao solicitar saque. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canWithdraw) {
    return (
      <p className="text-sm text-instructor-text-muted text-right">
        Sem saldo disponível para saque
      </p>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <ArrowUpRight className="h-4 w-4" />
          Solicitar Saque
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-instructor-dark-secondary border-white/10 text-instructor-text-primary">
        <DialogHeader>
          <DialogTitle>Solicitar Saque</DialogTitle>
          <DialogDescription className="text-instructor-text-muted">
            Escolha o método de recebimento e confirme.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-instructor-text-secondary text-sm">Valor disponível</Label>
            <p className="text-2xl font-bold text-green-400 mt-1">{fmt(availableBalance)}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-instructor-text-secondary text-sm">Método de recebimento</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="bg-instructor-dark-tertiary border-white/10 text-instructor-text-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-instructor-dark-tertiary border-white/10">
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="mp">Mercado Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {method === 'pix' && (
            <div className="space-y-2">
              <Label className="text-instructor-text-secondary text-sm">Chave Pix</Label>
              <Input
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="bg-instructor-dark-tertiary border-white/10 text-instructor-text-primary"
              />
            </div>
          )}

          {method === 'mp' && !isMpConnected && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <p className="text-sm text-orange-400 mb-3">
                Você precisa conectar sua conta do Mercado Pago para receber por este método.
              </p>
              <Button variant="outline" onClick={onStartMpOAuth} className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
                Conectar MP primeiro
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}
            className="bg-transparent border-white/10 text-instructor-text-secondary">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting || (method === 'mp' && !isMpConnected)}
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar Saque
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
