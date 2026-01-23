import { useEffect, useState } from 'react';
import { Users, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { SystemAdminHeader } from '@/components/system-admin/SystemAdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export default function SystemAdminDashboard() {
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('instructor_profiles')
        .select('verification_status');

      if (error) throw error;

      const pending = data?.filter(d => d.verification_status === 'pending').length || 0;
      const approved = data?.filter(d => d.verification_status === 'approved').length || 0;
      const rejected = data?.filter(d => d.verification_status === 'rejected').length || 0;

      setStats({
        pending,
        approved,
        rejected,
        total: data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total de Instrutores',
      value: stats.total,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      title: 'Pendentes de Aprovação',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
    {
      title: 'Aprovados',
      value: stats.approved,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
    },
    {
      title: 'Rejeitados',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      <SystemAdminHeader 
        title="Dashboard do Sistema" 
        subtitle="Visão geral dos cadastros de instrutores"
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="bg-zinc-900 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {loading ? '...' : stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-yellow-400" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <a 
              href="/system-admin/pendentes"
              className="flex items-center gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
            >
              <Clock className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="font-medium text-white">Revisar Pendentes</p>
                <p className="text-sm text-zinc-400">{stats.pending} aguardando</p>
              </div>
            </a>
            <a 
              href="/system-admin/documentos"
              className="flex items-center gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
            >
              <FileText className="h-8 w-8 text-blue-400" />
              <div>
                <p className="font-medium text-white">Ver Documentos</p>
                <p className="text-sm text-zinc-400">Analisar documentação</p>
              </div>
            </a>
            <a 
              href="/system-admin/aprovados"
              className="flex items-center gap-3 p-4 rounded-lg border border-zinc-800 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
            >
              <CheckCircle className="h-8 w-8 text-emerald-400" />
              <div>
                <p className="font-medium text-white">Instrutores Ativos</p>
                <p className="text-sm text-zinc-400">{stats.approved} aprovados</p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
