import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateForStorage } from '@/lib/addressFormatter';

interface TodayAppointment {
  id: string;
  studentName: string;
  time: string;
  category: string;
  vehicle: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

const statusStyles: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmada', className: 'bg-green-100 text-green-700' },
  pending: { label: 'Pendente', className: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Concluída', className: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
  rejected: { label: 'Rejeitada', className: 'bg-red-100 text-red-700' },
  in_progress: { label: 'Em andamento', className: 'bg-purple-100 text-purple-700' },
};

const getStatusStyle = (status: string) => {
  return statusStyles[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
};

export function TodaySchedule() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTodaySchedule();
    }
  }, [user]);

  const fetchTodaySchedule = async () => {
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

      const today = formatDateForStorage(new Date());

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          license_category,
          status,
          student_profiles!inner (
            profiles!inner (
              full_name
            )
          ),
          vehicles (
            brand,
            model
          )
        `)
        .eq('instructor_id', instructorProfile.id)
        .eq('scheduled_date', today)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true });

      if (error) throw error;

      if (data) {
        const mappedAppointments: TodayAppointment[] = data.map((booking: any) => ({
          id: booking.id,
          studentName: booking.student_profiles?.profiles?.full_name || 'Aluno',
          time: booking.start_time.slice(0, 5),
          category: booking.license_category,
          vehicle: booking.vehicles ? `${booking.vehicles.brand} ${booking.vehicles.model}` : 'Veículo',
          status: booking.status as 'pending' | 'confirmed' | 'completed' | 'cancelled',
        }));

        setAppointments(mappedAppointments);
      }
    } catch (error) {
      console.error('Error fetching today schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Agenda Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Agenda Hoje</CardTitle>
        <Link to="/admin/agendamentos" className="text-sm text-primary hover:underline">
          Ver completa
        </Link>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma aula agendada para hoje
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-border" />

            <div className="space-y-4">
              {appointments.map((appointment) => (
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
                      <Badge className={cn('text-xs', getStatusStyle(appointment.status).className)}>
                        {getStatusStyle(appointment.status).label}
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
