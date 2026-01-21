import { Question, Answer, CategoryScore, QuizResult, QuizMode } from '@/types/quiz';

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Select random questions based on quiz mode
 */
export function selectQuestions(
  allQuestions: Question[],
  mode: QuizMode,
  category?: string
): Question[] {
  let filteredQuestions = allQuestions;
  let count = 30;

  if (mode === 'category' && category) {
    filteredQuestions = allQuestions.filter(q => q.categoria === category);
    count = Math.min(15, filteredQuestions.length);
  } else if (mode === 'blitz') {
    count = 10;
  }

  const shuffled = shuffleArray(filteredQuestions);
  return shuffled.slice(0, count);
}

/**
 * Calculate quiz score and breakdown
 */
export function calculateScore(
  answers: Map<number, string>,
  questions: Question[]
): { correct: number; incorrect: number; score: number } {
  let correct = 0;
  
  questions.forEach(question => {
    const userAnswer = answers.get(question.id);
    if (userAnswer === question.resposta_correta) {
      correct++;
    }
  });

  const incorrect = questions.length - correct;
  const score = Math.round((correct / questions.length) * 100);

  return { correct, incorrect, score };
}

/**
 * Calculate breakdown by category
 */
export function calculateCategoryBreakdown(
  answers: Map<number, string>,
  questions: Question[]
): CategoryScore[] {
  const categoryMap = new Map<string, { correct: number; total: number }>();

  questions.forEach(question => {
    const category = question.categoria;
    const current = categoryMap.get(category) || { correct: 0, total: 0 };
    
    current.total++;
    
    const userAnswer = answers.get(question.id);
    if (userAnswer === question.resposta_correta) {
      current.correct++;
    }
    
    categoryMap.set(category, current);
  });

  const breakdown: CategoryScore[] = [];
  categoryMap.forEach((value, category) => {
    breakdown.push({
      category,
      correct: value.correct,
      total: value.total,
      percentage: Math.round((value.correct / value.total) * 100)
    });
  });

  return breakdown.sort((a, b) => b.percentage - a.percentage);
}

/**
 * Build complete answers array for storage
 */
export function buildAnswersArray(
  answersMap: Map<number, string>,
  questions: Question[]
): Answer[] {
  return questions.map(question => ({
    questionId: question.id,
    selectedAnswer: answersMap.get(question.id) || '',
    isCorrect: answersMap.get(question.id) === question.resposta_correta,
    correctAnswer: question.resposta_correta,
    category: question.categoria
  }));
}

/**
 * Generate UUID for quiz result
 */
export function generateQuizId(): string {
  return crypto.randomUUID();
}

/**
 * Format time in seconds to readable format
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}min ${remainingSeconds.toString().padStart(2, '0')}s`;
}

/**
 * Calculate time spent in seconds
 */
export function calculateTimeSpent(startTime: Date): number {
  return Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
}

/**
 * Build complete quiz result
 */
export function buildQuizResult(
  questions: Question[],
  answers: Map<number, string>,
  startTime: Date,
  mode: QuizMode,
  category?: string
): QuizResult {
  const { correct, incorrect, score } = calculateScore(answers, questions);
  const categoryBreakdown = calculateCategoryBreakdown(answers, questions);
  const answersArray = buildAnswersArray(answers, questions);
  const timeSpent = calculateTimeSpent(startTime);

  return {
    id: generateQuizId(),
    date: new Date().toISOString(),
    score,
    totalQuestions: questions.length,
    correctAnswers: correct,
    incorrectAnswers: incorrect,
    timeSpent,
    mode,
    category,
    answers: answersArray,
    categoryBreakdown
  };
}
