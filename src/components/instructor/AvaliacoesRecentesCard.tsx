import { Star, ThumbsUp, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Avaliacao {
  id: string;
  aluno: string;
  rating: number;
  comentario: string;
  data: Date;
}

interface AvaliacoesRecentesCardProps {
  avaliacoes?: Avaliacao[];
  mediaGeral?: number;
  totalAvaliacoes?: number;
}

export function AvaliacoesRecentesCard({ 
  avaliacoes,
  mediaGeral = 4.9, 
  totalAvaliacoes = 47 
}: AvaliacoesRecentesCardProps) {
  const listaAvaliacoes: Avaliacao[] = avaliacoes || [
    {
      id: '1',
      aluno: 'Rafael Ramalho',
      rating: 5,
      comentario: 'Excelente instrutor! Muito paciente e didático. Recomendo!',
      data: new Date(Date.now() - 3 * 60 * 60 * 1000)
    },
    {
      id: '2',
      aluno: 'Maria Silva',
      rating: 5,
      comentario: 'Aprendi muito nas aulas. Instrutor atencioso e profissional.',
      data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  ];

  return (
    <div className="bg-instructor-dark-secondary rounded-xl border border-white/5">
      {/* Header com Média */}
      <div className="flex items-start justify-between p-6 pb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Avaliações</h3>
          <p className="text-sm text-instructor-text-muted">
            {totalAvaliacoes} avaliações
          </p>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-1 mb-1">
            <Star className="w-5 h-5 text-primary fill-primary" />
            <span className="text-2xl font-bold text-white">{mediaGeral}</span>
          </div>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star}
                className={cn(
                  "w-3 h-3",
                  star <= Math.round(mediaGeral) 
                    ? "text-primary fill-primary" 
                    : "text-white/20"
                )}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Lista de Avaliações */}
      <div className="px-6 pb-4 space-y-4">
        {listaAvaliacoes.map((avaliacao) => (
          <div 
            key={avaliacao.id}
            className="pb-4 border-b border-white/5 last:border-0 last:pb-0"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-instructor-dark-primary font-semibold text-xs">
                  {avaliacao.aluno.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{avaliacao.aluno}</p>
                  <p className="text-xs text-instructor-text-muted">
                    {formatDistanceToNow(avaliacao.data, {
                      addSuffix: true,
                      locale: ptBR
                    })}
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
                        : "text-white/20"
                    )}
                  />
                ))}
              </div>
            </div>
            
            {/* Comentário */}
            <p className="text-sm text-instructor-text-secondary leading-relaxed mb-2">
              {avaliacao.comentario}
            </p>
            
            {/* Footer */}
            <button className="flex items-center gap-1 text-xs text-instructor-text-muted hover:text-white transition-colors">
              <ThumbsUp className="w-3 h-3" />
              Útil
            </button>
          </div>
        ))}
      </div>
      
      {/* Ver mais */}
      <div className="px-6 pb-6">
        <button className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:underline py-2">
          Ver todas avaliações
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
