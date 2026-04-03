import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CheckCircle2, XCircle, Clock, CreditCard, Users, AlertTriangle,
  CalendarDays, Receipt, Star,
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
  billing_interval: string;
  savings_cents: number;
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

// ── Máscaras de input ─────────────────────────────────────────────────────────

function maskCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function maskExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

function maskCpf(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// ── Plan Selection Dialog ─────────────────────────────────────────────────────

interface PlanSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  ownerType: 'instructor' | 'school';
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

function PlanSelectionDialog({ open, onClose, ownerType, onSelectPlan }: PlanSelectionDialogProps) {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans', ownerType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name, price_cents, owner_type, billing_interval, savings_cents')
        .eq('owner_type', ownerType)
        .eq('is_active', true)
        .order('billing_interval', { ascending: true }); // monthly first
      if (error) throw error;
      return data as SubscriptionPlan[];
    },
    enabled: open,
    staleTime: 1000 * 60 * 10,
  });

  const monthly = plans?.find((p) => p.billing_interval === 'monthly');
  const yearly = plans?.find((p) => p.billing_interval === 'yearly');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle>Escolha seu plano</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Selecione a periodicidade que preferir
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-52 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Card Mensal */}
            {monthly && (
              <div className="flex flex-col rounded-xl border border-white/10 bg-background p-5 gap-3">
                <p className="text-sm font-semibold text-foreground">Mensal</p>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {fmt(monthly.price_cents)}
                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">Cancele quando quiser</p>
                <Button
                  variant="outline"
                  className="w-full border-white/20 hover:bg-white/5 mt-auto"
                  onClick={() => onSelectPlan(monthly)}
                >
                  Escolher Mensal
                </Button>
              </div>
            )}

            {/* Card Anual */}
            {yearly && (
              <div className="flex flex-col rounded-xl border-2 border-amber-500/60 bg-background p-5 gap-3 relative">
                {yearly.savings_cents > 0 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                      <Star className="w-2.5 h-2.5" />
                      Mais popular — Economize {fmt(yearly.savings_cents)}
                    </span>
                  </div>
                )}
                <p className="text-sm font-semibold text-foreground mt-1">Anual</p>
                <div>
                  <p className="text-2xl font-bold text-amber-400">
                    {fmt(yearly.price_cents)}
                    <span className="text-sm font-normal text-muted-foreground">/ano</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fmt(Math.round(yearly.price_cents / 12))}/mês
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">Equivale a 10 meses — 2 grátis</p>
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold mt-auto"
                  onClick={() => onSelectPlan(yearly)}
                >
                  Escolher Anual
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Subscribe Dialog ──────────────────────────────────────────────────────────

interface SubscribeDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedPlan: SubscriptionPlan;
  ownerType: 'instructor' | 'school';
}

