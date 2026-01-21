import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Target, 
  RefreshCw, 
  Book, 
  ClipboardList, 
  Car, 
  Trophy, 
  Lock, 
  Check, 
  ChevronRight,
  Sparkles,
  Award,
  TrendingUp,
  FileText,
  Info,
  ExternalLink,
  HelpCircle,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface JornadaEtapa {
  id: number;
  titulo: string;
  descricao: string;
  status: 'concluida' | 'atual' | 'bloqueada';
  icon: string;
  detalhes?: {
    comprovante?: string;
    progresso?: { atual: number; total: number; unidade: string };
    action?: { label: string; route: string };
  };
}

interface JornadaProgress {
  userId: string;
  etapaAtual: number;
  percentualGeral: number;
  etapasConcluidas: number[];
  aulasPraticasHoras: number;
  dataAbertura?: string;
  comprovanteUrl?: string;
}

const defaultEtapas: JornadaEtapa[] = [
  {
    id: 1,
    titulo: "Abertura do Processo",
    descricao: "Abertura via app CDT ou Detran",
    status: "concluida",
    icon: "RefreshCw",
    detalhes: {
      comprovante: "/comprovante-abertura.pdf"
    }
  },
  {
    id: 2,
    titulo: "Estudo Teórico",
    descricao: "Curso teórico obrigatório",
    status: "atual",
    icon: "Book",
    detalhes: {
      action: { label: "Continuar Etapa", route: "/aluno/simulado" }
    }
  },
  {
    id: 3,
    titulo: "Prova Teórica",
    descricao: "Exame no DETRAN",
    status: "bloqueada",
    icon: "ClipboardList"
  },
  {
    id: 4,
    titulo: "Aulas Práticas",
    descricao: "Horas de direção",
    status: "bloqueada",
    icon: "Car",
    detalhes: {
      progresso: { atual: 0, total: 20, unidade: "h" }
    }
  },
  {
    id: 5,
    titulo: "Exame Prático",
    descricao: "Prova de direção final",
    status: "bloqueada",
    icon: "Trophy"
  }
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  RefreshCw,
  Book,
  ClipboardList,
  Car,
  Trophy
};

const motivationalMessages = [
  "Conhecimento é poder - você está no caminho certo! 📚",
  "Cada etapa te aproxima da sua CNH! 🚗",
  "Continue assim, você está indo muito bem! 💪",
  "A jornada de mil quilômetros começa com um único passo! 🎯"
];

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const
    }
  }
};

export default function JornadaCNH() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<JornadaProgress | null>(null);
  const [etapas, setEtapas] = useState<JornadaEtapa[]>(defaultEtapas);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [user]);

  async function loadProgress() {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.storage) {
        const key = `jornada:${user.id}`;
        const result = await window.storage.get(key, false);
        
        if (result) {
          const data: JornadaProgress = JSON.parse(result.value);
          setProgress(data);
          updateEtapasStatus(data);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
    } finally {
      setLoading(false);
    }
  }

  function updateEtapasStatus(data: JornadaProgress) {
    const updatedEtapas = defaultEtapas.map(etapa => {
      if (data.etapasConcluidas.includes(etapa.id)) {
        return { ...etapa, status: 'concluida' as const };
      } else if (etapa.id === data.etapaAtual) {
        return { ...etapa, status: 'atual' as const };
      } else {
        return { ...etapa, status: 'bloqueada' as const };
      }
    });

    const aulasPraticasIndex = updatedEtapas.findIndex(e => e.id === 4);
    if (aulasPraticasIndex !== -1 && updatedEtapas[aulasPraticasIndex].detalhes?.progresso) {
      updatedEtapas[aulasPraticasIndex].detalhes!.progresso!.atual = data.aulasPraticasHoras;
    }

    setEtapas(updatedEtapas);
  }

  const completedSteps = etapas.filter(e => e.status === 'concluida').length;
  const totalSteps = etapas.length;
  const percentComplete = progress?.percentualGeral ?? Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 lg:mb-8"
      >
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
          Minha Jornada CNH 🗺️
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Acompanhe cada etapa do seu processo de habilitação
        </p>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="jornada" className="mb-6">
        <TabsList className="w-full grid grid-cols-5 h-auto">
          <TabsTrigger value="jornada" className="text-xs md:text-sm py-2 px-1 md:px-3">
            Jornada
          </TabsTrigger>
          <TabsTrigger value="badges" className="text-xs md:text-sm py-2 px-1 md:px-3">
            🏆 Badges
          </TabsTrigger>
          <TabsTrigger value="evolucao" className="text-xs md:text-sm py-2 px-1 md:px-3">
            Evolução
          </TabsTrigger>
          <TabsTrigger value="certificados" className="text-xs md:text-sm py-2 px-1 md:px-3">
            📜 Cert.
          </TabsTrigger>
          <TabsTrigger value="info" className="text-xs md:text-sm py-2 px-1 md:px-3">
            Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jornada" className="mt-6">
          {/* Desktop: 2-column layout, Mobile: single column */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Main Content - Timeline */}
            <div className="lg:col-span-8 space-y-6">
              {/* Progress Card */}
              <ProgressCard 
                percentComplete={percentComplete}
                completedSteps={completedSteps}
                totalSteps={totalSteps}
              />

              {/* Timeline */}
              <JornadaTimeline etapas={etapas} navigate={navigate} />
            </div>

            {/* Sidebar - Desktop only */}
            <div className="hidden lg:block lg:col-span-4 space-y-6">
              <SidebarCard />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="badges" className="mt-6">
          <BadgesTab />
        </TabsContent>

        <TabsContent value="evolucao" className="mt-6">
          <EvolucaoTab />
        </TabsContent>

        <TabsContent value="certificados" className="mt-6">
          <CertificadosTab />
        </TabsContent>

        <TabsContent value="info" className="mt-6">
          <InfoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sidebar Card Component (Desktop only)
