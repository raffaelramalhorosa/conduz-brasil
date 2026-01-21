// Quiz Types for CNH Simulation System

export interface Question {
  id: number;
  pergunta: string;
  categoria: string;
  alternativas: string[];
  resposta_correta: string;
}

export interface Answer {
  questionId: number;
  selectedAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  category: string;
  timeSpent?: number;
}

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  answers: Map<number, string>;
  markedForReview: Set<number>;
  startTime: Date;
  isFinished: boolean;
  mode: QuizMode;
  category?: string;
}

export type QuizMode = 'complete' | 'category' | 'blitz';

export interface QuizResult {
  id: string;
  userId?: string;
  date: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: number; // in seconds
  mode: QuizMode;
  category?: string;
  answers: Answer[];
  categoryBreakdown: CategoryScore[];
}

export interface CategoryScore {
  category: string;
  correct: number;
  total: number;
  percentage: number;
}

// Metadata for dashboard statistics
export interface SimuladoMeta {
  userId: string;
  totalSimulados: number;
  averageScore: number;
  lastSimuladoDate: string;
  bestScore: number;
  worstScore: number;
  totalTimeSpent: number;
  lastUpdated: string;
}

// Category statistics
export interface CategoryStats {
  userId: string;
  byCategory: Record<string, {
    questionsAnswered: number;
    correctAnswers: number;
    accuracy: number;
  }>;
  lastUpdated: string;
}

export const QUIZ_CATEGORIES = [
  "Direção Defensiva",
  "Processos de habilitação",
  "Infrações e penalidades",
  "Sinalização de trânsito",
  "Normas de circulação",
  "Primeiros socorros",
  "Meio ambiente e cidadania",
  "Mecânica básica de veículos"
] as const;

export type QuizCategory = typeof QUIZ_CATEGORIES[number];

// Declare window.storage API types
declare global {
  interface Window {
    storage?: {
      set: (key: string, value: string, shared?: boolean) => Promise<void>;
      get: (key: string, shared?: boolean) => Promise<{ key: string; value: string; shared: boolean } | null>;
      list: (prefix?: string, shared?: boolean) => Promise<{ keys: string[]; prefix?: string; shared: boolean }>;
      delete: (key: string, shared?: boolean) => Promise<void>;
    };
  }
}
