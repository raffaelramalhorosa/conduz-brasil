import { useState, useEffect, useCallback } from 'react';
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

export function useInstrutorData() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [instructorProfileId, setInstructorProfileId] = useState<string | null>(null);
  const [stats, setStats] = useState<InstrutorStats | null>(null);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [proximasAulas, setProximasAulas] = useState<ProximaAula[]>([]);
  const [avaliacoesRecentes, setAvaliacoesRecentes] = useState<Avaliacao[]>([]);
  const [faturamentoHistorico, setFaturamentoHistorico] = useState<FaturamentoHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load instructor profile ID
  useEffect(() => {
    const loadInstructorProfile = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('instructor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setInstructorProfileId(profile.id);
      }
    };

    loadInstructorProfile();
  }, [user]);

  const loadData = useCallback(async () => {
    if (!instructorProfileId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const next7Days = format(addDays(today, 7), 'yyyy-MM-dd');

      // Fetch all data in parallel
      const [
        pendingBookingsResult,
        confirmedBookingsResult,
        reviewsResult,
        transactionsResult,
        activeStudentsResult,
      ] = await Promise.all([
        // Pending bookings (solicitações)
        supabase
          .from('bookings')
          .select(`
            id,
            student_id,
            scheduled_date,
            start_time,
            end_time,
            duration_hours,
            instructor_amount,
            pickup_address,
            student_message,
            created_at,
            student_profiles!inner(id, user_id)
          `)
          .eq('instructor_id', instructorProfileId)
          .eq('status', 'pending')
          .order('scheduled_date', { ascending: true }),

        // Confirmed bookings for next 7 days
        supabase
          .from('bookings')
          .select(`
            id,
            student_id,
            scheduled_date,
            start_time,
            duration_hours,
            pickup_address,
            student_profiles!inner(id, user_id)
          `)
          .eq('instructor_id', instructorProfileId)
          .eq('status', 'confirmed')
          .gte('scheduled_date', todayStr)
          .lte('scheduled_date', next7Days)
          .order('scheduled_date', { ascending: true })
          .order('start_time', { ascending: true }),

        // Reviews
        supabase
          .from('reviews')
          .select(`
            id,
            student_id,
            overall_rating,
            comment,
            created_at,
            student_profiles!inner(id, user_id)
          `)
          .eq('instructor_id', instructorProfileId)
          .eq('is_visible', true)
          .order('created_at', { ascending: false })
          .limit(3),

        // Transactions for last 6 months
        supabase
          .from('transactions')
          .select('net_amount, transaction_date, booking_id')
          .eq('instructor_id', instructorProfileId)
          .gte('transaction_date', format(subMonths(today, 6), 'yyyy-MM-dd'))
          .order('transaction_date', { ascending: true }),

        // Active students (confirmed or completed bookings)
        supabase
          .from('bookings')
          .select('student_id')
          .eq('instructor_id', instructorProfileId)
          .in('status', ['confirmed', 'completed']),
      ]);

      // Get student profiles for pending bookings
      const studentIds = [
        ...(pendingBookingsResult.data || []).map((b: any) => b.student_profiles.user_id),
        ...(confirmedBookingsResult.data || []).map((b: any) => b.student_profiles.user_id),
        ...(reviewsResult.data || []).map((r: any) => r.student_profiles.user_id),
      ];

      const uniqueStudentIds = [...new Set(studentIds)];
      
      let studentProfiles: Record<string, { full_name: string; avatar_url: string | null; phone: string | null }> = {};
      
      if (uniqueStudentIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, phone')
          .in('id', uniqueStudentIds);

        if (profiles) {
          studentProfiles = profiles.reduce((acc, p) => {
            acc[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url, phone: p.phone };
            return acc;
          }, {} as Record<string, { full_name: string; avatar_url: string | null; phone: string | null }>);
        }
      }

      // Check for first class status for pending bookings
      const pendingStudentProfileIds = (pendingBookingsResult.data || []).map((b: any) => b.student_id);
      let firstClassMap: Record<string, boolean> = {};
      
      if (pendingStudentProfileIds.length > 0) {
        const { data: completedBookings } = await supabase
          .from('bookings')
          .select('student_id')
          .eq('instructor_id', instructorProfileId)
          .eq('status', 'completed')
          .in('student_id', pendingStudentProfileIds);

        const studentsWithCompletedLessons = new Set((completedBookings || []).map(b => b.student_id));
        pendingStudentProfileIds.forEach(id => {
          firstClassMap[id] = !studentsWithCompletedLessons.has(id);
        });
      }

      // Process pending bookings (solicitações)
      const processedSolicitacoes: Solicitacao[] = (pendingBookingsResult.data || []).map((booking: any) => {
        const studentProfile = studentProfiles[booking.student_profiles.user_id] || { full_name: 'Aluno', avatar_url: null, phone: null };
        const addressParts = booking.pickup_address?.split(',') || [''];
        
        return {
          id: booking.id,
          alunoId: booking.student_id,
          aluno: {
            nome: studentProfile.full_name,
            avatar: studentProfile.avatar_url || undefined,
            telefone: studentProfile.phone || undefined,
          },
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
        };
      });

      // Process confirmed bookings (próximas aulas)
      const processedProximasAulas: ProximaAula[] = (confirmedBookingsResult.data || []).map((booking: any) => {
        const studentProfile = studentProfiles[booking.student_profiles.user_id] || { full_name: 'Aluno' };
        const addressParts = booking.pickup_address?.split(',') || [''];
        
        return {
          id: booking.id,
          alunoId: booking.student_id,
          aluno: studentProfile.full_name,
          data: booking.scheduled_date,
          horario: booking.start_time?.slice(0, 5) || '00:00',
          duracao: Math.round((booking.duration_hours || 1) * 60),
          local: addressParts[0]?.trim() || 'Local não informado',
          tipo: 'pratica',
          status: 'confirmada',
        };
      });

      // Process reviews
      const processedAvaliacoes: Avaliacao[] = (reviewsResult.data || []).map((review: any) => {
        const studentProfile = studentProfiles[review.student_profiles.user_id] || { full_name: 'Aluno', avatar_url: null };
        
        return {
          id: review.id,
          alunoId: review.student_id,
          aluno: studentProfile.full_name,
          avatar: studentProfile.avatar_url || undefined,
          rating: review.overall_rating,
          comentario: review.comment || '',
          data: review.created_at,
        };
      });

      // Calculate average rating
      let avaliacaoMedia = 0;
      let totalAvaliacoes = 0;
      
      const { data: ratingData } = await supabase
        .from('reviews')
        .select('overall_rating')
        .eq('instructor_id', instructorProfileId)
        .eq('is_visible', true);

      if (ratingData && ratingData.length > 0) {
        totalAvaliacoes = ratingData.length;
        avaliacaoMedia = ratingData.reduce((acc, r) => acc + r.overall_rating, 0) / totalAvaliacoes;
      }

      // Calculate faturamento (revenue) by month
      const transactionsByMonth: Record<string, { valor: number; aulas: number }> = {};
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const monthKey = format(monthDate, 'MMM', { locale: ptBR });
        const capitalizedMonth = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
        transactionsByMonth[capitalizedMonth] = { valor: 0, aulas: 0 };
      }

      (transactionsResult.data || []).forEach((t: any) => {
        const monthKey = format(new Date(t.transaction_date), 'MMM', { locale: ptBR });
        const capitalizedMonth = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
        if (transactionsByMonth[capitalizedMonth]) {
          transactionsByMonth[capitalizedMonth].valor += Number(t.net_amount) || 0;
          transactionsByMonth[capitalizedMonth].aulas += 1;
        }
      });

      const processedFaturamento: FaturamentoHistorico[] = Object.entries(transactionsByMonth).map(([mes, data]) => ({
        mes,
        valor: Math.round(data.valor),
        aulas: data.aulas,
      }));

      // Calculate current month revenue and variation
      const currentMonthStart = startOfMonth(today);
      const currentMonthEnd = endOfMonth(today);
      const lastMonthStart = startOfMonth(subMonths(today, 1));
      const lastMonthEnd = endOfMonth(subMonths(today, 1));

      const currentMonthTransactions = (transactionsResult.data || []).filter((t: any) => {
        const tDate = new Date(t.transaction_date);
        return tDate >= currentMonthStart && tDate <= currentMonthEnd;
      });

      const lastMonthTransactions = (transactionsResult.data || []).filter((t: any) => {
        const tDate = new Date(t.transaction_date);
        return tDate >= lastMonthStart && tDate <= lastMonthEnd;
      });

      const faturamentoMes = currentMonthTransactions.reduce((acc: number, t: any) => acc + (Number(t.net_amount) || 0), 0);
      const faturamentoMesAnterior = lastMonthTransactions.reduce((acc: number, t: any) => acc + (Number(t.net_amount) || 0), 0);

      let variacao = 0;
      if (faturamentoMesAnterior > 0) {
        variacao = Math.round(((faturamentoMes - faturamentoMesAnterior) / faturamentoMesAnterior) * 100 * 10) / 10;
      }

      // Count unique active students
      const uniqueActiveStudents = new Set((activeStudentsResult.data || []).map((b: any) => b.student_id));

      // Set all data
      setStats({
        proximasAulas: processedProximasAulas.length,
        aulasPendentes: processedSolicitacoes.length,
        avaliacaoMedia: Math.round(avaliacaoMedia * 10) / 10,
        totalAvaliacoes,
        alunosAtivos: uniqueActiveStudents.size,
        faturamentoMes: Math.round(faturamentoMes),
        variacao,
      });

      setSolicitacoes(processedSolicitacoes);
      setProximasAulas(processedProximasAulas);
      setAvaliacoesRecentes(processedAvaliacoes);
      setFaturamentoHistorico(processedFaturamento);

    } catch (err) {
      console.error('Erro ao carregar dados do instrutor:', err);
      setError('Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  }, [instructorProfileId]);

  const aceitarSolicitacao = useCallback(async (solicitacaoId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', solicitacaoId);

      if (updateError) throw updateError;

      toast({
        title: 'Aula aceita!',
        description: 'O aluno será notificado sobre a confirmação.',
      });

      // Reload data
      await loadData();
      return true;

    } catch (err) {
      console.error('Erro ao aceitar solicitação:', err);
      toast({
        title: 'Erro ao aceitar aula',
        description: 'Tente novamente',
        variant: 'destructive'
      });
      return false;
    }
  }, [loadData, toast]);

  const recusarSolicitacao = useCallback(async (solicitacaoId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'rejected',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', solicitacaoId);

      if (updateError) throw updateError;

      toast({
        title: 'Aula recusada',
        description: 'A solicitação foi recusada.',
      });

      // Reload data
      await loadData();
      return true;

    } catch (err) {
      console.error('Erro ao recusar solicitação:', err);
      toast({
        title: 'Erro ao recusar aula',
        description: 'Tente novamente',
        variant: 'destructive'
      });
      return false;
    }
  }, [loadData, toast]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  useEffect(() => {
    if (instructorProfileId) {
      loadData();
    }
  }, [instructorProfileId, loadData]);

  return {
    stats,
    solicitacoes,
    proximasAulas,
    avaliacoesRecentes,
    faturamentoHistorico,
    loading,
    error,
    aceitarSolicitacao,
    recusarSolicitacao,
    refreshData
  };
}
