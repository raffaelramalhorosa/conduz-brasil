import { Calendar, Clock, Check, DollarSign } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MetricCard } from '@/components/admin/MetricCard';
import { PendingRequests } from '@/components/admin/PendingRequests';
import { TodaySchedule } from '@/components/admin/TodaySchedule';
import { LessonsChart } from '@/components/admin/LessonsChart';
import { RecentReviews } from '@/components/admin/RecentReviews';

export default function AdminDashboard() {
  return (
    <div>
      <AdminHeader title="Dashboard" />
      
      <div className="p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Próximas Aulas"
            value={8}
            subtitle="Nos próximos 7 dias"
            icon={Calendar}
            variant="blue"
          />
          <MetricCard
            title="Aulas Pendentes"
            value={3}
            subtitle="Aguardando confirmação"
            icon={Clock}
            variant="orange"
          />
          <MetricCard
            title="Taxa de Aceitação"
            value="94%"
            subtitle="Últimos 30 dias"
            icon={Check}
            variant="green"
          />
          <MetricCard
            title="Faturamento Mensal"
            value="R$ 3.240"
            subtitle="Dezembro 2024"
            icon={DollarSign}
            variant="purple"
          />
        </div>

        {/* Pending Requests & Today Schedule */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <PendingRequests />
          </div>
          <div className="lg:col-span-2">
            <TodaySchedule />
          </div>
        </div>

        {/* Lessons Chart */}
        <LessonsChart />

        {/* Recent Reviews */}
        <RecentReviews />
      </div>
    </div>
  );
}
