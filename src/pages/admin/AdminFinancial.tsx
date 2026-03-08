import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBalance } from '@/hooks/useBalance';
import { useMpConnection } from '@/hooks/useMpConnection';
import { BalanceCards } from '@/components/admin/financial/BalanceCards';
import { WithdrawModal } from '@/components/admin/financial/WithdrawModal';
import { TransactionsTable } from '@/components/admin/financial/TransactionsTable';
import { Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import SchoolFinancialDashboard from './SchoolFinancialDashboard';

export default function AdminFinancial() {
  const { profile } = useAuth();

  if (profile?.user_type === 'driving_school') {
    return <SchoolFinancialWithBalance />;
  }

  return <InstructorFinancial />;
}

function InstructorFinancial() {
  const { balance, loading, entityId, refresh, refreshKey } = useBalance();
  const { isConnected, startOAuth } = useMpConnection();

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-instructor-text-primary">Financeiro</h1>
        <p className="text-sm sm:text-base text-instructor-text-secondary">Acompanhe seus ganhos e solicite saques</p>
      </div>

      <BalanceCards
        availableBalance={balance.available_balance}
        pendingBalance={balance.pending_balance}
        totalWithdrawn={balance.total_withdrawn}
        loading={loading}
      />

      <div className="flex justify-end">
        <WithdrawModal
          availableBalance={balance.available_balance}
          instructorId={entityId}
          isMpConnected={isConnected}
          onStartMpOAuth={startOAuth}
          onSuccess={refresh}
        />
      </div>

      <SourceBreakdown instructorId={entityId} />

      <TransactionsTable
        entityId={entityId}
        entityField="instructor_id"
        refreshKey={refreshKey}
      />
    </div>
  );
}

function SchoolFinancialWithBalance() {
  const { balance, loading, entityId, refresh, refreshKey } = useBalance();
  const { isConnected, startOAuth } = useMpConnection();

  return (
    <div className="space-y-0">
      {/* Balance section */}
      <div className="p-6 space-y-6">
        <BalanceCards
          availableBalance={balance.available_balance}
          pendingBalance={balance.pending_balance}
          totalWithdrawn={balance.total_withdrawn}
          loading={loading}
        />

        <div className="flex justify-end">
          <WithdrawModal
            availableBalance={balance.available_balance}
            schoolId={entityId}
            instructorId={null}
            isMpConnected={isConnected}
            onStartMpOAuth={startOAuth}
            onSuccess={refresh}
          />
        </div>

        <TransactionsTable
          entityId={entityId}
          entityField="driving_school_id"
          refreshKey={refreshKey}
        />
      </div>

      {/* Existing school dashboard below */}
      <SchoolFinancialDashboard />
    </div>
  );
}

/** Revenue source breakdown for instructors */
function SourceBreakdown({ instructorId }: { instructorId: string | null }) {
  const [groups, setGroups] = useState<{ source: string; total: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!instructorId) { setLoading(false); return; }
      const { data } = await supabase
        .from('transactions')
        .select('net_amount, booking_id, description')
        .eq('instructor_id', instructorId);

      if (!data || data.length === 0) { setLoading(false); return; }

      // Group by description prefix
      const map: Record<string, { total: number; count: number }> = {};
      data.forEach(t => {
        const key = t.description?.includes('via ') ? t.description.split(' — ')[0] || 'Direto' : 'Direto';
        if (!map[key]) map[key] = { total: 0, count: 0 };
        map[key].total += Number(t.net_amount);
        map[key].count += 1;
      });

      const result = Object.entries(map).map(([source, d]) => ({ source, ...d }));
      setGroups(result);
      setLoading(false);
    };
    fetch();
  }, [instructorId]);

  if (loading || groups.length <= 1) return null;

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="bg-instructor-dark-secondary rounded-xl p-5 border border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-4 w-4 text-instructor-text-secondary" />
        <h3 className="text-sm font-semibold text-instructor-text-primary">Receita por Origem</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(({ source, total, count }) => (
          <div key={source} className="p-3 rounded-lg bg-instructor-dark-tertiary border border-white/5">
            <p className="text-xs text-instructor-text-secondary">{source}</p>
            <p className="text-lg font-bold text-instructor-text-primary mt-1">{fmt(total)}</p>
            <p className="text-[10px] text-instructor-text-muted">{count} aula{count !== 1 ? 's' : ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
