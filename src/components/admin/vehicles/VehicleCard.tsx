import { useState } from 'react';
import { 
  MoreVertical, 
  Edit2, 
  DollarSign,
  Eye,
  EyeOff,
  Trash2,
  ImageIcon,
  Settings,
  Wind,
  Gauge,
  Accessibility,
  FileText,
  Palette,
  AlertTriangle
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
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
  total_bookings?: number;
  average_rating?: number;
}

interface VehicleCardProps {
  vehicle: VehicleData;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onManagePricing: () => void;
}

export function VehicleCard({ 
  vehicle, 
  onEdit, 
  onToggleStatus, 
  onDelete,
  onManagePricing 
}: VehicleCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const hasPrice = vehicle.pricing && vehicle.pricing.length > 0 && vehicle.pricing[0].single_class_price > 0;
  const pricing = hasPrice ? vehicle.pricing![0] : null;

  return (
    <div className="bg-card rounded-lg border border-border hover:shadow-md transition">
      
      {/* Imagem */}
      <div className="relative h-48 bg-muted rounded-t-lg overflow-hidden">
        {vehicle.main_photo_url ? (
          <img
            src={vehicle.main_photo_url}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageIcon className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        
        {/* Badge de status - improved visibility */}
        <div className="absolute top-3 left-3">
          {vehicle.is_active ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Ativo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Inativo
            </span>
          )}
        </div>
        
        {/* Menu de ações */}
        <div className="absolute top-3 right-3">
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button className="p-2 bg-background/90 backdrop-blur-sm rounded-lg hover:bg-background shadow-sm">
                <MoreVertical className="w-5 h-5 text-foreground" />
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => { onEdit(); setMenuOpen(false); }}>
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => { onManagePricing(); setMenuOpen(false); }}>
                <DollarSign className="w-4 h-4 mr-2" />
                Gerenciar Preços
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => { onToggleStatus(); setMenuOpen(false); }}>
                {vehicle.is_active ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => { onDelete(); setMenuOpen(false); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Galeria indicator */}
        {vehicle.additional_photos && vehicle.additional_photos.length > 0 && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-1 bg-black/60 text-white text-xs rounded flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              {vehicle.additional_photos.length + 1}
            </span>
          </div>
        )}
      </div>
      
      {/* Conteúdo */}
      <div className="p-5">
        
        {/* No pricing alert */}
        {!hasPrice && vehicle.is_active && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-lg mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs text-amber-500 font-medium">Sem valores definidos — este veículo não aparecerá para alunos</span>
          </div>
        )}
        
        {/* Título e categoria */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground mb-1">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground">{vehicle.year}</p>
          </div>
          
          <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full">
            Cat. {vehicle.license_category}
          </span>
        </div>
        
        {/* Características */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full flex items-center gap-1">
            <Settings className="w-3 h-3" />
            {vehicle.transmission === 'automatic' ? 'Automático' : 'Manual'}
          </span>
          
          {vehicle.has_air_conditioning && (
            <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full flex items-center gap-1">
              <Wind className="w-3 h-3" />
              Ar-condicionado
            </span>
          )}
          
          {vehicle.has_power_steering && (
            <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              Direção Hidráulica
            </span>
          )}
          
          {vehicle.is_adapted && (
            <span className="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs rounded-full flex items-center gap-1">
              <Accessibility className="w-3 h-3" />
              Adaptado
            </span>
          )}
        </div>
        
        {/* Placa e cor */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            {vehicle.license_plate}
          </span>
          {vehicle.color && (
            <span className="flex items-center gap-1">
              <Palette className="w-4 h-4" />
              {vehicle.color}
            </span>
          )}
        </div>
        
        <Separator className="my-4" />
        
        {/* Preços */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Aula avulsa</span>
            <span className="font-bold text-foreground">
              {pricing?.single_class_price 
                ? `R$ ${pricing.single_class_price.toFixed(2)}`
                : 'Não definido'
              }
            </span>
          </div>
          
          {pricing?.package_5_price && pricing.single_class_price && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pacote 5 aulas</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  R$ {pricing.package_5_price.toFixed(2)}
                </span>
                {(() => {
                  const discount = Math.round((1 - pricing.package_5_price! / (pricing.single_class_price * 5)) * 100);
                  if (discount > 0) {
                    const badgeColor = discount > 30 ? 'bg-red-500' : discount > 15 ? 'bg-orange-500' : 'bg-green-500';
                    return (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${badgeColor} text-white shadow-sm`}>
                        -{discount}%
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}
        </div>
        
        {/* Estatísticas */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">{vehicle.total_bookings || 0}</p>
            <p className="text-xs text-muted-foreground">Aulas realizadas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {vehicle.average_rating?.toFixed(1) || '0.0'}
            </p>
            <p className="text-xs text-muted-foreground">Avaliação média</p>
          </div>
        </div>
        
        {/* Ações rápidas */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted font-medium text-sm transition"
          >
            Editar
          </button>
          <button
            onClick={onManagePricing}
            className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium text-sm transition"
          >
            Preços
          </button>
        </div>
      </div>
    </div>
  );
}
