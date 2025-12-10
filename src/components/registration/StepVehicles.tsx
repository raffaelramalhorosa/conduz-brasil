import { useState } from 'react';
import { Plus, Trash2, Car, ChevronDown, ChevronUp } from 'lucide-react';
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
import { FileUploadArea } from './FileUploadArea';
import { RegistrationData, Vehicle } from '@/hooks/useRegistrationForm';
import { cn } from '@/lib/utils';

interface StepVehiclesProps {
  data: RegistrationData;
  onChange: (data: Partial<RegistrationData>) => void;
  errors: Record<string, string>;
}

const categories = [
  { value: 'A', label: 'Categoria A - Moto' },
  { value: 'B', label: 'Categoria B - Carro' },
  { value: 'C', label: 'Categoria C - Caminhão' },
  { value: 'D', label: 'Categoria D - Ônibus' },
  { value: 'E', label: 'Categoria E - Carreta' },
];

const features = [
  { id: 'ac', label: 'Ar-condicionado' },
  { id: 'automatic', label: 'Câmbio Automático' },
  { id: 'adapted', label: 'Carro Adaptado' },
  { id: 'abs', label: 'Freios ABS' },
  { id: 'camera', label: 'Câmera de ré' },
];

export function StepVehicles({ data, onChange, errors }: StepVehiclesProps) {
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(data.vehicles.length === 0);

  const addVehicle = () => {
    const newVehicle: Vehicle = {
      id: Date.now().toString(),
      brand: '',
      model: '',
      year: '',
      plate: '',
      category: '',
      features: [],
      photos: [],
    };
    onChange({ vehicles: [...data.vehicles, newVehicle] });
    setExpandedVehicle(newVehicle.id);
    setIsAddingNew(false);
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    onChange({
      vehicles: data.vehicles.map((v) =>
        v.id === id ? { ...v, ...updates } : v
      ),
    });
  };

  const removeVehicle = (id: string) => {
    onChange({
      vehicles: data.vehicles.filter((v) => v.id !== id),
    });
  };

  const toggleFeature = (vehicleId: string, featureId: string) => {
    const vehicle = data.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    const hasFeature = vehicle.features.includes(featureId);
    updateVehicle(vehicleId, {
      features: hasFeature
        ? vehicle.features.filter((f) => f !== featureId)
        : [...vehicle.features, featureId],
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Cadastre os veículos que utilizará
        </h2>
        <p className="text-muted-foreground">
          Adicione pelo menos um veículo para suas aulas
        </p>
      </div>

      {errors.vehicles && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">{errors.vehicles}</p>
        </div>
      )}

      <div className="space-y-4">
        {data.vehicles.map((vehicle, index) => (
          <div
            key={vehicle.id}
            className="border border-border rounded-lg overflow-hidden"
          >
            <button
              type="button"
              onClick={() =>
                setExpandedVehicle(
                  expandedVehicle === vehicle.id ? null : vehicle.id
                )
              }
              className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {vehicle.brand && vehicle.model
                    ? `${vehicle.brand} ${vehicle.model}`
                    : `Veículo ${index + 1}`}
                </span>
                {vehicle.category && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    CAT {vehicle.category}
                  </span>
                )}
              </div>
              {expandedVehicle === vehicle.id ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {expandedVehicle === vehicle.id && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Marca</Label>
                    <Input
                      value={vehicle.brand}
                      onChange={(e) =>
                        updateVehicle(vehicle.id, { brand: e.target.value })
                      }
                      placeholder="Honda, Toyota, Volkswagen..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Input
                      value={vehicle.model}
                      onChange={(e) =>
                        updateVehicle(vehicle.id, { model: e.target.value })
                      }
                      placeholder="Civic, Corolla, Golf..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ano</Label>
                    <Input
                      value={vehicle.year}
                      onChange={(e) =>
                        updateVehicle(vehicle.id, {
                          year: e.target.value.replace(/\D/g, '').slice(0, 4),
                        })
                      }
                      placeholder="2024"
                      maxLength={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Placa</Label>
                    <Input
                      value={vehicle.plate}
                      onChange={(e) =>
                        updateVehicle(vehicle.id, {
                          plate: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="ABC1D23"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={vehicle.category}
                    onValueChange={(value) =>
                      updateVehicle(vehicle.id, { category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
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

                <div className="space-y-3">
                  <Label>Características</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {features.map((feature) => (
                      <label
                        key={feature.id}
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all',
                          vehicle.features.includes(feature.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <Checkbox
                          checked={vehicle.features.includes(feature.id)}
                          onCheckedChange={() =>
                            toggleFeature(vehicle.id, feature.id)
                          }
                        />
                        <span className="text-sm">{feature.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <FileUploadArea
                  label="Fotos do veículo (até 5)"
                  accept="image/*"
                  multiple
                  maxFiles={5}
                  value={vehicle.photos}
                  onChange={(files) =>
                    updateVehicle(vehicle.id, { photos: files as File[] })
                  }
                />

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeVehicle(vehicle.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover veículo
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addVehicle}
          className="w-full h-16 border-dashed border-2"
        >
          <Plus className="w-5 h-5 mr-2" />
          Adicionar Veículo
        </Button>
      </div>
    </div>
  );
}
