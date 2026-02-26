import { Clock, MapPin, ArrowRight, Check, X, DollarSign, Timer, Loader2, CheckCircle, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInstrutorData } from '@/hooks/useInstrutorData';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { routes } from '@/lib/routes';

export function SolicitacoesCard() {
  const { solicitacoes, loading, aceitarSolicitacao, recusarSolicitacao } = useInstrutorData();
  const [processando, setProcessando] = useState<string | null>(null);

  async function handleAceitar(solicitacaoId: string) {
    setProcessando(solicitacaoId);
    await aceitarSolicitacao(solicitacaoId);
    setProcessando(null);
  }

  async function handleRecusar(solicitacaoId: string) {
    setProcessando(solicitacaoId);
    await recusarSolicitacao(solicitacaoId);
    setProcessando(null);
  }

  if (loading) {
    return (
      <div className="bg-instructor-dark-secondary rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-48 bg-muted" />
          <Skeleton className="h-4 w-20 bg-muted" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-instructor-dark-secondary rounded-xl border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Solicitações Pendentes</h3>
          <p className="text-sm text-instructor-text-muted">
            {solicitacoes.length} aguardando confirmação
          </p>
        </div>
        <Link 
          to={routes.instructor.appointments}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Ver todas
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      {/* Lista */}
      <div className="px-6 pb-6 space-y-4">
        {solicitacoes.length === 0 ? (
          <div className="text-center py-8">
            <Inbox className="w-12 h-12 text-instructor-text-muted/30 mx-auto mb-3" />
            <p className="text-instructor-text-muted">Você ainda não tem solicitações pendentes</p>
            <p className="text-instructor-text-muted/60 text-xs mt-1">
              Novas solicitações de aulas aparecerão aqui
            </p>
          </div>
        ) : (
          solicitacoes.slice(0, 3).map((solicitacao) => {
            const isProcessing = processando === solicitacao.id;
            
            return (
              <div 
                key={solicitacao.id}
                className="bg-instructor-dark-tertiary rounded-lg p-4 border border-border hover:border-primary/20 transition-colors"
              >
                {/* Header da solicitação */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {solicitacao.aluno.avatar ? (
                      <img 
                        src={solicitacao.aluno.avatar} 
                        alt={solicitacao.aluno.nome}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-primary-foreground font-semibold text-sm">
                        {solicitacao.aluno.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{solicitacao.aluno.nome}</p>
                      <p className="text-xs text-instructor-text-muted">
                        {formatDistanceToNow(new Date(solicitacao.createdAt), { 
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
                <div className="flex flex-wrap gap-4 mb-3 text-sm">
                  <div className="flex items-center gap-2 text-instructor-text-secondary">
                    <Clock className="w-4 h-4 text-instructor-text-muted" />
                    {solicitacao.data} às {solicitacao.horario}
                  </div>
                  <div className="flex items-center gap-2 text-instructor-text-secondary">
                    <MapPin className="w-4 h-4 text-instructor-text-muted" />
                    {solicitacao.local.endereco}
                  </div>
                </div>
                
                {/* Valor e Duração */}
                <div className="flex items-center gap-4 mb-3 text-sm">
                  <div className="flex items-center gap-1.5 text-instructor-success">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">R$ {solicitacao.valorAula.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-instructor-text-muted">
                    <Timer className="w-4 h-4" />
                    <span>{solicitacao.duracao} min</span>
                  </div>
                </div>

                {/* Observações */}
                {solicitacao.observacoes && (
                  <p className="text-xs text-instructor-text-muted italic mb-3 bg-muted/50 p-2 rounded">
                    "{solicitacao.observacoes}"
                  </p>
                )}
                
                {/* Ações */}
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    onClick={() => handleAceitar(solicitacao.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Aceitar
                      </>
                    )}
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="flex-1 border-border text-instructor-text-secondary hover:bg-muted hover:text-foreground"
                    onClick={() => handleRecusar(solicitacao.id)}
                    disabled={isProcessing}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Recusar
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