function SubscribeDialog({ open, onClose, onSuccess, selectedPlan, ownerType }: SubscribeDialogProps) {
  const { createCardToken } = useMercadoPago();

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setCardNumber(''); setCardName(''); setExpiry('');
    setCvv(''); setCpf(''); setEmail(''); setFormError(null);
  }, []);

  function handleClose() {
    if (submitting) return;
    resetForm();
    onClose();
  }

  const isYearly = selectedPlan.billing_interval === 'yearly';
  const billingLabel = isYearly ? 'ano' : 'mês';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      // Parsear validade MM/AA → mês e ano
      const [rawMonth, rawYear] = expiry.split('/');
      const month = (rawMonth || '').padStart(2, '0');
      const year = rawYear ? (rawYear.length === 2 ? `20${rawYear}` : rawYear) : '';

      // Tokenizar cartão via MP SDK
      const cardTokenId = await createCardToken({
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName: cardName.trim().toUpperCase(),
        cardExpirationMonth: month,
        cardExpirationYear: year,
        securityCode: cvv,
        identificationType: 'CPF',
        identificationNumber: cpf.replace(/\D/g, ''),
      });

      // Criar assinatura via Edge Function
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          owner_type: ownerType,
          plan_id: selectedPlan.id,
          card_token_id: cardTokenId,
          payer_email: email.trim(),
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success('Assinatura ativada com sucesso!');
      resetForm();
      onSuccess();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('recusado') || msg.toLowerCase().includes('rejected')) {
        setFormError('Cartão recusado. Verifique os dados ou tente outro cartão.');
      } else if (msg.includes('inválido') || msg.toLowerCase().includes('invalid')) {
        setFormError('Dados do cartão inválidos. Verifique e tente novamente.');
      } else if (msg.includes('SDK') || msg.includes('pública')) {
        setFormError(msg);
      } else {
        setFormError(msg || 'Erro ao processar assinatura. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle>Assinar {selectedPlan.name}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {fmt(selectedPlan.price_cents)}/{billingLabel} — cobrado automaticamente via Mercado Pago
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Número do cartão */}
          <div className="space-y-1.5">
            <Label htmlFor="card-number" className="text-sm text-muted-foreground">
              Número do cartão
            </Label>
            <Input
              id="card-number"
              placeholder="0000 0000 0000 0000"
              className="bg-background border-white/10"
              value={cardNumber}
              onChange={(e) => setCardNumber(maskCardNumber(e.target.value))}
              disabled={submitting}
              required
              inputMode="numeric"
            />
          </div>

          {/* Nome no cartão */}
          <div className="space-y-1.5">
            <Label htmlFor="card-name" className="text-sm text-muted-foreground">
              Nome do titular (como está no cartão)
            </Label>
            <Input
              id="card-name"
              placeholder="NOME SOBRENOME"
              className="bg-background border-white/10"
              value={cardName}
              onChange={(e) => setCardName(e.target.value.toUpperCase())}
              disabled={submitting}
              required
            />
          </div>

          {/* Validade + CVV */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="card-expiry" className="text-sm text-muted-foreground">
                Validade
              </Label>
              <Input
                id="card-expiry"
                placeholder="MM/AA"
                className="bg-background border-white/10"
                value={expiry}
                onChange={(e) => setExpiry(maskExpiry(e.target.value))}
                disabled={submitting}
                required
                inputMode="numeric"
                maxLength={5}
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
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                disabled={submitting}
                required
                inputMode="numeric"
                maxLength={4}
              />
            </div>
          </div>

          {/* CPF */}
          <div className="space-y-1.5">
            <Label htmlFor="card-cpf" className="text-sm text-muted-foreground">
              CPF do titular
            </Label>
            <Input
              id="card-cpf"
              placeholder="000.000.000-00"
              className="bg-background border-white/10"
              value={cpf}
              onChange={(e) => setCpf(maskCpf(e.target.value))}
              disabled={submitting}
              required
              inputMode="numeric"
              maxLength={14}
            />
          </div>

          {/* E-mail */}
          <div className="space-y-1.5">
            <Label htmlFor="card-email" className="text-sm text-muted-foreground">
              E-mail para cobrança
            </Label>
            <Input
              id="card-email"
              type="email"
              placeholder="seu@email.com"
              className="bg-background border-white/10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          {/* Erro */}
          {formError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400">
              {formError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold h-11"
            disabled={submitting}
          >
            {submitting ? 'Processando…' : `Assinar por ${fmt(selectedPlan.price_cents)}/${billingLabel}`}
          </Button>
        </form>
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

  const [planSelectionOpen, setPlanSelectionOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
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
          subscription_plans ( id, name, price_cents, owner_type, billing_interval, savings_cents ),
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

  function handlePlanSelected(plan: SubscriptionPlan) {
    setSelectedPlan(plan);
    setPlanSelectionOpen(false);
    setSubscribeOpen(true);
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
  const cancelledPeriodEnded = !sub.current_period_end || new Date(sub.current_period_end) < new Date();
  const canSubscribe = sub.status === 'trial' || sub.status === 'suspended' || (sub.status === 'cancelled' && cancelledPeriodEnded);
  const resubscribeBlockedUntil = sub.status === 'cancelled' && !cancelledPeriodEnded ? sub.current_period_end : null;
  const canCancel = sub.status === 'active';
  const trialDays = trialDaysRemaining(sub.trial_ends_at);
  const trialProgress = sub.status === 'trial' ? Math.max(0, ((7 - trialDays) / 7) * 100) : 0;

  const intervalLabel = plan.billing_interval === 'yearly' ? 'Plano Anual' : 'Plano Mensal';
  const billingLabel = plan.billing_interval === 'yearly' ? 'ano' : 'mês';

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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-semibold text-foreground">{intervalLabel}</span>
                {sub.status === 'active' && (
                  <Badge
                    className={
                      plan.billing_interval === 'yearly'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                    }
                  >
                    {plan.name}
                  </Badge>
                )}
              </div>
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
                <p className="text-2xl font-bold text-foreground">
                  {fmt(plan.price_cents)}
                  <span className="text-sm font-normal text-muted-foreground">/{billingLabel}</span>
                </p>
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
      <div className="flex flex-wrap gap-3 items-center">
        {canSubscribe && (
          <Button
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold h-11 px-6"
            onClick={() => setPlanSelectionOpen(true)}
          >
            Assinar Agora
          </Button>
        )}

        {resubscribeBlockedUntil && (
          <p className="text-sm text-muted-foreground">
            Sua assinatura segue ativa até <span className="text-foreground font-medium">{fmtDate(resubscribeBlockedUntil)}</span>. Você poderá assinar novamente após essa data.
          </p>
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
            <div className="overflow-x-auto">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <PlanSelectionDialog
        open={planSelectionOpen}
        onClose={() => setPlanSelectionOpen(false)}
        ownerType={isSchool ? 'school' : 'instructor'}
        onSelectPlan={handlePlanSelected}
      />

      {selectedPlan && (
        <SubscribeDialog
          open={subscribeOpen}
          onClose={() => setSubscribeOpen(false)}
          onSuccess={() => {
            setSubscribeOpen(false);
            setSelectedPlan(null);
            queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['subscription-access', user?.id] });
          }}
          selectedPlan={selectedPlan}
          ownerType={isSchool ? 'school' : 'instructor'}
        />
      )}

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
