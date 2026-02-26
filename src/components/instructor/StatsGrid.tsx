import { Calendar, Clock, Star, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInstrutorData } from '@/hooks/useInstrutorData';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down';
  suffix?: string;
  highlight?: boolean;
  loading?: boolean;
}

function StatCard({ icon, iconBg, label, value, change, trend, suffix, highlight, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-instructor-dark-secondary rounded-xl p-4 border border-border">
        <Skeleton className="w-10 h-10 rounded-lg bg-muted mb-3" />
        <Skeleton className="h-3 w-20 bg-muted mb-2" />
        <Skeleton className="h-7 w-16 bg-muted" />
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-instructor-dark-secondary rounded-xl p-4 border transition-all hover:scale-[1.02]",
      highlight ? "border-primary/30" : "border-border hover:border-border"
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
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {suffix && <span className="text-sm text-instructor-text-muted">{suffix}</span>}
      </div>
    </div>
  );
}

export function StatsGrid() {
  const { stats, loading } = useInstrutorData();
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={<Calendar className="w-5 h-5 text-instructor-info" />}
        iconBg="bg-instructor-info/20"
        label="Próximas Aulas"
        value={stats?.proximasAulas ?? 0}
        loading={loading}
      />
      
      <StatCard
        icon={<Clock className="w-5 h-5 text-primary" />}
        iconBg="bg-primary/20"
        label="Aulas Pendentes"
        value={stats?.aulasPendentes ?? 0}
        suffix="aguardando"
        highlight
        loading={loading}
      />
      
      <StatCard
        icon={<Star className="w-5 h-5 text-primary" />}
        iconBg="bg-primary/20"
        label="Avaliação Média"
        value={stats?.avaliacaoMedia?.toFixed(1) ?? "0.0"}
        suffix={`(${stats?.totalAvaliacoes ?? 0})`}
        loading={loading}
      />
      
      <StatCard
        icon={<Users className="w-5 h-5 text-purple-400" />}
        iconBg="bg-purple-500/20"
        label="Alunos Ativos"
        value={stats?.alunosAtivos ?? 0}
        loading={loading}
      />
    </div>
  );
}
