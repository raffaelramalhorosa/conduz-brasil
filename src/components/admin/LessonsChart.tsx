import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChartData {
  month: string;
  aulas: number;
}

export function LessonsChart() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChartData();
    }
  }, [user]);

  const fetchChartData = async () => {
    if (!user) return;

    try {
      const { data: instructorProfile } = await supabase
        .from('instructor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!instructorProfile) {
        setLoading(false);
        return;
      }

      const months: ChartData[] = [];
      const today = new Date();

      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

        const { count } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('instructor_id', instructorProfile.id)
          .eq('status', 'completed')
          .gte('scheduled_date', format(monthStart, 'yyyy-MM-dd'))
          .lte('scheduled_date', format(monthEnd, 'yyyy-MM-dd'));

        months.push({
          month: format(monthDate, 'MMM', { locale: ptBR }),
          aulas: count || 0,
        });
      }

      setChartData(months);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aulas Realizadas (Últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Aulas Realizadas (Últimos 6 meses)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs fill-muted-foreground"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                />
                <Bar
                  dataKey="aulas"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="Aulas"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Nenhuma aula realizada ainda
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
