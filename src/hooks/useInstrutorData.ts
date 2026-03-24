import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InstrutorStats {
  proximasAulas: number;
  aulasPendentes: number;
  avaliacaoMedia: number;
  totalAvaliacoes: number;
  alunosAtivos: number;
  faturamentoMes: number;
  variacao: number;
}

interface Solicitacao {
  id: string;
  alunoId: string;
  aluno: {
    nome: string;
    avatar?: string;
    telefone?: string;
  };
  tipo: 'primeira_aula' | 'agendamento';
  status: 'pendente' | 'aceita' | 'recusada';
  data: string;
  horario: string;
  duracao: number;
  valorAula: number;
  local: {
    endereco: string;
    bairro: string;
    cidade: string;
  };
  observacoes?: string;
  createdAt: string;
  instrutorNome?: string;
}

interface ProximaAula {
  id: string;
  alunoId: string;
  aluno: string;
  data: string;
  horario: string;
  duracao: number;
  local: string;
  tipo: 'pratica' | 'teorica';
  status: 'confirmada' | 'em_andamento' | 'concluida';
  payment_status?: string | null;
}

interface Avaliacao {
  id: string;
  alunoId: string;
  aluno: string;
  avatar?: string;
  rating: number;
  comentario: string;
  data: string;
}

interface FaturamentoHistorico {
  mes: string;
  valor: number;
  aulas: number;
}

interface DashboardData {
  stats: InstrutorStats;
  solicitacoes: Solicitacao[];
  proximasAulas: ProximaAula[];
  avaliacoesRecentes: Avaliacao[];
  faturamentoHistorico: FaturamentoHistorico[];
}

