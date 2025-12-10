import { useState } from 'react';
import { Eye, X, MessageCircle, Filter } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockAppointments, Appointment } from '@/data/mockAdminData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusStyles = {
  pending: { label: 'Pendente', className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
  confirmed: { label: 'Confirmada', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  completed: { label: 'Concluída', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
};

export default function AdminAppointments() {
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filterAppointments = (status: Appointment['status']) => {
    return mockAppointments.filter((a) => {
      const matchesStatus = a.status === status;
      const matchesSearch = a.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
      return matchesStatus && matchesSearch && matchesCategory;
    });
  };

  const handleCancel = (id: string) => {
    toast.error('Agendamento cancelado.');
  };

  const renderTable = (appointments: Appointment[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data/Hora</TableHead>
          <TableHead>Aluno</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Veículo</TableHead>
          <TableHead>Local</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              Nenhum agendamento encontrado
            </TableCell>
          </TableRow>
        ) : (
          appointments.map((appointment) => (
            <TableRow key={appointment.id} className="hover:bg-muted/50">
              <TableCell>
                <div>
                  <p className="font-medium">
                    {new Date(appointment.date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm text-muted-foreground">{appointment.time}</p>
                </div>
              </TableCell>
              <TableCell className="font-medium">{appointment.studentName}</TableCell>
              <TableCell>
                <Badge variant="outline">Cat. {appointment.category}</Badge>
              </TableCell>
              <TableCell className="text-sm">{appointment.vehicle}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {appointment.location}
              </TableCell>
              <TableCell>
                <Badge className={cn(statusStyles[appointment.status].className)}>
                  {statusStyles[appointment.status].label}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleCancel(appointment.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div>
      <AdminHeader title="Agendamentos" />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome do aluno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="A">Cat. A</SelectItem>
                  <SelectItem value="B">Cat. B</SelectItem>
                  <SelectItem value="AB">Cat. AB</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Mais Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs & Table */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b px-4">
              <TabsList className="bg-transparent h-auto p-0 gap-4">
                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-4"
                >
                  Pendentes
                  <Badge className="ml-2 bg-orange-500 text-white hover:bg-orange-500">
                    {filterAppointments('pending').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="confirmed"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-4"
                >
                  Confirmadas
                  <Badge className="ml-2 bg-green-500 text-white hover:bg-green-500">
                    {filterAppointments('confirmed').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-4"
                >
                  Concluídas
                </TabsTrigger>
                <TabsTrigger
                  value="cancelled"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-4"
                >
                  Canceladas
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="pending" className="mt-0">
              {renderTable(filterAppointments('pending'))}
            </TabsContent>
            <TabsContent value="confirmed" className="mt-0">
              {renderTable(filterAppointments('confirmed'))}
            </TabsContent>
            <TabsContent value="completed" className="mt-0">
              {renderTable(filterAppointments('completed'))}
            </TabsContent>
            <TabsContent value="cancelled" className="mt-0">
              {renderTable(filterAppointments('cancelled'))}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
