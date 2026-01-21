import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  lastUpdated: string;
}

const DEFAULT_DATA: DashboardData = {
  stats: {
    proximasAulas: 8,
    aulasPendentes: 3,
    avaliacaoMedia: 4.9,
    totalAvaliacoes: 47,
    alunosAtivos: 15,
    faturamentoMes: 3240,
    variacao: 8.5
  },
  solicitacoes: [
    {
      id: 'sol_001',
      alunoId: 'aluno_456',
      aluno: {
        nome: 'Rafael Ramalho',
        telefone: '(31) 99999-9999'
      },
      tipo: 'primeira_aula',
      status: 'pendente',
      data: '22/01/2026',
      horario: '14:00',
      duracao: 50,
      valorAula: 80.00,
      local: {
        endereco: 'Centro, Lagoa Santa',
        bairro: 'Centro',
        cidade: 'Lagoa Santa'
      },
      observacoes: 'Primeira aula do aluno, sem experiência prévia',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'sol_002',
      alunoId: 'aluno_457',
      aluno: {
        nome: 'Maria Silva',
        telefone: '(31) 98888-8888'
      },
      tipo: 'agendamento',
      status: 'pendente',
      data: '23/01/2026',
      horario: '09:00',
      duracao: 50,
      valorAula: 80.00,
      local: {
        endereco: 'Industrial, Lagoa Santa',
        bairro: 'Industrial',
        cidade: 'Lagoa Santa'
      },
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'sol_003',
      alunoId: 'aluno_458',
      aluno: {
        nome: 'João Santos',
        telefone: '(31) 97777-7777'
      },
      tipo: 'agendamento',
      status: 'pendente',
      data: '24/01/2026',
      horario: '16:30',
      duracao: 50,
      valorAula: 80.00,
      local: {
        endereco: 'Palmeiras, Lagoa Santa',
        bairro: 'Palmeiras',
        cidade: 'Lagoa Santa'
      },
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  proximasAulas: [
    {
      id: 'aula_001',
      alunoId: 'aluno_789',
      aluno: 'Carlos Eduardo',
      data: new Date().toISOString().split('T')[0],
      horario: '14:00',
      duracao: 50,
      local: 'Centro',
      tipo: 'pratica',
      status: 'confirmada'
    },
    {
      id: 'aula_002',
      alunoId: 'aluno_790',
      aluno: 'Ana Paula',
      data: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      horario: '09:00',
      duracao: 50,
      local: 'Industrial',
      tipo: 'pratica',
      status: 'confirmada'
    }
  ],
  avaliacoesRecentes: [
    {
      id: 'aval_001',
      alunoId: 'aluno_111',
      aluno: 'Rafael Ramalho',
      rating: 5,
      comentario: 'Excelente instrutor! Muito paciente e didático. Recomendo!',
      data: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'aval_002',
      alunoId: 'aluno_112',
      aluno: 'Maria Silva',
      rating: 5,
      comentario: 'Aprendi muito nas aulas. Instrutor atencioso e profissional.',
      data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  faturamentoHistorico: [
    { mes: 'Ago', valor: 2200, aulas: 18 },
    { mes: 'Set', valor: 2800, aulas: 22 },
    { mes: 'Out', valor: 2100, aulas: 17 },
    { mes: 'Nov', valor: 3100, aulas: 25 },
    { mes: 'Dez', valor: 2900, aulas: 23 },
    { mes: 'Jan', valor: 3240, aulas: 26 },
  ],
  lastUpdated: new Date().toISOString()
};

export function useInstrutorData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const instrutorId = user?.id || 'instrutor_demo';
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const key = `instrutor-dashboard:${instrutorId}`;
      
      // Try to get from window.storage
      if (typeof window !== 'undefined' && window.storage) {
        try {
          const result = await window.storage.get(key, false);
          if (result?.value) {
            const dashboardData = JSON.parse(result.value);
            setData(dashboardData);
            return;
          }
        } catch (storageErr) {
          console.warn('Storage not available, using localStorage fallback');
        }
      }
      
      // Fallback to localStorage
      const localData = localStorage.getItem(key);
      if (localData) {
        setData(JSON.parse(localData));
        return;
      }
      
      // Initialize with default data
      setData(DEFAULT_DATA);
      
      // Save to storage
      if (typeof window !== 'undefined' && window.storage) {
        try {
          await window.storage.set(key, JSON.stringify(DEFAULT_DATA), false);
        } catch {
          localStorage.setItem(key, JSON.stringify(DEFAULT_DATA));
        }
      } else {
        localStorage.setItem(key, JSON.stringify(DEFAULT_DATA));
      }

    } catch (err) {
      console.error('Erro ao carregar dados do instrutor:', err);
      setError('Não foi possível carregar os dados');
      setData(DEFAULT_DATA);
    } finally {
      setLoading(false);
    }
  }, [instrutorId]);

  const saveData = useCallback(async (newData: DashboardData) => {
    const key = `instrutor-dashboard:${instrutorId}`;
    const dataToSave = { ...newData, lastUpdated: new Date().toISOString() };
    
    if (typeof window !== 'undefined' && window.storage) {
      try {
        await window.storage.set(key, JSON.stringify(dataToSave), false);
      } catch {
        localStorage.setItem(key, JSON.stringify(dataToSave));
      }
    } else {
      localStorage.setItem(key, JSON.stringify(dataToSave));
    }
    
    setData(dataToSave);
  }, [instrutorId]);

  const aceitarSolicitacao = useCallback(async (solicitacaoId: string) => {
    try {
      if (!data) return false;

      const solicitacao = data.solicitacoes.find(s => s.id === solicitacaoId);
      if (!solicitacao) {
        throw new Error('Solicitação não encontrada');
      }

      const updatedData: DashboardData = {
        ...data,
        solicitacoes: data.solicitacoes.map(s => 
          s.id === solicitacaoId 
            ? { ...s, status: 'aceita' as const }
            : s
        ),
        proximasAulas: [
          ...data.proximasAulas,
          {
            id: `aula_${Date.now()}`,
            alunoId: solicitacao.alunoId,
            aluno: solicitacao.aluno.nome,
            data: solicitacao.data,
            horario: solicitacao.horario,
            duracao: solicitacao.duracao,
            local: solicitacao.local.bairro,
            tipo: 'pratica' as const,
            status: 'confirmada' as const
          }
        ],
        stats: {
          ...data.stats,
          proximasAulas: data.stats.proximasAulas + 1,
          aulasPendentes: Math.max(0, data.stats.aulasPendentes - 1)
        }
      };

      await saveData(updatedData);

      toast({
        title: 'Aula aceita!',
        description: `Aula com ${solicitacao.aluno.nome} confirmada para ${solicitacao.data}`,
      });

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
  }, [data, saveData, toast]);

  const recusarSolicitacao = useCallback(async (solicitacaoId: string) => {
    try {
      if (!data) return false;

      const solicitacao = data.solicitacoes.find(s => s.id === solicitacaoId);
      if (!solicitacao) {
        throw new Error('Solicitação não encontrada');
      }

      const updatedData: DashboardData = {
        ...data,
        solicitacoes: data.solicitacoes.filter(s => s.id !== solicitacaoId),
        stats: {
          ...data.stats,
          aulasPendentes: Math.max(0, data.stats.aulasPendentes - 1)
        }
      };

      await saveData(updatedData);

      toast({
        title: 'Aula recusada',
        description: `Solicitação de ${solicitacao.aluno.nome} foi recusada`,
      });

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
  }, [data, saveData, toast]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter only pending requests
  const solicitacoesPendentes = data?.solicitacoes.filter(s => s.status === 'pendente') || [];

  return {
    stats: data?.stats || null,
    solicitacoes: solicitacoesPendentes,
    proximasAulas: data?.proximasAulas || [],
    avaliacoesRecentes: data?.avaliacoesRecentes || [],
    faturamentoHistorico: data?.faturamentoHistorico || [],
    loading,
    error,
    aceitarSolicitacao,
    recusarSolicitacao,
    refreshData
  };
}
