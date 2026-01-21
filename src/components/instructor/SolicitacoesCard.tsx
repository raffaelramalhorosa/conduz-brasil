import { Clock, MapPin, ArrowRight, Check, X, DollarSign, Timer, Loader2, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInstrutorData } from '@/hooks/useInstrutorData';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div className="bg-instructor-dark-secondary rounded-xl border border-white/5 p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-48 bg-white/10" />
          <Skeleton className="h-4 w-20 bg-white/10" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full bg-white/10 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-instructor-dark-secondary rounded-xl border border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Solicitações Pendentes</h3>
          <p className="text-sm text-instructor-text-muted">
            {solicitacoes.length} aguardando confirmação
          </p>
        </div>
        <button className="flex items-center gap-1 text-sm text-primary hover:underline">
          Ver todas
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Lista */}
      <div className="px-6 pb-6 space-y-4">
        {solicitacoes.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-instructor-success mx-auto mb-3 opacity-50" />
            <p className="text-instructor-text-muted">Nenhuma solicitação pendente</p>
          </div>
        ) : (
          solicitacoes.map((solicitacao) => {
            const isProcessing = processando === solicitacao.id;
            
            return (
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
                  <p className="text-xs text-instructor-text-muted italic mb-3 bg-white/5 p-2 rounded">
                    "{solicitacao.observacoes}"
                  </p>
                )}
                
                {/* Ações */}
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary/90 text-instructor-dark-primary font-medium"
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
                    className="flex-1 border-white/10 text-instructor-text-secondary hover:bg-white/5 hover:text-white"
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
