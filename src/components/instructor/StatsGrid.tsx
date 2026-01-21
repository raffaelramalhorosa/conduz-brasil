import { Calendar, Clock, Star, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down';
  suffix?: string;
  highlight?: boolean;
}

function StatCard({ icon, iconBg, label, value, change, trend, suffix, highlight }: StatCardProps) {
  return (
    <div className={cn(
      "bg-instructor-dark-secondary rounded-xl p-4 border transition-all hover:scale-[1.02]",
      highlight ? "border-primary/30" : "border-white/5 hover:border-white/10"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBg)}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend === 'up' 
              ? "bg-instructor-success/10 text-instructor-success" 
              : "bg-instructor-danger/10 text-instructor-danger"
          )}>
            {trend === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(change)}%
          </div>
        )}
        {highlight && !change && (
          <span className="text-xs text-primary font-medium">Ação</span>
        )}
      </div>
      
      <p className="text-xs text-instructor-text-muted mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{value}</span>
        {suffix && <span className="text-sm text-instructor-text-muted">{suffix}</span>}
      </div>
    </div>
  );
}

interface StatsGridProps {
  proximasAulas?: number;
  aulasPendentes?: number;
  avaliacaoMedia?: number;
  alunosAtivos?: number;
}

export function StatsGrid({ 
  proximasAulas = 8, 
  aulasPendentes = 3, 
  avaliacaoMedia = 4.9, 
  alunosAtivos = 15 
}: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={<Calendar className="w-5 h-5 text-instructor-info" />}
        iconBg="bg-instructor-info/20"
        label="Próximas Aulas"
        value={proximasAulas}
        change={12}
        trend="up"
      />
      
      <StatCard
        icon={<Clock className="w-5 h-5 text-primary" />}
        iconBg="bg-primary/20"
        label="Aulas Pendentes"
        value={aulasPendentes}
        suffix="aguardando"
        highlight
      />
      
      <StatCard
        icon={<Star className="w-5 h-5 text-primary" />}
        iconBg="bg-primary/20"
        label="Avaliação Média"
        value={avaliacaoMedia}
        suffix="/5.0"
      />
      
      <StatCard
        icon={<Users className="w-5 h-5 text-purple-400" />}
        iconBg="bg-purple-500/20"
        label="Alunos Ativos"
        value={alunosAtivos}
        change={8}
        trend="up"
      />
    </div>
  );
}
