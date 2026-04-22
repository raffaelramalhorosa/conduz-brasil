import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Flag,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ReportRow {
  id: string;
  reporter_id: string;
  reported_id: string;
  booking_id: string | null;
  category: string;
  description: string;
  status: string;
  admin_notes: string | null;
  action_taken: string | null;
  created_at: string;
  reporter: { full_name: string | null } | null;
  reported: { full_name: string | null } | null;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  open: { label: 'Aberta', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  under_review: { label: 'Em análise', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  action_taken: { label: 'Ação tomada', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  dismissed: { label: 'Arquivada', className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  closed: { label: 'Fechada', className: 'bg-zinc-600/20 text-zinc-500 border-zinc-600/30' },
};

const CATEGORY_LABELS: Record<string, string> = {
  inappropriate_behavior: 'Comportamento inadequado',
  dangerous_driving: 'Direção perigosa',
  fraud: 'Fraude',
  safety_concern: 'Preocupação com segurança',
  fake_identity: 'Identidade falsa',
  fake_review: 'Avaliação falsa',
  other: 'Outro',
};

const ACTION_OPTIONS = [
  { value: 'warning', label: 'Advertência' },
  { value: 'temporary_suspension', label: 'Suspensão temporária' },
  { value: 'permanent_ban', label: 'Banimento permanente' },
];

export default function AdminReports() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});
  const [localAction, setLocalAction] = useState<Record<string, string>>({});

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id, reporter_id, reported_id, booking_id, category, description,
          status, admin_notes, action_taken, created_at,
          reporter:profiles!reporter_id ( full_name ),
          reported:profiles!reported_id ( full_name )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports((data as any[]) || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      toast.error('Erro ao carregar denúncias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSave = async (reportId: string) => {
    setSaving(reportId);
    try {
      const updates: Record<string, string | null> = {};
      if (localStatus[reportId]) updates.status = localStatus[reportId];
      if (localNotes[reportId] !== undefined) updates.admin_notes = localNotes[reportId] || null;
      if (localAction[reportId]) updates.action_taken = localAction[reportId];

      const { error } = await supabase
        .from('reports')
        .update(updates)
        .eq('id', reportId);

      if (error) throw error;
      toast.success('Denúncia atualizada');
      fetchReports();
    } catch (err) {
      console.error('Error saving report:', err);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(null);
    }
  };

  const isClosed = (status: string) => status === 'action_taken' || status === 'dismissed' || status === 'closed';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Flag className="h-6 w-6 text-red-400" />
          Denúncias
        </h1>
        <p className="text-zinc-400 mt-1">Gerencie as denúncias enviadas por usuários da plataforma</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500/50" />
          <p className="text-lg font-medium">Nenhuma denúncia encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const expanded = expandedId === report.id;
            const closed = isClosed(report.status);
            const badge = STATUS_BADGE[report.status] || { label: report.status, className: 'bg-zinc-500/20 text-zinc-400' };

            return (
              <div
                key={report.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
              >
                {/* Row header */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : report.id)}
                >
                  <Badge className={cn('border text-xs shrink-0', badge.className)}>{badge.label}</Badge>

                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {report.reporter?.full_name || 'Usuário'} denunciou {report.reported?.full_name || 'Usuário'}
                    </p>
                    <p className="text-zinc-400 text-xs truncate">
                      {CATEGORY_LABELS[report.category] || report.category}
                    </p>
                  </div>

                  <p className="text-zinc-500 text-xs shrink-0">
                    {format(new Date(report.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </p>

                  {expanded ? (
                    <ChevronUp className="h-4 w-4 text-zinc-500 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                  )}
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-zinc-800 p-5 space-y-5">
                    <div>
                      <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Descrição</p>
                      <p className="text-sm text-zinc-200">{report.description}</p>
                    </div>

                    {!closed && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-zinc-400 uppercase tracking-wider">Status</Label>
                            <Select
                              value={localStatus[report.id] || report.status}
                              onValueChange={(v) => setLocalStatus((prev) => ({ ...prev, [report.id]: v }))}
                            >
                              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_BADGE).map(([val, { label }]) => (
                                  <SelectItem key={val} value={val}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-zinc-400 uppercase tracking-wider">Ação tomada</Label>
                            <Select
                              value={localAction[report.id] || report.action_taken || ''}
                              onValueChange={(v) => setLocalAction((prev) => ({ ...prev, [report.id]: v }))}
                            >
                              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectValue placeholder="Nenhuma" />
                              </SelectTrigger>
                              <SelectContent>
                                {ACTION_OPTIONS.map((a) => (
                                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400 uppercase tracking-wider">Notas do Admin</Label>
                          <Textarea
                            placeholder="Registre sua decisão ou observações..."
                            value={localNotes[report.id] ?? (report.admin_notes || '')}
                            onChange={(e) =>
                              setLocalNotes((prev) => ({ ...prev, [report.id]: e.target.value }))
                            }
                            rows={3}
                            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            className="bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-semibold"
                            onClick={() => handleSave(report.id)}
                            disabled={saving === report.id}
                          >
                            {saving === report.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            ) : null}
                            Salvar
                          </Button>
                        </div>
                      </>
                    )}

                    {closed && (
                      <div className="flex items-center gap-2 p-3 bg-zinc-500/10 border border-zinc-500/20 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-zinc-400" />
                        <p className="text-sm text-zinc-300">
                          Status: <strong>{badge.label}</strong>
                          {report.action_taken && ` · ${ACTION_OPTIONS.find((a) => a.value === report.action_taken)?.label}`}
                          {report.admin_notes && ` · ${report.admin_notes}`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
