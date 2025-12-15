import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Plus,
  Car,
  Bike,
  Truck,
  Edit,
  Trash2,
  Snowflake,
  Cog,
  Accessibility,
  CheckCircle,
} from 'lucide-react';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  vehicle_type: string;
  license_category: string;
  transmission: string;
  color: string | null;
  has_air_conditioning: boolean;
  has_power_steering: boolean;
  is_adapted: boolean;
  adaptation_type: string | null;
  main_photo_url: string | null;
  is_active: boolean;
}

const vehicleTypeOptions = [
  { value: 'car', label: 'Carro' },
  { value: 'motorcycle', label: 'Moto' },
  { value: 'truck', label: 'Caminhão' },
];

const categoryOptions = [
  { value: 'A', label: 'Categoria A (Moto)' },
  { value: 'B', label: 'Categoria B (Carro)' },
  { value: 'AB', label: 'Categoria AB' },
  { value: 'C', label: 'Categoria C (Caminhão)' },
  { value: 'D', label: 'Categoria D (Ônibus)' },
  { value: 'E', label: 'Categoria E (Carreta)' },
];

const transmissionOptions = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automático' },
];

const defaultVehicle = {
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  license_plate: '',
  vehicle_type: 'car',
  license_category: 'B',
  transmission: 'manual',
  color: '',
  has_air_conditioning: false,
  has_power_steering: false,
  is_adapted: false,
  adaptation_type: '',
};

