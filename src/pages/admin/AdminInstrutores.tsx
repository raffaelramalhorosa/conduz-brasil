import { useState } from 'react';
import { Plus, Search, Users, Star, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InstrutorCard } from '@/components/autoescola/InstrutorCard';
import { InstrutorCardSkeleton } from '@/components/autoescola/InstrutorCardSkeleton';
import { NovoInstrutorModal } from '@/components/autoescola/NovoInstrutorModal';
import { EditarInstrutorDrawer } from '@/components/autoescola/EditarInstrutorDrawer';
import { useAutoescolaData, type Instrutor } from '@/hooks/useAutoescolaData';

type FilterStatus = 'todos' | 'ativos' | 'inativos';

export default function AdminInstrutores() {
  const { instrutores, veiculos, loading, refetch, instructorProfileId } = useAutoescolaData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [instrutorSelecionado, setInstrutorSelecionado] = useState<Instrutor | null>(null);

  // Filter instructors
  const instrutoresFiltrados = instrutores.filter(inst => {
    const matchSearch = inst.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        inst.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'todos' 
      ? true 
      : filterStatus === 'ativos' 
        ? inst.visivel 
        : !inst.visivel;
    return matchSearch && matchStatus;
  });

  // Calculate stats
  const totalInstrutores = instrutores.length;
  const instrutoresAtivos = instrutores.filter(i => i.visivel).length;
  const mediaAvaliacoes = instrutores.length > 0 
    ? (instrutores.reduce((acc, i) => acc + i.avaliacoes.media, 0) / instrutores.length).toFixed(1)
    : '0.0';
  const totalAulas = instrutores.reduce((acc, i) => acc + i.estatisticas.aulasRealizadas, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Instrutores
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os instrutores vinculados à sua autoescola
            </p>
          </div>
          
          <Button
            onClick={() => setShowNovoModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Instrutor
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="h-5 w-5 text-primary" />}
            label="Total"
            value={totalInstrutores.toString()}
          />
          <StatCard
            icon={<Users className="h-5 w-5 text-primary" />}
            label="Ativos"
            value={instrutoresAtivos.toString()}
          />
          <StatCard
            icon={<Star className="h-5 w-5 text-primary" />}
            label="Avaliação Média"
            value={mediaAvaliacoes}
          />
          <StatCard
            icon={<BookOpen className="h-5 w-5 text-primary" />}
            label="Total de Aulas"
            value={totalAulas.toString()}
          />
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'todos' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('todos')}
              className={filterStatus === 'todos' 
                ? '' 
                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              }
            >
              Todos
            </Button>
            <Button
              variant={filterStatus === 'ativos' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('ativos')}
              className={filterStatus === 'ativos' 
                ? '' 
                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              }
            >
              Ativos
            </Button>
            <Button
              variant={filterStatus === 'inativos' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('inativos')}
              className={filterStatus === 'inativos' 
                ? '' 
                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              }
            >
              Inativos
            </Button>
          </div>
        </div>

        {/* Instructors Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <InstrutorCardSkeleton key={i} />)}
          </div>
        ) : instrutoresFiltrados.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl border border-border">
            <div className="text-6xl mb-4">👨‍🏫</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum instrutor encontrado
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? 'Tente buscar com outros termos'
                : 'Adicione seu primeiro instrutor para começar'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setShowNovoModal(true)}
                className="font-semibold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Instrutor
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {instrutoresFiltrados.map(instrutor => (
              <InstrutorCard
                key={instrutor.id}
                instrutor={instrutor}
                onEdit={() => setInstrutorSelecionado(instrutor)}
                onDelete={refetch}
                veiculos={veiculos}
                schoolProfileId={instructorProfileId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <NovoInstrutorModal
        open={showNovoModal}
        onClose={() => setShowNovoModal(false)}
        onSuccess={refetch}
      />

      {instrutorSelecionado && (
        <EditarInstrutorDrawer
          instrutor={instrutorSelecionado}
          veiculos={veiculos}
          onClose={() => setInstrutorSelecionado(null)}
          onSuccess={refetch}
          schoolProfileId={instructorProfileId}
        />
      )}
    </div>
  );
}

// Helper component: Stat Card
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="bg-card/50 rounded-xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
