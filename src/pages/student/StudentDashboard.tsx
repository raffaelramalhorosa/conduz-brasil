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
  Sparkles,
  Trophy
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
      variant: "accent" as const,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Olá, {firstName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Continue sua jornada para a habilitação
        </p>
      </div>

      {/* Journey Status and Theoretical Average */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Journey Card - Dark blue/navy background */}
        <Card className="lg:col-span-2 bg-[#1e293b] text-white overflow-hidden border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-5 flex-1">
                <div>
                  <p className="text-sm text-white/60 font-medium">Sua Jornada</p>
                  <h2 className="text-xl md:text-2xl font-bold mt-1">Status da Habilitação</h2>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Progresso Geral</span>
                    <span className="text-lg font-bold text-primary">{journeyProgress}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${journeyProgress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2.5 w-fit">
                  <Rocket className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Fase Atual: {currentPhase}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm text-primary">
                    {completedSteps} de {totalSteps} etapas concluídas
                  </span>
                  <Button 
                    variant="link" 
                    className="text-primary p-0 h-auto font-semibold hover:no-underline"
                  >
                    Atualizar jornada <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>

              <div className="hidden md:flex items-center justify-center bg-white/10 rounded-xl p-4 ml-4">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theoretical Average Card */}
        <Card className="bg-card border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-muted rounded-full p-1.5">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="font-semibold text-foreground">Média Teórica</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-28 h-28">
                {/* Decorative dot */}
                <div className="absolute -top-1 right-6 w-2 h-2 bg-primary rounded-full" />
                
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${theoreticalAverage * 2.64} 264`}
                    strokeLinecap="round"
                    className="text-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{theoreticalAverage}%</span>
                </div>
              </div>
              
              <p className="text-sm text-primary font-medium mt-4">
                {simulationsCompleted} simulados realizados
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique para registrar simulado externo
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Practical Classes Progress */}
      <Card className="bg-card border shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-muted rounded-full p-2.5">
                <Car className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Aulas Práticas</h3>
                <p className="text-sm text-muted-foreground">
                  Meta: {practicalHoursGoal}h (personalizável)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-foreground">{practicalHoursCompleted}</span>
              <span className="text-muted-foreground text-lg">/{practicalHoursGoal}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground ml-1" />
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(practicalHoursCompleted / practicalHoursGoal) * 100}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {Math.round((practicalHoursCompleted / practicalHoursGoal) * 100)}% concluído • Faltam {practicalHoursGoal - practicalHoursCompleted}h
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-3 gap-4">
        {actionCards.map((card) => (
          <Link key={card.title} to={card.href}>
            <Card 
              className={`h-full transition-all hover:shadow-md cursor-pointer border ${
                card.variant === 'primary' 
                  ? 'bg-primary border-primary text-primary-foreground hover:bg-primary/90' 
                  : card.variant === 'accent'
                  ? 'bg-amber-50 border-amber-100 hover:border-amber-200'
                  : 'bg-card hover:bg-muted/30 border-border'
              }`}
            >
              <CardContent className="p-5 flex flex-col items-center justify-center text-center min-h-[100px] md:min-h-[120px]">
                <card.icon className={`h-5 w-5 md:h-6 md:w-6 mb-2.5 ${
                  card.variant === 'primary' 
                    ? 'text-primary-foreground' 
                    : card.variant === 'accent'
                    ? 'text-amber-600'
                    : 'text-muted-foreground'
                }`} />
                <span className={`font-medium text-sm md:text-base ${
                  card.variant === 'accent' ? 'text-foreground' : ''
                }`}>
                  {card.title}
                </span>
                {card.subtitle && (
                  <span className="text-xs text-muted-foreground mt-1 hidden md:block">
                    {card.subtitle}
                  </span>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Promotional Banner */}
      <Card className="bg-amber-50/80 border-amber-100 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="bg-amber-100 rounded-full p-3 shrink-0">
              <Sparkles className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                A nova lei joga a seu favor! 
                <span className="text-amber-500">〰️</span>
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                Estude online e escolha <strong className="text-foreground">instrutores parceiros</strong> para economizar até <strong className="text-primary">80%</strong> na sua CNH com a Habilitaí.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Button asChild size="sm" className="bg-foreground text-background hover:bg-foreground/90 font-medium">
                  <Link to="/instrutores">Encontrar Instrutor</Link>
                </Button>
                <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10 font-medium">
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
