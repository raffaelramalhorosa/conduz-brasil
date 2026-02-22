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
    <div className="min-h-screen bg-zinc-950">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Instrutores
            </h1>
            <p className="text-zinc-400 mt-1">
              Gerencie os instrutores vinculados à sua autoescola
            </p>
          </div>
          
          <Button
            onClick={() => setShowNovoModal(true)}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-zinc-900 font-semibold shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Instrutor
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="h-5 w-5 text-blue-400" />}
            label="Total"
            value={totalInstrutores.toString()}
            color="blue"
          />
          <StatCard
            icon={<Users className="h-5 w-5 text-emerald-400" />}
            label="Ativos"
            value={instrutoresAtivos.toString()}
            color="emerald"
          />
          <StatCard
            icon={<Star className="h-5 w-5 text-yellow-400" />}
            label="Avaliação Média"
            value={mediaAvaliacoes}
            color="yellow"
          />
          <StatCard
            icon={<BookOpen className="h-5 w-5 text-purple-400" />}
            label="Total de Aulas"
            value={totalAulas.toString()}
            color="purple"
          />
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus:border-yellow-400/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'todos' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('todos')}
              className={filterStatus === 'todos' 
                ? 'bg-yellow-400 text-zinc-900 hover:bg-yellow-500' 
                : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }
            >
              Todos
            </Button>
            <Button
              variant={filterStatus === 'ativos' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('ativos')}
              className={filterStatus === 'ativos' 
                ? 'bg-yellow-400 text-zinc-900 hover:bg-yellow-500' 
                : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }
            >
              Ativos
            </Button>
            <Button
              variant={filterStatus === 'inativos' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('inativos')}
              className={filterStatus === 'inativos' 
                ? 'bg-yellow-400 text-zinc-900 hover:bg-yellow-500' 
                : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white'
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
          <div className="text-center py-16 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <div className="text-6xl mb-4">👨‍🏫</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Nenhum instrutor encontrado
            </h3>
            <p className="text-zinc-400 mb-6">
              {searchTerm 
                ? 'Tente buscar com outros termos'
                : 'Adicione seu primeiro instrutor para começar'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setShowNovoModal(true)}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-zinc-900 font-semibold"
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
  color: 'blue' | 'emerald' | 'yellow' | 'purple';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const bgColors = {
    blue: 'bg-blue-500/10',
    emerald: 'bg-emerald-500/10',
    yellow: 'bg-yellow-500/10',
    purple: 'bg-purple-500/10'
  };

  return (
    <div className={`${bgColors[color]} rounded-xl p-4 border border-zinc-800`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
