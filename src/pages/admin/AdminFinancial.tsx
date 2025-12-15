import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Wallet, ArrowUpRight } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
  id: string;
  date: string;
  studentName: string;
  grossValue: number;
  fee: number;
  netValue: number;
  status: 'pending' | 'available' | 'withdrawn';
}

const statusStyles: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
  available: { label: 'Disponível', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  withdrawn: { label: 'Sacado', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
};

export default function AdminFinancial() {
  const { profile } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [instructorId, setInstructorId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstructorId = async () => {
      if (!profile?.id) return;
      
      const { data } = await supabase
        .from('instructor_profiles')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();
      
      if (data) {
        setInstructorId(data.id);
      }
    };
    
    fetchInstructorId();
  }, [profile?.id]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!instructorId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            id,
            transaction_date,
            gross_amount,
            platform_fee,
            net_amount,
            status,
            student_id
          `)
          .eq('instructor_id', instructorId)
          .order('transaction_date', { ascending: false });

        if (error) throw error;

        const studentIds = [...new Set(data?.map(t => t.student_id) || [])];
        
        let studentNames: Record<string, string> = {};
        if (studentIds.length > 0) {
          const { data: students } = await supabase
            .from('student_profiles')
            .select('id, user_id')
            .in('id', studentIds);
          
          if (students) {
            const userIds = students.map(s => s.user_id);
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', userIds);
            
            students.forEach(s => {
              const p = profiles?.find(pr => pr.id === s.user_id);
              if (p) studentNames[s.id] = p.full_name;
            });
          }
        }

        const mapped: Transaction[] = (data || []).map(t => ({
          id: t.id,
          date: t.transaction_date || new Date().toISOString(),
          studentName: studentNames[t.student_id] || 'Aluno',
          grossValue: t.gross_amount,
          fee: t.platform_fee,
          netValue: t.net_amount,
          status: t.status as 'pending' | 'available' | 'withdrawn',
        }));

        setTransactions(mapped);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [instructorId]);

  const filteredTransactions = transactions.filter((t) =>
    statusFilter === 'all' ? true : t.status === statusFilter
  );

  const totalToReceive = transactions
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + t.netValue, 0);

  const totalAvailable = transactions
    .filter((t) => t.status === 'available')
    .reduce((sum, t) => sum + t.netValue, 0);

  const totalWithdrawn = transactions
    .filter((t) => t.status === 'withdrawn')
    .reduce((sum, t) => sum + t.netValue, 0);

  const handleWithdraw = () => {
    toast.success('Solicitação de saque enviada com sucesso!');
    setIsWithdrawOpen(false);
    setWithdrawAmount('');
  };

  if (loading) {
    return (
      <div>
        <AdminHeader title="Financeiro" />
        <div className="p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="Financeiro" />

      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">A receber</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    R$ {totalToReceive.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Disponível para saque</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    R$ {totalAvailable.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total sacado</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    R$ {totalWithdrawn.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Wallet className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={totalAvailable < 50}>
                <ArrowUpRight className="h-4 w-4" />
                Solicitar Saque
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar Saque</DialogTitle>
                <DialogDescription>
                  Digite o valor que deseja sacar. O valor mínimo é R$ 50,00.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor disponível</label>
                  <p className="text-2xl font-bold text-primary">
                    R$ {totalAvailable.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor do saque</label>
                  <Input
                    type="number"
                    placeholder="R$ 0,00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsWithdrawOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleWithdraw}>Confirmar Saque</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Transações</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="withdrawn">Sacado</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead className="text-right">Valor Bruto</TableHead>
                  <TableHead className="text-right">Taxa (12%)</TableHead>
                  <TableHead className="text-right">Valor Líquido</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-muted/50">
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium">{transaction.studentName}</TableCell>
                      <TableCell className="text-right">
                        R$ {transaction.grossValue.toFixed(2).replace('.', ',')}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        -R$ {transaction.fee.toFixed(2).replace('.', ',')}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        R$ {transaction.netValue.toFixed(2).replace('.', ',')}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(statusStyles[transaction.status]?.className)}>
                          {statusStyles[transaction.status]?.label || transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
