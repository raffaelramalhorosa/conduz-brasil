import { useState } from 'react';
import { Save, Upload, Plus, Trash2, Clock, Car as CarIcon, User } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAutoescolaActions } from '@/hooks/useAutoescolaActions';
import { useToast } from '@/hooks/use-toast';
import type { Instrutor, Veiculo } from '@/hooks/useAutoescolaData';

interface EditarInstrutorDrawerProps {
  instrutor: Instrutor;
  veiculos: Veiculo[];
  onClose: () => void;
  onSuccess?: () => void;
}

const diasNomes: Record<string, string> = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado',
  domingo: 'Domingo'
};

const LICENSE_CATEGORIES = ['A', 'B', 'C', 'D', 'E'];

export function EditarInstrutorDrawer({ 
  instrutor, 
  veiculos, 
  onClose,
  onSuccess 
}: EditarInstrutorDrawerProps) {
  const [formData, setFormData] = useState({ ...instrutor });
  const [fotoPerfil, setFotoPerfil] = useState(instrutor.fotoPerfil || '');
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    instrutor.categoria ? instrutor.categoria.split('/').filter(c => LICENSE_CATEGORIES.includes(c)) : ['B']
  );
  const { atualizarInstrutor } = useAutoescolaActions();
  const { toast } = useToast();

  async function handleSave() {
    setLoading(true);
    try {
      await atualizarInstrutor(formData.id, {
        ...formData,
        fotoPerfil,
        categoria: selectedCategories.join('/'),
      });

      toast({
        title: 'Instrutor atualizado!',
        description: 'As alterações foram salvas com sucesso'
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  function handleFotoUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Use apenas imagens',
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

  function handleDiaChange(dia: string, config: { ativo: boolean; periodos: { inicio: string; fim: string }[] }) {
    setFormData({
      ...formData,
      horarios: {
        ...formData.horarios,
        [dia]: config
      }
    });
  }

  function adicionarPeriodo(dia: string) {
    const config = formData.horarios[dia];
    handleDiaChange(dia, {
      ...config,
      periodos: [...config.periodos, { inicio: '08:00', fim: '12:00' }]
    });
  }

  function removerPeriodo(dia: string, index: number) {
    const config = formData.horarios[dia];
    handleDiaChange(dia, {
      ...config,
      periodos: config.periodos.filter((_, i) => i !== index)
    });
  }

  function atualizarPeriodo(dia: string, index: number, campo: 'inicio' | 'fim', valor: string) {
    const config = formData.horarios[dia];
    const newPeriodos = [...config.periodos];
    newPeriodos[index] = { ...newPeriodos[index], [campo]: valor };
    handleDiaChange(dia, { ...config, periodos: newPeriodos });
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-xl bg-zinc-900 border-zinc-800 text-white p-0 flex flex-col max-h-screen"
      >
        <SheetHeader className="p-6 border-b border-zinc-800 shrink-0">
          <SheetTitle className="text-xl font-bold text-white">
            Editar Instrutor
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="perfil" className="flex flex-col">
            <TabsList className="mx-6 mt-4 bg-zinc-800 border border-zinc-700 shrink-0">
              <TabsTrigger value="perfil" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-zinc-900">
                <User className="h-4 w-4 mr-2" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="veiculos" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-zinc-900">
                <CarIcon className="h-4 w-4 mr-2" />
                Veículos
              </TabsTrigger>
              <TabsTrigger value="horarios" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-zinc-900">
                <Clock className="h-4 w-4 mr-2" />
                Horários
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              {/* TAB 1: PERFIL */}
              <TabsContent value="perfil" className="mt-0 space-y-6">
                {/* Profile Photo */}
                <div className="flex flex-col items-center">
                  <label className="cursor-pointer group">
                    <Avatar className="h-28 w-28 border-2 border-dashed border-zinc-700 group-hover:border-yellow-400 transition-colors">
                      <AvatarImage src={fotoPerfil} alt={formData.nome} />
                      <AvatarFallback className="bg-zinc-800 text-yellow-400 text-2xl font-semibold">
                        {getInitials(formData.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFotoUpload(file);
                      }}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-zinc-500 mt-2">Clique para alterar a foto</p>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-zinc-300">Nome Completo</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                {/* Email (readonly) */}
                <div className="space-y-2">
                  <Label className="text-zinc-300">E-mail</Label>
                  <Input
                    value={formData.email}
                    disabled
                    className="bg-zinc-800/50 border-zinc-700 text-zinc-500"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label className="text-zinc-300">Telefone</Label>
                  <Input
                    value={formData.telefone || ''}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                {/* CNH */}
                <div className="space-y-2">
                  <Label className="text-zinc-300">Número da CNH</Label>
                  <Input
                    value={formData.documentos.cnh || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      documentos: { ...formData.documentos, cnh: e.target.value }
                    })}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                {/* Category - Multiple Checkboxes */}
                <div className="space-y-2">
                  <Label className="text-zinc-300">Categorias de habilitação</Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {LICENSE_CATEGORIES.map((cat) => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedCategories.includes(cat)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCategories([...selectedCategories, cat]);
                            } else {
                              setSelectedCategories(selectedCategories.filter(c => c !== cat));
                            }
                          }}
                          className="data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400"
                        />
                        <span className="font-medium text-zinc-300">Cat {cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: VEÍCULOS */}
              <TabsContent value="veiculos" className="mt-0 space-y-4">
                <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-zinc-400">
                    Selecione os veículos que este instrutor pode utilizar
                  </p>
                </div>

                {veiculos.length === 0 ? (
                  <div className="text-center py-12 bg-zinc-800/30 rounded-lg">
                    <CarIcon className="h-12 w-12 mx-auto text-zinc-600 mb-3" />
                    <p className="text-zinc-400 mb-4">Nenhum veículo cadastrado</p>
                    <Button variant="outline" className="border-yellow-400 text-yellow-400 hover:bg-yellow-400/10">
                      Cadastrar veículo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {veiculos.map(veiculo => {
                      const isVinculado = formData.veiculosVinculados?.includes(veiculo.id);
                      
                      return (
                        <div
                          key={veiculo.id}
                          onClick={() => {
                            const newVeiculos = isVinculado
                              ? formData.veiculosVinculados.filter(id => id !== veiculo.id)
                              : [...(formData.veiculosVinculados || []), veiculo.id];
                            
                            setFormData({
                              ...formData,
                              veiculosVinculados: newVeiculos
                            });
                          }}
                          className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all border ${
                            isVinculado 
                              ? 'bg-yellow-400/10 border-yellow-400/50' 
                              : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                          }`}
                        >
                          <Checkbox 
                            checked={isVinculado}
                            className="data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400"
                          />
                          {veiculo.foto ? (
                            <img src={veiculo.foto} alt={veiculo.modelo} className="h-12 w-16 object-cover rounded" />
                          ) : (
                            <div className="h-12 w-16 bg-zinc-700 rounded flex items-center justify-center">
                              <CarIcon className="h-6 w-6 text-zinc-500" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-white">{veiculo.modelo}</p>
                            <p className="text-sm text-zinc-400">
                              {veiculo.placa} • {veiculo.ano} • {veiculo.cor}
                            </p>
                          </div>
                          <span className="text-xs bg-zinc-700 px-2 py-1 rounded text-zinc-300">
                            Cat. {veiculo.categoria}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* TAB 3: HORÁRIOS */}
              <TabsContent value="horarios" className="mt-0 space-y-4">
                <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-zinc-400">
                    Configure os horários em que o instrutor está disponível para aulas
                  </p>
                </div>

                {Object.entries(formData.horarios).map(([dia, config]) => (
                  <div key={dia} className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={config.ativo}
                          onCheckedChange={(checked) => handleDiaChange(dia, { ...config, ativo: checked })}
                          className="data-[state=checked]:bg-yellow-400"
                        />
                        <span className={`font-medium ${config.ativo ? 'text-white' : 'text-zinc-500'}`}>
                          {diasNomes[dia]}
                        </span>
                      </div>

                      {config.ativo && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => adicionarPeriodo(dia)}
                          className="text-yellow-400 hover:bg-yellow-400/10"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Período
                        </Button>
                      )}
                    </div>

                    {config.ativo && config.periodos.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {config.periodos.map((periodo, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={periodo.inicio}
                              onChange={(e) => atualizarPeriodo(dia, index, 'inicio', e.target.value)}
                              className="bg-zinc-900 border-zinc-700 text-white w-28"
                            />
                            <span className="text-zinc-500">até</span>
                            <Input
                              type="time"
                              value={periodo.fim}
                              onChange={(e) => atualizarPeriodo(dia, index, 'fim', e.target.value)}
                              className="bg-zinc-900 border-zinc-700 text-white w-28"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removerPeriodo(dia, index)}
                              className="text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {config.ativo && config.periodos.length === 0 && (
                      <p className="text-sm text-zinc-600 italic">Nenhum período configurado</p>
                    )}
                  </div>
                ))}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Sticky Action Buttons */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900 flex gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-zinc-900 font-semibold"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
