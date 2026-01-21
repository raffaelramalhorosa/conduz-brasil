import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Trophy,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function StudentDashboard() {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] || "Aluno";

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
      icon: Target,
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
    <div className="space-y-5 pb-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Olá, {firstName}! 👋</h1>
        <p className="text-muted-foreground mt-1">Continue sua jornada para a habilitação</p>
      </div>

      {/* Journey Status and Theoretical Average */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Journey Card - Dark navy background */}
        <Card className="lg:col-span-2 bg-[#1e293b] text-white overflow-hidden border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-4 flex-1">
                <div>
                  <p className="text-sm text-white/60 font-medium">Sua Jornada</p>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-xl md:text-2xl font-bold">Status da Habilitação</h2>
                    <Trophy className="h-5 w-5 text-[#FDB913]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Progresso Geral</span>
                    <span className="text-lg font-bold text-[#FDB913]">{journeyProgress}%</span>
                  </div>
                  <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FDB913] rounded-full transition-all duration-500"
                      style={{ width: `${journeyProgress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 w-fit">
                  <Rocket className="h-4 w-4 text-[#FDB913]" />
                  <span className="text-sm font-medium">Fase Atual: {currentPhase}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm text-white/70">
                    {completedSteps} de {totalSteps} etapas concluídas
                  </span>
                  <Button
                    variant="link"
                    className="text-[#FDB913] p-0 h-auto font-semibold hover:no-underline hover:text-[#FDB913]/80"
                  >
                    Atualizar jornada <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theoretical Average Card */}
        <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[#FDB913]" />
                <span className="font-semibold text-foreground">Média Teórica</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#FDB913] hover:text-[#FDB913] hover:bg-[#FDB913]/10 rounded-full"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    stroke="#FDB913"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${theoreticalAverage * 2.64} 264`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-foreground">{theoreticalAverage}%</span>
                </div>
              </div>

              <p className="text-sm text-[#FDB913] font-medium mt-4">{simulationsCompleted} simulados realizados</p>
              <p className="text-xs text-muted-foreground mt-1 text-center">Clique para registrar simulado externo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Practical Classes Progress */}
      <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#FDB913]/10 rounded-full p-2.5">
                <Car className="h-5 w-5 text-[#FDB913]" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Aulas Práticas</h3>
                <p className="text-sm text-muted-foreground">Meta: {practicalHoursGoal}h (personalizável)</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-foreground">{practicalHoursCompleted}</span>
              <span className="text-muted-foreground text-lg">/{practicalHoursGoal}</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground ml-1" />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FDB913] rounded-full transition-all duration-500"
                style={{ width: `${(practicalHoursCompleted / practicalHoursGoal) * 100}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {Math.round((practicalHoursCompleted / practicalHoursGoal) * 100)}% concluído • Faltam{" "}
              {practicalHoursGoal - practicalHoursCompleted}h
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Cards Grid - 2x3 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actionCards.map((card) => (
          <Link key={card.title} to={card.href}>
            <Card
              className={`h-full transition-all duration-200 cursor-pointer ${
                card.variant === "primary"
                  ? "bg-[#FDB913] border-[#FDB913] text-[#1e293b] hover:bg-[#FDB913]/90 hover:shadow-lg"
                  : card.variant === "accent"
                    ? "bg-[#FEF3C7] border-[#FEF3C7] hover:bg-[#FEF3C7]/80 hover:shadow-md"
                    : "bg-card hover:bg-muted/50 border-border hover:shadow-md"
              }`}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[100px] md:min-h-[110px]">
                <card.icon
                  className={`h-6 w-6 mb-2 ${
                    card.variant === "primary"
                      ? "text-[#1e293b]"
                      : card.variant === "accent"
                        ? "text-[#92400e]"
                        : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`font-medium text-sm md:text-base ${
                    card.variant === "primary"
                      ? "text-[#1e293b]"
                      : card.variant === "accent"
                        ? "text-[#92400e]"
                        : "text-foreground"
                  }`}
                >
                  {card.title}
                </span>
                {card.subtitle && (
                  <span className="text-xs text-[#92400e]/70 mt-1 hidden md:block">{card.subtitle}</span>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Promotional Banner */}
      <Card className="bg-muted/50 border-muted overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="bg-[#FDB913]/20 rounded-full p-3 shrink-0">
              <Sparkles className="h-6 w-6 text-[#FDB913]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                A nova lei joga a seu favor!
                <span className="text-green-500">🌱</span>
              </h3>
              <p className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
                Estude online e escolha <strong className="text-foreground">instrutores parceiros</strong> para
                economizar até <strong className="text-[#FDB913]">80%</strong> na sua CNH com a Habilitaaí.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Button
                  asChild
                  size="sm"
                  className="bg-[#FDB913] text-[#1e293b] hover:bg-[#FDB913]/90 font-semibold shadow-sm"
                >
                  <Link to="/instrutores">Encontrar Instrutor</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-foreground/20 text-foreground hover:bg-foreground/5 font-medium"
                >
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
