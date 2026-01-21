import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Target, Zap, BookOpen, Trophy } from 'lucide-react';
import { QuizMode, QUIZ_CATEGORIES } from '@/types/quiz';
import { getTotalQuizzesCount, getQuizStats } from '@/utils/quizStorage';

interface QuizStartProps {
  onStart: (mode: QuizMode, category?: string) => void;
}

export function QuizStart({ onStart }: QuizStartProps) {
  const [selectedMode, setSelectedMode] = useState<QuizMode>('complete');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const navigate = useNavigate();

  const stats = getQuizStats();
  const totalQuizzes = getTotalQuizzesCount();

  const handleStart = () => {
    if (selectedMode === 'category' && !selectedCategory) {
      return;
    }
    onStart(selectedMode, selectedMode === 'category' ? selectedCategory : undefined);
  };

  const getModeDescription = (mode: QuizMode): string => {
    switch (mode) {
      case 'complete':
        return '30 perguntas aleatórias de todas as categorias';
      case 'category':
        return '15 perguntas da categoria selecionada';
      case 'blitz':
        return '10 perguntas aleatórias - teste rápido!';
    }
  };

  const getModeIcon = (mode: QuizMode) => {
    switch (mode) {
      case 'complete':
        return <Target className="w-5 h-5" />;
      case 'category':
        return <BookOpen className="w-5 h-5" />;
      case 'blitz':
        return <Zap className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Novo Simulado
          </h1>
          <p className="text-muted-foreground">
            Pratique para a prova teórica do DETRAN
          </p>
        </div>

        {/* Stats Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Simulados realizados</p>
                  <p className="text-2xl font-bold">{totalQuizzes}</p>
                </div>
              </div>
              {stats.averageScore > 0 && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Média</p>
                  <p className="text-2xl font-bold text-primary">{stats.averageScore}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mode Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Escolha o modo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Complete Mode */}
            <button
              onClick={() => setSelectedMode('complete')}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                selectedMode === 'complete'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  selectedMode === 'complete' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Target className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Simulado Completo</span>
                    <Badge variant="secondary">30 questões</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getModeDescription('complete')}
                  </p>
                </div>
              </div>
            </button>

            {/* Category Mode */}
            <button
              onClick={() => setSelectedMode('category')}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                selectedMode === 'category'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  selectedMode === 'category' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Por Categoria</span>
                    <Badge variant="secondary">15 questões</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getModeDescription('category')}
                  </p>
                </div>
              </div>
            </button>

            {/* Category Selector */}
            {selectedMode === 'category' && (
              <div className="ml-14">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUIZ_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Blitz Mode */}
            <button
              onClick={() => setSelectedMode('blitz')}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                selectedMode === 'blitz'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  selectedMode === 'blitz' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Blitz Rápida</span>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      10 questões
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getModeDescription('blitz')}
                  </p>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>

        {/* Start Button */}
        <Button
          onClick={handleStart}
          disabled={selectedMode === 'category' && !selectedCategory}
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
        >
          {getModeIcon(selectedMode)}
          <span className="ml-2">Iniciar Simulado</span>
        </Button>

        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="w-full"
        >
          Voltar
        </Button>
      </div>
    </div>
  );
}
