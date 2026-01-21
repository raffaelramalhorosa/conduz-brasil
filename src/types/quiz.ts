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
