import { useState } from "react";
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
  HelpCircle,
  Calendar,
  TrendingUp,
  FileText,
  Info,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { useJornadaProgress, type JornadaEtapa } from "@/hooks/useJornadaProgress";
import { ProofUploadModal } from "@/components/jornada/ProofUploadModal";

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

// Animation variants
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
  const navigate = useNavigate();
  const {
    etapas,
    loading,
    totalSimulados,
    completedLessons,
    completedSteps,
    percentComplete,
    completeStep,
    minSimulados,
    minAulas,
    recommendedAulas,
  } = useJornadaProgress();

  const [uploadModal, setUploadModal] = useState<{
    open: boolean;
    stepId: number;
    title: string;
    description: string;
  }>({
    open: false,
    stepId: 0,
    title: '',
    description: '',
  });

  const handleStepClick = (etapa: JornadaEtapa) => {
    if (etapa.status === 'bloqueada') return;

    if (etapa.tipo === 'upload' && etapa.status !== 'concluida') {
      setUploadModal({
        open: true,
        stepId: etapa.id,
        title: etapa.titulo,
        description: `Envie o comprovante de ${etapa.titulo.toLowerCase()} para marcar esta etapa como concluída.`,
      });
    } else if (etapa.detalhes?.action) {
      navigate(etapa.detalhes.action.route);
    }
  };

  const handleUploadConfirm = () => {
    completeStep(uploadModal.stepId);
    setUploadModal({ open: false, stepId: 0, title: '', description: '' });
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

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
        <div className="overflow-x-auto">
        <TabsList className="min-w-max sm:w-full grid grid-cols-5 h-auto">
          <TabsTrigger value="jornada" className="text-xs md:text-sm py-2 px-2 md:px-3">
            Jornada
          </TabsTrigger>
          <TabsTrigger value="badges" className="text-xs md:text-sm py-2 px-2 md:px-3">
            🏆 Badges
          </TabsTrigger>
          <TabsTrigger value="evolucao" className="text-xs md:text-sm py-2 px-2 md:px-3">
            Evolução
          </TabsTrigger>
          <TabsTrigger value="certificados" className="text-xs md:text-sm py-2 px-2 md:px-3">
            📜 Cert.
          </TabsTrigger>
          <TabsTrigger value="info" className="text-xs md:text-sm py-2 px-2 md:px-3">
            Info
          </TabsTrigger>
        </TabsList>
        </div>

        <div className="mt-6 md:min-h-[500px] lg:min-h-[600px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-8">
              <TabsContent value="jornada" className="mt-0 space-y-6">
                <ProgressCard 
                  percentComplete={percentComplete}
                  completedSteps={completedSteps}
                  totalSteps={5}
                />

                <JornadaTimeline 
                  etapas={etapas} 
                  onStepClick={handleStepClick}
                  totalSimulados={totalSimulados}
                  completedLessons={completedLessons}
                  minSimulados={minSimulados}
                  minAulas={minAulas}
                  recommendedAulas={recommendedAulas}
                />
              </TabsContent>

              <TabsContent value="badges" className="mt-0">
                <BadgesTab totalSimulados={totalSimulados} completedLessons={completedLessons} />
              </TabsContent>

              <TabsContent value="evolucao" className="mt-0">
                <EvolucaoTab />
              </TabsContent>

              <TabsContent value="certificados" className="mt-0">
                <CertificadosTab />
              </TabsContent>

              <TabsContent value="info" className="mt-0">
                <InfoTab minSimulados={minSimulados} minAulas={minAulas} recommendedAulas={recommendedAulas} />
              </TabsContent>
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block lg:col-span-4">
              <div className="sticky top-6 space-y-6">
                <SidebarCard 
                  totalSimulados={totalSimulados}
                  completedLessons={completedLessons}
                  minSimulados={minSimulados}
                  recommendedAulas={recommendedAulas}
                />
              </div>
            </div>
          </div>
        </div>
      </Tabs>

      {/* Upload Modal */}
      <ProofUploadModal
        open={uploadModal.open}
        onOpenChange={(open) => setUploadModal({ ...uploadModal, open })}
        stepTitle={uploadModal.title}
        stepDescription={uploadModal.description}
        onConfirm={handleUploadConfirm}
      />
    </div>
  );
}

