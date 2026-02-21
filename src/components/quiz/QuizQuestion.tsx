import { useState, useEffect, useRef } from 'react';
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
  LogOut,
  SkipForward
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
  onSelectAnswer,
  onConfirm,
  onNext,
  onExit,
  isLastQuestion,
  onFinish
}: QuizQuestionProps) {
  const [showExitDialog, setShowExitDialog] = useState(false);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  // Auto-advance after answering
  useEffect(() => {
    if (isAnswered) {
      autoAdvanceRef.current = setTimeout(() => {
        if (isLastQuestion) {
          onFinish();
        } else {
          onNext();
        }
      }, 1500);
    }
    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
      }
    };
  }, [isAnswered, isLastQuestion, onNext, onFinish]);

  const handleSelect = (alternative: string) => {
    if (isAnswered) return;
    onSelectAnswer(alternative);
    setTimeout(() => onConfirm(), 50);
  };

  const handleSkip = () => {
    if (isLastQuestion) {
      onFinish();
    } else {
      onNext();
    }
  };

  const getAlternativeState = (alternative: string) => {
    if (!isAnswered) return 'default';
    if (alternative === question.resposta_correta) return 'correct';
    if (selectedAnswer === alternative && alternative !== question.resposta_correta) return 'incorrect';
    return 'disabled';
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Pergunta {currentIndex + 1} de {totalQuestions}
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
      <main className="flex-1 p-4 pb-24">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
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
                  const letter = String.fromCharCode(65 + index);
                  
                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleSelect(alternative)}
                      disabled={isAnswered}
                      className={cn(
                        "w-full p-4 rounded-lg border-2 text-left transition-all flex items-start gap-3",
                        state === 'default' && 'bg-card border-border hover:border-primary/50 hover:shadow-sm cursor-pointer',
                        state === 'correct' && 'bg-green-500/20 border-green-500 cursor-default',
                        state === 'incorrect' && 'bg-red-500/20 border-red-500 cursor-default',
                        state === 'disabled' && 'opacity-50 pointer-events-none cursor-default'
                      )}
                      whileTap={!isAnswered ? { scale: 0.98 } : undefined}
                    >
                      <span className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
                        state === 'correct' && "bg-green-500 text-white",
                        state === 'incorrect' && "bg-red-500 text-white",
                        (state === 'default' || state === 'disabled') && "bg-muted"
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
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer - only skip button */}
      {!isAnswered && (
        <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
          <div className="max-w-3xl mx-auto flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              <SkipForward className="w-4 h-4 mr-1" />
              Pular
            </Button>
          </div>
        </footer>
      )}

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
