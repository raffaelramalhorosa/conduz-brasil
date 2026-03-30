import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Download, Search, Shield, ChevronDown, ChevronUp } from 'lucide-react';

const ACTION_OPTIONS = [
  { value: 'all', label: 'Todas as ações' },
  { value: 'booking.created', label: 'Aula agendada' },
  { value: 'booking.status_changed', label: 'Status aula alterado' },
  { value: 'booking.payment_changed', label: 'Pagamento aula alterado' },
  { value: 'payment.approved', label: 'Pagamento aprovado' },
  { value: 'payment.refunded', label: 'Pagamento reembolsado' },
  { value: 'refund.processed', label: 'Reembolso processado' },
  { value: 'subscription.created', label: 'Assinatura criada' },
  { value: 'subscription.cancelled', label: 'Assinatura cancelada' },
  { value: 'withdrawal.processed', label: 'Saque processado' },
];

const USER_TYPE_OPTIONS = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'student', label: 'Aluno' },
  { value: 'instructor', label: 'Instrutor' },
  { value: 'school', label: 'Autoescola' },
  { value: 'admin', label: 'Admin' },
  { value: 'system', label: 'Sistema' },
];

const PAGE_SIZE = 50;

function userTypeBadge(type: string | null) {
  const map: Record<string, { label: string; className: string }> = {
    student: { label: 'Aluno', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    instructor: { label: 'Instrutor', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    school: { label: 'Autoescola', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    admin: { label: 'Admin', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    system: { label: 'Sistema', className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  };
  const info = map[type || ''] || { label: type || '—', className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' };
  return <Badge variant="outline" className={info.className}>{info.label}</Badge>;
}

export default function AuditLogs() {
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['audit-logs', page, actionFilter, userTypeFilter, searchTerm, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (actionFilter !== 'all') query = query.eq('action', actionFilter);
      if (userTypeFilter !== 'all') query = query.eq('user_type', userTypeFilter);
      if (startDate) query = query.gte('created_at', `${startDate}T00:00:00Z`);
      if (endDate) query = query.lte('created_at', `${endDate}T23:59:59Z`);
      if (searchTerm) query = query.or(`user_email.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

      const { data, error, count } = await query;
      if (error) throw error;
      return { logs: data || [], total: count || 0 };
    },
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleExportCSV = () => {
    if (!logs.length) return;
    const headers = ['id', 'created_at', 'user_email', 'user_type', 'action', 'resource_type', 'resource_id', 'description', 'metadata'];
    const rows = logs.map((l: any) =>
      headers.map(h => {
        const val = h === 'metadata' ? JSON.stringify(l[h]) : (l[h] ?? '');
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const s = startDate || 'inicio';
    const e = endDate || 'fim';
    a.href = url;
    a.download = `audit_log_${s}_${e}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-yellow-400/20 flex items-center justify-center">
          <Shield className="h-5 w-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Auditoria</h1>
          <p className="text-sm text-zinc-400">Rastreamento de ações do sistema</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Data início</label>
              <Input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(0); }} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Data fim</label>
              <Input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(0); }} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Ação</label>
              <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(0); }}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Tipo usuário</label>
              <Select value={userTypeFilter} onValueChange={v => { setUserTypeFilter(v); setPage(0); }}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Email ou descrição"
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
                  className="pl-9 bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-lg">
            {total} registro{total !== 1 ? 's' : ''}
            {isFetching && <span className="text-zinc-500 text-sm ml-2">carregando...</span>}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!logs.length} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Data/hora</TableHead>
                <TableHead className="text-zinc-400">Usuário</TableHead>
                <TableHead className="text-zinc-400">Tipo</TableHead>
                <TableHead className="text-zinc-400">Ação</TableHead>
                <TableHead className="text-zinc-400">Recurso</TableHead>
                <TableHead className="text-zinc-400">Descrição</TableHead>
                <TableHead className="text-zinc-400 w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-zinc-800">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-zinc-800 rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={7} className="text-center text-zinc-500 py-12">Nenhum registro encontrado</TableCell>
                </TableRow>
              ) : (
                logs.map((log: any) => (
                  <>
                    <TableRow
                      key={log.id}
                      className="border-zinc-800 cursor-pointer hover:bg-zinc-800/50"
                      onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                    >
                      <TableCell className="text-zinc-300 text-xs whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-zinc-300 text-xs max-w-[150px] truncate">{log.user_email || log.user_id?.slice(0, 8) || '—'}</TableCell>
                      <TableCell>{userTypeBadge(log.user_type)}</TableCell>
                      <TableCell><Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">{log.action}</Badge></TableCell>
                      <TableCell className="text-zinc-400 text-xs">{log.resource_type || '—'}</TableCell>
                      <TableCell className="text-zinc-300 text-xs max-w-[250px] truncate">{log.description || '—'}</TableCell>
                      <TableCell>
                        {expandedRow === log.id ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
                      </TableCell>
                    </TableRow>
                    {expandedRow === log.id && (
                      <TableRow key={`${log.id}-detail`} className="border-zinc-800 bg-zinc-950">
                        <TableCell colSpan={7} className="p-4">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-zinc-500">User ID:</span>
                              <span className="text-zinc-300 ml-2 font-mono">{log.user_id || '—'}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Resource ID:</span>
                              <span className="text-zinc-300 ml-2 font-mono">{log.resource_id || '—'}</span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="text-zinc-500 text-xs">Metadata:</span>
                            <pre className="mt-1 p-3 bg-zinc-900 rounded border border-zinc-800 text-xs text-zinc-300 overflow-auto max-h-48">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
              <span className="text-xs text-zinc-500">
                Página {page + 1} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
