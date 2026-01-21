import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  X, 
  Check, 
  Star, 
  StarOff, 
  ChevronRight, 
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { Question } from '@/types/quiz';
import { cn } from '@/lib/utils';

interface QuizQuestionProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  isAnswered: boolean;
  isMarkedForReview: boolean;
  onSelectAnswer: (answer: string) => void;
  onConfirm: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleMark: () => void;
  onExit: () => void;
  isLastQuestion: boolean;
  onFinish: () => void;
}

export function QuizQuestion({
  question,
  currentIndex,
  totalQuestions,
  selectedAnswer,
  isAnswered,
  isMarkedForReview,
  onSelectAnswer,
  onConfirm,
  onNext,
  onPrevious,
  onToggleMark,
  onExit,
  isLastQuestion,
  onFinish
}: QuizQuestionProps) {
  const [showExitDialog, setShowExitDialog] = useState(false);
  
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const getAlternativeState = (alternative: string) => {
    if (!isAnswered) {
      if (selectedAnswer === alternative) return 'selected';
      return 'default';
    }
    
    // After confirmation
    if (alternative === question.resposta_correta) return 'correct';
    if (selectedAnswer === alternative && alternative !== question.resposta_correta) return 'incorrect';
    return 'default';
  };

  const alternativeStyles = {
    default: 'bg-card border-border hover:border-primary/50 hover:shadow-sm',
    selected: 'bg-primary/10 border-primary shadow-sm',
    correct: 'bg-green-50 border-green-500 text-green-700',
    incorrect: 'bg-red-50 border-red-500 text-red-700'
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Questão {currentIndex + 1} de {totalQuestions}
              </span>
              <Badge variant="secondary" className="text-xs">
                {question.categoria}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExitDialog(true)}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Sair
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {Math.round(progress)}% concluído
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-32">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Question */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <p className="text-lg font-medium leading-relaxed">
                    {question.pergunta}
                  </p>
                </CardContent>
              </Card>

              {/* Alternatives */}
              <div className="space-y-3">
                {question.alternativas.map((alternative, index) => {
                  const state = getAlternativeState(alternative);
                  const letter = String.fromCharCode(65 + index); // A, B, C, D
                  
                  return (
                    <motion.button
                      key={index}
                      onClick={() => !isAnswered && onSelectAnswer(alternative)}
                      disabled={isAnswered}
                      className={cn(
                        "w-full p-4 rounded-lg border-2 text-left transition-all flex items-start gap-3",
                        alternativeStyles[state],
                        !isAnswered && "cursor-pointer",
                        isAnswered && "cursor-default"
                      )}
                      whileTap={!isAnswered ? { scale: 0.98 } : undefined}
                    >
                      <span className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
                        state === 'selected' && "bg-primary text-primary-foreground",
                        state === 'correct' && "bg-green-500 text-white",
                        state === 'incorrect' && "bg-red-500 text-white",
                        state === 'default' && "bg-muted"
                      )}>
                        {state === 'correct' ? <Check className="w-4 h-4" /> :
                         state === 'incorrect' ? <X className="w-4 h-4" /> :
                         letter}
                      </span>
                      <span className="flex-1 pt-1">{alternative}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Feedback after answer */}
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "mt-4 p-4 rounded-lg",
                    selectedAnswer === question.resposta_correta
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  )}
                >
                  <p className={cn(
                    "font-medium",
                    selectedAnswer === question.resposta_correta
                      ? "text-green-700"
                      : "text-red-700"
                  )}>
                    {selectedAnswer === question.resposta_correta
                      ? "✓ Resposta correta!"
                      : "✗ Resposta incorreta"}
                  </p>
                  {selectedAnswer !== question.resposta_correta && (
                    <p className="text-sm text-muted-foreground mt-1">
                      A resposta correta é: <strong>{question.resposta_correta}</strong>
                    </p>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={onPrevious}
              disabled={currentIndex === 0}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={onToggleMark}
              className={isMarkedForReview ? "text-yellow-500 border-yellow-500" : ""}
            >
              {isMarkedForReview ? (
                <Star className="w-4 h-4 fill-current" />
              ) : (
                <StarOff className="w-4 h-4" />
              )}
            </Button>

            <div className="flex-1">
              {!isAnswered ? (
                <Button
                  onClick={onConfirm}
                  disabled={!selectedAnswer}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Confirmar Resposta
                </Button>
              ) : isLastQuestion ? (
                <Button
                  onClick={onFinish}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Finalizar Simulado
                </Button>
              ) : (
                <Button
                  onClick={onNext}
                  className="w-full"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Exit Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair do simulado?</AlertDialogTitle>
            <AlertDialogDescription>
              Seu progresso será perdido. Tem certeza que deseja sair?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onExit}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
