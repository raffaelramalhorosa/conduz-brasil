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
        .select('id, transaction_date, description, net_amount, status', { count: 'exact' })
        .eq(entityField, entityId)
        .order('transaction_date', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const from = page * PAGE_SIZE;
      query = query.range(from, from + PAGE_SIZE - 1);

      const { data, count, error } = await query;
      if (error) console.error(error);
      setTransactions(data || []);
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

      <Table>
        <TableHeader>
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="text-instructor-text-secondary">Data</TableHead>
            <TableHead className="text-instructor-text-secondary">Descrição</TableHead>
            <TableHead className="text-right text-instructor-text-secondary">Valor</TableHead>
            <TableHead className="text-instructor-text-secondary">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow className="border-white/5">
              <TableCell colSpan={4} className="text-center py-8 text-instructor-text-muted">
                Nenhuma transação encontrada
              </TableCell>
            </TableRow>
          ) : (
            transactions.map(t => (
              <TableRow key={t.id} className="border-white/5 hover:bg-white/5">
                <TableCell className="text-instructor-text-primary">
                  {new Date(t.transaction_date).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-instructor-text-primary">
                  {t.description || '—'}
                </TableCell>
                <TableCell className="text-right font-medium text-green-400">
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
