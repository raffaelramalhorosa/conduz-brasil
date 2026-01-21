import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BarChart3,
  RotateCcw,
  Home,
  Eye,
  Share2
} from 'lucide-react';
import { QuizResult as QuizResultType } from '@/types/quiz';
import { formatTime } from '@/utils/quizCalculations';
import { cn } from '@/lib/utils';

interface QuizResultProps {
  result: QuizResultType;
  onRestart: () => void;
  onReviewErrors: () => void;
  onViewAnswers: () => void;
}

export function QuizResult({ result, onRestart, onReviewErrors, onViewAnswers }: QuizResultProps) {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (result.score >= 85) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [result.score]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 85) return '🎉 Excelente! Você está preparado!';
    if (score >= 70) return '✅ Muito bom! Continue praticando!';
    if (score >= 50) return '⚠️ Bom, mas precisa melhorar';
    return '📚 Continue estudando!';
  };

  const getProgressColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      {/* Confetti effect for high scores */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][
                  Math.floor(Math.random() * 5)
                ]
              }}
              initial={{ y: -10, opacity: 1 }}
              animate={{
                y: window.innerHeight + 100,
                x: (Math.random() - 0.5) * 200,
                rotate: Math.random() * 720
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.5
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Main Result Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 text-center pb-2">
              <div className="flex justify-center mb-2">
                <Trophy className="w-16 h-16 text-primary" />
              </div>
              <CardTitle className="text-2xl">Simulado Concluído!</CardTitle>
              <p className="text-muted-foreground">{getScoreMessage(result.score)}</p>
            </CardHeader>
            <CardContent className="p-6">
              {/* Score Circle */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-32 h-32 mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      className={getScoreColor(result.score)}
                      initial={{ strokeDasharray: '0 352' }}
                      animate={{ strokeDasharray: `${(result.score / 100) * 352} 352` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn("text-4xl font-bold", getScoreColor(result.score))}>
                      {result.score}%
                    </span>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground">
                  {result.correctAnswers} de {result.totalQuestions} questões corretas
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-600">{result.correctAnswers}</p>
                  <p className="text-xs text-muted-foreground">Acertos</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-600">{result.incorrectAnswers}</p>
                  <p className="text-xs text-muted-foreground">Erros</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-600">{formatTime(result.timeSpent)}</p>
                  <p className="text-xs text-muted-foreground">Tempo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Desempenho por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.categoryBreakdown.map((category, index) => (
                <div key={category.category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium truncate flex-1 mr-2">
                      {category.category}
                    </span>
                    <span className={cn(
                      "text-sm font-semibold",
                      category.percentage >= 70 ? "text-green-600" :
                      category.percentage >= 50 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {category.correct}/{category.total} ({category.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        getProgressColor(category.percentage)
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${category.percentage}%` }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-3"
        >
          <Button
            variant="outline"
            onClick={onViewAnswers}
            className="h-12"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Respostas
          </Button>
          <Button
            onClick={onRestart}
            className="h-12 bg-primary hover:bg-primary/90"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Refazer
          </Button>
          {result.incorrectAnswers > 0 && (
            <Button
              variant="secondary"
              onClick={onReviewErrors}
              className="h-12 col-span-2"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Revisar Erros ({result.incorrectAnswers})
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => navigate('/aluno')}
            className="h-12 col-span-2"
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
