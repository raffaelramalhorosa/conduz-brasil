import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CheckCircle2, XCircle, Clock, CreditCard, Users, AlertTriangle,
  CalendarDays, Receipt,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SubscriptionPlan {
  id: string;
  name: string;
  price_cents: number;
  owner_type: string;
}

interface SubscriptionPayment {
  id: string;
  amount_cents: number;
  status: 'paid' | 'failed' | 'pending';
  payment_date: string | null;
  created_at: string;
}

interface SubscriptionData {
  id: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'suspended';
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  mp_preapproval_id: string | null;
  cancelled_at: string | null;
  subscription_plans: SubscriptionPlan;
  subscription_payments: SubscriptionPayment[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return format(new Date(iso), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

function trialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ sub }: { sub: SubscriptionData }) {
  if (sub.status === 'trial') {
    const days = trialDaysRemaining(sub.trial_ends_at);
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30">
        Trial — {days} dia{days !== 1 ? 's' : ''} restante{days !== 1 ? 's' : ''}
      </Badge>
    );
  }
  if (sub.status === 'active') {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">
        Ativo
      </Badge>
    );
  }
  if (sub.status === 'suspended') {
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">
        Suspenso — pagamento pendente
      </Badge>
    );
  }
  if (sub.status === 'cancelled') {
    return (
      <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30 hover:bg-zinc-500/30">
        Cancelado — acesso até {fmtDate(sub.current_period_end)}
      </Badge>
    );
  }
  return <Badge variant="outline">{sub.status}</Badge>;
}

// ── Payment Status Icon ───────────────────────────────────────────────────────

function PaymentStatusIcon({ status }: { status: SubscriptionPayment['status'] }) {
  if (status === 'paid') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === 'failed') return <XCircle className="w-4 h-4 text-red-400" />;
  return <Clock className="w-4 h-4 text-amber-400" />;
}

// ── Subscribe Dialog (UI placeholder — MP CardForm vem depois) ────────────────

