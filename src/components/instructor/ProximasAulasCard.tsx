import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { format, addDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Aula {
  id: string;
  aluno: string;
  data: Date;
  horario: string;
  local: string;
}

interface ProximasAulasCardProps {
  aulas?: Aula[];
}

export function ProximasAulasCard({ aulas }: ProximasAulasCardProps) {
  const hoje = new Date();
  
  const listaAulas: Aula[] = aulas || [
    {
      id: '1',
      aluno: 'Carlos Eduardo',
      data: hoje,
      horario: '14:00',
      local: 'Centro'
    },
    {
      id: '2',
      aluno: 'Ana Paula',
      data: addDays(hoje, 1),
      horario: '09:00',
      local: 'Industrial'
    },
    {
      id: '3',
      aluno: 'Pedro Henrique',
      data: addDays(hoje, 1),
      horario: '16:00',
      local: 'Palmeiras'
    },
    {
      id: '4',
      aluno: 'Fernanda Lima',
      data: addDays(hoje, 2),
      horario: '10:30',
      local: 'Centro'
    }
  ];

  return (
    <div className="bg-instructor-dark-secondary rounded-xl border border-white/5">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 pb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Agenda</h3>
          <p className="text-xs text-instructor-text-muted">
            {format(hoje, "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="px-6 pb-4 space-y-3">
        {listaAulas.map((aula, index) => {
          const isHoje = isToday(aula.data);
          
          return (
            <div key={aula.id} className="relative">
              {/* Linha de conexão */}
              {index < listaAulas.length - 1 && (
                <div className="absolute left-[7px] top-10 w-0.5 h-6 bg-white/10" />
              )}
              
              {/* Card */}
              <div className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors",
                isHoje 
                  ? "bg-primary/10 border border-primary/20" 
                  : "bg-white/5 hover:bg-white/10"
              )}>
                {/* Indicador */}
                <div className="mt-1">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    isHoje ? "border-primary bg-primary/20" : "border-white/30"
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
                        isHoje ? "text-white" : "text-instructor-text-secondary"
                      )}>
                        {aula.aluno}
                      </p>
                      {isHoje && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary text-instructor-dark-primary">
                          Hoje
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      isHoje ? "text-primary" : "text-instructor-text-muted"
                    )}>
                      {aula.horario}
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
        <button className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:underline py-2">
          Ver agenda completa
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
