import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  MapPin,
  Navigation,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DisputeRow {
  id: string;
  booking_id: string;
  opened_by: string;
  opened_by_type: 'student' | 'instructor';
  reason: string;
  description: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  booking: {
    scheduled_date: string;
    start_time: string;
    total_price: number;
    instructor_checkin_lat: number | null;
    instructor_checkin_lng: number | null;
    student_checkin_lat: number | null;
    student_checkin_lng: number | null;
    checkin_distance_meters: number | null;
    checkin_validated: boolean | null;
    payment_status: string | null;
    student: { full_name: string };
    instructor: { full_name: string };
  } | null;
}

const statusBadge: Record<string, { label: string; className: string }> = {
  open: { label: 'Aberta', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  under_review: { label: 'Em análise', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  resolved_instructor: { label: 'Resolvida (instrutor)', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  resolved_student: { label: 'Resolvida (aluno)', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  resolved_refund: { label: 'Reembolsado', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

const REASON_LABELS: Record<string, string> = {
  lesson_did_not_happen: 'Aula não aconteceu',
  lesson_incomplete: 'Aula incompleta',
  instructor_issue: 'Problema com instrutor',
  vehicle_issue: 'Problema com veículo',
  other: 'Outro',
};

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('booking_disputes')
        .select(`
          id,
          booking_id,
          opened_by,
          opened_by_type,
          reason,
          description,
          status,
          admin_note,
          created_at,
          bookings!booking_id (
            scheduled_date,
            start_time,
            total_price,
            instructor_checkin_lat,
            instructor_checkin_lng,
            student_checkin_lat,
            student_checkin_lng,
            checkin_distance_meters,
            checkin_validated,
            payment_status,
            student_profiles!student_id (
              profiles!user_id ( full_name )
            ),
            instructor_profiles!instructor_id (
              profiles!user_id ( full_name )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((d: any) => ({
        ...d,
        booking: d.bookings
          ? {
              ...d.bookings,
              student: { full_name: d.bookings.student_profiles?.profiles?.full_name || 'Aluno' },
              instructor: { full_name: d.bookings.instructor_profiles?.profiles?.full_name || 'Instrutor' },
            }
          : null,
      }));

      setDisputes(mapped);
    } catch (err) {
      console.error('Error fetching disputes:', err);
      toast.error('Erro ao carregar disputas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (disputeId: string, resolution: string) => {
    setResolving(disputeId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resolve-dispute`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            dispute_id: disputeId,
            resolution,
            admin_note: adminNotes[disputeId] || null,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao resolver disputa');
        return;
      }
      toast.success('Disputa resolvida com sucesso!');
      setExpandedId(null);
      fetchDisputes();
    } catch (err) {
      console.error('Resolve dispute error:', err);
      toast.error('Erro ao resolver disputa');
    } finally {
      setResolving(null);
    }
  };

  const mapsUrl = (lat: number | null, lng: number | null) =>
    lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  const isResolved = (status: string) =>
    status.startsWith('resolved_');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          Disputas de Aulas
        </h1>
        <p className="text-zinc-400 mt-1">Gerencie as contestações abertas por alunos e instrutores</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500/50" />
          <p className="text-lg font-medium">Nenhuma disputa encontrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => {
            const expanded = expandedId === dispute.id;
            const resolved = isResolved(dispute.status);
            const badge = statusBadge[dispute.status] || { label: dispute.status, className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' };

            return (
              <div
                key={dispute.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
              >
                {/* Row header */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : dispute.id)}
                >
                  <Badge className={cn('border text-xs shrink-0', badge.className)}>{badge.label}</Badge>

                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {dispute.booking
                        ? `${dispute.booking.student.full_name} ↔ ${dispute.booking.instructor.full_name}`
                        : dispute.booking_id.slice(0, 8)}
                    </p>
                    <p className="text-zinc-400 text-xs truncate">
                      {REASON_LABELS[dispute.reason] || dispute.reason}
                      {dispute.booking && ` · ${format(new Date(dispute.booking.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}`}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-zinc-500 text-xs">
                      {format(new Date(dispute.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-zinc-500 text-xs capitalize">{dispute.opened_by_type}</p>
                  </div>

                  {expanded ? (
                    <ChevronUp className="h-4 w-4 text-zinc-500 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                  )}
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-zinc-800 p-5 space-y-5">
                    {/* Description */}
                    {dispute.description && (
                      <div>
                        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Descrição</p>
                        <p className="text-sm text-zinc-200">{dispute.description}</p>
                      </div>
                    )}

                    {/* Geo Evidence */}
                    {dispute.booking && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-800/50 rounded-lg p-3">
                          <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">Check-in Instrutor</p>
                          {dispute.booking.instructor_checkin_lat ? (
                            <div className="space-y-1">
                              <p className="text-xs text-zinc-300 font-mono">
                                {dispute.booking.instructor_checkin_lat.toFixed(6)},{' '}
                                {dispute.booking.instructor_checkin_lng?.toFixed(6)}
                              </p>
                              <a
                                href={mapsUrl(dispute.booking.instructor_checkin_lat, dispute.booking.instructor_checkin_lng) || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
                              >
                                <MapPin className="h-3 w-3" /> Ver no Maps
                              </a>
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-500">Não registrado</p>
                          )}
                        </div>

                        <div className="bg-zinc-800/50 rounded-lg p-3">
                          <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">Check-in Aluno</p>
                          {dispute.booking.student_checkin_lat ? (
                            <div className="space-y-1">
                              <p className="text-xs text-zinc-300 font-mono">
                                {dispute.booking.student_checkin_lat.toFixed(6)},{' '}
                                {dispute.booking.student_checkin_lng?.toFixed(6)}
                              </p>
                              <a
                                href={mapsUrl(dispute.booking.student_checkin_lat, dispute.booking.student_checkin_lng) || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
                              >
                                <MapPin className="h-3 w-3" /> Ver no Maps
                              </a>
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-500">Não registrado</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Distance + validation badge */}
                    {dispute.booking?.checkin_distance_meters != null && (
                      <div className="flex items-center gap-3">
                        <Navigation className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm text-zinc-300">
                          Distância entre check-ins: <strong>{dispute.booking.checkin_distance_meters}m</strong>
                        </span>
                        {dispute.booking.checkin_validated ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Validado</Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Distância alta</Badge>
                        )}
                      </div>
                    )}

                    {/* Admin note */}
                    {!resolved && (
                      <div className="space-y-2">
                        <Label className="text-xs text-zinc-400 uppercase tracking-wider">Nota do Admin (opcional)</Label>
                        <Textarea
                          placeholder="Registre sua decisão..."
                          value={adminNotes[dispute.id] || ''}
                          onChange={(e) =>
                            setAdminNotes((prev) => ({ ...prev, [dispute.id]: e.target.value }))
                          }
                          rows={3}
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                        />
                      </div>
                    )}

                    {/* Resolution buttons */}
                    {!resolved ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
                          disabled={resolving === dispute.id}
                          onClick={() => handleResolve(dispute.id, 'resolved_refund')}
                        >
                          {resolving === dispute.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                          Reembolsar Aluno
                        </Button>
                        <Button
                          size="sm"
                          className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30"
                          disabled={resolving === dispute.id}
                          onClick={() => handleResolve(dispute.id, 'resolved_instructor')}
                        >
                          Manter Pagamento ao Instrutor
                        </Button>
                        <Button
                          size="sm"
                          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                          disabled={resolving === dispute.id}
                          onClick={() => handleResolve(dispute.id, 'resolved_student')}
                        >
                          Resolver a Favor do Aluno
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <p className="text-sm text-green-300">
                          Resolvida como: <strong>{badge.label}</strong>
                          {dispute.admin_note && ` · ${dispute.admin_note}`}
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
