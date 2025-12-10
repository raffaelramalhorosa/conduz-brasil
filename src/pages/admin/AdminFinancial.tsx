import { useState } from 'react';
import { DollarSign, TrendingUp, Wallet, ArrowUpRight } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { mockTransactions, Transaction } from '@/data/mockAdminData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusStyles = {
  pending: { label: 'Pendente', className: 'bg-orange-100 text-orange-700 hover:bg-orange-100' },
  paid: { label: 'Pago', className: 'bg-green-100 text-green-700 hover:bg-green-100' },
  processing: { label: 'Processando', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
};

export default function AdminFinancial() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const filteredTransactions = mockTransactions.filter((t) =>
    statusFilter === 'all' ? true : t.status === statusFilter
  );

  const totalToReceive = mockTransactions
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + t.netValue, 0);

  const totalReceived = mockTransactions
    .filter((t) => t.status === 'paid')
    .reduce((sum, t) => sum + t.netValue, 0);

  const handleWithdraw = () => {
    toast.success('Solicitação de saque enviada com sucesso!');
    setIsWithdrawOpen(false);
    setWithdrawAmount('');
  };

  return (
    <div>
      <AdminHeader title="Financeiro" />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">A receber este mês</p>
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
                  <p className="text-sm text-muted-foreground">Recebido este mês</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    R$ {totalReceived.toFixed(2).replace('.', ',')}
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
                  <p className="text-sm text-muted-foreground">Total de retiradas</p>
                  <p className="text-2xl font-bold text-foreground mt-1">R$ 8.500,00</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Wallet className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Withdraw Button */}
        <div className="flex justify-end">
          <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
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
                    R$ {totalToReceive.toFixed(2).replace('.', ',')}
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

        {/* Transactions Table */}
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
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
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
                        <Badge className={cn(statusStyles[transaction.status].className)}>
                          {statusStyles[transaction.status].label}
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
