import { Calendar, MapPin, ArrowRight, Inbox, CheckCircle, Clock as ClockIcon, XCircle } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatTimeHHMM } from '@/lib/timeFormatter';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { routes } from '@/lib/routes';

interface Aula {
  id: string;
  aluno: string;
  data: string;
  horario: string;
  local: string;
  payment_status?: string | null;
}

interface ProximasAulasCardProps {
  aulas?: Aula[];
  loading?: boolean;
}

export function ProximasAulasCard({ aulas = [], loading = false }: ProximasAulasCardProps) {
  const hoje = new Date();

  if (loading) {
    return (
      <div className="bg-instructor-dark-secondary rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-lg bg-muted" />
          <div>
            <Skeleton className="h-5 w-24 bg-muted mb-1" />
            <Skeleton className="h-3 w-32 bg-muted" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-instructor-dark-secondary rounded-xl border border-border">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 pb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Agenda</h3>
          <p className="text-xs text-instructor-text-muted">
            {format(hoje, "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>
      
      {/* Timeline or Empty State */}
      {aulas.length > 0 ? (
        <>
          <div className="px-6 pb-4 space-y-3">
            {aulas.slice(0, 4).map((aula, index) => {
              const aulaDate = typeof aula.data === 'string' ? parseISO(aula.data) : aula.data;
              const isHoje = isToday(aulaDate);
              
              return (
                <div key={aula.id} className="relative">
                  {/* Linha de conexão */}
                  {index < Math.min(aulas.length, 4) - 1 && (
                    <div className="absolute left-[7px] top-10 w-0.5 h-6 bg-border" />
                  )}
                  
                  {/* Card */}
                  <div className={cn(
                    "flex items-start gap-3 p-3 rounded-lg transition-colors",
                    isHoje 
                      ? "bg-primary/10 border border-primary/20" 
                      : "bg-muted/50 hover:bg-muted"
                  )}>
                    {/* Indicador */}
                    <div className="mt-1">
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        isHoje ? "border-primary bg-primary/20" : "border-muted-foreground/30"
                      )}>
                        {isHoje && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "font-medium text-sm truncate",
                            isHoje ? "text-foreground" : "text-instructor-text-secondary"
                          )}>
                            {aula.aluno}
                          </p>
                          {isHoje && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                              Hoje
                            </span>
                          )}
                        </div>
                        <span className={cn(
                          "text-sm font-medium",
                          isHoje ? "text-primary" : "text-instructor-text-muted"
                        )}>
                          {formatTimeHHMM(aula.horario)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-instructor-text-muted">
                        <MapPin className="w-3 h-3" />
                        {aula.local}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Footer */}
          <div className="px-6 pb-6">
            <Link 
              to={routes.instructor.appointments}
              className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:underline py-2"
            >
              Ver agenda completa
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </>
      ) : (
        <div className="px-6 pb-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Inbox className="w-12 h-12 text-instructor-text-muted/30 mb-3" />
            <p className="text-instructor-text-muted text-sm">
              Você ainda não tem agenda
            </p>
            <p className="text-instructor-text-muted/60 text-xs mt-1">
              Aulas confirmadas aparecerão aqui
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