function SubscribeDialog({
  open, onClose, price, planName,
}: { open: boolean; onClose: () => void; price: number; planName: string }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle>Assinar {planName}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {fmt(price)}/mês — cobrado automaticamente todo mês
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="card-number" className="text-sm text-muted-foreground">
              Número do cartão
            </Label>
            <Input
              id="card-number"
              placeholder="0000 0000 0000 0000"
              className="bg-background border-white/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="card-expiry" className="text-sm text-muted-foreground">
                Validade
              </Label>
              <Input
                id="card-expiry"
                placeholder="MM/AA"
                className="bg-background border-white/10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="card-cvv" className="text-sm text-muted-foreground">
                CVV
              </Label>
              <Input
                id="card-cvv"
                placeholder="123"
                className="bg-background border-white/10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="card-name" className="text-sm text-muted-foreground">
              Nome no cartão
            </Label>
            <Input
              id="card-name"
              placeholder="NOME COMO NO CARTÃO"
              className="bg-background border-white/10"
            />
          </div>

          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-xs text-amber-400">
            Integração com Mercado Pago em breve. Nenhum valor será cobrado agora.
          </div>

          <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold h-11" disabled>
            Assinar por {fmt(price)}/mês
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Instructor Count Card (school only) ───────────────────────────────────────

function InstructorCountCard({ schoolProfileId }: { schoolProfileId: string }) {
  const { data: count, isLoading } = useQuery({
    queryKey: ['school-instructor-count', schoolProfileId],
    queryFn: async () => {
      const { count } = await supabase
        .from('driving_school_instructors')
        .select('id', { count: 'exact', head: true })
        .eq('driving_school_id', schoolProfileId)
        .eq('status', 'active');
      return count ?? 0;
    },
    enabled: !!schoolProfileId,
    staleTime: 1000 * 60 * 2,
  });

  const MAX = 15;
  const active = count ?? 0;
  const nearLimit = active >= 13;
  const atLimit = active >= MAX;

  return (
    <Card className="border-white/10 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Users className="w-4 h-4" />
          Instrutores Ativos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <p className="text-3xl font-bold text-foreground">
              {active}
              <span className="text-lg text-muted-foreground font-normal"> / {MAX}</span>
            </p>
            <Progress value={(active / MAX) * 100} className="h-2" />
            {atLimit && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Limite atingido — remova um instrutor para adicionar novos
              </div>
            )}
            {nearLimit && !atLimit && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Próximo do limite de instrutores
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminAssinaturas() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const isSchool = profile?.user_type === 'driving_school';

  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Buscar dados da assinatura
  const { data: sub, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          id, status, trial_ends_at,
          current_period_start, current_period_end,
          mp_preapproval_id, cancelled_at,
          subscription_plans ( id, name, price_cents, owner_type ),
          subscription_payments ( id, amount_cents, status, payment_date, created_at )
        `)
        .eq('owner_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as SubscriptionData | null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  // Buscar instructor_profile.id para a autoescola (necessário para contagem)
  const { data: schoolProfile } = useQuery({
    queryKey: ['instructor-profile-id', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('instructor_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && isSchool,
    staleTime: 1000 * 60 * 30,
  });

  // ── Cancelar assinatura ───────────────────────────────────────────────────
  async function handleCancel() {
    if (!sub) return;
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscription_id: sub.id },
      });
      if (error) throw error;
      toast.success('Assinatura cancelada. Acesso mantido até ' + fmtDate(data?.access_until));
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['subscription-access', user?.id] });
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao cancelar assinatura. Tente novamente.');
    } finally {
      setCancelling(false);
      setCancelOpen(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="p-6 max-w-3xl">
        <p className="text-muted-foreground text-sm">Nenhuma assinatura encontrada para sua conta.</p>
      </div>
    );
  }

  const plan = sub.subscription_plans;
  const payments = [...(sub.subscription_payments ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const canSubscribe = sub.status === 'trial' || sub.status === 'suspended' || sub.status === 'cancelled';
  const canCancel = sub.status === 'active';
  const trialDays = trialDaysRemaining(sub.trial_ends_at);
  const trialProgress = sub.status === 'trial' ? Math.max(0, ((7 - trialDays) / 7) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">Assinatura</h1>

      {/* ── Seção 1: Status atual ───────────────────────────────────────────── */}
      <div className={`grid gap-4 ${isSchool ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {/* Card plano + status */}
        <Card className="border-white/10 bg-card md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Plano atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xl font-semibold text-foreground">{plan.name}</span>
              <StatusBadge sub={sub} />
            </div>

            {sub.status === 'trial' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Período de trial</span>
                  <span>{trialDays} dia{trialDays !== 1 ? 's' : ''} restante{trialDays !== 1 ? 's' : ''}</span>
                </div>
                <Progress value={trialProgress} className="h-1.5" />
              </div>
            )}

            {sub.status === 'active' && sub.current_period_end && (
              <p className="text-sm text-muted-foreground">
                Renova em {fmtDate(sub.current_period_end)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card próxima cobrança */}
        <Card className="border-white/10 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Próxima cobrança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {sub.status === 'active' && sub.current_period_end ? (
              <>
                <p className="text-2xl font-bold text-foreground">{fmt(plan.price_cents)}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(sub.current_period_end)}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sem renovação agendada</p>
            )}
          </CardContent>
        </Card>

        {/* Card instrutores (apenas autoescola) */}
        {isSchool && schoolProfile && (
          <InstructorCountCard schoolProfileId={schoolProfile.id} />
        )}
      </div>

      {/* ── Seção 2: Ação principal ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {canSubscribe && (
          <Button
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold h-11 px-6"
            onClick={() => setSubscribeOpen(true)}
          >
            Assinar por {fmt(plan.price_cents)}/mês
          </Button>
        )}

        {canCancel && (
          <Button
            variant="outline"
            className="border-white/20 hover:bg-white/5 h-11 px-6"
            onClick={() => setCancelOpen(true)}
          >
            Cancelar Assinatura
          </Button>
        )}
      </div>

      {/* ── Seção 3: Histórico de pagamentos ───────────────────────────────── */}
      <Card className="border-white/10 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Histórico de pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <Receipt className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Data</TableHead>
                  <TableHead className="text-muted-foreground">Valor</TableHead>
                  <TableHead className="text-muted-foreground text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="text-sm text-foreground">
                      {fmtDate(p.payment_date ?? p.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {fmt(p.amount_cents)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <PaymentStatusIcon status={p.status} />
                        <span className={`text-xs ${
                          p.status === 'paid' ? 'text-emerald-400' :
                          p.status === 'failed' ? 'text-red-400' :
                          'text-amber-400'
                        }`}>
                          {p.status === 'paid' ? 'Pago' : p.status === 'failed' ? 'Falhou' : 'Pendente'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <SubscribeDialog
        open={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
        price={plan.price_cents}
        planName={plan.name}
      />

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Você continuará com acesso até{' '}
              <strong className="text-foreground">{fmtDate(sub.current_period_end)}</strong>.
              Após essa data o acesso será bloqueado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 hover:bg-white/5">
              Manter assinatura
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelando…' : 'Confirmar cancelamento'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
