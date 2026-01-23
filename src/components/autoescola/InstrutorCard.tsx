import { Star, Edit2, Trash2, Eye, EyeOff, Car, MoreVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAutoescolaActions } from '@/hooks/useAutoescolaActions';
import { useToast } from '@/hooks/use-toast';
import type { Instrutor, Veiculo } from '@/hooks/useAutoescolaData';

interface InstrutorCardProps {
  instrutor: Instrutor;
  onEdit: () => void;
  onDelete?: () => void;
  veiculos: Veiculo[];
}

export function InstrutorCard({ instrutor, onEdit, onDelete, veiculos }: InstrutorCardProps) {
  const { toggleVisibilidade, deletarInstrutor } = useAutoescolaActions();
  const { toast } = useToast();

  async function handleToggleVisibilidade() {
    try {
      const newStatus = !instrutor.visivel;
      await toggleVisibilidade(instrutor.id, newStatus);
      
      toast({
        title: newStatus ? 'Instrutor ativado' : 'Instrutor desativado',
        description: newStatus 
          ? `${instrutor.nome} agora está visível para receber aulas`
          : `${instrutor.nome} não receberá novas solicitações`
      });
      
      if (onDelete) onDelete(); // Refetch data
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status',
        variant: 'destructive'
      });
    }
  }

  async function handleDeletar() {
    if (!confirm(`Deseja realmente deletar ${instrutor.nome}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deletarInstrutor(instrutor.id);
      
      toast({
        title: 'Instrutor removido',
        description: `${instrutor.nome} foi removido da autoescola`,
      });
      
      if (onDelete) onDelete(); // Refetch data
    } catch (error) {
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover o instrutor',
        variant: 'destructive'
      });
    }
  }

  // Get linked vehicles
  const veiculosVinculados = veiculos.filter(v => 
    instrutor.veiculosVinculados?.includes(v.id)
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all">
      {/* Header with Photo and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Photo */}
          <div className="relative">
            <Avatar className="h-14 w-14 border-2 border-yellow-400/30">
              <AvatarImage src={instrutor.fotoPerfil} alt={instrutor.nome} />
              <AvatarFallback className="bg-zinc-800 text-yellow-400 font-semibold">
                {getInitials(instrutor.nome)}
              </AvatarFallback>
            </Avatar>
            {/* Status Badge */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 ${
              instrutor.visivel ? 'bg-emerald-500' : 'bg-zinc-600'
            }`} />
          </div>

          {/* Name and Info */}
          <div>
            <h3 className="font-semibold text-white text-lg">
              {instrutor.nome}
            </h3>
            <p className="text-sm text-zinc-400">
              Cat. {instrutor.categoria} • {instrutor.email}
            </p>
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
            <DropdownMenuItem onClick={onEdit} className="text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer">
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDeletar} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= Math.round(instrutor.avaliacoes.media)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-zinc-700'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-zinc-400">
          {instrutor.avaliacoes.media.toFixed(1)} ({instrutor.avaliacoes.total} avaliações)
        </span>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-zinc-800/50 rounded-lg">
        <div className="text-center">
          <p className="text-xs text-zinc-500 mb-1">Aulas</p>
          <p className="text-lg font-bold text-white">
            {instrutor.estatisticas.aulasRealizadas}
          </p>
        </div>
        <div className="text-center border-x border-zinc-700">
          <p className="text-xs text-zinc-500 mb-1">Alunos</p>
          <p className="text-lg font-bold text-white">
            {instrutor.estatisticas.alunosAtivos}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-zinc-500 mb-1">Aprovação</p>
          <p className="text-lg font-bold text-emerald-400">
            {instrutor.estatisticas.taxaAprovacao}%
          </p>
        </div>
      </div>

      {/* Linked Vehicles */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
          <Car className="h-4 w-4" />
          Veículos ({veiculosVinculados.length})
        </div>
        <div className="flex flex-wrap gap-2">
          {veiculosVinculados.length === 0 ? (
            <span className="text-xs text-zinc-600">Nenhum veículo vinculado</span>
          ) : (
            veiculosVinculados.slice(0, 2).map(veiculo => (
              <span key={veiculo.id} className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">
                {veiculo.modelo} • {veiculo.placa}
              </span>
            ))
          )}
          {veiculosVinculados.length > 2 && (
            <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">
              +{veiculosVinculados.length - 2} mais
            </span>
          )}
        </div>
      </div>

      {/* Visibility Toggle */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          {instrutor.visivel ? (
            <Eye className="h-4 w-4 text-emerald-400" />
          ) : (
            <EyeOff className="h-4 w-4 text-zinc-500" />
          )}
          <span className={`text-sm ${instrutor.visivel ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {instrutor.visivel ? 'Recebendo aulas' : 'Invisível'}
          </span>
        </div>
        
        <Switch
          checked={instrutor.visivel}
          onCheckedChange={handleToggleVisibilidade}
          className="data-[state=checked]:bg-yellow-400"
        />
      </div>
    </div>
  );
}
