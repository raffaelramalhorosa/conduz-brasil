import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSimuladoMeta, getCategoryStats } from '@/utils/quizStorage';
import type { SimuladoMeta, CategoryStats } from '@/types/quiz';

interface JornadaData {
  userId: string;
  etapaAtual: number;
  percentualGeral: number;
  etapasConcluidas: number[];
  aulasPraticasHoras: number;
  dataAbertura?: string;
  comprovanteUrl?: string;
}

interface DashboardData {
  jornada: JornadaData | null;
  simulados: SimuladoMeta | null;
  categoryStats: CategoryStats | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const DEFAULT_JORNADA: JornadaData = {
  userId: '',
  etapaAtual: 1,
  percentualGeral: 0,
  etapasConcluidas: [],
  aulasPraticasHoras: 0
};

const DEFAULT_SIMULADOS: SimuladoMeta = {
  userId: '',
  totalSimulados: 0,
  averageScore: 0,
  lastSimuladoDate: new Date().toISOString(),
  bestScore: 0,
  worstScore: 0,
  totalTimeSpent: 0,
  lastUpdated: new Date().toISOString()
};

export function useDashboardData(): DashboardData {
  const { user } = useAuth();
  const userId = user?.id || '';
  
  const [jornada, setJornada] = useState<JornadaData | null>(null);
  const [simulados, setSimulados] = useState<SimuladoMeta | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch jornada data from window.storage
      if (window.storage) {
        const jornadaKey = `jornada:${userId}`;
        const jornadaResult = await window.storage.get(jornadaKey, false);
        
        if (jornadaResult?.value) {
          setJornada(JSON.parse(jornadaResult.value));
        } else {
          setJornada({ ...DEFAULT_JORNADA, userId });
        }
      } else {
        // Fallback to localStorage
        const jornadaKey = `jornada_${userId}`;
        const storedJornada = localStorage.getItem(jornadaKey);
        if (storedJornada) {
          setJornada(JSON.parse(storedJornada));
        } else {
          setJornada({ ...DEFAULT_JORNADA, userId });
        }
      }

      // Fetch simulado metadata using existing utility
      const simuladoMeta = await getSimuladoMeta(userId);
      setSimulados(simuladoMeta || { ...DEFAULT_SIMULADOS, userId });

      // Fetch category stats
      const stats = await getCategoryStats(userId);
      setCategoryStats(stats);

    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Não foi possível carregar seus dados.');
      
      // Set defaults on error
      setJornada({ ...DEFAULT_JORNADA, userId });
      setSimulados({ ...DEFAULT_SIMULADOS, userId });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const refreshData = useCallback(async () => {
    await loadDashboardData();
  }, [loadDashboardData]);

  return {
    jornada,
    simulados,
    categoryStats,
    loading,
    error,
    refreshData
  };
}
