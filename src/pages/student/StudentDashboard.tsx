import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  Clock,
  Calendar,
  MessageCircle,
  Users,
  
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

const ETAPAS_NOMES = ["Abertura Digital", "Estudo Teórico", "Prova Teórica", "Aulas Práticas", "Exame Prático"];

export default function StudentDashboard() {
  const { profile } = useAuth();
  const { jornada, simulados, loading } = useDashboardData();
  const firstName = profile?.full_name?.split(" ")[0] || "Aluno";

  // Calculate completed steps from etapasConcluidas array
  const completedSteps = jornada?.etapasConcluidas?.length || 0;
  const totalSteps = 5;

  // Calculate progress as percentage: each completed step = 20%
  // Use stored percentualGeral if available, otherwise calculate from completed steps
  const journeyProgress = jornada?.percentualGeral ?? Math.round((completedSteps / totalSteps) * 100);

  // Determine current phase: find the first non-completed step or use etapaAtual
  const currentPhaseIndex = jornada?.etapaAtual ? jornada.etapaAtual - 1 : completedSteps; // If no etapaAtual, current is the next after completed
  const currentPhase = ETAPAS_NOMES[Math.min(currentPhaseIndex, totalSteps - 1)] || "Abertura Digital";

  const theoreticalAverage = Math.round(simulados?.averageScore || 0);
  const simulationsCompleted = simulados?.totalSimulados || 0;
  const practicalHoursGoal = 20;
  const practicalHoursCompleted = jornada?.aulasPraticasHoras || 0;

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
  ];

  return (
    <motion.div className="w-full pb-8" variants={containerVariants} initial="hidden" animate="visible">
      {/* Greeting */}
      <motion.div variants={itemVariants} className="mb-6 lg:mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Olá, {firstName}! 👋</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Continue sua jornada para a habilitação</p>
      </motion.div>

      {/* Main Layout - 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
        {/* Left Column - Main Cards (8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Journey Card - Dark navy background */}
          <motion.div variants={itemVariants}>
            <Card className="bg-slate-800 text-white overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-5 sm:p-6 lg:p-7">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-32 bg-white/20" />
                    <Skeleton className="h-8 w-48 bg-white/20" />
                    <Skeleton className="h-3 w-full bg-white/20" />
                    <Skeleton className="h-10 w-40 bg-white/20" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="space-y-4 flex-1">
                      <div>
                        <p className="text-xs sm:text-sm text-white/60 font-medium">Sua Jornada</p>
                        <div className="flex items-center gap-2 mt-1">
                          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Status da Habilitação</h2>
                          <Trophy className="h-5 w-5 text-primary" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm text-white/70">Progresso Geral</span>
                          <span className="text-base sm:text-lg font-bold text-primary">{journeyProgress}%</span>
                        </div>
                        <div className="h-2.5 sm:h-3 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${journeyProgress}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                            className="h-full bg-primary rounded-full"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 w-fit">
                        <Rocket className="h-4 w-4 text-primary" />
                        <span className="text-xs sm:text-sm font-medium">Fase Atual: {currentPhase}</span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <span className="text-xs sm:text-sm text-white/70">
                          {completedSteps} de {totalSteps} etapas concluídas
                        </span>
                        <Button
                          asChild
                          variant="link"
                          className="text-primary p-0 h-auto font-semibold hover:no-underline hover:text-primary/80 justify-start sm:justify-end"
                        >
                          <Link to="/aluno/jornada">
                            Atualizar jornada <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Sidebar (4 cols on desktop) */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-6 space-y-5">
            {/* Theoretical Average Card */}
            <motion.div variants={itemVariants}>
              <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  {loading ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-28" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                      <div className="flex flex-col items-center py-4">
                        <Skeleton className="h-28 w-28 rounded-full" />
                        <Skeleton className="h-4 w-32 mt-4" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-sm sm:text-base text-foreground">Média Teórica</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-full"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="flex flex-col items-center justify-center py-4">
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                            <motion.circle
                              cx="50"
                              cy="50"
                              r="42"
                              stroke="hsl(var(--primary))"
                              strokeWidth="8"
                              fill="none"
                              strokeLinecap="round"
                              initial={{ strokeDasharray: "0 264" }}
                              animate={{ strokeDasharray: `${theoreticalAverage * 2.64} 264` }}
                              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl sm:text-3xl font-bold text-foreground">
                              {theoreticalAverage}%
                            </span>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-primary font-medium mt-4">
                          {simulationsCompleted}{" "}
                          {simulationsCompleted === 1 ? "simulado realizado" : "simulados realizados"}
                        </p>

                        {simulationsCompleted === 0 ? (
                          <Button
                            asChild
                            size="sm"
                            className="mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <Link to="/aluno/simulado">Fazer Primeiro Simulado</Link>
                          </Button>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1 text-center">
                            Clique para registrar simulado externo
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Practical Classes Progress - Full Width */}
      <motion.div variants={itemVariants} className="mt-5 lg:mt-6">
        <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow w-full">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            {loading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="h-2.5 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-2 sm:p-2.5">
                      <Car className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base text-foreground">Aulas Práticas</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Meta: {practicalHoursGoal}h (personalizável)
                      </p>
                    </div>
                  </div>
                  <Link to="/aluno/aulas" className="flex items-center gap-1 group">
                    <span className="text-xl sm:text-2xl font-bold text-foreground">{practicalHoursCompleted}</span>
                    <span className="text-muted-foreground text-base sm:text-lg">/{practicalHoursGoal}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="h-2 sm:h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(practicalHoursCompleted / practicalHoursGoal) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {Math.round((practicalHoursCompleted / practicalHoursGoal) * 100)}% concluído • Faltam{" "}
                    {Math.max(practicalHoursGoal - practicalHoursCompleted, 0)}h
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Cards Grid - 2x3 on mobile, 3x2 on tablet+ */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 lg:gap-5 mt-6 lg:mt-8"
        variants={gridContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {actionCards.map((card) => (
          <motion.div key={card.title} variants={itemVariants}>
            <Link to={card.href}>
              <Card
                className={`h-full transition-all duration-200 cursor-pointer group ${
                  card.variant === "primary"
                    ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg"
                    : card.variant === "accent"
                      ? "bg-secondary border-secondary hover:bg-secondary/80 hover:shadow-md"
                      : "bg-card hover:bg-muted/50 border-border hover:shadow-md"
                }`}
              >
                <CardContent className="p-4 lg:p-5 flex flex-col items-center justify-center text-center min-h-[100px] md:min-h-[110px] lg:min-h-[120px]">
                  <div className="transition-transform duration-200 group-hover:scale-110">
                    <card.icon
                      className={`h-6 w-6 lg:h-7 lg:w-7 mb-2 ${
                        card.variant === "primary"
                          ? "text-primary-foreground"
                          : card.variant === "accent"
                            ? "text-amber-700"
                            : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <span
                    className={`font-medium text-sm md:text-base ${
                      card.variant === "primary"
                        ? "text-primary-foreground"
                        : card.variant === "accent"
                          ? "text-amber-800"
                          : "text-foreground"
                    }`}
                  >
                    {card.title}
                  </span>
                  {card.subtitle && (
                    <span className="text-xs text-amber-700/70 mt-1 hidden md:block">{card.subtitle}</span>
                  )}
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Promotional Banner */}
      <motion.div variants={itemVariants} className="mt-6 lg:mt-8">
        <Card className="bg-muted/50 border-muted overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="bg-primary/20 rounded-full p-3 shrink-0">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 text-foreground">
                  A nova lei joga a seu favor!
                  <span className="text-green-500">🌱</span>
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1.5 leading-relaxed">
                  Estude online e escolha <strong className="text-foreground">instrutores parceiros</strong> para
                  economizar até <strong className="text-primary">80%</strong> na sua CNH com a Conduz Brasil.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <Button
                    asChild
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm"
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
      </motion.div>
    </motion.div>
  );
}
