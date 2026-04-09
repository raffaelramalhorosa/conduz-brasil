import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DISPUTE_REASONS = [
  { value: 'lesson_did_not_happen', label: 'A aula não aconteceu' },
  { value: 'lesson_incomplete', label: 'Aula incompleta ou interrompida' },
  { value: 'instructor_issue', label: 'Problema com o instrutor' },
  { value: 'vehicle_issue', label: 'Problema com o veículo' },
  { value: 'other', label: 'Outro motivo' },
];

interface DisputeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  onSuccess?: (disputeId: string) => void;
}

export function DisputeModal({ open, onOpenChange, bookingId, onSuccess }: DisputeModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [disputeId, setDisputeId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Selecione o motivo da contestação');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/open-dispute`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ booking_id: bookingId, reason, description: description || undefined }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao abrir contestação');
        return;
      }
      setDisputeId(data.dispute_id);
      onSuccess?.(data.dispute_id);
    } catch (err) {
      console.error('Dispute error:', err);
      toast.error('Erro ao abrir contestação');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      // Reset state on close
      setReason('');
      setDescription('');
      setDisputeId(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Contestar Aula</DialogTitle>
          <DialogDescription>
            Descreva o problema. Nossa equipe analisará em até 2 dias úteis.
          </DialogDescription>
        </DialogHeader>

        {!disputeId ? (
          <div className="space-y-5 py-2">
            {/* Reason selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Motivo *</Label>
              <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
                {DISPUTE_REASONS.map((r) => (
                  <div key={r.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={r.value} id={r.value} />
                    <Label htmlFor={r.value} className="cursor-pointer text-sm font-normal">
                      {r.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="dispute-desc" className="text-sm font-medium">
                Descrição adicional (opcional)
              </Label>
              <Textarea
                id="dispute-desc"
                placeholder="Descreva o que aconteceu em detalhes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/1000</p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-300">
                Ao contestar uma aula, o pagamento fica suspenso até resolução. Use apenas para situações legítimas.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={loading || !reason}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Abrir Contestação'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-4">
            <CheckCircle className="h-14 w-14 text-green-400 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-foreground">Contestação aberta!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Protocolo: <span className="font-mono text-foreground">{disputeId.slice(0, 8).toUpperCase()}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Nossa equipe analisará em até 2 dias úteis e entrará em contato.
              </p>
            </div>
            <Button onClick={() => handleClose(false)} className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
