import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSimuladoMeta } from '@/utils/quizStorage';
import { useStudentLessonsProgress } from './useStudentLessonsProgress';

export interface JornadaEtapa {
  id: number;
  titulo: string;
  descricao: string;
  status: 'concluida' | 'atual' | 'bloqueada';
  icon: string;
  tipo: 'upload' | 'simulados' | 'aulas' | 'info';
  detalhes?: {
    comprovante?: boolean;
    progresso?: { atual: number; total: number; unidade: string; minimo?: number };
    action?: { label: string; route: string };
    requisito?: string;
  };
}

export interface JornadaData {
  userId: string;
  etapaAtual: number;
  percentualGeral: number;
  etapasConcluidas: number[];
  aulasPraticasHoras: number;
  dataAbertura?: string;
}

const STORAGE_KEY_PREFIX = 'jornada';
const MIN_SIMULADOS = 3;
const MIN_AULAS = 2;
const RECOMMENDED_AULAS = 10;

export function useJornadaProgress() {
  const { user } = useAuth();
  const userId = user?.id || '';
  
  const [jornadaData, setJornadaData] = useState<JornadaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalSimulados, setTotalSimulados] = useState(0);
  
  const lessonsProgress = useStudentLessonsProgress();

  // Load jornada data from storage
  const loadJornadaData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get simulados count
      const simuladoMeta = await getSimuladoMeta(userId);
      setTotalSimulados(simuladoMeta?.totalSimulados || 0);

      // Get jornada data from storage
      const key = `${STORAGE_KEY_PREFIX}:${userId}`;
      
      if (typeof window !== 'undefined' && window.storage) {
        const result = await window.storage.get(key, false);
        if (result?.value) {
          setJornadaData(JSON.parse(result.value));
        } else {
          // Initialize default data
          const defaultData: JornadaData = {
            userId,
            etapaAtual: 1,
            percentualGeral: 0,
            etapasConcluidas: [],
            aulasPraticasHoras: 0,
          };
          setJornadaData(defaultData);
        }
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem(`jornada_${userId}`);
        if (stored) {
          setJornadaData(JSON.parse(stored));
        } else {
          const defaultData: JornadaData = {
            userId,
            etapaAtual: 1,
            percentualGeral: 0,
            etapasConcluidas: [],
            aulasPraticasHoras: 0,
          };
          setJornadaData(defaultData);
        }
      }
    } catch (error) {
      console.error('Error loading jornada data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Save jornada data to storage
  const saveJornadaData = useCallback(async (data: JornadaData) => {
    if (!userId) return;

    try {
      const key = `${STORAGE_KEY_PREFIX}:${userId}`;
      
      if (typeof window !== 'undefined' && window.storage) {
        await window.storage.set(key, JSON.stringify(data), false);
      } else {
        localStorage.setItem(`jornada_${userId}`, JSON.stringify(data));
      }
      
      setJornadaData(data);
    } catch (error) {
      console.error('Error saving jornada data:', error);
    }
  }, [userId]);

  // Mark a step as complete
  const completeStep = useCallback(async (stepId: number) => {
    if (!jornadaData) return;

    const updatedData: JornadaData = {
      ...jornadaData,
      etapasConcluidas: [...new Set([...jornadaData.etapasConcluidas, stepId])],
    };

    // Calculate next step
    const allSteps = [1, 2, 3, 4, 5];
    const nextIncomplete = allSteps.find(s => !updatedData.etapasConcluidas.includes(s));
    updatedData.etapaAtual = nextIncomplete || 5;

    // Calculate percentage
    updatedData.percentualGeral = Math.round((updatedData.etapasConcluidas.length / 5) * 100);

    await saveJornadaData(updatedData);
  }, [jornadaData, saveJornadaData]);

  // Generate etapas with dynamic status
  const getEtapas = useCallback((): JornadaEtapa[] => {
    const completedSteps = jornadaData?.etapasConcluidas || [];
    const completedLessons = lessonsProgress.completedLessons;

    // Helper to determine status
    const getStatus = (stepId: number, prerequisiteId?: number): 'concluida' | 'atual' | 'bloqueada' => {
      if (completedSteps.includes(stepId)) return 'concluida';
      
      // Check prerequisites
      if (prerequisiteId && !completedSteps.includes(prerequisiteId)) {
        return 'bloqueada';
      }
      
      // Special checks
      if (stepId === 3 && totalSimulados < MIN_SIMULADOS) {
        return 'bloqueada';
      }
      if (stepId === 5 && completedLessons < MIN_AULAS) {
        return 'bloqueada';
      }

      // Find current step
      const allSteps = [1, 2, 3, 4, 5];
      const firstIncomplete = allSteps.find(s => !completedSteps.includes(s));
      
      return stepId === firstIncomplete ? 'atual' : 'bloqueada';
    };

    // Check if estudo teórico can be marked complete (auto-complete when 3+ simulados)
    const estudoTeoricoStatus = (): 'concluida' | 'atual' | 'bloqueada' => {
      if (completedSteps.includes(2)) return 'concluida';
      if (!completedSteps.includes(1)) return 'bloqueada';
      return 'atual';
    };

    // Check if aulas práticas can be considered complete
    const aulasPraticasStatus = (): 'concluida' | 'atual' | 'bloqueada' => {
      if (completedSteps.includes(4)) return 'concluida';
      if (!completedSteps.includes(3)) return 'bloqueada';
      return 'atual';
    };

    return [
      {
        id: 1,
        titulo: 'Abertura do Processo',
        descricao: 'Abertura via app CDT ou Detran',
        status: getStatus(1),
        icon: 'RefreshCw',
        tipo: 'upload',
        detalhes: {
          comprovante: true,
        },
      },
      {
        id: 2,
        titulo: 'Estudo Teórico',
        descricao: `Complete ${MIN_SIMULADOS} simulados para avançar`,
        status: estudoTeoricoStatus(),
        icon: 'Book',
        tipo: 'simulados',
        detalhes: {
          progresso: {
            atual: totalSimulados,
            total: MIN_SIMULADOS,
            unidade: 'simulados',
          },
          action: { label: 'Fazer Simulado', route: '/aluno/simulado' },
          requisito: `Mínimo de ${MIN_SIMULADOS} simulados`,
        },
      },
      {
        id: 3,
        titulo: 'Prova Teórica',
        descricao: 'Exame no DETRAN',
        status: getStatus(3, 2),
        icon: 'ClipboardList',
        tipo: 'upload',
        detalhes: {
          comprovante: true,
          requisito: 'Complete o estudo teórico primeiro',
        },
      },
      {
        id: 4,
        titulo: 'Aulas Práticas',
        descricao: `Mínimo ${MIN_AULAS} aulas, recomendado ${RECOMMENDED_AULAS}`,
        status: aulasPraticasStatus(),
        icon: 'Car',
        tipo: 'aulas',
        detalhes: {
          progresso: {
            atual: completedLessons,
            total: RECOMMENDED_AULAS,
            unidade: 'aulas',
            minimo: MIN_AULAS,
          },
          action: { label: 'Agendar Aula', route: '/instrutores' },
          requisito: `Mínimo ${MIN_AULAS} aulas para o exame`,
        },
      },
      {
        id: 5,
        titulo: 'Exame Prático',
        descricao: 'Prova de direção final',
        status: getStatus(5, 4),
        icon: 'Trophy',
        tipo: 'upload',
        detalhes: {
          comprovante: true,
          requisito: `Complete ${MIN_AULAS}+ aulas práticas primeiro`,
        },
      },
    ];
  }, [jornadaData, totalSimulados, lessonsProgress.completedLessons]);

  useEffect(() => {
    loadJornadaData();
  }, [loadJornadaData]);

  // Auto-complete Estudo Teórico when 3+ simulados
  useEffect(() => {
    if (jornadaData && totalSimulados >= MIN_SIMULADOS && !jornadaData.etapasConcluidas.includes(2)) {
      // Only if step 1 is complete
      if (jornadaData.etapasConcluidas.includes(1)) {
        completeStep(2);
      }
    }
  }, [totalSimulados, jornadaData, completeStep]);

  // Auto-complete Aulas Práticas when 2+ lessons
  useEffect(() => {
    if (jornadaData && lessonsProgress.completedLessons >= MIN_AULAS && !jornadaData.etapasConcluidas.includes(4)) {
      // Only if step 3 is complete
      if (jornadaData.etapasConcluidas.includes(3)) {
        completeStep(4);
      }
    }
  }, [lessonsProgress.completedLessons, jornadaData, completeStep]);

  const etapas = getEtapas();
  const completedSteps = jornadaData?.etapasConcluidas.length || 0;
  const percentComplete = jornadaData?.percentualGeral || Math.round((completedSteps / 5) * 100);

  return {
    etapas,
    jornadaData,
    loading: loading || lessonsProgress.loading,
    totalSimulados,
    completedLessons: lessonsProgress.completedLessons,
    completedSteps,
    percentComplete,
    completeStep,
    refreshData: loadJornadaData,
    minSimulados: MIN_SIMULADOS,
    minAulas: MIN_AULAS,
    recommendedAulas: RECOMMENDED_AULAS,
  };
}
