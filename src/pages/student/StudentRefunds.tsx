import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle, XCircle, RotateCcw, Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StudentHeader } from '@/components/student/StudentHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: 'Em análise', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { label: 'Aprovado', className: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Negado', className: 'bg-red-100 text-red-700', icon: XCircle },
  refunded: { label: 'Reembolsado', className: 'bg-blue-100 text-blue-700', icon: RotateCcw },
};

export default function StudentRefunds() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: refunds, isLoading } = useQuery({
    queryKey: ['student-refunds', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      // Get student profile id
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (!studentProfile) return [];

      const { data, error } = await supabase
        .from('refunds' as any)
        .select('*, bookings!inner(scheduled_date, start_time, total_price, instructor_id, instructor_profiles!bookings_instructor_id_fkey(profiles:user_id(full_name)))')
        .eq('student_id', studentProfile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching refunds:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!profile?.id,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/aluno/aulas')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus Reembolsos</h1>
          <p className="text-muted-foreground text-sm">Acompanhe o status das suas solicitações</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !refunds?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RotateCcw className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground">Nenhum reembolso</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Você ainda não possui solicitações de reembolso.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {refunds.map((refund: any) => {
            const config = statusConfig[refund.status] || statusConfig.pending;
            const booking = refund.bookings;
            const instructorName = booking?.instructor_profiles?.profiles?.full_name || 'Instrutor';
            const date = booking?.scheduled_date
              ? new Date(booking.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR')
              : '-';

            return (
              <Card key={refund.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          Aula com {instructorName}
                        </span>
                        <Badge className={config.className}>{config.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Data da aula: {date}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Motivo: {refund.reason}
                      </p>
                      {refund.admin_note && (
                        <p className="text-sm text-red-600 mt-1">
                          Nota do admin: {refund.admin_note}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-foreground">
                        R$ {Number(refund.amount).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(refund.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
