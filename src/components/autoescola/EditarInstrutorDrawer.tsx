import { useState, useEffect } from 'react';
import { Save, Upload, Plus, Trash2, Clock, Car as CarIcon, User, Building2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useAutoescolaActions } from '@/hooks/useAutoescolaActions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Instrutor, Veiculo } from '@/hooks/useAutoescolaData';

interface VehicleOption {
  id: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  license_category: string;
  main_photo_url: string | null;
  owner: 'autoescola' | 'instrutor';
}

interface EditarInstrutorDrawerProps {
  instrutor: Instrutor;
  veiculos: Veiculo[];
  onClose: () => void;
  onSuccess?: () => void;
  schoolProfileId?: string | null;
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
  onSuccess,
  schoolProfileId,
}: EditarInstrutorDrawerProps) {
  const [formData, setFormData] = useState({ ...instrutor });
  const [fotoPerfil, setFotoPerfil] = useState(instrutor.fotoPerfil || '');
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    instrutor.categoria ? instrutor.categoria.split('/').filter(c => LICENSE_CATEGORIES.includes(c)) : ['B']
  );
  const [allVehicleOptions, setAllVehicleOptions] = useState<VehicleOption[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingLinkedData, setLoadingLinkedData] = useState(false);
  const { atualizarInstrutor } = useAutoescolaActions();
  const { toast } = useToast();

  // Fetch linked account data for affiliated instructors
  useEffect(() => {
    if (instrutor.linkedUserId && instrutor.isAccountLinked) {
      setLoadingLinkedData(true);
      Promise.all([
        supabase
          .from('profiles')
          .select('phone, avatar_url')
          .eq('id', instrutor.linkedUserId)
          .maybeSingle(),
        supabase
          .from('instructor_profiles')
          .select('cnh_number, bio')
          .eq('user_id', instrutor.linkedUserId)
          .maybeSingle(),
      ]).then(([profileRes, instrRes]) => {
        const linkedPhone = profileRes.data?.phone || '';
        const linkedAvatar = profileRes.data?.avatar_url || '';
        const linkedCnh = instrRes.data?.cnh_number || '';
        const linkedBio = instrRes.data?.bio || '';

        // Fill empty fields with linked data
        setFormData(prev => ({
          ...prev,
          telefone: prev.telefone || linkedPhone,
          documentos: {
            ...prev.documentos,
            cnh: prev.documentos.cnh || linkedCnh,
          },
        }));
        if (!fotoPerfil) {
          setFotoPerfil(linkedAvatar);
        }
      }).finally(() => setLoadingLinkedData(false));
    }
  }, [instrutor.linkedUserId, instrutor.isAccountLinked]);

  // Fetch all available vehicles (school + instructor's own)
  useEffect(() => {
    fetchAllVehicles();
  }, [instrutor.linkedUserId, schoolProfileId]);

  async function fetchAllVehicles() {
    setLoadingVehicles(true);
    try {
      const options: VehicleOption[] = [];

      // School vehicles
      if (schoolProfileId) {
        const { data: schoolVehicles } = await supabase
          .from('vehicles')
          .select('id, brand, model, year, license_plate, license_category, main_photo_url')
          .eq('instructor_id', schoolProfileId)
          .eq('is_active', true);

        if (schoolVehicles) {
          options.push(...schoolVehicles.map(v => ({ ...v, owner: 'autoescola' as const })));
        }
      }

      // Instructor's own vehicles (if linked)
      if (instrutor.linkedUserId) {
        const { data: instrProfile } = await supabase
          .from('instructor_profiles')
          .select('id')
          .eq('user_id', instrutor.linkedUserId)
          .maybeSingle();

        if (instrProfile) {
          const { data: instrVehicles } = await supabase
            .from('vehicles')
            .select('id, brand, model, year, license_plate, license_category, main_photo_url')
            .eq('instructor_id', instrProfile.id)
            .eq('is_active', true);

          if (instrVehicles) {
            options.push(...instrVehicles.map(v => ({ ...v, owner: 'instrutor' as const })));
          }
        }
      }

      setAllVehicleOptions(options);
    } catch (err) {
      console.error('Error fetching vehicles for assignment:', err);
    } finally {
      setLoadingVehicles(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      await atualizarInstrutor(formData.id, {
        ...formData,
        fotoPerfil,
        categoria: selectedCategories.join('/'),
      });

      // Notify linked instructor about profile changes
      if (instrutor.linkedUserId && instrutor.isAccountLinked) {
        try {
          const changedFields: string[] = [];
          if (formData.nome !== instrutor.nome) changedFields.push('nome');
          if (formData.telefone !== instrutor.telefone) changedFields.push('telefone');
          if (fotoPerfil !== (instrutor.fotoPerfil || '')) changedFields.push('foto');
          if (selectedCategories.join('/') !== instrutor.categoria) changedFields.push('categorias');
          if (JSON.stringify(formData.veiculosVinculados) !== JSON.stringify(instrutor.veiculosVinculados)) changedFields.push('veículos atribuídos');
          if ((formData as any).comissao !== (instrutor as any).comissao) changedFields.push('taxa de comissão');

          if (changedFields.length > 0) {
            const { error: notifError } = await supabase.from('notifications').insert({
              user_id: instrutor.linkedUserId,
              type: 'profile_edited_by_school',
              title: 'Perfil editado pela autoescola',
              message: `A autoescola atualizou seu perfil de filiado. Campos: ${changedFields.join(', ')}.`,
              action_url: '/dashboard',
            });
            if (notifError) {
              console.error('Erro ao notificar instrutor (perfil):', notifError);
            }
          }
        } catch (notifyErr) {
          console.error('Falha na notificação de edição de perfil:', notifyErr);
        }
      }

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

  // Use allVehicleOptions if available, fallback to legacy veiculos prop
  const vehicleList = allVehicleOptions.length > 0 ? allVehicleOptions : veiculos.map(v => ({
    id: v.id,
    brand: v.modelo.split(' ')[0] || v.modelo,
    model: v.modelo.split(' ').slice(1).join(' ') || '',
    year: v.ano,
    license_plate: v.placa,
    license_category: v.categoria,
    main_photo_url: v.foto || null,
    owner: 'autoescola' as const,
  }));

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
                    Selecione quais veículos este instrutor pode usar para dar aulas.
                  </p>
                </div>

                {loadingVehicles ? (
                  <div className="text-center py-12 text-zinc-400 text-sm">Carregando veículos...</div>
                ) : vehicleList.length === 0 ? (
                  <div className="text-center py-12 bg-zinc-800/30 rounded-lg">
                    <CarIcon className="h-12 w-12 mx-auto text-zinc-600 mb-3" />
                    <p className="text-zinc-400 mb-4">Nenhum veículo disponível</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vehicleList.map(vehicle => {
                      const isVinculado = formData.veiculosVinculados?.includes(vehicle.id);
                      const displayName = 'brand' in vehicle ? `${vehicle.brand} ${vehicle.model}` : '';
                      
                      return (
                        <div
                          key={vehicle.id}
                          onClick={() => {
                            const newVeiculos = isVinculado
                              ? formData.veiculosVinculados.filter(id => id !== vehicle.id)
                              : [...(formData.veiculosVinculados || []), vehicle.id];
                            
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
                          {vehicle.main_photo_url ? (
                            <img src={vehicle.main_photo_url} alt={displayName} className="h-12 w-16 object-cover rounded" />
                          ) : (
                            <div className="h-12 w-16 bg-zinc-700 rounded flex items-center justify-center">
                              <CarIcon className="h-6 w-6 text-zinc-500" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-white">{displayName} ({vehicle.year})</p>
                            <p className="text-sm text-zinc-400">
                              {vehicle.license_plate} • Cat {vehicle.license_category}
                            </p>
                          </div>
                          <Badge variant="outline" className={`text-xs ${vehicle.owner === 'autoescola' ? 'border-blue-400/50 text-blue-400' : 'border-green-400/50 text-green-400'}`}>
                            {vehicle.owner === 'autoescola' ? '🏢 Autoescola' : '👤 Instrutor'}
                          </Badge>
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
