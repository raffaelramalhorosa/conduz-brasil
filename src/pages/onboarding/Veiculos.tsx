import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Plus,
  Car,
  Trash2,
  Upload,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { useOnboarding, OnboardingData } from '@/contexts/OnboardingContext';
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
import { useToast } from '@/hooks/use-toast';

type VehicleData = OnboardingData['vehicles'][0];

const categories = [
  { value: 'A', label: 'Categoria A (Moto)' },
  { value: 'B', label: 'Categoria B (Carro)' },
  { value: 'AB', label: 'Categoria AB' },
  { value: 'C', label: 'Categoria C' },
  { value: 'D', label: 'Categoria D' },
  { value: 'E', label: 'Categoria E' },
];

const vehicleTypes = [
  { value: 'car', label: 'Carro' },
  { value: 'motorcycle', label: 'Moto' },
  { value: 'truck', label: 'Caminhão' },
  { value: 'bus', label: 'Ônibus' },
];

const emptyVehicle: VehicleData = {
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  license_plate: '',
  color: '',
  vehicle_type: 'car',
  license_category: 'B',
  transmission: 'manual',
  has_air_conditioning: false,
  has_power_steering: false,
  is_adapted: false,
  main_photo: null,
  main_photo_url: null,
  pricing: {
    single_class_price: 0,
    package_5_price: null,
    package_10_price: null,
    package_20_price: null,
  },
};

const Veiculos = () => {
  const navigate = useNavigate();
  const { data, updateData, saveProgress, isSaving } = useOnboarding();
  const { toast } = useToast();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    data.vehicles.length === 0 ? null : 0
  );

  const addVehicle = () => {
    const newVehicles = [...data.vehicles, { ...emptyVehicle }];
    updateData({ vehicles: newVehicles });
    setExpandedIndex(newVehicles.length - 1);
  };

  const removeVehicle = (index: number) => {
    const newVehicles = data.vehicles.filter((_, i) => i !== index);
    updateData({ vehicles: newVehicles });
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const updateVehicle = (index: number, updates: Partial<VehicleData>) => {
    const newVehicles = data.vehicles.map((v, i) =>
      i === index ? { ...v, ...updates } : v
    );
    updateData({ vehicles: newVehicles });
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      updateVehicle(index, { main_photo: file, main_photo_url: URL.createObjectURL(file) });
    }
  };

  const validate = () => {
    if (data.vehicles.length === 0) {
      toast({
        title: 'Adicione pelo menos um veículo',
        variant: 'destructive',
      });
      return false;
    }

    for (let i = 0; i < data.vehicles.length; i++) {
      const vehicle = data.vehicles[i];
      if (!vehicle.brand || !vehicle.model || !vehicle.license_plate) {
        toast({
          title: `Preencha os dados obrigatórios do veículo ${i + 1}`,
          variant: 'destructive',
        });
        setExpandedIndex(i);
        return false;
      }
    }

    return true;
  };

  const handleNext = async () => {
    if (!validate()) return;

    await saveProgress();
    navigate('/onboarding-instrutor/precos');
  };

  return (
    <OnboardingLayout step={3}>
      <div className="bg-card rounded-xl border p-6 md:p-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Veículos</h2>
        <p className="text-muted-foreground mb-8">
          Cadastre os veículos disponíveis para suas aulas
        </p>

        {/* Lista de veículos */}
        <div className="space-y-4 mb-6">
          {data.vehicles.map((vehicle, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              {/* Header */}
              <div
                className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer"
                onClick={() =>
                  setExpandedIndex(expandedIndex === index ? null : index)
                }
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {vehicle.brand && vehicle.model
                        ? `${vehicle.brand} ${vehicle.model}`
                        : `Veículo ${index + 1}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cat. {vehicle.license_category} •{' '}
                      {vehicle.transmission === 'automatic' ? 'Automático' : 'Manual'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVehicle(index);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                  {expandedIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Content */}
              {expandedIndex === index && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Marca *</Label>
                      <Input
                        value={vehicle.brand}
                        onChange={(e) =>
                          updateVehicle(index, { brand: e.target.value })
                        }
                        placeholder="Ex: Chevrolet"
                      />
                    </div>
                    <div>
                      <Label>Modelo *</Label>
                      <Input
                        value={vehicle.model}
                        onChange={(e) =>
                          updateVehicle(index, { model: e.target.value })
                        }
                        placeholder="Ex: Onix"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Ano</Label>
                      <Input
                        type="number"
                        value={vehicle.year}
                        onChange={(e) =>
                          updateVehicle(index, { year: parseInt(e.target.value) })
                        }
                        min={1990}
                        max={new Date().getFullYear() + 1}
                      />
                    </div>
                    <div>
                      <Label>Placa *</Label>
                      <Input
                        value={vehicle.license_plate}
                        onChange={(e) =>
                          updateVehicle(index, {
                            license_plate: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="ABC1D23"
                        maxLength={7}
                      />
                    </div>
                    <div>
                      <Label>Cor</Label>
                      <Input
                        value={vehicle.color}
                        onChange={(e) =>
                          updateVehicle(index, { color: e.target.value })
                        }
                        placeholder="Branco"
                      />
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      <Select
                        value={vehicle.vehicle_type}
                        onValueChange={(value) =>
                          updateVehicle(index, { vehicle_type: value })
                        }
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Categoria</Label>
                      <Select
                        value={vehicle.license_category}
                        onValueChange={(value) =>
                          updateVehicle(index, { license_category: value })
                        }
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
                    <div>
                      <Label>Câmbio</Label>
                      <Select
                        value={vehicle.transmission}
                        onValueChange={(value) =>
                          updateVehicle(index, { transmission: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="automatic">Automático</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={vehicle.has_air_conditioning}
                        onCheckedChange={(checked) =>
                          updateVehicle(index, {
                            has_air_conditioning: checked as boolean,
                          })
                        }
                      />
                      <span className="text-sm">Ar-condicionado</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={vehicle.has_power_steering}
                        onCheckedChange={(checked) =>
                          updateVehicle(index, {
                            has_power_steering: checked as boolean,
                          })
                        }
                      />
                      <span className="text-sm">Direção Hidráulica</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={vehicle.is_adapted}
                        onCheckedChange={(checked) =>
                          updateVehicle(index, { is_adapted: checked as boolean })
                        }
                      />
                      <span className="text-sm">Adaptado (PCD)</span>
                    </label>
                  </div>

                  {/* Foto */}
                  <div>
                    <Label>Foto do Veículo</Label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition hover:border-primary/50 hover:bg-muted/50">
                      {vehicle.main_photo_url ? (
                        <div className="relative w-full h-full">
                          <img
                            src={vehicle.main_photo_url}
                            alt="Veículo"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg opacity-0 hover:opacity-100 transition">
                            <p className="text-white text-sm">Clique para trocar</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-4">
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Clique para enviar
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, index)}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Adicionar veículo */}
        <Button
          variant="outline"
          onClick={addVehicle}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Veículo
        </Button>

        {data.vehicles.length === 0 && (
          <div className="text-center py-8">
            <Car className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Você precisa cadastrar pelo menos um veículo para continuar
            </p>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/onboarding-instrutor/documentacao')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Button onClick={handleNext} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Continuar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default Veiculos;
