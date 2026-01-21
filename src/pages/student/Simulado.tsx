import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizStart } from '@/components/quiz/QuizStart';
import { QuizQuestion } from '@/components/quiz/QuizQuestion';
import { QuizResult } from '@/components/quiz/QuizResult';
import { QuizReview } from '@/components/quiz/QuizReview';
import { useQuizState } from '@/hooks/useQuizState';
import { QuizMode, QuizResult as QuizResultType } from '@/types/quiz';

type ViewState = 'start' | 'quiz' | 'result' | 'review' | 'review-errors';

export default function Simulado() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>('start');
  const [currentResult, setCurrentResult] = useState<QuizResultType | null>(null);
  
  const {
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
    toggleMarkForReview,
    finishQuiz,
    resetQuiz
  } = useQuizState();

  const handleStart = useCallback((mode: QuizMode, category?: string) => {
    startQuiz(mode, category);
    setView('quiz');
  }, [startQuiz]);

  const handleFinish = useCallback(() => {
    const result = finishQuiz();
    setCurrentResult(result);
    setView('result');
  }, [finishQuiz]);

  const handleRestart = useCallback(() => {
    resetQuiz();
    setView('start');
    setCurrentResult(null);
  }, [resetQuiz]);

  const handleExit = useCallback(() => {
    resetQuiz();
    navigate('/aluno');
  }, [resetQuiz, navigate]);

  const handleViewAnswers = useCallback(() => {
    setView('review');
  }, []);

  const handleReviewErrors = useCallback(() => {
    setView('review-errors');
  }, []);

  const handleBackToResult = useCallback(() => {
    setView('result');
  }, []);

  // Render based on current view
  if (view === 'start') {
    return <QuizStart onStart={handleStart} />;
  }

  if (view === 'quiz' && currentQuestion) {
    return (
      <QuizQuestion
        question={currentQuestion}
        currentIndex={state.currentIndex}
        totalQuestions={state.questions.length}
        selectedAnswer={selectedAnswer}
        isAnswered={isAnswered}
        isMarkedForReview={state.markedForReview.has(currentQuestion.id)}
        onSelectAnswer={selectAnswer}
        onConfirm={confirmAnswer}
        onNext={nextQuestion}
        onPrevious={previousQuestion}
        onToggleMark={toggleMarkForReview}
        onExit={handleExit}
        isLastQuestion={isLastQuestion}
        onFinish={handleFinish}
      />
    );
  }

  if (view === 'result' && currentResult) {
    return (
      <QuizResult
        result={currentResult}
        onRestart={handleRestart}
        onReviewErrors={handleReviewErrors}
        onViewAnswers={handleViewAnswers}
      />
    );
  }

  if ((view === 'review' || view === 'review-errors') && currentResult) {
    return (
      <QuizReview
        questions={state.questions}
        answers={currentResult.answers}
        onlyErrors={view === 'review-errors'}
        onBack={handleBackToResult}
      />
    );
  }

  // Fallback
  return <QuizStart onStart={handleStart} />;
}
