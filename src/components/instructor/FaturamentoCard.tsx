import { TrendingUp, TrendingDown, DollarSign, Calendar, Inbox } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface FaturamentoCardProps {
  valorAtual?: number;
  variacao?: number;
  historico?: Array<{ mes: string; valor: number; aulas: number }>;
  loading?: boolean;
}

export function FaturamentoCard({ 
  valorAtual = 0, 
  variacao = 0,
  historico = [],
  loading = false,
}: FaturamentoCardProps) {
  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  const totalPeriodo = historico.reduce((acc, curr) => acc + curr.valor, 0);
  const mediaMensal = historico.length > 0 ? Math.round(totalPeriodo / historico.length) : 0;
  const totalAulas = historico.reduce((acc, curr) => acc + curr.aulas, 0);

  const hasData = historico.length > 0 && totalPeriodo > 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
          <p className="text-foreground font-medium mb-1">{label}</p>
          <p className="text-primary text-sm">
            R$ {payload[0].value.toLocaleString('pt-BR')}
          </p>
          <p className="text-muted-foreground text-xs">
            {payload[0].payload.aulas} aulas
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden p-6">
        <div className="flex items-start gap-4 mb-4">
          <Skeleton className="w-12 h-12 rounded-xl bg-muted" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 bg-muted mb-2" />
            <Skeleton className="h-8 w-40 bg-muted" />
          </div>
        </div>
        <Skeleton className="h-[200px] w-full bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-foreground">Faturamento</h3>
                <div className="flex items-center gap-1 text-instructor-text-muted text-xs">
                  <Calendar className="w-3 h-3" />
                  {mesAtual}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-foreground">
                  R$ {valorAtual.toLocaleString('pt-BR')}
                </span>
                {variacao !== 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    variacao >= 0 
                      ? 'bg-instructor-success/10 text-instructor-success' 
                      : 'bg-instructor-danger/10 text-instructor-danger'
                  }`}>
                    {variacao >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {variacao >= 0 ? '+' : ''}{variacao}%
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Select defaultValue="6m">
            <SelectTrigger className="w-[100px] bg-muted border-border text-foreground text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6m">6 Meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Chart or Empty State */}
      {hasData ? (
        <>
          <div className="h-[200px] px-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historico} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="mes" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="valor" 
                  name="Receita" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Footer Stats */}
          <div className="grid grid-cols-3 gap-4 p-6 pt-4 border-t border-border mt-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total (6m)</p>
              <p className="text-lg font-semibold text-foreground">
                R$ {totalPeriodo.toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Média/mês</p>
              <p className="text-lg font-semibold text-foreground">
                R$ {mediaMensal.toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total aulas</p>
              <p className="text-lg font-semibold text-foreground">{totalAulas}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="px-6 pb-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm">
              Você ainda não tem faturamento
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Complete aulas para ver seu histórico aqui
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
