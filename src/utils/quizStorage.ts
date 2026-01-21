import { QuizResult } from '@/types/quiz';

const STORAGE_KEY = 'quiz_history';

/**
 * Get all quiz history from localStorage
 */
export function getQuizHistory(): QuizResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    console.error('Error reading quiz history from localStorage');
    return [];
  }
}

/**
 * Save a new quiz result to localStorage
 */
export function saveQuizResult(result: QuizResult): void {
  try {
    const history = getQuizHistory();
    history.unshift(result); // Add to beginning (most recent first)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    console.error('Error saving quiz result to localStorage');
  }
}

/**
 * Get a specific quiz result by ID
 */
export function getQuizResultById(id: string): QuizResult | null {
  const history = getQuizHistory();
  return history.find(result => result.id === id) || null;
}

/**
 * Get the last N quiz results
 */
export function getRecentQuizzes(count: number = 5): QuizResult[] {
  const history = getQuizHistory();
  return history.slice(0, count);
}

/**
 * Calculate average score from recent quizzes
 */
export function calculateAverageScore(count: number = 5): number {
  const recent = getRecentQuizzes(count);
  if (recent.length === 0) return 0;
  
  const totalScore = recent.reduce((sum, quiz) => sum + quiz.score, 0);
  return Math.round(totalScore / recent.length);
}

/**
 * Get total number of quizzes completed
 */
export function getTotalQuizzesCount(): number {
  return getQuizHistory().length;
}

/**
 * Clear all quiz history
 */
export function clearQuizHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Delete a specific quiz result
 */
export function deleteQuizResult(id: string): void {
  const history = getQuizHistory();
  const filtered = history.filter(result => result.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Get stats for dashboard display
 */
export function getQuizStats(): {
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
  totalQuestionsAnswered: number;
} {
  const history = getQuizHistory();
  
  if (history.length === 0) {
    return {
      totalQuizzes: 0,
      averageScore: 0,
      bestScore: 0,
      totalQuestionsAnswered: 0
    };
  }

  const totalScore = history.reduce((sum, quiz) => sum + quiz.score, 0);
  const bestScore = Math.max(...history.map(quiz => quiz.score));
  const totalQuestionsAnswered = history.reduce((sum, quiz) => sum + quiz.totalQuestions, 0);

  return {
    totalQuizzes: history.length,
    averageScore: Math.round(totalScore / history.length),
    bestScore,
    totalQuestionsAnswered
  };
}
