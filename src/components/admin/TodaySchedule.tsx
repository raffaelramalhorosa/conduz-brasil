import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockAppointments } from '@/data/mockAdminData';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const statusStyles = {
  confirmed: { label: 'Confirmada', className: 'bg-green-100 text-green-700' },
  pending: { label: 'Pendente', className: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Concluída', className: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
};

export function TodaySchedule() {
  const todayAppointments = mockAppointments
    .filter((a) => a.date === '2024-12-10' && a.status !== 'cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Agenda Hoje</CardTitle>
        <Link to="/admin/agendamentos" className="text-sm text-primary hover:underline">
          Ver completa
        </Link>
      </CardHeader>
      <CardContent>
        {todayAppointments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma aula agendada para hoje
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-border" />

            <div className="space-y-4">
              {todayAppointments.map((appointment, index) => (
                <div key={appointment.id} className="relative flex gap-4 pl-10">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'absolute left-[11px] w-4 h-4 rounded-full border-2 border-background',
                      appointment.status === 'confirmed' ? 'bg-green-500' : 'bg-orange-500'
                    )}
                  />

                  <div className="flex-1 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-semibold text-foreground">{appointment.time}</span>
                      <Badge className={cn('text-xs', statusStyles[appointment.status].className)}>
                        {statusStyles[appointment.status].label}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {appointment.studentName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cat {appointment.category} • {appointment.vehicle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
