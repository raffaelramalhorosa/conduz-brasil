import { Clock, MapPin, ArrowRight, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Solicitacao {
  id: string;
  aluno: {
    nome: string;
    avatar?: string;
  };
  tipo: 'primeira_aula' | 'agendamento';
  data: string;
  horario: string;
  local: string;
  createdAt: Date;
}

interface SolicitacoesCardProps {
  solicitacoes?: Solicitacao[];
  onAceitar?: (id: string) => void;
  onRecusar?: (id: string) => void;
}

export function SolicitacoesCard({ solicitacoes, onAceitar, onRecusar }: SolicitacoesCardProps) {
  const pendentes: Solicitacao[] = solicitacoes || [
    {
      id: '1',
      aluno: { nome: 'Rafael Ramalho' },
      tipo: 'primeira_aula',
      data: '22/01/2026',
      horario: '14:00',
      local: 'Centro, Lagoa Santa',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2',
      aluno: { nome: 'Maria Silva' },
      tipo: 'agendamento',
      data: '23/01/2026',
      horario: '09:00',
      local: 'Industrial, Lagoa Santa',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
    },
    {
      id: '3',
      aluno: { nome: 'João Santos' },
      tipo: 'agendamento',
      data: '24/01/2026',
      horario: '16:30',
      local: 'Palmeiras, Lagoa Santa',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ];

  return (
    <div className="bg-instructor-dark-secondary rounded-xl border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Solicitações Pendentes</h3>
          <p className="text-sm text-instructor-text-muted">
            {pendentes.length} aguardando confirmação
          </p>
        </div>
        <button className="flex items-center gap-1 text-sm text-primary hover:underline">
          Ver todas
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Lista */}
      <div className="px-6 pb-6 space-y-4">
        {pendentes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-instructor-text-muted">Nenhuma solicitação pendente</p>
          </div>
        ) : (
          pendentes.map((solicitacao) => (
            <div 
              key={solicitacao.id}
              className="bg-instructor-dark-tertiary rounded-lg p-4 border border-white/5 hover:border-primary/20 transition-colors"
            >
              {/* Header da solicitação */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-instructor-dark-primary font-semibold text-sm">
                    {solicitacao.aluno.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{solicitacao.aluno.nome}</p>
                    <p className="text-xs text-instructor-text-muted">
                      {formatDistanceToNow(solicitacao.createdAt, { 
                        addSuffix: true,
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
                
                {solicitacao.tipo === 'primeira_aula' && (
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border-0 text-xs">
                    1ª Aula
                  </Badge>
                )}
              </div>
              
              {/* Detalhes */}
              <div className="flex flex-wrap gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2 text-instructor-text-secondary">
                  <Clock className="w-4 h-4 text-instructor-text-muted" />
                  {solicitacao.data} às {solicitacao.horario}
                </div>
                <div className="flex items-center gap-2 text-instructor-text-secondary">
                  <MapPin className="w-4 h-4 text-instructor-text-muted" />
                  {solicitacao.local}
                </div>
              </div>
              
              {/* Ações */}
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary/90 text-instructor-dark-primary font-medium"
                  onClick={() => onAceitar?.(solicitacao.id)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Aceitar
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  className="flex-1 border-white/10 text-instructor-text-secondary hover:bg-white/5 hover:text-white"
                  onClick={() => onRecusar?.(solicitacao.id)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Recusar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