export default function AdminVehicles() {
  const { profile } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState(defaultVehicle);
  const [instructorId, setInstructorId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchInstructorId();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (instructorId) {
      fetchVehicles();
    }
  }, [instructorId]);

  const fetchInstructorId = async () => {
    try {
      const { data, error } = await supabase
        .from('instructor_profiles')
        .select('id')
        .eq('user_id', profile?.id)
        .single();

      if (error) throw error;
      setInstructorId(data.id);
    } catch (error) {
      console.error('Error fetching instructor ID:', error);
      toast.error('Erro ao carregar dados do instrutor');
    }
  };

  const fetchVehicles = async () => {
    if (!instructorId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('instructor_id', instructorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Erro ao carregar veículos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        license_plate: vehicle.license_plate,
        vehicle_type: vehicle.vehicle_type,
        license_category: vehicle.license_category,
        transmission: vehicle.transmission,
        color: vehicle.color || '',
        has_air_conditioning: vehicle.has_air_conditioning,
        has_power_steering: vehicle.has_power_steering,
        is_adapted: vehicle.is_adapted,
        adaptation_type: vehicle.adaptation_type || '',
      });
    } else {
      setEditingVehicle(null);
      setFormData(defaultVehicle);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!instructorId) return;
    if (!formData.brand || !formData.model || !formData.license_plate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      const vehicleData = {
        instructor_id: instructorId,
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        license_plate: formData.license_plate.toUpperCase(),
        vehicle_type: formData.vehicle_type,
        license_category: formData.license_category,
        transmission: formData.transmission,
        color: formData.color || null,
        has_air_conditioning: formData.has_air_conditioning,
        has_power_steering: formData.has_power_steering,
        is_adapted: formData.is_adapted,
        adaptation_type: formData.is_adapted ? formData.adaptation_type : null,
      };

      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', editingVehicle.id);

        if (error) throw error;
        toast.success('Veículo atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert(vehicleData);

        if (error) throw error;
        toast.success('Veículo adicionado com sucesso');
      }

      setIsDialogOpen(false);
      fetchVehicles();
    } catch (error: any) {
      console.error('Error saving vehicle:', error);
      toast.error(error.message || 'Erro ao salvar veículo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleToDelete);

      if (error) throw error;
      toast.success('Veículo removido com sucesso');
      setIsDeleteDialogOpen(false);
      setVehicleToDelete(null);
      fetchVehicles();
    } catch (error: any) {
      console.error('Error deleting vehicle:', error);
      toast.error(error.message || 'Erro ao remover veículo');
    }
  };

  const handleToggleActive = async (vehicle: Vehicle) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ is_active: !vehicle.is_active })
        .eq('id', vehicle.id);

      if (error) throw error;
      toast.success(vehicle.is_active ? 'Veículo desativado' : 'Veículo ativado');
      fetchVehicles();
    } catch (error: any) {
      console.error('Error toggling vehicle:', error);
      toast.error(error.message || 'Erro ao alterar status');
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'motorcycle':
        return <Bike className="h-8 w-8" />;
      case 'truck':
        return <Truck className="h-8 w-8" />;
      default:
        return <Car className="h-8 w-8" />;
    }
  };

  return (
    <div>
      <AdminHeader title="Meus Veículos" />

      <div className="p-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Gerencie os veículos disponíveis para suas aulas
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Veículo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca *</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Ex: Volkswagen"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo *</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="Ex: Gol"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Ano *</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      min={1990}
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_plate">Placa *</Label>
                    <Input
                      id="license_plate"
                      value={formData.license_plate}
                      onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                      placeholder="ABC1D23"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Veículo</Label>
                    <Select
                      value={formData.vehicle_type}
                      onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleTypeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria CNH</Label>
                    <Select
                      value={formData.license_category}
                      onValueChange={(value) => setFormData({ ...formData, license_category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Transmissão</Label>
                    <Select
                      value={formData.transmission}
                      onValueChange={(value) => setFormData({ ...formData, transmission: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {transmissionOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Cor</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="Ex: Prata"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Características</Label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="air"
                        checked={formData.has_air_conditioning}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, has_air_conditioning: checked as boolean })
                        }
                      />
                      <label htmlFor="air" className="text-sm cursor-pointer">
                        Ar Condicionado
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="steering"
                        checked={formData.has_power_steering}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, has_power_steering: checked as boolean })
                        }
                      />
                      <label htmlFor="steering" className="text-sm cursor-pointer">
                        Direção Hidráulica
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="adapted"
                      checked={formData.is_adapted}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_adapted: checked as boolean })
                      }
                    />
                    <label htmlFor="adapted" className="text-sm cursor-pointer font-medium">
                      Veículo Adaptado (PCD)
                    </label>
                  </div>
                  {formData.is_adapted && (
                    <div className="space-y-2 ml-6">
                      <Label htmlFor="adaptation">Tipo de Adaptação</Label>
                      <Input
                        id="adaptation"
                        value={formData.adaptation_type}
                        onChange={(e) => setFormData({ ...formData, adaptation_type: e.target.value })}
                        placeholder="Ex: Acelerador e freio manual"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Vehicles Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-12 w-12 rounded-full mb-4" />
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Car className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Nenhum veículo cadastrado
              </h2>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Adicione seu primeiro veículo para poder oferecer aulas.
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Veículo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <Card
                key={vehicle.id}
                className={`relative ${!vehicle.is_active ? 'opacity-60' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {getVehicleIcon(vehicle.vehicle_type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {vehicle.brand} {vehicle.model}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.year} • {vehicle.license_plate}
                        </p>
                      </div>
                    </div>
                    {vehicle.is_active ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline">CAT {vehicle.license_category}</Badge>
                    <Badge variant="outline">
                      {vehicle.transmission === 'automatic' ? 'Automático' : 'Manual'}
                    </Badge>
                    {vehicle.color && (
                      <Badge variant="outline">{vehicle.color}</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {vehicle.has_air_conditioning && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Snowflake className="h-3 w-3" />
                        <span>A/C</span>
                      </div>
                    )}
                    {vehicle.has_power_steering && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Cog className="h-3 w-3" />
                        <span>D.H.</span>
                      </div>
                    )}
                    {vehicle.is_adapted && (
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <Accessibility className="h-3 w-3" />
                        <span>PCD</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenDialog(vehicle)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(vehicle)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setVehicleToDelete(vehicle.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Veículo</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este veículo? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
