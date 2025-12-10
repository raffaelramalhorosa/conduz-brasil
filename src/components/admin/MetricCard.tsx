import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  variant: 'blue' | 'orange' | 'green' | 'purple';
}

const variantStyles = {
  blue: 'bg-blue-500/10 text-blue-600',
  orange: 'bg-orange-500/10 text-orange-600',
  green: 'bg-green-500/10 text-green-600',
  purple: 'bg-purple-500/10 text-purple-600',
};

export function MetricCard({ title, value, subtitle, icon: Icon, variant }: MetricCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className={cn('p-3 rounded-lg', variantStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
