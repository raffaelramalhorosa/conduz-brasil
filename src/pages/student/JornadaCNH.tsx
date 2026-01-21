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
  ExternalLink
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

    // Update aulas práticas progress
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
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Minha Jornada CNH 🗺️
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe cada etapa do seu processo de habilitação
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="jornada" className="mb-6">
          <TabsList className="w-full grid grid-cols-5 h-auto">
            <TabsTrigger value="jornada" className="text-xs md:text-sm py-2">
              Jornada
            </TabsTrigger>
            <TabsTrigger value="badges" className="text-xs md:text-sm py-2">
              🏆 Badges
            </TabsTrigger>
            <TabsTrigger value="evolucao" className="text-xs md:text-sm py-2">
              Evolução
            </TabsTrigger>
            <TabsTrigger value="certificados" className="text-xs md:text-sm py-2">
              📜 Cert.
            </TabsTrigger>
            <TabsTrigger value="info" className="text-xs md:text-sm py-2">
              Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jornada" className="mt-6 space-y-6">
            {/* Progress Card */}
            <ProgressCard 
              percentComplete={percentComplete}
              completedSteps={completedSteps}
              totalSteps={totalSteps}
            />

            {/* Timeline */}
            <JornadaTimeline etapas={etapas} navigate={navigate} />
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
    </div>
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-primary/10">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{percentComplete}% Concluído</p>
              <p className="text-sm text-muted-foreground">{completedSteps} de {totalSteps} etapas</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentComplete}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute left-0 top-0 h-full bg-primary rounded-full"
            />
          </div>

          {/* Motivational Message */}
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
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
    <div className="relative">
      {/* Vertical Line */}
      <div className="absolute left-5 md:left-6 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-4">
        {etapas.map((etapa, index) => (
          <TimelineEtapa 
            key={etapa.id}
            etapa={etapa}
            index={index}
            navigate={navigate}
          />
        ))}
      </div>
    </div>
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative pl-12 md:pl-14"
    >
      {/* Timeline Node */}
      <div className={`absolute left-0 top-4 md:top-5 w-10 md:w-12 h-10 md:h-12 rounded-full ${styles.iconBg} flex items-center justify-center z-10`}>
        {etapa.status === 'concluida' ? (
          <Check className={`h-5 w-5 md:h-6 md:w-6 ${styles.iconColor}`} />
        ) : etapa.status === 'bloqueada' ? (
          <div className="relative">
            <IconComponent className={`h-4 w-4 md:h-5 md:w-5 ${styles.iconColor}`} />
            <Lock className="absolute -bottom-1 -right-1 h-3 w-3 text-muted-foreground" />
          </div>
        ) : (
          <IconComponent className={`h-5 w-5 md:h-6 md:w-6 ${styles.iconColor}`} />
        )}
      </div>

      {/* Card */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card 
              className={`${styles.bg} border ${styles.border} ${styles.opacity} transition-all duration-200 ${
                etapa.status !== 'bloqueada' ? 'hover:shadow-md cursor-pointer' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">
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
                    <p className="text-sm text-muted-foreground">
                      {etapa.descricao}
                    </p>

                    {/* Comprovante Link */}
                    {etapa.status === 'concluida' && etapa.detalhes?.comprovante && (
                      <button className="flex items-center gap-1 text-sm text-primary mt-2 hover:underline">
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

                    {/* Action Button */}
                    {etapa.status === 'atual' && etapa.detalhes?.action && (
                      <Button
                        onClick={() => navigate(etapa.detalhes!.action!.route)}
                        className="w-full mt-3 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90"
                      >
                        {etapa.detalhes.action.label}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>

                  {etapa.status !== 'bloqueada' && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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

// Badges Tab Placeholder
function BadgesTab() {
  const badges = [
    { id: 1, name: "Primeiro Simulado", icon: "🎯", earned: true, description: "Completou seu primeiro simulado" },
    { id: 2, name: "Estudante Dedicado", icon: "📚", earned: true, description: "Estudou por 5 dias seguidos" },
    { id: 3, name: "Mestre Teórico", icon: "🏆", earned: false, description: "Atingiu 90% em 5 simulados" },
    { id: 4, name: "Velocista", icon: "⚡", earned: false, description: "Completou simulado em menos de 10 min" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {badges.map((badge) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className={`text-center p-4 ${!badge.earned ? 'opacity-50 grayscale' : ''}`}>
            <div className="text-4xl mb-2">{badge.icon}</div>
            <h4 className="font-semibold text-sm">{badge.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
            {badge.earned && (
              <Badge className="mt-2 bg-green-500">Conquistado!</Badge>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Evolução Tab Placeholder
function EvolucaoTab() {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">Evolução</h3>
        <p className="text-sm text-muted-foreground">
          Gráfico de evolução em breve! Continue praticando para ver seu progresso.
        </p>
      </CardContent>
    </Card>
  );
}

// Certificados Tab Placeholder
function CertificadosTab() {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">Certificados</h3>
        <p className="text-sm text-muted-foreground">
          Seus certificados aparecerão aqui conforme você conclui as etapas.
        </p>
      </CardContent>
    </Card>
  );
}

// Info Tab
function InfoTab() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Info className="h-6 w-6 text-primary" />
          <h3 className="font-semibold">Sobre o processo CNH</h3>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            O processo de habilitação no Brasil consiste em 5 etapas principais:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Abertura do processo:</strong> Registro no DETRAN</li>
            <li><strong>Curso teórico:</strong> 45 horas de aulas obrigatórias</li>
            <li><strong>Prova teórica:</strong> 30 questões, mínimo 70% de acertos</li>
            <li><strong>Aulas práticas:</strong> Mínimo de 20 horas de direção</li>
            <li><strong>Exame prático:</strong> Avaliação final de direção</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
