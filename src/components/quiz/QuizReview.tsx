import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight,
  Check,
  X,
  Home
} from 'lucide-react';
import { Question, Answer } from '@/types/quiz';
import { cn } from '@/lib/utils';

interface QuizReviewProps {
  questions: Question[];
  answers: Answer[];
  onlyErrors?: boolean;
  onBack: () => void;
}

export function QuizReview({ questions, answers, onlyErrors = false, onBack }: QuizReviewProps) {
  const navigate = useNavigate();
  
  // Filter questions based on mode
  const reviewQuestions = onlyErrors
    ? questions.filter(q => {
        const answer = answers.find(a => a.questionId === q.id);
        return answer && !answer.isCorrect;
      })
    : questions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion = reviewQuestions[currentIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);

  if (reviewQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Parabéns!</h2>
            <p className="text-muted-foreground mb-4">
              Você não errou nenhuma questão neste simulado!
            </p>
            <Button onClick={onBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Resultado
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <span className="text-sm font-medium">
              {onlyErrors ? 'Revisão de Erros' : 'Revisão Completa'}
            </span>
            <Badge variant="secondary">
              {currentIndex + 1} de {reviewQuestions.length}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24">
        <div className="max-w-3xl mx-auto">
          <motion.div
            key={currentQuestion?.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Status Badge */}
            <div className="flex items-center gap-2 mb-4">
              <Badge
                variant={currentAnswer?.isCorrect ? "default" : "destructive"}
                className={currentAnswer?.isCorrect ? "bg-green-500" : ""}
              >
                {currentAnswer?.isCorrect ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Correta
                  </>
                ) : (
                  <>
                    <X className="w-3 h-3 mr-1" />
                    Incorreta
                  </>
                )}
              </Badge>
              <Badge variant="outline">{currentQuestion?.categoria}</Badge>
            </div>

            {/* Question */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <p className="text-lg font-medium leading-relaxed">
                  {currentQuestion?.pergunta}
                </p>
              </CardContent>
            </Card>

            {/* Alternatives */}
            <div className="space-y-3">
              {currentQuestion?.alternativas.map((alternative, index) => {
                const isSelected = currentAnswer?.selectedAnswer === alternative;
                const isCorrect = alternative === currentQuestion.resposta_correta;
                const letter = String.fromCharCode(65 + index);

                let state: 'correct' | 'incorrect' | 'default' = 'default';
                if (isCorrect) state = 'correct';
                else if (isSelected) state = 'incorrect';

                const styles = {
                  correct: 'bg-green-50 border-green-500',
                  incorrect: 'bg-red-50 border-red-500',
                  default: 'bg-card border-border'
                };

                return (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-lg border-2 flex items-start gap-3",
                      styles[state]
                    )}
                  >
                    <span className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
                      state === 'correct' && "bg-green-500 text-white",
                      state === 'incorrect' && "bg-red-500 text-white",
                      state === 'default' && "bg-muted"
                    )}>
                      {state === 'correct' ? <Check className="w-4 h-4" /> :
                       state === 'incorrect' ? <X className="w-4 h-4" /> :
                       letter}
                    </span>
                    <span className={cn(
                      "flex-1 pt-1",
                      state === 'correct' && "text-green-700 font-medium",
                      state === 'incorrect' && "text-red-700"
                    )}>
                      {alternative}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            {!currentAnswer?.isCorrect && (
              <Card className="mt-4 border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-sm">
                    <strong>Resposta correta:</strong> {currentQuestion?.resposta_correta}
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex(prev => prev - 1)}
              disabled={currentIndex === 0}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/aluno')}
            >
              <Home className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentIndex(prev => prev + 1)}
              disabled={currentIndex === reviewQuestions.length - 1}
              className="flex-1"
            >
              Próxima
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
