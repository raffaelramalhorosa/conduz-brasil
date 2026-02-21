import { useState } from 'react';
import { Star, Edit2, Trash2, Eye, EyeOff, Car, MoreVertical, RefreshCw, Percent, DollarSign, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAutoescolaActions } from '@/hooks/useAutoescolaActions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import type { Instrutor, Veiculo } from '@/hooks/useAutoescolaData';

interface InstrutorCardProps {
  instrutor: Instrutor;
  onEdit: () => void;
  onDelete?: () => void;
  veiculos: Veiculo[];
}

const REFERENCE_LESSON_PRICE = 80;

export function InstrutorCard({ instrutor, onEdit, onDelete, veiculos }: InstrutorCardProps) {
  const { toggleVisibilidade, deletarInstrutor } = useAutoescolaActions();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [resending, setResending] = useState(false);
  const [editingCommission, setEditingCommission] = useState(false);

  // Derive affiliation status from raw data
  const invitationStatus: string = (instrutor as any).invitationStatus || 'none';
  const isAccountLinked: boolean = (instrutor as any).isAccountLinked || false;
  const currentCommissionRate: number = (instrutor as any).commissionRate ?? 0;
  const currentFixedFee: number = (instrutor as any).fixedFee ?? 0;

  // Commission editing state
  const initialType = currentFixedFee > 0 && currentCommissionRate === 0 ? 'fixed' : 'percentage';
  const initialValue = initialType === 'fixed' ? String(currentFixedFee) : String(currentCommissionRate);
  const [commissionType, setCommissionType] = useState<'percentage' | 'fixed'>(initialType);
  const [commissionValue, setCommissionValue] = useState(initialValue);

  // Check if editing should be blocked
  const isPendingInvite = invitationStatus === 'pending_invitation' || 
    (invitationStatus !== 'none' && invitationStatus !== 'accepted' && !isAccountLinked);
  const canEdit = !isPendingInvite || invitationStatus === 'none';

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
      if (onDelete) onDelete();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível alterar o status', variant: 'destructive' });
    }
  }

  async function handleDeletar() {
    if (!confirm(`Deseja realmente deletar ${instrutor.nome}? Esta ação não pode ser desfeita.`)) return;
    try {
      await deletarInstrutor(instrutor.id);
      toast({ title: 'Instrutor removido', description: `${instrutor.nome} foi removido da autoescola` });
      if (onDelete) onDelete();
    } catch (error) {
      toast({ title: 'Erro ao remover', description: 'Não foi possível remover o instrutor', variant: 'destructive' });
    }
  }

  async function handleResendInvite() {
    setResending(true);
    try {
      const { data: ipData } = await supabase
        .from('instructor_profiles')
        .select('id, business_name')
        .eq('user_id', profile?.id)
        .single();

      if (!ipData) throw new Error('Perfil não encontrado');

      const { data: existingInv } = await supabase
        .from('affiliation_invitations' as any)
        .select('token, email_exists')
        .eq('driving_school_id', (ipData as any).id)
        .eq('email', instrutor.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let token = (existingInv as any)?.token;
      let emailExists = (existingInv as any)?.email_exists ?? false;

      if (!token) {
        const { data: newInv } = await supabase
          .from('affiliation_invitations' as any)
          .insert({
            driving_school_id: (ipData as any).id,
            email: instrutor.email,
            instructor_name: instrutor.nome,
            email_exists: false,
          })
          .select('token')
          .single();
        token = (newInv as any)?.token;
      }

      await supabase.functions.invoke('send-affiliation-invite', {
        body: {
          email: instrutor.email,
          instructor_name: instrutor.nome,
          driving_school_name: (ipData as any).business_name || profile?.full_name,
          invitation_token: token,
          email_exists: emailExists,
        },
      });

      sonnerToast.success('Convite reenviado com sucesso!');
    } catch (err: any) {
      console.error('Resend invite error:', err);
      sonnerToast.error('Erro ao reenviar convite');
    } finally {
      setResending(false);
    }
  }

  function getCommissionPreview() {
    const val = parseFloat(commissionValue) || 0;
    if (commissionType === 'percentage') {
      const schoolAmount = (REFERENCE_LESSON_PRICE * val) / 100;
      return { school: schoolAmount.toFixed(2), instructor: (REFERENCE_LESSON_PRICE - schoolAmount).toFixed(2) };
    } else {
      return { school: val.toFixed(2), instructor: Math.max(0, REFERENCE_LESSON_PRICE - val).toFixed(2) };
    }
  }

  async function handleSaveCommission() {
    try {
      const val = parseFloat(commissionValue) || 0;
      await supabase
        .from('driving_school_instructors')
        .update({
          commission_rate: commissionType === 'percentage' ? val : 0,
          fixed_fee: commissionType === 'fixed' ? val : 0,
        } as any)
        .eq('id', instrutor.id);

      setEditingCommission(false);
      sonnerToast.success('Comissão atualizada');
      onDelete?.();
    } catch (err) {
      sonnerToast.error('Erro ao salvar comissão');
    }
  }

  const veiculosVinculados = veiculos.filter(v => instrutor.veiculosVinculados?.includes(v.id));

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Commission display text
  function getCommissionDisplay() {
    if (currentCommissionRate > 0 && currentFixedFee === 0) {
      return `${currentCommissionRate}%`;
    }
    if (currentFixedFee > 0 && currentCommissionRate === 0) {
      return `R$ ${currentFixedFee}/aula`;
    }
    return 'Não definida';
  }

  // Affiliation badge
  function renderAffiliationBadge() {
    if (invitationStatus === 'accepted' && isAccountLinked) {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">✓ Conta vinculada</Badge>;
    }
    if (invitationStatus === 'pending_invitation') {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs animate-pulse">Convite pendente</Badge>;
    }
    if (invitationStatus === 'rejected') {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Convite recusado</Badge>;
    }
    return <Badge className="bg-zinc-700/50 text-zinc-400 border-zinc-600 text-xs">Cadastro simples</Badge>;
  }

  const preview = getCommissionPreview();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-14 w-14 border-2 border-yellow-400/30">
              <AvatarImage src={instrutor.fotoPerfil} alt={instrutor.nome} />
              <AvatarFallback className="bg-zinc-800 text-yellow-400 font-semibold">{getInitials(instrutor.nome)}</AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 ${instrutor.visivel ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">{instrutor.nome}</h3>
            <p className="text-sm text-zinc-400">Cat. {instrutor.categoria} • {instrutor.email}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
            {canEdit && (
              <DropdownMenuItem onClick={onEdit} className="text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer">
                <Edit2 className="h-4 w-4 mr-2" /> Editar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDeletar} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" /> Deletar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Affiliation + Commission Badges */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {renderAffiliationBadge()}
        <Popover open={editingCommission} onOpenChange={setEditingCommission}>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors border border-zinc-700">
              Comissão: {getCommissionDisplay()}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 bg-zinc-900 border-zinc-700 text-white p-4 space-y-3">
            <p className="text-sm font-medium text-zinc-300">Editar comissão</p>
            
            <RadioGroup
              value={commissionType}
              onValueChange={(val) => {
                setCommissionType(val as 'percentage' | 'fixed');
                setCommissionValue(val === 'percentage' ? '30' : '15');
              }}
              className="flex gap-4"
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="percentage" />
                <span className="text-xs text-zinc-300">Porcentagem (%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="fixed" />
                <span className="text-xs text-zinc-300">Valor fixo (R$)</span>
              </label>
            </RadioGroup>

            {commissionType === 'percentage' ? (
              <div className="space-y-2">
                <div className="relative">
                  <Input type="number" min="0" max="100" value={commissionValue} onChange={(e) => setCommissionValue(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm pr-8" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">%</span>
                </div>
                <Slider
                  value={[parseFloat(commissionValue) || 0]}
                  onValueChange={([val]) => setCommissionValue(String(val))}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            ) : (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">R$</span>
                <Input type="number" min="0" value={commissionValue} onChange={(e) => setCommissionValue(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white h-8 text-sm pl-10" />
              </div>
            )}

            <div className="bg-zinc-800/50 rounded-lg p-2 text-xs text-zinc-400">
              <span className="text-yellow-400">💡</span> Aula de R$ {REFERENCE_LESSON_PRICE}: escola{' '}
              <strong className="text-white">R$ {preview.school}</strong>, instrutor{' '}
              <strong className="text-white">R$ {preview.instructor}</strong>
            </div>

            <Button size="sm" onClick={handleSaveCommission} className="w-full bg-yellow-400 text-zinc-900 hover:bg-yellow-500 text-xs">
              Salvar
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Pending invite notice */}
      {isPendingInvite && (
        <div className="mb-3 space-y-2">
          <p className="text-xs text-zinc-500 italic">Edição disponível após aceitar o convite</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendInvite}
            disabled={resending}
            className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-400/10 text-xs"
          >
            {resending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
            Reenviar convite
          </Button>
        </div>
      )}

      {/* Resend invite button for non-pending but unlinked */}
      {invitationStatus === 'pending_invitation' && !isPendingInvite && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResendInvite}
          disabled={resending}
          className="w-full mb-3 border-yellow-500/30 text-yellow-400 hover:bg-yellow-400/10 text-xs"
        >
          {resending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
          Reenviar convite
        </Button>
      )}

      {/* Rating - only show if has reviews */}
      <div className="flex items-center gap-2 mb-4">
        {instrutor.avaliacoes.total > 0 ? (
          <>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} className={`h-4 w-4 ${star <= Math.round(instrutor.avaliacoes.media) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-700'}`} />
              ))}
            </div>
            <span className="text-sm text-zinc-400">{instrutor.avaliacoes.media.toFixed(1)} ({instrutor.avaliacoes.total} avaliações)</span>
          </>
        ) : (
          <span className="text-sm text-zinc-500">Sem avaliações</span>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-zinc-800/50 rounded-lg">
        <div className="text-center">
          <p className="text-xs text-zinc-500 mb-1">Aulas</p>
          <p className="text-lg font-bold text-white">{instrutor.estatisticas.aulasRealizadas}</p>
        </div>
        <div className="text-center border-x border-zinc-700">
          <p className="text-xs text-zinc-500 mb-1">Alunos</p>
          <p className="text-lg font-bold text-white">{instrutor.estatisticas.alunosAtivos}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-zinc-500 mb-1">Aprovação</p>
          <p className="text-lg font-bold text-emerald-400">{instrutor.estatisticas.taxaAprovacao}%</p>
        </div>
      </div>

      {/* Linked Vehicles */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
          <Car className="h-4 w-4" /> Veículos ({veiculosVinculados.length})
        </div>
        <div className="flex flex-wrap gap-2">
          {veiculosVinculados.length === 0 ? (
            <span className="text-xs text-zinc-600">Nenhum veículo vinculado</span>
          ) : (
            veiculosVinculados.slice(0, 2).map(v => (
              <span key={v.id} className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">{v.modelo} • {v.placa}</span>
            ))
          )}
          {veiculosVinculados.length > 2 && (
            <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">+{veiculosVinculados.length - 2} mais</span>
          )}
        </div>
      </div>

      {/* Visibility Toggle */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          {instrutor.visivel ? <Eye className="h-4 w-4 text-emerald-400" /> : <EyeOff className="h-4 w-4 text-zinc-500" />}
          <span className={`text-sm ${instrutor.visivel ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {instrutor.visivel ? 'Recebendo aulas' : 'Invisível'}
          </span>
        </div>
        <Switch checked={instrutor.visivel} onCheckedChange={handleToggleVisibilidade} className="data-[state=checked]:bg-yellow-400" />
      </div>
    </div>
  );
}