// Sidebar Card Component
function SidebarCard({
  totalSimulados,
  completedLessons,
  minSimulados,
  recommendedAulas,
}: {
  totalSimulados: number;
  completedLessons: number;
  minSimulados: number;
  recommendedAulas: number;
}) {
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
            <p>• Complete {minSimulados} simulados para avançar</p>
            <p>• Pratique no mínimo {recommendedAulas} aulas de direção</p>
            <p>• Revise as questões que errou</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Seu Progresso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Simulados realizados</span>
              <Badge variant={totalSimulados >= minSimulados ? "default" : "secondary"}>
                {totalSimulados}/{minSimulados}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Aulas práticas</span>
              <Badge variant={completedLessons >= 2 ? "default" : "secondary"}>
                {completedLessons}/{recommendedAulas}
              </Badge>
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

          <div className="relative h-2.5 sm:h-3 bg-muted rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentComplete}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className="absolute left-0 top-0 h-full bg-primary rounded-full"
            />
          </div>

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
  onStepClick,
  totalSimulados,
  completedLessons,
  minSimulados,
  minAulas,
  recommendedAulas,
}: { 
  etapas: JornadaEtapa[];
  onStepClick: (etapa: JornadaEtapa) => void;
  totalSimulados: number;
  completedLessons: number;
  minSimulados: number;
  minAulas: number;
  recommendedAulas: number;
}) {
  return (
    <motion.div 
      className="relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="absolute left-5 sm:left-6 lg:left-7 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-4 lg:space-y-5">
        {etapas.map((etapa, index) => (
          <TimelineEtapa 
            key={etapa.id}
            etapa={etapa}
            index={index}
            onStepClick={onStepClick}
            totalSimulados={totalSimulados}
            completedLessons={completedLessons}
            minSimulados={minSimulados}
            minAulas={minAulas}
            recommendedAulas={recommendedAulas}
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
  onStepClick,
  totalSimulados,
  completedLessons,
  minSimulados,
  minAulas,
  recommendedAulas,
}: { 
  etapa: JornadaEtapa; 
  index: number;
  onStepClick: (etapa: JornadaEtapa) => void;
  totalSimulados: number;
  completedLessons: number;
  minSimulados: number;
  minAulas: number;
  recommendedAulas: number;
}) {
  const navigate = useNavigate();
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

  // Determine progress values
  const getProgressValues = () => {
    if (etapa.tipo === 'simulados') {
      return { atual: totalSimulados, total: minSimulados, unidade: 'simulados' };
    }
    if (etapa.tipo === 'aulas') {
      return { atual: completedLessons, total: recommendedAulas, unidade: 'aulas', minimo: minAulas };
    }
    return etapa.detalhes?.progresso;
  };

  const progress = getProgressValues();

  return (
    <motion.div
      variants={itemVariants}
      className="relative pl-12 sm:pl-14 lg:pl-16"
    >
      {/* Timeline Node */}
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
              onClick={() => onStepClick(etapa)}
              className={`${styles.bg} border ${styles.border} ${styles.opacity} transition-all duration-200 ${
                etapa.status !== 'bloqueada' ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'cursor-not-allowed'
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

                    {/* Upload instruction for upload types */}
                    {etapa.tipo === 'upload' && etapa.status === 'atual' && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-primary">
                        <ExternalLink className="h-3 w-3" />
                        <span>Clique para enviar comprovante</span>
                      </div>
                    )}

                    {/* Progress for Simulados and Aulas */}
                    {progress && (etapa.tipo === 'simulados' || etapa.tipo === 'aulas') && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progresso</span>
                          <div className="flex items-center gap-2">
                            <span>{progress.atual}/{progress.total} {progress.unidade}</span>
                            {progress.minimo && progress.atual >= progress.minimo && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 border-green-500 text-green-600">
                                Apto
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Progress 
                          value={Math.min((progress.atual / progress.total) * 100, 100)} 
                          className="h-2"
                        />
                        {etapa.tipo === 'aulas' && progress.minimo && progress.atual < progress.minimo && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Mínimo {progress.minimo} para o exame prático
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    {etapa.status === 'atual' && etapa.detalhes?.action && etapa.tipo !== 'upload' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(etapa.detalhes!.action!.route);
                        }}
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
              <p>{etapa.detalhes?.requisito || 'Complete a etapa anterior para desbloquear'}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}

// Badges Tab
function BadgesTab({ totalSimulados, completedLessons }: { totalSimulados: number; completedLessons: number }) {
  const badges = [
    { id: 1, name: "Primeiro Simulado", icon: "🎯", earned: totalSimulados >= 1, description: "Completou seu primeiro simulado" },
    { id: 2, name: "Estudante Dedicado", icon: "📚", earned: totalSimulados >= 3, description: "Completou 3 simulados" },
    { id: 3, name: "Mestre Teórico", icon: "🏆", earned: totalSimulados >= 5, description: "Completou 5 simulados" },
    { id: 4, name: "Primeira Aula", icon: "🚗", earned: completedLessons >= 1, description: "Realizou sua primeira aula prática" },
    { id: 5, name: "Motorista em Formação", icon: "🛣️", earned: completedLessons >= 5, description: "Completou 5 aulas práticas" },
    { id: 6, name: "Pronto para o Exame", icon: "✅", earned: completedLessons >= 10, description: "Completou 10 aulas práticas" },
  ];

  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4"
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
function InfoTab({ minSimulados, minAulas, recommendedAulas }: { minSimulados: number; minAulas: number; recommendedAulas: number }) {
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
                  <p className="text-xs sm:text-sm">Registro inicial no DETRAN via app ou presencialmente. Envie o comprovante para avançar.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Book className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">2. Estudo Teórico</p>
                  <p className="text-xs sm:text-sm">Complete {minSimulados} simulados na plataforma para demonstrar preparo.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ClipboardList className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">3. Prova Teórica</p>
                  <p className="text-xs sm:text-sm">Exame com 30 questões, mínimo 70% de acertos. Envie o comprovante de aprovação.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Car className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">4. Aulas Práticas</p>
                  <p className="text-xs sm:text-sm">Mínimo de {minAulas} aulas para estar legalmente apto. Recomendamos {recommendedAulas} aulas.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Trophy className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">5. Exame Prático</p>
                  <p className="text-xs sm:text-sm">Teste final de direção veicular no DETRAN. Envie o resultado para concluir!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
