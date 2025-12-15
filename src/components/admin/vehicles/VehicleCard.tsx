import { 
  Car, 
  Settings, 
  MoreVertical, 
  Pencil, 
  ToggleLeft, 
  ToggleRight, 
  Trash2,
  DollarSign,
  Wind,
  Gauge,
  Accessibility,
  Camera
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  pricing?: {
    id: string;
    single_class_price: number;
    package_5_price: number | null;
    package_10_price: number | null;
    package_20_price: number | null;
  }[];
}

interface VehicleCardProps {
  vehicle: VehicleData;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onManagePricing: () => void;
}

const vehicleTypeLabels: Record<string, string> = {
  car: 'Carro',
  motorcycle: 'Moto',
  truck: 'Caminhão',
  bus: 'Ônibus',
};

const transmissionLabels: Record<string, string> = {
  manual: 'Manual',
  automatic: 'Automático',
};

export function VehicleCard({ 
  vehicle, 
  onEdit, 
  onToggleStatus, 
  onDelete,
  onManagePricing 
}: VehicleCardProps) {
  const hasPrice = vehicle.pricing && vehicle.pricing.length > 0;
  const price = hasPrice ? vehicle.pricing![0].single_class_price : null;
  const photosCount = (vehicle.additional_photos?.length || 0) + (vehicle.main_photo_url ? 1 : 0);

  return (
    <div className={`bg-card rounded-lg border overflow-hidden transition-all ${
      !vehicle.is_active ? 'opacity-60' : ''
    }`}>
      {/* Vehicle Image */}
      <div className="relative h-48 bg-muted">
        {vehicle.main_photo_url ? (
          <img 
            src={vehicle.main_photo_url} 
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={vehicle.is_active ? 'default' : 'secondary'}>
            {vehicle.is_active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
        
        {/* Category Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className="bg-background/90">
            Cat. {vehicle.license_category}
          </Badge>
        </div>
        
        {/* Photos Count */}
        {photosCount > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-background/90 rounded-full px-2 py-1 text-xs text-muted-foreground">
            <Camera className="w-3 h-3" />
            {photosCount}
          </div>
        )}
      </div>
      
      {/* Vehicle Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground">
              {vehicle.year} • {vehicle.license_plate} • {vehicle.color || 'Cor não informada'}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onManagePricing}>
                <DollarSign className="w-4 h-4 mr-2" />
                Gerenciar Preços
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleStatus}>
                {vehicle.is_active ? (
                  <>
                    <ToggleLeft className="w-4 h-4 mr-2" />
                    Desativar
                  </>
                ) : (
                  <>
                    <ToggleRight className="w-4 h-4 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="gap-1">
            <Settings className="w-3 h-3" />
            {transmissionLabels[vehicle.transmission] || vehicle.transmission}
          </Badge>
          
          <Badge variant="outline" className="gap-1">
            <Car className="w-3 h-3" />
            {vehicleTypeLabels[vehicle.vehicle_type] || vehicle.vehicle_type}
          </Badge>
          
          {vehicle.has_air_conditioning && (
            <Badge variant="outline" className="gap-1">
              <Wind className="w-3 h-3" />
              A/C
            </Badge>
          )}
          
          {vehicle.has_power_steering && (
            <Badge variant="outline" className="gap-1">
              <Gauge className="w-3 h-3" />
              Dir. Hidráulica
            </Badge>
          )}
          
          {vehicle.is_adapted && (
            <Badge variant="outline" className="gap-1 text-primary border-primary">
              <Accessibility className="w-3 h-3" />
              Adaptado
            </Badge>
          )}
        </div>
        
        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            {hasPrice ? (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">
                  R$ {price?.toFixed(0)}
                </span>
                <span className="text-sm text-muted-foreground">/aula</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                Preço não definido
              </span>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onManagePricing}
            className="gap-1"
          >
            <DollarSign className="w-4 h-4" />
            {hasPrice ? 'Ver Preços' : 'Definir Preço'}
          </Button>
        </div>
      </div>
    </div>
  );
}
