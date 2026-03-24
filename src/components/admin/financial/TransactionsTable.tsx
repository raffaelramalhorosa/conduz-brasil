import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const CREDIT_BADGE = 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30';
const DEBIT_BADGE  = 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30';

// MP payment_method_detail values
const paymentTypeStyles: Record<string, string> = {
  credit_card: CREDIT_BADGE,
  debit_card:  DEBIT_BADGE,
};

// MP payment_method values (card brands / method ids)
const brandLabels: Record<string, string> = {
  master:      'Mastercard',
  visa:        'Visa',
  elo:         'Elo',
  amex:        'Amex',
  hipercard:   'Hipercard',
  pix:         'Pix',
  account_money: 'Saldo MP',
};

function resolvePayment(method: string | null, detail: string | null): { label: string; className: string } | null {
  if (!method) return null;
  if (method === 'pix')
    return { label: 'Pix', className: 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30' };
  if (method === 'account_money')
    return { label: 'Saldo MP', className: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' };

  const brand = brandLabels[method] ?? method;
  const typeLabel = detail === 'debit_card' ? 'Débito' : 'Crédito';
  const className = paymentTypeStyles[detail ?? ''] ?? CREDIT_BADGE;
  return { label: `${brand} ${typeLabel}`, className };
}

const statusStyles: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' },
  available: { label: 'Disponível', className: 'bg-green-500/20 text-green-400 hover:bg-green-500/30' },
  withdrawn: { label: 'Sacado', className: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' },
  reversed: { label: 'Estornado', className: 'bg-white/10 text-instructor-text-muted hover:bg-white/15' },
};

interface Transaction {
  id: string;
  transaction_date: string;
  description: string | null;
  net_amount: number;
  status: string;
  booking_id: string | null;
  student_id: string | null;
  // enriched after fetch
  studentName?: string;
  vehicleLabel?: string;
  paymentMethod?: string | null;
  paymentMethodDetail?: string | null;
}

const PAGE_SIZE = 10;

interface TransactionsTableProps {
  entityId: string | null;
  entityField: 'instructor_id' | 'driving_school_id';
  refreshKey?: number;
}

export function TransactionsTable({ entityId, entityField, refreshKey }: TransactionsTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  useEffect(() => {
    const fetch = async () => {
      if (!entityId) { setLoading(false); return; }
      setLoading(true);

      let query = supabase
        .from('transactions')
        .select('id, transaction_date, description, net_amount, status, booking_id, student_id', { count: 'exact' })
        .eq(entityField, entityId)
        .order('transaction_date', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const from = page * PAGE_SIZE;
      query = query.range(from, from + PAGE_SIZE - 1);

      const { data, count, error } = await query;
      if (error) { console.error(error); setLoading(false); return; }

      const rows: Transaction[] = data || [];

      const bookingIds = [...new Set(rows.map(r => r.booking_id).filter(Boolean))] as string[];

      const [bookingsRes, chargesRes] = await Promise.all([
        bookingIds.length > 0
          ? supabase
              .from('bookings')
              .select('id, vehicles(brand, model, license_plate), student_profiles(full_name)')
              .in('id', bookingIds)
          : Promise.resolve({ data: [], error: null }),
        bookingIds.length > 0
          ? supabase
              .from('payment_charges')
              .select('booking_id, payment_method, payment_method_detail, payer_name')
              .in('booking_id', bookingIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const bookingMap = Object.fromEntries(
        (bookingsRes.data || []).map((b: any) => [b.id, b])
      );
      const chargeMap = Object.fromEntries(
        (chargesRes.data || []).map((c: any) => [c.booking_id, c])
      );

      const enriched = rows.map(r => {
        const booking = r.booking_id ? bookingMap[r.booking_id] : null;
        const charge = r.booking_id ? chargeMap[r.booking_id] : null;
        const vehicle = booking?.vehicles;
        const studentName =
          booking?.student_profiles?.full_name ?? charge?.payer_name ?? undefined;
        return {
          ...r,
          studentName,
          vehicleLabel: vehicle
            ? `${vehicle.brand} ${vehicle.model} · ${vehicle.license_plate}`
            : undefined,
          paymentMethod: charge?.payment_method ?? null,
          paymentMethodDetail: charge?.payment_method_detail ?? null,
        };
      });

      setTransactions(enriched);
      setTotal(count || 0);
      setLoading(false);
    };
    fetch();
  }, [entityId, entityField, statusFilter, page, refreshKey]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (loading && transactions.length === 0) {
    return <Skeleton className="h-96 w-full bg-instructor-dark-secondary" />;
  }

  return (
    <div className="bg-instructor-dark-secondary rounded-xl border border-white/5">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <h2 className="text-lg font-semibold text-instructor-text-primary">Transações</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-instructor-dark-tertiary border-white/10 text-instructor-text-primary">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-instructor-dark-tertiary border-white/10">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="available">Disponível</SelectItem>
            <SelectItem value="withdrawn">Sacado</SelectItem>
            <SelectItem value="reversed">Estornado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
      <Table className="min-w-[700px]">
        <TableHeader>
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="text-instructor-text-secondary">Data</TableHead>
            <TableHead className="text-instructor-text-secondary">Aluno</TableHead>
            <TableHead className="text-instructor-text-secondary">Veículo</TableHead>
            <TableHead className="text-instructor-text-secondary">Descrição</TableHead>
            <TableHead className="text-instructor-text-secondary">Pagamento</TableHead>
            <TableHead className="text-right text-instructor-text-secondary">Valor</TableHead>
            <TableHead className="text-instructor-text-secondary">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow className="border-white/5">
              <TableCell colSpan={7} className="text-center py-8 text-instructor-text-muted">
                Nenhuma transação encontrada
              </TableCell>
            </TableRow>
          ) : (
            transactions.map(t => (
              <TableRow key={t.id} className="border-white/5 hover:bg-white/5">
                <TableCell className="text-instructor-text-primary whitespace-nowrap">
                  {new Date(t.transaction_date).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-instructor-text-primary">
                  {t.studentName || '—'}
                </TableCell>
                <TableCell className="text-instructor-text-primary whitespace-nowrap">
                  {t.vehicleLabel || '—'}
                </TableCell>
                <TableCell className="text-instructor-text-primary">
                  {t.description || '—'}
                </TableCell>
                <TableCell>
                  {(() => {
                    const p = resolvePayment(t.paymentMethod ?? null, t.paymentMethodDetail ?? null);
                    return p
                      ? <Badge className={cn(p.className)}>{p.label}</Badge>
                      : '—';
                  })()}
                </TableCell>
                <TableCell className="text-right font-medium text-green-400 whitespace-nowrap">
                  {fmt(t.net_amount)}
                </TableCell>
                <TableCell>
                  <Badge className={cn(statusStyles[t.status]?.className)}>
                    {statusStyles[t.status]?.label || t.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-white/5">
          <p className="text-xs text-instructor-text-muted">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
          </p>
          <div className="flex gap-1">
            <Button
              size="sm" variant="outline" disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="bg-transparent border-white/10 text-instructor-text-secondary h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm" variant="outline" disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="bg-transparent border-white/10 text-instructor-text-secondary h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
