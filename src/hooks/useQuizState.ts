import { useState, useCallback, useMemo } from 'react';
import { Question, QuizState, QuizMode, QuizResult } from '@/types/quiz';
import { selectQuestions, buildQuizResult } from '@/utils/quizCalculations';
import { saveQuizResult } from '@/utils/quizStorage';
import perguntasData from '@/data/perguntas.json';

const allQuestions = perguntasData as Question[];

interface UseQuizStateReturn {
  state: QuizState;
  currentQuestion: Question | null;
  progress: number;
  isLastQuestion: boolean;
  isAnswered: boolean;
  selectedAnswer: string | null;
  
  // Actions
  startQuiz: (mode: QuizMode, category?: string) => void;
  selectAnswer: (answer: string) => void;
  confirmAnswer: () => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  toggleMarkForReview: () => void;
  finishQuiz: () => QuizResult;
  resetQuiz: () => void;
}

const initialState: QuizState = {
  questions: [],
  currentIndex: 0,
  answers: new Map(),
  markedForReview: new Set(),
  startTime: new Date(),
  isFinished: false,
  mode: 'complete',
  category: undefined
};

export function useQuizState(): UseQuizStateReturn {
  const [state, setState] = useState<QuizState>(initialState);
  const [confirmedAnswers, setConfirmedAnswers] = useState<Set<number>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const currentQuestion = useMemo(() => {
    if (state.questions.length === 0) return null;
    return state.questions[state.currentIndex] || null;
  }, [state.questions, state.currentIndex]);

  const progress = useMemo(() => {
    if (state.questions.length === 0) return 0;
    return Math.round(((state.currentIndex + 1) / state.questions.length) * 100);
  }, [state.currentIndex, state.questions.length]);

  const isLastQuestion = state.currentIndex === state.questions.length - 1;

  const isAnswered = currentQuestion 
    ? confirmedAnswers.has(currentQuestion.id)
    : false;

  const startQuiz = useCallback((mode: QuizMode, category?: string) => {
    const questions = selectQuestions(allQuestions, mode, category);
    setState({
      questions,
      currentIndex: 0,
      answers: new Map(),
      markedForReview: new Set(),
      startTime: new Date(),
      isFinished: false,
      mode,
      category
    });
    setConfirmedAnswers(new Set());
    setSelectedAnswer(null);
  }, []);

  const selectAnswer = useCallback((answer: string) => {
    if (!currentQuestion || isAnswered) return;
    setSelectedAnswer(answer);
  }, [currentQuestion, isAnswered]);

  const confirmAnswer = useCallback(() => {
    if (!currentQuestion || !selectedAnswer || isAnswered) return;
    
    setState(prev => {
      const newAnswers = new Map(prev.answers);
      newAnswers.set(currentQuestion.id, selectedAnswer);
      return { ...prev, answers: newAnswers };
    });
    
    setConfirmedAnswers(prev => new Set(prev).add(currentQuestion.id));
  }, [currentQuestion, selectedAnswer, isAnswered]);

  const nextQuestion = useCallback(() => {
    if (state.currentIndex < state.questions.length - 1) {
      setState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
      setSelectedAnswer(null);
    }
  }, [state.currentIndex, state.questions.length]);

  const previousQuestion = useCallback(() => {
    if (state.currentIndex > 0) {
      setState(prev => ({ ...prev, currentIndex: prev.currentIndex - 1 }));
      setSelectedAnswer(null);
    }
  }, [state.currentIndex]);

  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < state.questions.length) {
      setState(prev => ({ ...prev, currentIndex: index }));
      setSelectedAnswer(null);
    }
  }, [state.questions.length]);

  const toggleMarkForReview = useCallback(() => {
    if (!currentQuestion) return;
    
    setState(prev => {
      const newMarked = new Set(prev.markedForReview);
      if (newMarked.has(currentQuestion.id)) {
        newMarked.delete(currentQuestion.id);
      } else {
        newMarked.add(currentQuestion.id);
      }
      return { ...prev, markedForReview: newMarked };
    });
  }, [currentQuestion]);

  const finishQuiz = useCallback((): QuizResult => {
    const result = buildQuizResult(
      state.questions,
      state.answers,
      state.startTime,
      state.mode,
      state.category
    );
    
    saveQuizResult(result);
    setState(prev => ({ ...prev, isFinished: true }));
    
    return result;
  }, [state]);

  const resetQuiz = useCallback(() => {
    setState(initialState);
    setConfirmedAnswers(new Set());
    setSelectedAnswer(null);
  }, []);

  return {
    state,
    currentQuestion,
    progress,
    isLastQuestion,
    isAnswered,
    selectedAnswer,
    startQuiz,
    selectAnswer,
    confirmAnswer,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    toggleMarkForReview,
    finishQuiz,
    resetQuiz
  };
}
