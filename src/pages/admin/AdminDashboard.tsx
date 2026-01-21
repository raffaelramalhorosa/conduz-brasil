import { useAuth } from '@/contexts/AuthContext';
import { StatsGrid } from '@/components/instructor/StatsGrid';
import { FaturamentoCard } from '@/components/instructor/FaturamentoCard';
import { SolicitacoesCard } from '@/components/instructor/SolicitacoesCard';
import { ProximasAulasCard } from '@/components/instructor/ProximasAulasCard';
import { AvaliacoesRecentesCard } from '@/components/instructor/AvaliacoesRecentesCard';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const instructorName = profile?.full_name?.split(' ')[0] || 'Instrutor';

  return (
    <div className="p-6 bg-instructor-dark-primary min-h-screen">
      <div className="max-w-[1680px] mx-auto">
        
        {/* Saudação */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Bem-vindo, <span className="text-primary">{instructorName}</span> 👋
          </h1>
          <p className="text-instructor-text-secondary">
            Aqui está um resumo da sua atividade hoje
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <StatsGrid />
        </div>
        
        {/* Grid Principal: 8 + 4 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUNA ESQUERDA (8 colunas) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Gráfico de Faturamento */}
            <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <FaturamentoCard />
            </div>
            
            {/* Solicitações Pendentes */}
            <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <SolicitacoesCard />
            </div>
            
            {/* Avaliações (Mobile only) */}
            <div className="lg:hidden animate-fade-in" style={{ animationDelay: '400ms' }}>
              <AvaliacoesRecentesCard />
            </div>
            
          </div>
          
          {/* COLUNA DIREITA (4 colunas) - Sticky */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-6">
              
              {/* Próximas Aulas */}
              <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                <ProximasAulasCard />
              </div>
              
              {/* Avaliações (Desktop only) */}
              <div className="hidden lg:block animate-fade-in" style={{ animationDelay: '300ms' }}>
                <AvaliacoesRecentesCard />
              </div>
              
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
}
