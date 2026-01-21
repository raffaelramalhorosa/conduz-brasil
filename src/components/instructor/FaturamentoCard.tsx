import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
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

interface FaturamentoCardProps {
  valorAtual?: number;
  variacao?: number;
  historico?: Array<{ mes: string; valor: number; aulas: number }>;
}

export function FaturamentoCard({ 
  valorAtual = 3240, 
  variacao = 8.5,
  historico 
}: FaturamentoCardProps) {
  const mesAtual = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  
  const chartData = historico || [
    { mes: 'Ago', valor: 2200, aulas: 18 },
    { mes: 'Set', valor: 2800, aulas: 22 },
    { mes: 'Out', valor: 2100, aulas: 17 },
    { mes: 'Nov', valor: 3100, aulas: 25 },
    { mes: 'Dez', valor: 2900, aulas: 23 },
    { mes: 'Jan', valor: 3240, aulas: 26 },
  ];

  const totalPeriodo = chartData.reduce((acc, curr) => acc + curr.valor, 0);
  const mediaMensal = Math.round(totalPeriodo / chartData.length);
  const totalAulas = chartData.reduce((acc, curr) => acc + curr.aulas, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-instructor-dark-tertiary border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-1">{label}</p>
          <p className="text-primary text-sm">
            R$ {payload[0].value.toLocaleString('pt-BR')}
          </p>
          <p className="text-instructor-text-muted text-xs">
            {payload[0].payload.aulas} aulas
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-instructor-dark-secondary rounded-xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-white">Faturamento</h3>
                <div className="flex items-center gap-1 text-instructor-text-muted text-xs">
                  <Calendar className="w-3 h-3" />
                  {mesAtual}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-white">
                  R$ {valorAtual.toLocaleString('pt-BR')}
                </span>
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
              </div>
            </div>
          </div>
          
          <Select defaultValue="6m">
            <SelectTrigger className="w-[100px] bg-white/5 border-white/10 text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-instructor-dark-tertiary border-white/10">
              <SelectItem value="1m" className="text-white hover:bg-white/5 focus:bg-white/5 focus:text-white">1 Mês</SelectItem>
              <SelectItem value="3m" className="text-white hover:bg-white/5 focus:bg-white/5 focus:text-white">3 Meses</SelectItem>
              <SelectItem value="6m" className="text-white hover:bg-white/5 focus:bg-white/5 focus:text-white">6 Meses</SelectItem>
              <SelectItem value="1y" className="text-white hover:bg-white/5 focus:bg-white/5 focus:text-white">1 Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-[200px] px-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(43, 98%, 54%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(43, 98%, 54%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="mes" 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="valor"
              stroke="hsl(43, 98%, 54%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorFaturamento)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Footer Stats */}
      <div className="grid grid-cols-3 gap-4 p-6 pt-4 border-t border-white/5 mt-4">
        <div>
          <p className="text-xs text-instructor-text-muted mb-1">Total (6m)</p>
          <p className="text-lg font-semibold text-white">
            R$ {totalPeriodo.toLocaleString('pt-BR')}
          </p>
        </div>
        <div>
          <p className="text-xs text-instructor-text-muted mb-1">Média/mês</p>
          <p className="text-lg font-semibold text-white">
            R$ {mediaMensal.toLocaleString('pt-BR')}
          </p>
        </div>
        <div>
          <p className="text-xs text-instructor-text-muted mb-1">Total aulas</p>
          <p className="text-lg font-semibold text-white">{totalAulas}</p>
        </div>
      </div>
    </div>
  );
}
