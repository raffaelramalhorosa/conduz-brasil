import { useState } from 'react';
import { X, UserPlus, Mail, Phone, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAutoescolaActions } from '@/hooks/useAutoescolaActions';
import { useToast } from '@/hooks/use-toast';

interface NovoInstrutorModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NovoInstrutorModal({ open, onClose, onSuccess }: NovoInstrutorModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    categoria: 'B'
  });
  const [fotoPerfil, setFotoPerfil] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { criarInstrutor } = useAutoescolaActions();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.nome || !formData.email) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome e email do instrutor',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await criarInstrutor({
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        categoria: formData.categoria
      });

      toast({
        title: 'Instrutor adicionado!',
        description: `${formData.nome} foi adicionado à sua autoescola`
      });

      setFormData({ nome: '', email: '', telefone: '', categoria: 'B' });
      setFotoPerfil('');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar',
        description: error.message || 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Selecione uma imagem',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFotoPerfil(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  const getInitials = (name: string) => {
    if (!name) return 'IN';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-yellow-400" />
            Novo Instrutor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo Upload */}
          <div className="flex flex-col items-center">
            <label className="cursor-pointer group">
              <Avatar className="h-24 w-24 border-2 border-dashed border-zinc-700 group-hover:border-yellow-400 transition-colors">
                <AvatarImage src={fotoPerfil} alt="Foto" />
                <AvatarFallback className="bg-zinc-800 text-yellow-400 text-xl font-semibold">
                  {getInitials(formData.nome)}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoUpload}
                className="hidden"
              />
            </label>
            <p className="text-xs text-zinc-500 mt-2">Clique para adicionar foto</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-zinc-300">Nome Completo *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              placeholder="Nome do instrutor"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">E-mail *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 pl-10"
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="telefone" className="text-zinc-300">Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 pl-10"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="categoria" className="text-zinc-300">Categoria CNH</Label>
            <select
              id="categoria"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
            >
              <option value="A">A (Moto)</option>
              <option value="B">B (Carro)</option>
              <option value="AB">AB (Moto e Carro)</option>
              <option value="C">C (Caminhão)</option>
              <option value="D">D (Ônibus)</option>
              <option value="E">E (Carreta)</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-zinc-900 font-semibold"
            >
              {loading ? 'Salvando...' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