// ---------------------------------------------------------------------------
// Função de fetch pura — fora do hook para que o useQuery possa cachear
// ---------------------------------------------------------------------------
async function fetchDashboardData(
  instructorProfileId: string,
  isDrivingSchool: boolean,
): Promise<DashboardData> {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const next7Days = format(addDays(today, 7), 'yyyy-MM-dd');

  const applyBookingFilter = (query: any) =>
    isDrivingSchool
      ? query.or(`instructor_id.eq.${instructorProfileId},driving_school_id.eq.${instructorProfileId}`)
      : query.eq('instructor_id', instructorProfileId);

  // Para driving schools: busca IDs de instrutores filiados UMA vez
  let allInstructorIds: string[] = [instructorProfileId];
  if (isDrivingSchool) {
    const { data: dsi } = await supabase
      .from('driving_school_instructors')
      .select('linked_user_id')
      .eq('driving_school_id', instructorProfileId)
      .eq('status', 'active')
      .eq('is_account_linked', true);

    const affiliatedUserIds = (dsi || []).map(i => i.linked_user_id).filter(Boolean) as string[];
    if (affiliatedUserIds.length > 0) {
      const { data: affProfiles } = await supabase
        .from('instructor_profiles')
        .select('id')
        .in('user_id', affiliatedUserIds);
      allInstructorIds = [instructorProfileId, ...(affProfiles || []).map(p => p.id)];
    }
  }

  const pendingQuery = applyBookingFilter(
    supabase.from('bookings').select(`
      id, student_id, instructor_id,
      scheduled_date, start_time, end_time, duration_hours,
      instructor_amount, pickup_address, student_message,
      created_at, instructor_message,
      student_profiles!inner(id, user_id)
    `).eq('status', 'pending').order('scheduled_date', { ascending: true })
  );

  const confirmedQuery = applyBookingFilter(
    supabase.from('bookings').select(`
      id, student_id, scheduled_date, start_time,
      duration_hours, pickup_address, payment_status,
      student_profiles!inner(id, user_id)
    `).eq('status', 'confirmed')
      .gte('scheduled_date', todayStr)
      .lte('scheduled_date', next7Days)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true })
  );

  const activeStudentsQuery = applyBookingFilter(
    supabase.from('bookings').select('student_id').in('status', ['confirmed', 'completed'])
  );

  const [
    pendingBookingsResult,
    confirmedBookingsResult,
    reviewsResult,
    transactionsResult,
    activeStudentsResult,
  ] = await Promise.all([
    pendingQuery,
    confirmedQuery,
    supabase
      .from('reviews')
      .select(`id, student_id, overall_rating, comment, created_at, student_profiles!inner(id, user_id)`)
      .in('instructor_id', allInstructorIds)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('transactions')
      .select('net_amount, transaction_date, booking_id')
      .in('instructor_id', allInstructorIds)
      .gte('transaction_date', format(subMonths(today, 6), 'yyyy-MM-dd'))
      .order('transaction_date', { ascending: true }),
    activeStudentsQuery,
  ]);

  // Busca nomes/avatares em batch
  const studentUserIds = [
    ...(pendingBookingsResult.data || []).map((b: any) => b.student_profiles.user_id),
    ...(confirmedBookingsResult.data || []).map((b: any) => b.student_profiles.user_id),
    ...(reviewsResult.data || []).map((r: any) => r.student_profiles.user_id),
  ];
  const uniqueStudentUserIds = [...new Set(studentUserIds)];

  let studentProfiles: Record<string, { full_name: string; avatar_url: string | null; phone: string | null }> = {};
  if (uniqueStudentUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, phone')
      .in('id', uniqueStudentUserIds);
    studentProfiles = (profiles || []).reduce((acc, p) => {
      acc[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url, phone: p.phone };
      return acc;
    }, {} as typeof studentProfiles);
  }

  // Check de primeira aula (1 query batch)
  const pendingStudentProfileIds = (pendingBookingsResult.data || []).map((b: any) => b.student_id);
  let firstClassMap: Record<string, boolean> = {};
  if (pendingStudentProfileIds.length > 0) {
    let completedQuery = supabase
      .from('bookings')
      .select('student_id')
      .eq('status', 'completed')
      .in('student_id', pendingStudentProfileIds);

    completedQuery = isDrivingSchool
      ? completedQuery.or(`instructor_id.eq.${instructorProfileId},driving_school_id.eq.${instructorProfileId}`)
      : completedQuery.eq('instructor_id', instructorProfileId);

    const { data: completedBookings } = await completedQuery;
    const studentsWithCompleted = new Set((completedBookings || []).map(b => b.student_id));
    pendingStudentProfileIds.forEach((id: string) => {
      firstClassMap[id] = !studentsWithCompleted.has(id);
    });
  }

  // Nomes de instrutores para driving school
  let instructorNamesMap: Record<string, string> = {};
  if (isDrivingSchool) {
    const instructorIds = [...new Set(
      (pendingBookingsResult.data || []).map((b: any) => b.instructor_id).filter(Boolean)
    )] as string[];

    if (instructorIds.length > 0) {
      const { data: instrProfiles } = await supabase
        .from('instructor_profiles')
        .select('id, user_id')
        .in('id', instructorIds);

      if (instrProfiles?.length) {
        const { data: instrUsers } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', instrProfiles.map(p => p.user_id));

        const userNameMap = Object.fromEntries((instrUsers || []).map(u => [u.id, u.full_name]));
        instrProfiles.forEach(ip => {
          instructorNamesMap[ip.id] = userNameMap[ip.user_id] || 'Instrutor';
        });
      }
    }
  }

  // Rating (allInstructorIds já resolvido acima)
  let avaliacaoMedia = 0;
  let totalAvaliacoes = 0;
  const { data: ratingData } = await supabase
    .from('reviews')
    .select('overall_rating')
    .in('instructor_id', allInstructorIds)
    .eq('is_visible', true);

  if (ratingData?.length) {
    totalAvaliacoes = ratingData.length;
    avaliacaoMedia = ratingData.reduce((acc, r) => acc + r.overall_rating, 0) / totalAvaliacoes;
  }

  // Faturamento por mês
  const transactionsByMonth: Record<string, { valor: number; aulas: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(today, i);
    const monthKey = format(monthDate, 'MMM', { locale: ptBR });
    const cap = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
    transactionsByMonth[cap] = { valor: 0, aulas: 0 };
  }
  (transactionsResult.data || []).forEach((t: any) => {
    const key = format(new Date(t.transaction_date), 'MMM', { locale: ptBR });
    const cap = key.charAt(0).toUpperCase() + key.slice(1);
    if (transactionsByMonth[cap]) {
      transactionsByMonth[cap].valor += Number(t.net_amount) || 0;
      transactionsByMonth[cap].aulas += 1;
    }
  });

  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  const lastMonthStart = startOfMonth(subMonths(today, 1));
  const lastMonthEnd = endOfMonth(subMonths(today, 1));

  const currentTxs = (transactionsResult.data || []).filter((t: any) => {
    const d = new Date(t.transaction_date);
    return d >= currentMonthStart && d <= currentMonthEnd;
  });
  const lastTxs = (transactionsResult.data || []).filter((t: any) => {
    const d = new Date(t.transaction_date);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });

  const faturamentoMes = currentTxs.reduce((acc: number, t: any) => acc + (Number(t.net_amount) || 0), 0);
  const faturamentoMesAnterior = lastTxs.reduce((acc: number, t: any) => acc + (Number(t.net_amount) || 0), 0);
  const variacao = faturamentoMesAnterior > 0
    ? Math.round(((faturamentoMes - faturamentoMesAnterior) / faturamentoMesAnterior) * 1000) / 10
    : 0;

  const uniqueActiveStudents = new Set((activeStudentsResult.data || []).map((b: any) => b.student_id));

  return {
    stats: {
      proximasAulas: (confirmedBookingsResult.data || []).length,
      aulasPendentes: (pendingBookingsResult.data || []).length,
      avaliacaoMedia: Math.round(avaliacaoMedia * 10) / 10,
      totalAvaliacoes,
      alunosAtivos: uniqueActiveStudents.size,
      faturamentoMes: Math.round(faturamentoMes),
      variacao,
    },
    solicitacoes: (pendingBookingsResult.data || []).map((booking: any) => {
      const sp = studentProfiles[booking.student_profiles.user_id] || { full_name: 'Aluno', avatar_url: null, phone: null };
      const addressParts = booking.pickup_address?.split(',') || [''];
      return {
        id: booking.id,
        alunoId: booking.student_id,
        aluno: { nome: sp.full_name, avatar: sp.avatar_url || undefined, telefone: sp.phone || undefined },
        tipo: firstClassMap[booking.student_id] ? 'primeira_aula' : 'agendamento',
        status: 'pendente',
        data: format(new Date(booking.scheduled_date), 'dd/MM/yyyy'),
        horario: booking.start_time?.slice(0, 5) || '00:00',
        duracao: Math.round((booking.duration_hours || 1) * 60),
        valorAula: Number(booking.instructor_amount) || 0,
        local: {
          endereco: booking.pickup_address || 'Endereço não informado',
          bairro: addressParts[0]?.trim() || '',
          cidade: addressParts[1]?.trim() || '',
        },
        observacoes: booking.student_message || undefined,
        createdAt: booking.created_at,
        instrutorNome: isDrivingSchool ? (instructorNamesMap[booking.instructor_id] || undefined) : undefined,
      } as Solicitacao;
    }),
    proximasAulas: (confirmedBookingsResult.data || []).map((booking: any) => {
      const sp = studentProfiles[booking.student_profiles.user_id] || { full_name: 'Aluno' };
      const addressParts = booking.pickup_address?.split(',') || [''];
      return {
        id: booking.id,
        alunoId: booking.student_id,
        aluno: sp.full_name,
        data: booking.scheduled_date,
        horario: booking.start_time?.slice(0, 5) || '00:00',
        duracao: Math.round((booking.duration_hours || 1) * 60),
        local: addressParts[0]?.trim() || 'Local não informado',
        tipo: 'pratica',
        status: 'confirmada',
        payment_status: booking.payment_status,
      } as ProximaAula;
    }),
    avaliacoesRecentes: (reviewsResult.data || []).map((review: any) => {
      const sp = studentProfiles[review.student_profiles.user_id] || { full_name: 'Aluno', avatar_url: null };
      return {
        id: review.id,
        alunoId: review.student_id,
        aluno: sp.full_name,
        avatar: sp.avatar_url || undefined,
        rating: review.overall_rating,
        comentario: review.comment || '',
        data: review.created_at,
      } as Avaliacao;
    }),
    faturamentoHistorico: Object.entries(transactionsByMonth).map(([mes, d]) => ({
      mes,
      valor: Math.round(d.valor),
      aulas: d.aulas,
    })),
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useInstrutorData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Perfil do instrutor (staleTime alto — raramente muda)
  const { data: instructorProfile } = useQuery({
    queryKey: ['instructor-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('instructor_profiles')
        .select('id, is_driving_school')
        .eq('user_id', user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 30,
  });

  const instructorProfileId = instructorProfile?.id ?? null;
  const isDrivingSchool = !!instructorProfile?.is_driving_school;

  // Dados do dashboard (staleTime de 2 min — mais dinâmico)
  const { data, isLoading, error } = useQuery({
    queryKey: ['instrutor-dashboard', instructorProfileId],
    queryFn: () => fetchDashboardData(instructorProfileId!, isDrivingSchool),
    enabled: !!instructorProfileId,
    staleTime: 1000 * 60 * 2,
  });

  const invalidateDashboard = () =>
    queryClient.invalidateQueries({ queryKey: ['instrutor-dashboard', instructorProfileId] });

  const aceitarSolicitacao = async (solicitacaoId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', solicitacaoId);
      if (updateError) throw updateError;
      toast({ title: 'Aula aceita!', description: 'O aluno será notificado sobre a confirmação.' });
      await invalidateDashboard();
      return true;
    } catch {
      toast({ title: 'Erro ao aceitar aula', description: 'Tente novamente', variant: 'destructive' });
      return false;
    }
  };

  const recusarSolicitacao = async (solicitacaoId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'rejected', cancelled_at: new Date().toISOString() })
        .eq('id', solicitacaoId);
      if (updateError) throw updateError;
      toast({ title: 'Aula recusada', description: 'A solicitação foi recusada.' });
      await invalidateDashboard();
      return true;
    } catch {
      toast({ title: 'Erro ao recusar aula', description: 'Tente novamente', variant: 'destructive' });
      return false;
    }
  };

  return {
    stats: data?.stats ?? null,
    solicitacoes: data?.solicitacoes ?? [],
    proximasAulas: data?.proximasAulas ?? [],
    avaliacoesRecentes: data?.avaliacoesRecentes ?? [],
    faturamentoHistorico: data?.faturamentoHistorico ?? [],
    loading: isLoading || (!instructorProfile && !!user),
    error: error ? 'Não foi possível carregar os dados' : null,
    aceitarSolicitacao,
    recusarSolicitacao,
    refreshData: invalidateDashboard,
  };
}
