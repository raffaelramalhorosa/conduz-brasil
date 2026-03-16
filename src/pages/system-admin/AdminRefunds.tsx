import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckCircle, XCircle, RotateCcw, Loader2, Search, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SystemAdminHeader } from '@/components/system-admin/SystemAdminHeader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function AdminRefunds() {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRefundId, setRejectRefundId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const { data: refunds, isLoading } = useQuery({
    queryKey: ['admin-refunds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('refunds')
        .select(`
          *,
          bookings (
            id,
            total_price,
            scheduled_date,
            student_id,
            instructor_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching refunds:', error);
        return [];
      }

      // Fetch student names separately
      const studentIds = [...new Set((data || []).map((r: any) => r.student_id))];
      if (studentIds.length > 0) {
        const { data: students } = await supabase
          .from('student_profiles')
          .select('id, user_id, profiles:user_id(full_name, email)')
          .in('id', studentIds);

        const studentMap: Record<string, any> = {};
        (students || []).forEach((s: any) => {
          studentMap[s.id] = s.profiles;
        });

        return (data || []).map((r: any) => ({
          ...r,
          _student: studentMap[r.student_id] || null,
        }));
      }

      return data || [];
    },
  });

  const handleApprove = async (refund: any) => {
    setProcessingId(refund.id);
    try {
      // Get the student's user_id from booking
      const { data: booking } = await supabase
        .from('bookings')
        .select('student_id, student_profiles!bookings_student_id_fkey(user_id)')
        .eq('id', refund.booking_id)
        .single();

      const studentUserId = (booking as any)?.student_profiles?.user_id;

      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          booking_id: refund.booking_id,
          student_id: studentUserId,
          refund_id: refund.id,
        },
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      toast.success('Reembolso aprovado e processado no Mercado Pago');
    } catch (err: any) {
      console.error('Error approving refund:', err);
      toast.error(err.message || 'Erro ao processar reembolso');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClick = (refundId: string) => {
    setRejectRefundId(refundId);
    setRejectNote('');
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectRefundId) return;
    setRejecting(true);
    try {
      const { error } = await supabase
        .from('refunds' as any)
        .update({
          status: 'rejected',
          admin_note: rejectNote || 'Solicitação negada pelo administrador',
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', rejectRefundId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      toast.success('Solicitação de reembolso negada');
      setRejectModalOpen(false);
    } catch (err: any) {
      console.error('Error rejecting refund:', err);
      toast.error('Erro ao negar reembolso');
    } finally {
      setRejecting(false);
    }
  };

  const pendingRefunds = refunds?.filter((r: any) => r.status === 'pending') || [];
  const otherRefunds = refunds?.filter((r: any) => r.status !== 'pending') || [];

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Em análise', className: 'bg-yellow-100 text-yellow-700' },
    approved: { label: 'Aprovado', className: 'bg-green-100 text-green-700' },
    rejected: { label: 'Negado', className: 'bg-red-100 text-red-700' },
    refunded: { label: 'Reembolsado', className: 'bg-blue-100 text-blue-700' },
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <SystemAdminHeader
        title="Reembolsos"
        subtitle="Gerencie as solicitações de reembolso dos alunos"
      />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
          </div>
        ) : (
          <>
            {/* Pending */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                Pendentes ({pendingRefunds.length})
              </h2>
              {pendingRefunds.length === 0 ? (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="py-8 text-center">
                    <p className="text-zinc-400">Nenhuma solicitação pendente</p>
                  </CardContent>
                </Card>
              ) : (
                pendingRefunds.map((refund: any) => {
                  const studentName = refund._student?.full_name || 'Aluno';
                  const date = refund.bookings?.scheduled_date
                    ? new Date(refund.bookings.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR')
                    : '-';
                  const isProcessing = processingId === refund.id;

                  return (
                    <Card key={refund.id} className="bg-zinc-900 border-zinc-800">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <p className="font-semibold text-white">{studentName}</p>
                            <p className="text-sm text-zinc-400">Aula em {date}</p>
                            <p className="text-sm text-zinc-300">Motivo: {refund.reason}</p>
                            <p className="text-sm text-zinc-500">
                              Solicitado em {new Date(refund.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <p className="text-lg font-bold text-white">
                              R$ {Number(refund.amount).toFixed(2).replace('.', ',')}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(refund)}
                                disabled={isProcessing}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                )}
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectClick(refund.id)}
                                disabled={isProcessing}
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Negar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* History */}
            {otherRefunds.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Histórico</h2>
                {otherRefunds.map((refund: any) => {
                  const config = statusConfig[refund.status] || statusConfig.pending;
                  const studentName = refund._student?.full_name || 'Aluno';

                  return (
                    <Card key={refund.id} className="bg-zinc-900 border-zinc-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{studentName}</span>
                              <Badge className={config.className}>{config.label}</Badge>
                            </div>
                            <p className="text-sm text-zinc-400">{refund.reason}</p>
                            {refund.admin_note && (
                              <p className="text-sm text-zinc-500">Nota: {refund.admin_note}</p>
                            )}
                          </div>
                          <p className="text-white font-bold">
                            R$ {Number(refund.amount).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Negar Reembolso</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Informe o motivo da negação. O aluno poderá visualizar esta mensagem.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Motivo da negação..."
            className="bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
          />
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRejectConfirm}
              disabled={rejecting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {rejecting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirmar Negação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
