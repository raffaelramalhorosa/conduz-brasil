import { DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface BalanceCardsProps {
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  loading: boolean;
}

export function BalanceCards({ availableBalance, pendingBalance, totalWithdrawn, loading }: BalanceCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-28 w-full bg-instructor-dark-secondary" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Saldo disponível', value: availableBalance, icon: DollarSign, color: 'bg-green-500/20', iconColor: 'text-green-400' },
    { label: 'Saldo a liberar', value: pendingBalance, icon: TrendingUp, color: 'bg-orange-500/20', iconColor: 'text-orange-400' },
    { label: 'Total sacado', value: totalWithdrawn, icon: Wallet, color: 'bg-purple-500/20', iconColor: 'text-purple-400' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map(card => (
        <div key={card.label} className="bg-instructor-dark-secondary rounded-xl p-6 border border-white/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-instructor-text-secondary">{card.label}</p>
              <p className="text-2xl font-bold text-instructor-text-primary mt-1">
                {fmt(card.value)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${card.color}`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
