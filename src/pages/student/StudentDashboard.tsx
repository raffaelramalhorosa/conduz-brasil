import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Calendar, 
  Brain, 
  MessageCircle, 
  Users, 
  UsersRound,
  Rocket,
  Car,
  Plus,
  ChevronRight,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

export default function StudentDashboard() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(' ')[0] || 'Aluno';

  // Mock data - these would come from the database in a real implementation
  const journeyProgress = 0;
  const currentPhase = "Abertura Digital";
  const completedSteps = 0;
  const totalSteps = 5;
  const theoreticalAverage = 0;
  const simulationsCompleted = 0;
  const practicalHoursGoal = 20;
  const practicalHoursCompleted = 0;

  const actionCards = [
    {
      title: "Agendar Aula",
      icon: Clock,
      href: "/instrutores",
      variant: "primary" as const,
    },
    {
      title: "Minhas Aulas",
      icon: Calendar,
      href: "/aluno/aulas",
      variant: "default" as const,
    },
    {
      title: "Simulado",
      subtitle: "Sua preparação principal!",
      icon: Brain,
      href: "/aluno/simulado",
      variant: "accent" as const,
    },
    {
      title: "Mensagens",
      icon: MessageCircle,
      href: "/aluno/mensagens",
      variant: "default" as const,
    },
    {
      title: "Instrutores",
      icon: Users,
      href: "/instrutores",
      variant: "default" as const,
    },
    {
      title: "Comunidade",
      icon: UsersRound,
      href: "/aluno/comunidade",
      variant: "default" as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Olá, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground">
          Continue sua jornada para a habilitação
        </p>
      </div>

      {/* Journey Status and Theoretical Average */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Journey Card */}
        <Card className="lg:col-span-2 bg-foreground text-background overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-4 flex-1">
                <div>
                  <p className="text-sm text-background/70">Sua Jornada</p>
                  <h2 className="text-xl md:text-2xl font-bold">Status da Habilitação</h2>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-background/70">Progresso Geral</span>
                    <span className="text-lg font-bold text-primary">{journeyProgress}%</span>
                  </div>
                  <Progress value={journeyProgress} className="h-2 bg-background/20" />
                </div>

                <div className="flex items-center gap-2 bg-background/10 rounded-lg px-3 py-2 w-fit">
                  <Rocket className="h-4 w-4 text-primary" />
                  <span className="text-sm">Fase Atual: {currentPhase}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-background/70">
                    {completedSteps} de {totalSteps} etapas concluídas
                  </span>
                  <Button 
                    variant="link" 
                    className="text-primary p-0 h-auto font-medium"
                  >
                    Atualizar jornada <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>

              <div className="hidden md:flex items-center justify-center bg-background/10 rounded-lg p-3">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theoretical Average Card */}
        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Média Teórica</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${theoreticalAverage * 2.51} 251`}
                    className="text-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{theoreticalAverage}%</span>
                </div>
              </div>
              
              <p className="text-sm text-primary mt-3">
                {simulationsCompleted} simulados realizados
              </p>
              <p className="text-xs text-muted-foreground">
                Clique para registrar simulado externo
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Practical Classes Progress */}
      <Card className="bg-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-muted rounded-full p-2">
                <Car className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">Aulas Práticas</h3>
                <p className="text-sm text-muted-foreground">
                  Meta: {practicalHoursGoal}h (personalizável)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{practicalHoursCompleted}</span>
              <span className="text-muted-foreground">/{practicalHoursGoal}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <Progress 
              value={(practicalHoursCompleted / practicalHoursGoal) * 100} 
              className="h-2"
            />
            <p className="text-sm text-muted-foreground">
              {Math.round((practicalHoursCompleted / practicalHoursGoal) * 100)}% concluído • Faltam {practicalHoursGoal - practicalHoursCompleted}h
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {actionCards.map((card) => (
          <Link key={card.title} to={card.href}>
            <Card 
              className={`h-full transition-all hover:shadow-md cursor-pointer ${
                card.variant === 'primary' 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : card.variant === 'accent'
                  ? 'bg-primary/10 border-primary/20'
                  : 'bg-card hover:bg-muted/50'
              }`}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[120px]">
                <card.icon className={`h-6 w-6 mb-3 ${
                  card.variant === 'primary' 
                    ? 'text-primary-foreground' 
                    : card.variant === 'accent'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`} />
                <span className={`font-medium ${
                  card.variant === 'accent' ? 'text-foreground' : ''
                }`}>
                  {card.title}
                </span>
                {card.subtitle && (
                  <span className="text-xs text-muted-foreground mt-1">
                    {card.subtitle}
                  </span>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Promotional Banner */}
      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary/10 rounded-full p-3 shrink-0">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg flex items-center gap-2">
                A nova lei joga a seu favor! 
                <span className="text-primary">〰️</span>
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                Estude online e escolha <strong>instrutores parceiros</strong> para economizar até <strong className="text-primary">80%</strong> na sua CNH com a Habilitaí.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Button asChild size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                  <Link to="/instrutores">Encontrar Instrutor</Link>
                </Button>
                <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Material Gratuito Gov
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
