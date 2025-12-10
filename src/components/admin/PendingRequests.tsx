import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockAppointments, Appointment } from '@/data/mockAdminData';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmAppointmentModal } from './ConfirmAppointmentModal';

export function PendingRequests() {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);
  
  const pendingAppointments = mockAppointments
    .filter((a) => a.status === 'pending' && !confirmedIds.includes(a.id))
    .slice(0, 4);

  const handleAcceptClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleConfirm = (appointmentId: string) => {
    setConfirmedIds((prev) => [...prev, appointmentId]);
  };

  const handleReject = (id: string) => {
    toast.error('Solicitação recusada.');
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Solicitações Pendentes</CardTitle>
          <Link to="/admin/agendamentos" className="text-sm text-primary hover:underline">
            Ver todas
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingAppointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma solicitação pendente
            </p>
          ) : (
            pendingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={appointment.studentPhoto} alt={appointment.studentName} />
                  <AvatarFallback>{appointment.studentName.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {appointment.studentName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Quer agendar {appointment.lessonsCount} aula{appointment.lessonsCount > 1 ? 's' : ''} de Cat. {appointment.category}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                    onClick={() => handleAcceptClick(appointment)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                    onClick={() => handleReject(appointment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ConfirmAppointmentModal
        open={!!selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
        appointment={selectedAppointment}
        onConfirm={handleConfirm}
      />
    </>
  );
}
