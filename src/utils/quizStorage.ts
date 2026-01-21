import { QuizResult, SimuladoMeta, CategoryStats, Answer } from '@/types/quiz';

// Storage key patterns
const SIMULADO_PREFIX = 'simulados';
const META_PREFIX = 'simulados-meta';
const STATS_PREFIX = 'simulados-stats';

// Fallback to localStorage when window.storage is unavailable
const FALLBACK_KEY = 'quiz_history';
const FALLBACK_META_KEY = 'quiz_meta';
const FALLBACK_STATS_KEY = 'quiz_stats';

/**
 * Check if window.storage API is available
 */
function isStorageAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.storage;
}

/**
 * Generate unique ID for simulado
 */
function generateSimuladoId(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.T-]/g, '').slice(0, 14);
  return `sim_${timestamp}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Save a quiz result to storage
 */
export async function saveQuizResult(result: QuizResult, userId?: string): Promise<void> {
  const uid = userId || 'anonymous';
  const resultWithUser = { ...result, userId: uid };

  if (isStorageAvailable()) {
    try {
      // 1. Save individual simulado
      const key = `${SIMULADO_PREFIX}:${uid}:${result.id}`;
      await window.storage!.set(key, JSON.stringify(resultWithUser), false);

      // 2. Update metadata
      await updateSimuladoMeta(uid, resultWithUser);

      // 3. Update category statistics
      await updateCategoryStats(uid, result.answers);
    } catch (error) {
      console.error('Error saving to window.storage, falling back to localStorage:', error);
      saveToLocalStorageFallback(resultWithUser);
    }
  } else {
    saveToLocalStorageFallback(resultWithUser);
  }
}

/**
 * Update simulado metadata (totals, averages, etc.)
 */
async function updateSimuladoMeta(userId: string, newResult: QuizResult): Promise<void> {
  const metaKey = `${META_PREFIX}:${userId}`;

  try {
    const existing = await window.storage!.get(metaKey, false);
    let meta: SimuladoMeta;

    if (existing) {
      meta = JSON.parse(existing.value);

      // Recalculate weighted average
      const totalScoreSum = (meta.averageScore * meta.totalSimulados) + newResult.score;
      meta.totalSimulados += 1;
      meta.averageScore = Math.round(totalScoreSum / meta.totalSimulados);

      // Update best/worst scores
      meta.bestScore = Math.max(meta.bestScore, newResult.score);
      meta.worstScore = Math.min(meta.worstScore, newResult.score);
      meta.totalTimeSpent += newResult.timeSpent;
    } else {
      // First simulado
      meta = {
        userId,
        totalSimulados: 1,
        averageScore: newResult.score,
        lastSimuladoDate: newResult.date,
        bestScore: newResult.score,
        worstScore: newResult.score,
        totalTimeSpent: newResult.timeSpent,
        lastUpdated: new Date().toISOString()
      };
    }

    meta.lastSimuladoDate = newResult.date;
    meta.lastUpdated = new Date().toISOString();

    await window.storage!.set(metaKey, JSON.stringify(meta), false);
  } catch (error) {
    console.error('Error updating meta:', error);
  }
}

/**
 * Update category-wise statistics
 */
async function updateCategoryStats(userId: string, answers: Answer[]): Promise<void> {
  const statsKey = `${STATS_PREFIX}:${userId}`;

  try {
    const existing = await window.storage!.get(statsKey, false);
    let stats: CategoryStats = existing 
      ? JSON.parse(existing.value) 
      : { userId, byCategory: {}, lastUpdated: '' };

    // Group answers by category
    const grouped = answers.reduce((acc, answer) => {
      const category = answer.category || 'Outros';
      if (!acc[category]) {
        acc[category] = { total: 0, correct: 0 };
      }
      acc[category].total++;
      if (answer.isCorrect) acc[category].correct++;
      return acc;
    }, {} as Record<string, { total: number; correct: number }>);

    // Update statistics
    for (const [category, data] of Object.entries(grouped)) {
      if (!stats.byCategory[category]) {
        stats.byCategory[category] = {
          questionsAnswered: 0,
          correctAnswers: 0,
          accuracy: 0
        };
      }

      stats.byCategory[category].questionsAnswered += data.total;
      stats.byCategory[category].correctAnswers += data.correct;
      stats.byCategory[category].accuracy = Math.round(
        (stats.byCategory[category].correctAnswers /
          stats.byCategory[category].questionsAnswered) * 100
      );
    }

    stats.lastUpdated = new Date().toISOString();
    await window.storage!.set(statsKey, JSON.stringify(stats), false);
  } catch (error) {
    console.error('Error updating category stats:', error);
  }
}

/**
 * Get simulado metadata for dashboard
 */
export async function getSimuladoMeta(userId?: string): Promise<SimuladoMeta | null> {
  const uid = userId || 'anonymous';

  if (isStorageAvailable()) {
    try {
      const result = await window.storage!.get(`${META_PREFIX}:${uid}`, false);
      return result ? JSON.parse(result.value) : null;
    } catch (error) {
      console.error('Error fetching meta:', error);
      return getMetaFromLocalStorageFallback();
    }
  } else {
    return getMetaFromLocalStorageFallback();
  }
}

/**
 * Get recent simulados
 */
export async function getRecentSimulados(userId?: string, limit: number = 5): Promise<QuizResult[]> {
  const uid = userId || 'anonymous';

  if (isStorageAvailable()) {
    try {
      const keys = await window.storage!.list(`${SIMULADO_PREFIX}:${uid}:`, false);
      if (!keys || keys.keys.length === 0) return [];

      // Fetch all simulados
      const simulados = await Promise.all(
        keys.keys.map(async (key) => {
          const result = await window.storage!.get(key, false);
          return result ? JSON.parse(result.value) as QuizResult : null;
        })
      );

      // Sort by date (most recent first) and limit
      return simulados
        .filter((s): s is QuizResult => s !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent simulados:', error);
      return getRecentFromLocalStorageFallback(limit);
    }
  } else {
    return getRecentFromLocalStorageFallback(limit);
  }
}

/**
 * Get category statistics
 */
export async function getCategoryStats(userId?: string): Promise<CategoryStats | null> {
  const uid = userId || 'anonymous';

  if (isStorageAvailable()) {
    try {
      const result = await window.storage!.get(`${STATS_PREFIX}:${uid}`, false);
      return result ? JSON.parse(result.value) : null;
    } catch (error) {
      console.error('Error fetching category stats:', error);
      return null;
    }
  }
  return null;
}

/**
 * Get a specific quiz result by ID
 */
export async function getQuizResultById(id: string, userId?: string): Promise<QuizResult | null> {
  const uid = userId || 'anonymous';

  if (isStorageAvailable()) {
    try {
      const result = await window.storage!.get(`${SIMULADO_PREFIX}:${uid}:${id}`, false);
      return result ? JSON.parse(result.value) : null;
    } catch (error) {
      console.error('Error fetching quiz result:', error);
      return getResultByIdFromLocalStorageFallback(id);
    }
  } else {
    return getResultByIdFromLocalStorageFallback(id);
  }
}

/**
 * Delete a specific quiz result
 */
export async function deleteQuizResult(id: string, userId?: string): Promise<void> {
  const uid = userId || 'anonymous';

  if (isStorageAvailable()) {
    try {
      await window.storage!.delete(`${SIMULADO_PREFIX}:${uid}:${id}`, false);
      // Note: We don't recalculate meta on delete for simplicity
    } catch (error) {
      console.error('Error deleting quiz result:', error);
    }
  } else {
    deleteFromLocalStorageFallback(id);
  }
}

// ============ localStorage Fallback Functions ============

function saveToLocalStorageFallback(result: QuizResult): void {
  try {
    const history = getQuizHistoryFromLocalStorage();
    history.unshift(result);
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(history));

    // Update fallback meta
    updateLocalStorageMeta(result);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

function getQuizHistoryFromLocalStorage(): QuizResult[] {
  try {
    const data = localStorage.getItem(FALLBACK_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function updateLocalStorageMeta(newResult: QuizResult): void {
  try {
    const existing = localStorage.getItem(FALLBACK_META_KEY);
    let meta: SimuladoMeta;

    if (existing) {
      meta = JSON.parse(existing);
      const totalScoreSum = (meta.averageScore * meta.totalSimulados) + newResult.score;
      meta.totalSimulados += 1;
      meta.averageScore = Math.round(totalScoreSum / meta.totalSimulados);
      meta.bestScore = Math.max(meta.bestScore, newResult.score);
      meta.worstScore = Math.min(meta.worstScore, newResult.score);
      meta.totalTimeSpent += newResult.timeSpent;
    } else {
      meta = {
        userId: 'anonymous',
        totalSimulados: 1,
        averageScore: newResult.score,
        lastSimuladoDate: newResult.date,
        bestScore: newResult.score,
        worstScore: newResult.score,
        totalTimeSpent: newResult.timeSpent,
        lastUpdated: new Date().toISOString()
      };
    }

    meta.lastSimuladoDate = newResult.date;
    meta.lastUpdated = new Date().toISOString();
    localStorage.setItem(FALLBACK_META_KEY, JSON.stringify(meta));
  } catch (error) {
    console.error('Error updating localStorage meta:', error);
  }
}

function getMetaFromLocalStorageFallback(): SimuladoMeta | null {
  try {
    const data = localStorage.getItem(FALLBACK_META_KEY);
    if (data) return JSON.parse(data);

    // Calculate from history if meta doesn't exist
    const history = getQuizHistoryFromLocalStorage();
    if (history.length === 0) return null;

    const totalScore = history.reduce((sum, quiz) => sum + quiz.score, 0);
    const bestScore = Math.max(...history.map(q => q.score));
    const worstScore = Math.min(...history.map(q => q.score));
    const totalTime = history.reduce((sum, quiz) => sum + quiz.timeSpent, 0);

    return {
      userId: 'anonymous',
      totalSimulados: history.length,
      averageScore: Math.round(totalScore / history.length),
      lastSimuladoDate: history[0]?.date || new Date().toISOString(),
      bestScore,
      worstScore,
      totalTimeSpent: totalTime,
      lastUpdated: new Date().toISOString()
    };
  } catch {
    return null;
  }
}

function getRecentFromLocalStorageFallback(limit: number): QuizResult[] {
  return getQuizHistoryFromLocalStorage().slice(0, limit);
}

function getResultByIdFromLocalStorageFallback(id: string): QuizResult | null {
  const history = getQuizHistoryFromLocalStorage();
  return history.find(result => result.id === id) || null;
}

function deleteFromLocalStorageFallback(id: string): void {
  const history = getQuizHistoryFromLocalStorage();
  const filtered = history.filter(result => result.id !== id);
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(filtered));
}

// ============ Legacy Compatibility Functions ============

/**
 * @deprecated Use getSimuladoMeta instead
 */
export function getQuizStats(): {
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
  totalQuestionsAnswered: number;
} {
  const history = getQuizHistoryFromLocalStorage();

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

/**
 * @deprecated Use getRecentSimulados instead
 */
export function getQuizHistory(): QuizResult[] {
  return getQuizHistoryFromLocalStorage();
}

/**
 * @deprecated Use saveQuizResult instead (now async)
 */
export function saveQuizResultSync(result: QuizResult): void {
  saveToLocalStorageFallback(result);
}

/**
 * Calculate average score from recent quizzes (legacy)
 */
export function calculateAverageScore(count: number = 5): number {
  const recent = getQuizHistoryFromLocalStorage().slice(0, count);
  if (recent.length === 0) return 0;
  const totalScore = recent.reduce((sum, quiz) => sum + quiz.score, 0);
  return Math.round(totalScore / recent.length);
}

/**
 * Get total number of quizzes completed (legacy)
 */
export function getTotalQuizzesCount(): number {
  return getQuizHistoryFromLocalStorage().length;
}

/**
 * Clear all quiz history
 */
export async function clearQuizHistory(userId?: string): Promise<void> {
  const uid = userId || 'anonymous';

  if (isStorageAvailable()) {
    try {
      const keys = await window.storage!.list(`${SIMULADO_PREFIX}:${uid}:`, false);
      if (keys && keys.keys.length > 0) {
        await Promise.all(keys.keys.map(key => window.storage!.delete(key, false)));
      }
      await window.storage!.delete(`${META_PREFIX}:${uid}`, false);
      await window.storage!.delete(`${STATS_PREFIX}:${uid}`, false);
    } catch (error) {
      console.error('Error clearing quiz history:', error);
    }
  }
  
  localStorage.removeItem(FALLBACK_KEY);
  localStorage.removeItem(FALLBACK_META_KEY);
  localStorage.removeItem(FALLBACK_STATS_KEY);
}
