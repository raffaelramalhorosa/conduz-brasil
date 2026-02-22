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
  AlertTriangle,
  Car
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
  readOnly?: boolean;
  ownerName?: string;
  ownerPhoto?: string;
}

export function VehicleCard({ 
  vehicle, 
  onEdit, 
  onToggleStatus, 
  onDelete,
  onManagePricing,
  readOnly = false,
  ownerName,
  ownerPhoto,
}: VehicleCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const hasPrice = vehicle.pricing && vehicle.pricing.length > 0 && vehicle.pricing[0].single_class_price > 0;
  const pricing = hasPrice ? vehicle.pricing![0] : null;

  return (
    <div className="group overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/80 hover:from-card hover:to-muted/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
      
      {/* Image */}
      <div className="relative h-44 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
        {vehicle.main_photo_url ? (
          <img
            src={vehicle.main_photo_url}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-16 h-16 text-muted-foreground/40" />
          </div>
        )}
        
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          {vehicle.is_active ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-500/90 text-white backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Ativo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/90 text-white backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              Inativo
            </span>
          )}
        </div>
        
        {/* Action menu */}
        {!readOnly && (
          <div className="absolute top-3 left-3">
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button className="p-2 bg-background/80 backdrop-blur-sm rounded-lg hover:bg-background shadow-sm">
                  <MoreVertical className="w-4 h-4 text-foreground" />
                </button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="start" className="w-48">
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
        )}
        
        {/* Owner badge overlay for affiliated vehicles */}
        {readOnly && ownerName && (
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
              {ownerPhoto ? (
                <img src={ownerPhoto} alt={ownerName} className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[8px] font-bold">
                  {ownerName.charAt(0)}
                </div>
              )}
              <span className="text-[10px] text-white font-medium truncate max-w-[120px]">
                {ownerName}
              </span>
            </div>
          </div>
        )}

        {/* Gallery indicator */}
        {vehicle.additional_photos && vehicle.additional_photos.length > 0 && (
          <div className={`absolute bottom-3 ${readOnly && ownerName ? 'right-3' : 'left-3'}`}>
            <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              {vehicle.additional_photos.length + 1}
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        
        {/* No pricing alert */}
        {!hasPrice && vehicle.is_active && !readOnly && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[11px] text-amber-500 font-medium">Sem valores — não aparecerá para alunos</span>
          </div>
        )}
        
        {/* Title and category */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-base text-foreground">{vehicle.brand} {vehicle.model}</h3>
            <p className="text-sm text-muted-foreground">{vehicle.year}{vehicle.color ? ` • ${vehicle.color}` : ''}</p>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-xs font-semibold">
            Cat {vehicle.license_category}
          </span>
        </div>
        
        {/* Quick info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5" />
            {vehicle.transmission === 'automatic' ? 'Automático' : 'Manual'}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            {vehicle.license_plate}
          </span>
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap gap-1.5">
          {vehicle.has_air_conditioning && (
            <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] rounded-full flex items-center gap-1">
              <Wind className="w-3 h-3" /> A/C
            </span>
          )}
          {vehicle.has_power_steering && (
            <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] rounded-full flex items-center gap-1">
              <Settings className="w-3 h-3" /> D.H.
            </span>
          )}
          {vehicle.is_adapted && (
            <span className="px-2 py-0.5 bg-purple-500/15 text-purple-400 text-[10px] rounded-full flex items-center gap-1">
              <Accessibility className="w-3 h-3" /> Adaptado
            </span>
          )}
        </div>

        <Separator className="opacity-30" />
        
        {/* Price */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Aula avulsa</span>
          <span className="font-bold text-foreground">
            {pricing?.single_class_price 
              ? `R$ ${pricing.single_class_price.toFixed(2)}`
              : '—'
            }
          </span>
        </div>

        {pricing?.package_5_price && pricing.single_class_price && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pacote 5 aulas</span>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">
                R$ {pricing.package_5_price.toFixed(2)}
              </span>
              {(() => {
                const discount = Math.round((1 - pricing.package_5_price! / (pricing.single_class_price * 5)) * 100);
                return discount > 0 ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400">
                    -{discount}%
                  </span>
                ) : null;
              })()}
            </div>
          </div>
        )}
        
        {/* Actions for own vehicles */}
        {!readOnly && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={onEdit}
              className="flex-1 px-3 py-2 border border-border rounded-lg hover:bg-muted font-medium text-xs transition text-foreground"
            >
              Editar
            </button>
            <button
              onClick={onManagePricing}
              className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium text-xs transition"
            >
              Preços
            </button>
          </div>
        )}

        {/* Read-only footer */}
        {readOnly && (
          <p className="text-[11px] text-muted-foreground text-center italic pt-1">
            Gerenciado pelo instrutor
          </p>
        )}
      </div>
    </div>
  );
}
