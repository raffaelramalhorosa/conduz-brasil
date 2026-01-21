import { Calendar, Clock, DollarSign, TrendingUp, Star, Users } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="p-6 bg-instructor-dark-primary min-h-screen">
      <div className="max-w-[1680px] mx-auto">
        
        {/* Saudação */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Bem-vindo, <span className="text-instructor-accent">Instrutor</span> 👋
          </h1>
          <p className="text-instructor-text-secondary">
            Aqui está um resumo da sua atividade hoje
          </p>
        </div>
        
        {/* Grid Principal: 8 + 4 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUNA ESQUERDA (8 colunas) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Stats Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Card: Próximas Aulas */}
              <div className="bg-instructor-dark-secondary rounded-xl p-4 border border-white/5 hover:border-instructor-accent/30 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex items-center gap-1 text-instructor-success text-xs">
                    <TrendingUp className="w-3 h-3" />
                    <span>+12%</span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mb-1">8</p>
                <p className="text-xs text-instructor-text-muted">Próximas Aulas</p>
              </div>
              
              {/* Card: Pendentes */}
              <div className="bg-instructor-dark-secondary rounded-xl p-4 border border-white/5 hover:border-instructor-warning/30 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-instructor-warning/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-instructor-warning" />
                  </div>
                  <span className="text-xs text-instructor-warning font-medium">Ação</span>
                </div>
                <p className="text-2xl font-bold text-white mb-1">3</p>
                <p className="text-xs text-instructor-text-muted">Pendentes</p>
              </div>
              
              {/* Card: Avaliação */}
              <div className="bg-instructor-dark-secondary rounded-xl p-4 border border-white/5 hover:border-instructor-accent/30 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-instructor-accent/20 flex items-center justify-center">
                    <Star className="w-5 h-5 text-instructor-accent" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mb-1">4.9</p>
                <p className="text-xs text-instructor-text-muted">Avaliação Média</p>
              </div>
              
              {/* Card: Alunos */}
              <div className="bg-instructor-dark-secondary rounded-xl p-4 border border-white/5 hover:border-purple-500/30 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex items-center gap-1 text-instructor-success text-xs">
                    <TrendingUp className="w-3 h-3" />
                    <span>+5</span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mb-1">47</p>
                <p className="text-xs text-instructor-text-muted">Total de Alunos</p>
              </div>
              
            </div>
            
            {/* Chart Placeholder */}
            <div className="bg-instructor-dark-secondary rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Aulas por Semana</h3>
                  <p className="text-sm text-instructor-text-muted">Últimas 8 semanas</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-xs font-medium text-instructor-text-secondary hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                    Semana
                  </button>
                  <button className="px-3 py-1.5 text-xs font-medium text-white bg-instructor-accent/20 rounded-lg">
                    Mês
                  </button>
                </div>
              </div>
              
              {/* Chart Area - Placeholder */}
              <div className="h-[250px] flex items-end justify-between gap-2 px-4">
                {[65, 45, 80, 55, 90, 70, 85, 95].map((height, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-gradient-to-t from-instructor-accent/40 to-instructor-accent/10 rounded-t-lg transition-all hover:from-instructor-accent/60 hover:to-instructor-accent/20"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-instructor-text-muted">S{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Próximas Aulas */}
            <div className="bg-instructor-dark-secondary rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Próximas Aulas</h3>
                <button className="text-sm text-instructor-accent hover:underline">
                  Ver todas
                </button>
              </div>
              
              <div className="space-y-4">
                {[
                  { name: 'Maria Silva', time: '09:00', category: 'Categoria B', status: 'confirmed' },
                  { name: 'João Santos', time: '11:00', category: 'Categoria A', status: 'pending' },
                  { name: 'Ana Costa', time: '14:00', category: 'Categoria B', status: 'confirmed' },
                ].map((lesson, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 bg-instructor-dark-tertiary rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-instructor-accent to-instructor-accent-secondary flex items-center justify-center text-instructor-dark-primary font-semibold text-sm">
                        {lesson.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-white">{lesson.name}</p>
                        <p className="text-sm text-instructor-text-muted">{lesson.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-white">{lesson.time}</p>
                      <p className={`text-xs ${lesson.status === 'confirmed' ? 'text-instructor-success' : 'text-instructor-warning'}`}>
                        {lesson.status === 'confirmed' ? 'Confirmada' : 'Pendente'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
          
          {/* COLUNA DIREITA (4 colunas) - Sticky */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-6">
              
              {/* Faturamento Card */}
              <div className="bg-gradient-to-br from-instructor-accent/10 to-instructor-accent-secondary/5 rounded-xl p-6 border border-instructor-accent/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Faturamento</h3>
                  <DollarSign className="w-5 h-5 text-instructor-accent" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">R$ 3.240</p>
                <p className="text-sm text-instructor-text-secondary mb-4">Janeiro 2026</p>
                <div className="flex items-center gap-2 text-instructor-success text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+8% em relação ao mês anterior</span>
                </div>
              </div>
              
              {/* Avaliações Recentes */}
              <div className="bg-instructor-dark-secondary rounded-xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Avaliações Recentes</h3>
                  <button className="text-sm text-instructor-accent hover:underline">
                    Ver todas
                  </button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { name: 'Maria S.', rating: 5, comment: 'Excelente instrutor!' },
                    { name: 'João P.', rating: 5, comment: 'Muito paciente e didático.' },
                    { name: 'Ana L.', rating: 4, comment: 'Ótima experiência.' },
                  ].map((review, index) => (
                    <div key={index} className="pb-4 border-b border-white/5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white text-sm">{review.name}</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-instructor-accent fill-instructor-accent" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-instructor-text-muted">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Agenda de Hoje */}
              <div className="bg-instructor-dark-secondary rounded-xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Hoje</h3>
                  <span className="text-sm text-instructor-text-muted">21 Jan</span>
                </div>
                
                <div className="space-y-3">
                  {['09:00', '11:00', '14:00', '16:00'].map((time, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        index < 2 ? 'bg-instructor-accent/10 border border-instructor-accent/20' : 'bg-white/5'
                      }`}
                    >
                      <span className={`text-sm font-medium ${index < 2 ? 'text-instructor-accent' : 'text-instructor-text-muted'}`}>
                        {time}
                      </span>
                      <span className={`text-sm ${index < 2 ? 'text-white' : 'text-instructor-text-muted'}`}>
                        {index < 2 ? 'Aula agendada' : 'Disponível'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
}
