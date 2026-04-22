import { useState } from 'react';
import { Flag, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  reportedId: string;
  reportedName: string;
  bookingId?: string;
}

const CATEGORIES = [
  { value: 'inappropriate_behavior', label: 'Comportamento inadequado' },
  { value: 'dangerous_driving', label: 'Direção perigosa' },
  { value: 'fraud', label: 'Fraude' },
  { value: 'safety_concern', label: 'Preocupação com segurança' },
  { value: 'fake_identity', label: 'Identidade falsa' },
  { value: 'fake_review', label: 'Avaliação falsa' },
  { value: 'other', label: 'Outro' },
];

export function ReportModal({ open, onClose, reportedId, reportedName, bookingId }: ReportModalProps) {
  const { user, profile } = useAuth();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para fazer uma denúncia');
      return;
    }
    if (!category) {
      toast.error('Selecione uma categoria');
      return;
    }
    if (description.trim().length < 20) {
      toast.error('Descreva o problema com pelo menos 20 caracteres');
      return;
    }

    setSubmitting(true);
    try {
      const { data: report, error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_id: reportedId,
          booking_id: bookingId || null,
          category,
          description: description.trim(),
        })
        .select('id')
        .single();

      if (error) throw error;

      // Notify admin (non-blocking)
      supabase.functions.invoke('notify-admin-new-report', {
        body: {
          reportId: report.id,
          reporterName: profile?.full_name || user.email,
          reportedName,
          category,
          description: description.trim(),
        },
      }).catch(() => {});

      toast.success('Denúncia enviada. Nossa equipe irá analisar em breve.');
      setCategory('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error('Error submitting report:', err);
      toast.error('Não foi possível enviar a denúncia. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Denunciar {reportedName}
          </DialogTitle>
          <DialogDescription>
            Sua denúncia é anônima e será revisada pela nossa equipe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Motivo *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Textarea
              placeholder="Descreva o que aconteceu com o máximo de detalhes possível..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/1000</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !category || description.trim().length < 20}
            className="bg-red-600 hover:bg-red-700"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Denúncia'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