function SidebarCard() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              Dicas Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Complete os simulados para se preparar melhor</p>
            <p>• Pratique no mínimo 20 horas de direção</p>
            <p>• Revise as questões que errou</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Próximos Passos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Simulados pendentes</span>
              <Badge variant="secondary">3</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Horas práticas</span>
              <Badge variant="secondary">0/20h</Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Progress Card Component
function ProgressCard({ 
  percentComplete, 
  completedSteps, 
  totalSteps 
}: { 
  percentComplete: number; 
  completedSteps: number; 
  totalSteps: number;
}) {
  const messageIndex = Math.floor(percentComplete / 25);
  const motivationalMessage = motivationalMessages[Math.min(messageIndex, motivationalMessages.length - 1)];

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 sm:p-3 rounded-full bg-primary/10">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                {percentComplete}% Concluído
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {completedSteps} de {totalSteps} etapas
              </p>
            </div>
          </div>

          {/* Progress Bar - Yellow fill on dark background */}
          <div className="relative h-2.5 sm:h-3 bg-slate-800 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentComplete}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className="absolute left-0 top-0 h-full bg-primary rounded-full"
            />
          </div>

          {/* Motivational Message */}
          <div className="bg-secondary rounded-lg p-3 sm:p-4 flex items-center gap-3">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <p className="text-xs sm:text-sm text-foreground">
              {motivationalMessage}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Timeline Component
function JornadaTimeline({ 
  etapas, 
  navigate 
}: { 
  etapas: JornadaEtapa[]; 
  navigate: (path: string) => void;
}) {
  return (
    <motion.div 
      className="relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Vertical Line - Responsive width */}
      <div className="absolute left-5 sm:left-6 lg:left-7 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-4 lg:space-y-5">
        {etapas.map((etapa, index) => (
          <TimelineEtapa 
            key={etapa.id}
            etapa={etapa}
            index={index}
            navigate={navigate}
          />
        ))}
      </div>
    </motion.div>
  );
}

// Timeline Etapa Component
function TimelineEtapa({ 
  etapa, 
  index, 
  navigate 
}: { 
  etapa: JornadaEtapa; 
  index: number;
  navigate: (path: string) => void;
}) {
  const IconComponent = iconMap[etapa.icon] || Book;
  
  const statusStyles = {
    concluida: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-500',
      iconBg: 'bg-green-500',
      iconColor: 'text-white',
      opacity: ''
    },
    atual: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-primary',
      iconBg: 'bg-primary',
      iconColor: 'text-primary-foreground',
      opacity: ''
    },
    bloqueada: {
      bg: 'bg-muted/50',
      border: 'border-muted-foreground/20',
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
      opacity: 'opacity-60'
    }
  };

  const styles = statusStyles[etapa.status];

  return (
    <motion.div
      variants={itemVariants}
      className="relative pl-12 sm:pl-14 lg:pl-16"
    >
      {/* Timeline Node - Responsive sizing */}
      <div className={`absolute left-0 top-4 sm:top-5 w-10 sm:w-12 lg:w-14 h-10 sm:h-12 lg:h-14 rounded-full ${styles.iconBg} flex items-center justify-center z-10 shadow-sm`}>
        {etapa.status === 'concluida' ? (
          <Check className={`h-5 w-5 sm:h-6 sm:w-6 ${styles.iconColor}`} />
        ) : etapa.status === 'bloqueada' ? (
          <div className="relative">
            <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 ${styles.iconColor}`} />
            <Lock className="absolute -bottom-1 -right-1 h-3 w-3 text-muted-foreground" />
          </div>
        ) : (
          <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${styles.iconColor}`} />
        )}
      </div>

      {/* Card */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card 
              className={`${styles.bg} border ${styles.border} ${styles.opacity} transition-all duration-200 ${
                etapa.status !== 'bloqueada' ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : ''
              }`}
            >
              <CardContent className="p-3 sm:p-4 lg:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground">
                        {etapa.titulo}
                      </h3>
                      {etapa.status === 'concluida' && (
                        <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                          Concluído
                        </Badge>
                      )}
                      {etapa.status === 'atual' && (
                        <Badge className="bg-primary text-primary-foreground text-xs animate-pulse">
                          Atual
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {etapa.descricao}
                    </p>

                    {/* Comprovante Link */}
                    {etapa.status === 'concluida' && etapa.detalhes?.comprovante && (
                      <button className="flex items-center gap-1 text-xs sm:text-sm text-primary mt-2 hover:underline">
                        <ExternalLink className="h-3 w-3" />
                        Ver Comprovante
                      </button>
                    )}

                    {/* Progress for Aulas Práticas */}
                    {etapa.detalhes?.progresso && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progresso</span>
                          <span>{etapa.detalhes.progresso.atual}/{etapa.detalhes.progresso.total}{etapa.detalhes.progresso.unidade}</span>
                        </div>
                        <Progress 
                          value={(etapa.detalhes.progresso.atual / etapa.detalhes.progresso.total) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}

                    {/* Action Button - Full width on mobile, auto on desktop */}
                    {etapa.status === 'atual' && etapa.detalhes?.action && (
                      <Button
                        onClick={() => navigate(etapa.detalhes!.action!.route)}
                        className="w-full sm:w-auto mt-3 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-sm"
                      >
                        {etapa.detalhes.action.label}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>

                  {etapa.status !== 'bloqueada' && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 hidden sm:block" />
                  )}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          {etapa.status === 'bloqueada' && (
            <TooltipContent>
              <p>Complete a etapa anterior para desbloquear</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}

// Badges Tab
function BadgesTab() {
  const badges = [
    { id: 1, name: "Primeiro Simulado", icon: "🎯", earned: true, description: "Completou seu primeiro simulado" },
    { id: 2, name: "Estudante Dedicado", icon: "📚", earned: true, description: "Estudou por 5 dias seguidos" },
    { id: 3, name: "Mestre Teórico", icon: "🏆", earned: false, description: "Atingiu 90% em 5 simulados" },
    { id: 4, name: "Velocista", icon: "⚡", earned: false, description: "Completou simulado em menos de 10 min" },
  ];

  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {badges.map((badge) => (
        <motion.div key={badge.id} variants={itemVariants}>
          <Card className={`text-center p-3 sm:p-4 h-full bg-card ${!badge.earned ? 'opacity-50 grayscale' : ''}`}>
            <div className="text-3xl sm:text-4xl mb-2">{badge.icon}</div>
            <h4 className="font-semibold text-xs sm:text-sm">{badge.name}</h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{badge.description}</p>
            {badge.earned && (
              <Badge className="mt-2 bg-green-500 text-xs">Conquistado!</Badge>
            )}
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Evolução Tab
function EvolucaoTab() {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="bg-card">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center justify-center text-center py-8">
            <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Evolução em Breve</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Aqui você poderá acompanhar seu progresso ao longo do tempo com gráficos detalhados.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Certificados Tab
function CertificadosTab() {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="bg-card">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center justify-center text-center py-8">
            <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum Certificado</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Complete as etapas da sua jornada para receber certificados de conclusão.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Info Tab
function InfoTab() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <motion.div variants={itemVariants}>
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Sobre o Processo de Habilitação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              O processo para obter a Carteira Nacional de Habilitação (CNH) envolve 5 etapas principais que devem ser completadas em ordem.
            </p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <RefreshCw className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">1. Abertura do Processo</p>
                  <p className="text-xs sm:text-sm">Registro inicial no DETRAN via app ou presencialmente.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Book className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">2. Estudo Teórico</p>
                  <p className="text-xs sm:text-sm">45 horas/aula de curso teórico obrigatório.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ClipboardList className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">3. Prova Teórica</p>
                  <p className="text-xs sm:text-sm">Exame com 30 questões, mínimo 70% de acertos.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Car className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">4. Aulas Práticas</p>
                  <p className="text-xs sm:text-sm">Mínimo de 20 horas de aulas de direção.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Trophy className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">5. Exame Prático</p>
                  <p className="text-xs sm:text-sm">Teste final de direção veicular no DETRAN.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
