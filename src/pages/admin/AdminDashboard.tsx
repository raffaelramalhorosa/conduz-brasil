import { useAuth } from '@/contexts/AuthContext';
import { StatsGrid } from '@/components/instructor/StatsGrid';
import { FaturamentoCard } from '@/components/instructor/FaturamentoCard';
import { SolicitacoesCard } from '@/components/instructor/SolicitacoesCard';
import { ProximasAulasCard } from '@/components/instructor/ProximasAulasCard';
import { AvaliacoesRecentesCard } from '@/components/instructor/AvaliacoesRecentesCard';
import { MpConnectionCard } from '@/components/admin/MpConnectionCard';
import { useInstrutorData } from '@/hooks/useInstrutorData';
import { useDashboardSettings } from '@/contexts/DashboardSettingsContext';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

function loadGoogleFont(font: string) {
  const id = `google-font-${font.replace(/\s/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s/g, '+')}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const instructorName = profile?.full_name?.split(' ')[0] || 'Instrutor';
  const { settings } = useDashboardSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const {
    stats,
    proximasAulas,
    avaliacoesRecentes,
    faturamentoHistorico,
    loading,
  } = useInstrutorData();

  // Load custom font
  useEffect(() => {
    if (settings?.font_family && settings.font_family !== 'Inter') {
      loadGoogleFont(settings.font_family);
    }
  }, [settings?.font_family]);

  // Handle MP OAuth return params
  useEffect(() => {
    if (searchParams.get('mp_connected') === 'true') {
      toast.success('Mercado Pago conectado com sucesso!');
      searchParams.delete('mp_connected');
      setSearchParams(searchParams, { replace: true });
    } else if (searchParams.get('mp_error') === 'true') {
      toast.error('Não foi possível conectar o Mercado Pago. Tente novamente.');
      searchParams.delete('mp_error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Transform proximasAulas for the card
  const aulasFormatadas = proximasAulas.map((aula) => ({
    id: aula.id,
    aluno: aula.aluno,
    data: aula.data,
    horario: aula.horario,
    local: aula.local,
    payment_status: aula.payment_status,
  }));

  // Transform avaliacoes for the card
  const avaliacoesFormatadas = avaliacoesRecentes.map((av) => ({
    id: av.id,
    aluno: av.aluno,
    avatar: av.avatar,
    rating: av.rating,
    comentario: av.comentario,
    data: av.data,
  }));

  const customStyle = settings ? {
    '--custom-primary': settings.primary_color,
    '--custom-secondary': settings.secondary_color,
    '--custom-accent': settings.accent_color,
    '--custom-bg': settings.background_color,
    backgroundColor: settings.background_color,
  } as React.CSSProperties : undefined;
  return (
    <div className="p-3 sm:p-6 min-h-screen" style={customStyle}>
      <div className="max-w-[1680px] mx-auto">
        
        {/* Saudação */}
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2" style={{ color: 'var(--school-text, white)' }}>
            Bem-vindo, <span style={{ color: 'var(--school-primary, hsl(var(--primary)))' }}>{instructorName}</span> 👋
          </h1>
          <p className="text-instructor-text-secondary">
            Aqui está um resumo da sua atividade hoje
          </p>
        </div>

        {/* MP Connection Card */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '80ms' }}>
          <MpConnectionCard />
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
              <FaturamentoCard 
                valorAtual={stats?.faturamentoMes || 0}
                variacao={stats?.variacao || 0}
                historico={faturamentoHistorico}
                loading={loading}
              />
            </div>
            
            {/* Solicitações Pendentes */}
            <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <SolicitacoesCard />
            </div>
            
            {/* Avaliações (Mobile only) */}
            <div className="lg:hidden animate-fade-in" style={{ animationDelay: '400ms' }}>
              <AvaliacoesRecentesCard 
                avaliacoes={avaliacoesFormatadas}
                mediaGeral={stats?.avaliacaoMedia || 0}
                totalAvaliacoes={stats?.totalAvaliacoes || 0}
                loading={loading}
              />
            </div>
            
          </div>
          
          {/* COLUNA DIREITA (4 colunas) - Sticky */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-6">
              
              {/* Próximas Aulas */}
              <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                <ProximasAulasCard 
                  aulas={aulasFormatadas}
                  loading={loading}
                />
              </div>
              
              {/* Avaliações (Desktop only) */}
              <div className="hidden lg:block animate-fade-in" style={{ animationDelay: '300ms' }}>
                <AvaliacoesRecentesCard 
                  avaliacoes={avaliacoesFormatadas}
                  mediaGeral={stats?.avaliacaoMedia || 0}
                  totalAvaliacoes={stats?.totalAvaliacoes || 0}
                  loading={loading}
                />
              </div>
              
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
}
