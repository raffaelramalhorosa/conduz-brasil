import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { Loader2, Upload, X } from 'lucide-react';

interface VehicleData {
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
  is_active: boolean;
  main_photo_url: string | null;
  additional_photos: string[] | null;
  crlv_url: string | null;
  instructor_id: string;
}

interface VehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleData | null;
  instructorId: string | null;
  onSaved: () => void;
}

const vehicleTypes = [
  { value: 'car', label: 'Carro' },
  { value: 'motorcycle', label: 'Moto' },
  { value: 'truck', label: 'Caminhão' },
  { value: 'bus', label: 'Ônibus' },
];

const categories = [
  { value: 'A', label: 'A - Moto' },
  { value: 'B', label: 'B - Carro' },
  { value: 'AB', label: 'AB - Moto e Carro' },
  { value: 'C', label: 'C - Caminhão' },
  { value: 'D', label: 'D - Ônibus' },
  { value: 'E', label: 'E - Carreta' },
];

const transmissions = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automático' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

export function VehicleModal({ 
  open, 
  onOpenChange, 
  vehicle, 
  instructorId,
  onSaved 
}: VehicleModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: currentYear,
    license_plate: '',
    vehicle_type: 'car',
    license_category: 'B',
    transmission: 'manual',
    color: '',
    has_air_conditioning: false,
    has_power_steering: false,
    is_adapted: false,
    adaptation_type: '',
  });

  useEffect(() => {
    if (vehicle) {
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
      setFormData({
        brand: '',
        model: '',
        year: currentYear,
        license_plate: '',
        vehicle_type: 'car',
        license_category: 'B',
        transmission: 'manual',
        color: '',
        has_air_conditioning: false,
        has_power_steering: false,
        is_adapted: false,
        adaptation_type: '',
      });
    }
  }, [vehicle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!instructorId) {
      toast({
        title: 'Erro',
        description: 'Instrutor não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.brand || !formData.model || !formData.license_plate) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const vehicleData = {
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
        instructor_id: instructorId,
      };

      if (vehicle) {
        // Update existing vehicle
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', vehicle.id);
        
        if (error) throw error;
        
        toast({
          title: 'Veículo atualizado',
          description: 'As alterações foram salvas com sucesso.',
        });
      } else {
        // Create new vehicle
        const { error } = await supabase
          .from('vehicles')
          .insert(vehicleData);
        
        if (error) throw error;
        
        toast({
          title: 'Veículo adicionado',
          description: 'O veículo foi cadastrado com sucesso.',
        });
      }
      
      onSaved();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o veículo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!vehicle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Veículo' : 'Adicionar Veículo'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Marca *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="Ex: Volkswagen"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model">Modelo *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="Ex: Gol"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Ano *</Label>
              <Select 
                value={String(formData.year)} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, year: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="license_plate">Placa *</Label>
              <Input
                id="license_plate"
                value={formData.license_plate}
                onChange={(e) => setFormData(prev => ({ ...prev, license_plate: e.target.value.toUpperCase() }))}
                placeholder="ABC-1234"
                maxLength={8}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="Ex: Branco"
              />
            </div>
          </div>
          
          {/* Vehicle Type and Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Veículo *</Label>
              <Select 
                value={formData.vehicle_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Categoria CNH *</Label>
              <Select 
                value={formData.license_category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, license_category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Câmbio *</Label>
              <Select 
                value={formData.transmission} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, transmission: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transmissions.map((trans) => (
                    <SelectItem key={trans.value} value={trans.value}>
                      {trans.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Features */}
          <div className="space-y-4">
            <Label>Características</Label>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_air_conditioning"
                  checked={formData.has_air_conditioning}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, has_air_conditioning: checked === true }))
                  }
                />
                <label htmlFor="has_air_conditioning" className="text-sm cursor-pointer">
                  Ar Condicionado
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_power_steering"
                  checked={formData.has_power_steering}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, has_power_steering: checked === true }))
                  }
                />
                <label htmlFor="has_power_steering" className="text-sm cursor-pointer">
                  Direção Hidráulica
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_adapted"
                  checked={formData.is_adapted}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_adapted: checked === true }))
                  }
                />
                <label htmlFor="is_adapted" className="text-sm cursor-pointer">
                  Veículo Adaptado (PCD)
                </label>
              </div>
            </div>
            
            {formData.is_adapted && (
              <div className="space-y-2">
                <Label htmlFor="adaptation_type">Tipo de Adaptação</Label>
                <Input
                  id="adaptation_type"
                  value={formData.adaptation_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, adaptation_type: e.target.value }))}
                  placeholder="Ex: Acelerador e freio manual"
                />
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEditing ? 'Salvar Alterações' : 'Adicionar Veículo'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
