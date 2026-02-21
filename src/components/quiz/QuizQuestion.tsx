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
  LogOut,
  ChevronRight
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
  
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const handleSelect = (alternative: string) => {
    onSelectAnswer(alternative);
  };

  const handleAdvance = () => {
    if (selectedAnswer) {
      onConfirm();
    }
    if (isLastQuestion) {
      onFinish();
    } else {
      onNext();
    }
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
                  const letter = String.fromCharCode(65 + index);
                  const isSelected = selectedAnswer === alternative;
                  
                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleSelect(alternative)}
                      className={cn(
                        "w-full p-4 rounded-lg border-2 text-left transition-all flex items-start gap-3 cursor-pointer",
                        isSelected
                          ? 'bg-primary/10 border-primary shadow-sm'
                          : 'bg-card border-border hover:border-primary/50 hover:shadow-sm'
                      )}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {letter}
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

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="max-w-3xl mx-auto flex justify-end">
          <Button onClick={handleAdvance}>
            {isLastQuestion ? 'Finalizar' : 'Avançar'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
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
