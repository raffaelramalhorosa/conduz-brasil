import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Building2, Users, Calendar, Pencil, Settings2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSchoolFinancialData, InstructorFinancialRow, PeriodPreset } from '@/hooks/useSchoolFinancialData';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid,
} from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const PIE_COLORS = [
  'hsl(30, 100%, 50%)',   // orange
  'hsl(217, 91%, 60%)',   // blue
  'hsl(142, 69%, 58%)',   // green
  'hsl(280, 67%, 55%)',   // purple
  'hsl(0, 100%, 71%)',    // red
  'hsl(45, 100%, 50%)',   // yellow
  'hsl(180, 70%, 50%)',   // teal
  'hsl(330, 80%, 60%)',   // pink
];

const periodLabels: Record<PeriodPreset, string> = {
  today: 'Hoje',
  week: 'Esta Semana',
  month: 'Este Mês',
  last_month: 'Último Mês',
  year: 'Este Ano',
  custom: 'Personalizado',
};

export default function SchoolFinancialDashboard() {
  const isMobile = useIsMobile();
  const {
    instructorRows, chartData, totals, isLoading, refetch,
    periodPreset, setPeriodPreset,
    dateFrom, dateTo,
    customDateFrom, setCustomDateFrom, customDateTo, setCustomDateTo,
    instructorProfileId,
  } = useSchoolFinancialData();

  const [selectedInstructor, setSelectedInstructor] = useState<InstructorFinancialRow | null>(null);
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [editIsPercentage, setEditIsPercentage] = useState(true);
  const [editValue, setEditValue] = useState('');

  // Commission settings
  const [showDefaultSettings, setShowDefaultSettings] = useState(false);
  const [defaultType, setDefaultType] = useState<'percentage' | 'fixed'>('percentage');
  const [defaultValue, setDefaultValue] = useState('');

  const handleSaveRate = async (row: InstructorFinancialRow) => {
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0) {
      toast.error('Valor inválido');
      return;
    }

    const updates = editIsPercentage
      ? { commission_rate: val, fixed_fee: 0 }
      : { fixed_fee: val, commission_rate: 0 };

    const { error } = await supabase
      .from('driving_school_instructors')
      .update(updates)
      .eq('id', row.instructorDsiId);

    if (error) {
      toast.error('Erro ao atualizar taxa');
      return;
    }

    toast.success(`Taxa de ${row.instructorName} atualizada!`);
    setEditingRate(null);
    refetch();
  };

  const handleSaveDefaultSettings = async () => {
    if (!instructorProfileId) return;
    const val = parseFloat(defaultValue);
    if (isNaN(val) || val < 0) {
      toast.error('Valor inválido');
      return;
    }

    const { error } = await supabase
      .from('school_commission_settings')
      .upsert({
        driving_school_id: instructorProfileId,
        commission_type: defaultType,
        default_commission_rate: defaultType === 'percentage' ? val : 0,
        default_fixed_fee: defaultType === 'fixed' ? val : 0,
      }, { onConflict: 'driving_school_id' });

    if (error) {
      toast.error('Erro ao salvar configuração padrão');
      return;
    }
    toast.success('Configuração padrão salva!');
  };

  const previewFee = (val: string, isPercentage: boolean) => {
    const v = parseFloat(val);
    if (isNaN(v)) return '—';
    if (isPercentage) return fmt(80 * (v / 100));
    return fmt(v);
  };

  // Pie chart data
  const pieData = instructorRows.map(r => ({
    name: r.instructorName,
    value: r.totalRevenue,
  }));

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 w-full bg-instructor-dark-secondary" />
          ))}
        </div>
        <Skeleton className="h-12 w-full bg-instructor-dark-secondary" />
        <Skeleton className="h-96 w-full bg-instructor-dark-secondary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-instructor-text-primary">Financeiro da Autoescola</h1>
        <p className="text-instructor-text-secondary">Acompanhe receitas, comissões e performance dos instrutores</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Receita Total', value: totals.totalRevenue, icon: DollarSign, color: 'bg-green-500/20', iconColor: 'text-green-400' },
          { label: 'Comissão da Autoescola', value: totals.totalSchoolFees, icon: Building2, color: 'bg-blue-500/20', iconColor: 'text-blue-400' },
          { label: 'Pago a Instrutores', value: totals.totalInstructorPay, icon: Users, color: 'bg-orange-500/20', iconColor: 'text-orange-400' },
          { label: 'Total de Aulas', value: totals.completedBookings, icon: Calendar, color: 'bg-purple-500/20', iconColor: 'text-purple-400', isCurrency: false },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="bg-instructor-dark-secondary rounded-xl p-4 md:p-6 border border-white/5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-instructor-text-secondary truncate">{card.label}</p>
                  <p className="text-lg md:text-2xl font-bold text-instructor-text-primary mt-1">
                    {card.isCurrency === false ? card.value : fmt(card.value)}
                  </p>
                </div>
                <div className={cn('p-2 md:p-3 rounded-lg shrink-0', card.color)}>
                  <card.icon className={cn('h-4 w-4 md:h-5 md:w-5', card.iconColor)} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Period Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {(['today', 'week', 'month', 'last_month', 'year'] as PeriodPreset[]).map(p => (
          <Button
            key={p}
            size="sm"
            variant={periodPreset === p ? 'default' : 'outline'}
            onClick={() => setPeriodPreset(p)}
            className={cn(
              'text-xs md:text-sm',
              periodPreset === p
                ? 'bg-primary text-primary-foreground'
                : 'bg-instructor-dark-tertiary border-white/10 text-instructor-text-secondary hover:text-instructor-text-primary'
            )}
          >
            {periodLabels[p]}
          </Button>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant={periodPreset === 'custom' ? 'default' : 'outline'}
              className={cn(
                'text-xs md:text-sm',
                periodPreset === 'custom'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-instructor-dark-tertiary border-white/10 text-instructor-text-secondary hover:text-instructor-text-primary'
              )}
            >
              {periodPreset === 'custom'
                ? `${format(dateFrom, 'dd/MM')} - ${format(dateTo, 'dd/MM')}`
                : 'Personalizado'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4 bg-instructor-dark-secondary border-white/10" align="start">
            <div className="space-y-3">
              <div>
                <Label className="text-instructor-text-secondary text-xs">De</Label>
                <CalendarComponent
                  mode="single"
                  selected={customDateFrom}
                  onSelect={(d) => { setCustomDateFrom(d); setPeriodPreset('custom'); }}
                  className="p-2 pointer-events-auto"
                />
              </div>
              <div>
                <Label className="text-instructor-text-secondary text-xs">Até</Label>
                <CalendarComponent
                  mode="single"
                  selected={customDateTo}
                  onSelect={(d) => { setCustomDateTo(d); setPeriodPreset('custom'); }}
                  className="p-2 pointer-events-auto"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Over Time */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="bg-instructor-dark-secondary rounded-xl border border-white/5 p-4">
            <h3 className="text-sm font-semibold text-instructor-text-primary mb-4">Receita ao Longo do Tempo</h3>
            <div className="h-[200px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(215, 14%, 67%)', fontSize: 11 }}
                    tickFormatter={(v) => format(new Date(v), 'dd/MM', { locale: ptBR })}
                  />
                  <YAxis tick={{ fill: 'hsl(215, 14%, 67%)', fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(210, 18%, 13%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                    formatter={(v: number, name: string) => [fmt(v), name === 'revenue' ? 'Receita' : 'Comissão']}
                    labelFormatter={(l) => format(new Date(l), "dd 'de' MMMM", { locale: ptBR })}
                  />
                  <Bar dataKey="revenue" name="Receita" fill="hsl(30, 100%, 50%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="commission" name="Comissão" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className="bg-instructor-dark-secondary rounded-xl border border-white/5 p-4">
            <h3 className="text-sm font-semibold text-instructor-text-primary mb-4">Distribuição por Instrutor</h3>
            <div className="h-[200px] md:h-[300px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 40 : 60}
                      outerRadius={isMobile ? 70 : 100}
                      paddingAngle={2}
                      dataKey="value"
                      label={!isMobile ? ({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)` : false}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(210, 18%, 13%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                      formatter={(v: number) => [fmt(v), 'Receita']}
                    />
                    <Legend
                      verticalAlign={isMobile ? 'bottom' : 'middle'}
                      align={isMobile ? 'center' : 'right'}
                      layout={isMobile ? 'horizontal' : 'vertical'}
                      formatter={(value) => <span className="text-instructor-text-secondary text-xs">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-instructor-text-muted text-sm">
                  Nenhum dado para o período
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Revenue per Instructor Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="bg-instructor-dark-secondary rounded-xl border border-white/5">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-instructor-text-primary">Receita por Instrutor</h2>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-instructor-text-secondary">Instrutor</TableHead>
                  <TableHead className="text-right text-instructor-text-secondary">Aulas</TableHead>
                  <TableHead className="text-right text-instructor-text-secondary">Concluídas</TableHead>
                  <TableHead className="text-right text-instructor-text-secondary">Receita</TableHead>
                  <TableHead className="text-right text-instructor-text-secondary">Comissão</TableHead>
                  <TableHead className="text-right text-instructor-text-secondary">A Pagar</TableHead>
                  <TableHead className="text-instructor-text-secondary">Taxa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instructorRows.length === 0 ? (
                  <TableRow className="border-white/5">
                    <TableCell colSpan={7} className="text-center py-8 text-instructor-text-muted">
                      Nenhum instrutor encontrado no período
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {instructorRows.map(row => (
                      <TableRow key={row.instructorDsiId} className="border-white/5 hover:bg-white/5">
                        <TableCell>
                          <button
                            onClick={() => setSelectedInstructor(row)}
                            className="text-instructor-text-primary font-medium hover:text-primary transition-colors text-left"
                          >
                            👤 {row.instructorName}
                          </button>
                        </TableCell>
                        <TableCell className="text-right text-instructor-text-primary">{row.totalBookings}</TableCell>
                        <TableCell className="text-right text-instructor-text-primary">{row.completedBookings}</TableCell>
                        <TableCell className="text-right text-instructor-text-primary">{fmt(row.totalRevenue)}</TableCell>
                        <TableCell className="text-right text-blue-400">{fmt(row.totalSchoolFees)}</TableCell>
                        <TableCell className="text-right text-green-400">{fmt(row.totalInstructorPay)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-instructor-text-primary text-sm">
                              {row.commissionRate > 0 ? `${row.commissionRate.toFixed(1)}%` : fmt(row.fixedFee)}
                            </span>
                            <Popover
                              open={editingRate === row.instructorDsiId}
                              onOpenChange={(open) => {
                                if (open) {
                                  setEditingRate(row.instructorDsiId);
                                  setEditIsPercentage(row.commissionRate > 0);
                                  setEditValue(row.commissionRate > 0 ? String(row.commissionRate) : String(row.fixedFee));
                                } else {
                                  setEditingRate(null);
                                }
                              }}
                            >
                              <PopoverTrigger asChild>
                                <button className="p-1 rounded hover:bg-white/10 transition-colors">
                                  <Pencil className="h-3.5 w-3.5 text-instructor-text-muted" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72 bg-instructor-dark-tertiary border-white/10 p-4" side="left">
                                <div className="space-y-3">
                                  <h4 className="text-sm font-medium text-instructor-text-primary">Editar Taxa</h4>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-instructor-text-secondary text-xs">Percentual (%)</Label>
                                    <Switch checked={editIsPercentage} onCheckedChange={(v) => { setEditIsPercentage(v); setEditValue(''); }} />
                                    <Label className="text-instructor-text-secondary text-xs">
                                      {editIsPercentage ? 'Sim' : 'Valor fixo (R$)'}
                                    </Label>
                                  </div>
                                  <Input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    placeholder={editIsPercentage ? 'Ex: 30' : 'Ex: 15.00'}
                                    className="bg-instructor-dark-secondary border-white/10 text-instructor-text-primary"
                                  />
                                  <p className="text-xs text-instructor-text-muted">
                                    Preview: para uma aula de R$ 80,00, a autoescola receberá {previewFee(editValue, editIsPercentage)}
                                  </p>
                                  <div className="flex gap-2 justify-end">
                                    <Button size="sm" variant="outline" onClick={() => setEditingRate(null)}
                                      className="bg-transparent border-white/10 text-instructor-text-secondary">
                                      Cancelar
                                    </Button>
                                    <Button size="sm" onClick={() => handleSaveRate(row)}>Salvar</Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="border-white/5 bg-white/5 font-semibold">
                      <TableCell className="text-instructor-text-primary">TOTAL</TableCell>
                      <TableCell className="text-right text-instructor-text-primary">{totals.totalBookings}</TableCell>
                      <TableCell className="text-right text-instructor-text-primary">{totals.completedBookings}</TableCell>
                      <TableCell className="text-right text-instructor-text-primary">{fmt(totals.totalRevenue)}</TableCell>
                      <TableCell className="text-right text-blue-400">{fmt(totals.totalSchoolFees)}</TableCell>
                      <TableCell className="text-right text-green-400">{fmt(totals.totalInstructorPay)}</TableCell>
                      <TableCell />
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden p-4 space-y-3">
            {instructorRows.length === 0 ? (
              <p className="text-center py-8 text-instructor-text-muted text-sm">Nenhum instrutor encontrado</p>
            ) : (
              instructorRows.map(row => (
                <div
                  key={row.instructorDsiId}
                  className="bg-instructor-dark-tertiary rounded-lg p-4 border border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedInstructor(row)}
                      className="font-medium text-instructor-text-primary hover:text-primary transition-colors"
                    >
                      👤 {row.instructorName}
                    </button>
                    <Badge className="bg-white/10 text-instructor-text-secondary text-xs">
                      {row.commissionRate > 0 ? `${row.commissionRate.toFixed(1)}%` : fmt(row.fixedFee)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-instructor-text-muted">Aulas:</span>
                      <span className="ml-1 text-instructor-text-primary">{row.completedBookings}/{row.totalBookings}</span>
                    </div>
                    <div>
                      <span className="text-instructor-text-muted">Receita:</span>
                      <span className="ml-1 text-instructor-text-primary">{fmt(row.totalRevenue)}</span>
                    </div>
                    <div>
                      <span className="text-instructor-text-muted">Comissão:</span>
                      <span className="ml-1 text-blue-400">{fmt(row.totalSchoolFees)}</span>
                    </div>
                    <div>
                      <span className="text-instructor-text-muted">A Pagar:</span>
                      <span className="ml-1 text-green-400">{fmt(row.totalInstructorPay)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
            {/* Mobile Totals */}
            {instructorRows.length > 0 && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="font-semibold text-instructor-text-primary text-sm mb-2">TOTAL</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-instructor-text-muted">Aulas:</span> <span className="text-instructor-text-primary">{totals.completedBookings}/{totals.totalBookings}</span></div>
                  <div><span className="text-instructor-text-muted">Receita:</span> <span className="text-instructor-text-primary">{fmt(totals.totalRevenue)}</span></div>
                  <div><span className="text-instructor-text-muted">Comissão:</span> <span className="text-blue-400">{fmt(totals.totalSchoolFees)}</span></div>
                  <div><span className="text-instructor-text-muted">A Pagar:</span> <span className="text-green-400">{fmt(totals.totalInstructorPay)}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Default Commission Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <div className="bg-instructor-dark-secondary rounded-xl border border-white/5 p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="h-5 w-5 text-instructor-text-secondary" />
            <h3 className="text-sm font-semibold text-instructor-text-primary">Taxa Padrão para Novos Instrutores</h3>
          </div>
          <p className="text-xs text-instructor-text-muted mb-4">
            Esta taxa será aplicada automaticamente ao cadastrar um novo instrutor. Você pode alterar individualmente depois.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-instructor-text-secondary text-xs whitespace-nowrap">Tipo:</Label>
              <Button
                size="sm"
                variant={defaultType === 'percentage' ? 'default' : 'outline'}
                onClick={() => setDefaultType('percentage')}
                className={cn(
                  'text-xs',
                  defaultType !== 'percentage' && 'bg-transparent border-white/10 text-instructor-text-secondary'
                )}
              >
                Percentual (%)
              </Button>
              <Button
                size="sm"
                variant={defaultType === 'fixed' ? 'default' : 'outline'}
                onClick={() => setDefaultType('fixed')}
                className={cn(
                  'text-xs',
                  defaultType !== 'fixed' && 'bg-transparent border-white/10 text-instructor-text-secondary'
                )}
              >
                Valor fixo (R$)
              </Button>
            </div>
            <Input
              type="number"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder={defaultType === 'percentage' ? 'Ex: 30' : 'Ex: 15.00'}
              className="w-32 bg-instructor-dark-tertiary border-white/10 text-instructor-text-primary"
            />
            <Button size="sm" onClick={handleSaveDefaultSettings}>Salvar padrão</Button>
          </div>
        </div>
      </motion.div>

      {/* Instructor Detail Dialog */}
      <Dialog open={!!selectedInstructor} onOpenChange={(o) => !o && setSelectedInstructor(null)}>
        <DialogContent className="bg-instructor-dark-secondary border-white/10 text-instructor-text-primary max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedInstructor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  👤 {selectedInstructor.instructorName}
                  <Badge className="bg-white/10 text-instructor-text-secondary text-xs ml-auto">
                    {selectedInstructor.commissionRate > 0
                      ? `${selectedInstructor.commissionRate.toFixed(1)}%`
                      : fmt(selectedInstructor.fixedFee)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: 'Receita Total', value: fmt(selectedInstructor.totalRevenue), color: 'text-instructor-text-primary' },
                  { label: 'Comissão', value: fmt(selectedInstructor.totalSchoolFees), color: 'text-blue-400' },
                  { label: 'A Pagar', value: fmt(selectedInstructor.totalInstructorPay), color: 'text-green-400' },
                ].map(c => (
                  <div key={c.label} className="bg-instructor-dark-tertiary rounded-lg p-3 text-center">
                    <p className="text-[10px] text-instructor-text-muted">{c.label}</p>
                    <p className={cn('text-sm font-bold mt-1', c.color)}>{c.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-instructor-text-muted">Total de Aulas</span>
                  <span className="text-instructor-text-primary">{selectedInstructor.totalBookings}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-instructor-text-muted">Aulas Concluídas</span>
                  <span className="text-instructor-text-primary">{selectedInstructor.completedBookings}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-instructor-text-muted">Preço Médio por Aula</span>
                  <span className="text-instructor-text-primary">{fmt(selectedInstructor.avgClassPrice)}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
