import { Star, ThumbsUp, ArrowRight, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { routes } from '@/lib/routes';

interface Avaliacao {
  id: string;
  aluno: string;
  avatar?: string;
  rating: number;
  comentario: string;
  data: string;
}

interface AvaliacoesRecentesCardProps {
  avaliacoes?: Avaliacao[];
  mediaGeral?: number;
  totalAvaliacoes?: number;
  loading?: boolean;
}

export function AvaliacoesRecentesCard({ 
  avaliacoes = [],
  mediaGeral = 0, 
  totalAvaliacoes = 0,
  loading = false,
}: AvaliacoesRecentesCardProps) {
  if (loading) {
    return (
      <div className="bg-instructor-dark-secondary rounded-xl border border-border p-6">
        <div className="flex items-start justify-between mb-6">
          <Skeleton className="h-6 w-32 bg-muted" />
          <Skeleton className="h-10 w-16 bg-muted" />
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const hasAvaliacoes = avaliacoes.length > 0;

  return (
    <div className="bg-instructor-dark-secondary rounded-xl border border-border">
      {/* Header com Média */}
      <div className="flex items-start justify-between p-6 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Avaliações</h3>
          <p className="text-sm text-instructor-text-muted">
            {totalAvaliacoes} avaliações
          </p>
        </div>
        
        {hasAvaliacoes && (
          <div className="text-right">
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-5 h-5 text-primary fill-primary" />
              <span className="text-2xl font-bold text-foreground">{mediaGeral.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star}
                  className={cn(
                    "w-3 h-3",
                    star <= Math.round(mediaGeral) 
                      ? "text-primary fill-primary" 
                      : "text-muted-foreground/20"
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Lista de Avaliações or Empty State */}
      {hasAvaliacoes ? (
        <>
          <div className="px-6 pb-4 space-y-4">
            {avaliacoes.map((avaliacao) => (
              <div 
                key={avaliacao.id}
                className="pb-4 border-b border-border last:border-0 last:pb-0"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {avaliacao.avatar ? (
                      <img 
                        src={avaliacao.avatar} 
                        alt={avaliacao.aluno}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-primary-foreground font-semibold text-xs">
                        {avaliacao.aluno.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{avaliacao.aluno}</p>
                      <p className="text-xs text-instructor-text-muted">
                        ​
                      </p>
                    </div>
                  </div>
                  
                  {/* Estrelas */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={cn(
                          "w-3 h-3",
                          star <= avaliacao.rating 
                            ? "text-primary fill-primary" 
                            : "text-muted-foreground/20"
                        )}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Comentário */}
                {avaliacao.comentario && (
                  <p className="text-sm text-instructor-text-secondary leading-relaxed mb-2">
                    {avaliacao.comentario}
                  </p>
                )}
                
                {/* Footer */}
                <button className="flex items-center gap-1 text-xs text-instructor-text-muted hover:text-foreground transition-colors">
                  <ThumbsUp className="w-3 h-3" />
                  Útil
                </button>
              </div>
            ))}
          </div>
          
          {/* Ver mais */}
          <div className="px-6 pb-6">
            <Link 
              to={routes.instructor.reviews}
              className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:underline py-2"
            >
              Ver todas avaliações
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </>
      ) : (
        <div className="px-6 pb-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Inbox className="w-12 h-12 text-instructor-text-muted/30 mb-3" />
            <p className="text-instructor-text-muted text-sm">
              Você ainda não tem avaliações
            </p>
            <p className="text-instructor-text-muted/60 text-xs mt-1">
              Complete aulas para receber feedback
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
