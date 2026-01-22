import { X, Star, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    providerTypes: string[];
    priceRange: [number, number];
    minRating: number;
    availability: string[];
    vehicleTypes: string[];
    features: string[];
  };
  setFilters: (filters: FilterSidebarProps["filters"]) => void;
  onApply: () => void;
  onClear: () => void;
}

const FilterSidebar = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  onApply,
  onClear,
}: FilterSidebarProps) => {
  const toggleArrayFilter = (
    key: keyof typeof filters,
    value: string
  ) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value];
    setFilters({ ...filters, [key]: newArray });
  };

  const activeFiltersCount = 
    filters.providerTypes.length + 
    filters.availability.length + 
    filters.vehicleTypes.length + 
    filters.features.length +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.priceRange[0] > 50 || filters.priceRange[1] < 200 ? 1 : 0);

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => setFilters({ ...filters, minRating: star === filters.minRating ? 0 : star })}
          className={cn(
            "w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center",
            star <= filters.minRating
              ? "bg-primary/10 text-primary scale-110"
              : "text-muted-foreground/40 hover:text-primary/60 hover:bg-muted"
          )}
        >
          <Star className={cn("w-5 h-5", star <= filters.minRating && "fill-current")} />
        </button>
      ))}
    </div>
  );

  const FilterCheckbox = ({ 
    id, 
    checked, 
    onChange, 
    label 
  }: { 
    id: string; 
    checked: boolean; 
    onChange: () => void; 
    label: string;
  }) => (
    <div 
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200",
        checked 
          ? "bg-primary/10 border border-primary/30" 
          : "hover:bg-muted/50 border border-transparent"
      )}
      onClick={onChange}
    >
      <div className={cn(
        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
        checked 
          ? "bg-primary border-primary" 
          : "border-muted-foreground/30"
      )}>
        {checked && <Check className="w-3 h-3 text-primary-foreground" />}
      </div>
      <label
        htmlFor={id}
        className={cn(
          "text-sm cursor-pointer select-none transition-colors",
          checked ? "text-foreground font-medium" : "text-muted-foreground"
        )}
      >
        {label}
      </label>
    </div>
  );

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Provider Type */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
            🏢 Tipo de Prestador
          </Label>
          <div className="space-y-1.5">
            {[
              { value: "autonomous", label: "Instrutor Autônomo" },
              { value: "school", label: "Autoescola" },
            ].map((option) => (
              <FilterCheckbox
                key={option.value}
                id={`provider-${option.value}`}
                checked={filters.providerTypes.includes(option.value)}
                onChange={() => toggleArrayFilter("providerTypes", option.value)}
                label={option.label}
              />
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
            💰 Faixa de Preço
          </Label>
          <div className="px-1">
            <Slider
              value={filters.priceRange}
              min={50}
              max={200}
              step={10}
              onValueChange={(value) =>
                setFilters({ ...filters, priceRange: value as [number, number] })
              }
              className="mb-3"
            />
            <div className="flex justify-between items-center">
              <span className="px-3 py-1.5 bg-muted rounded-lg text-sm font-medium">
                R$ {filters.priceRange[0]}
              </span>
              <span className="text-muted-foreground text-xs">até</span>
              <span className="px-3 py-1.5 bg-muted rounded-lg text-sm font-medium">
                R$ {filters.priceRange[1]}
              </span>
            </div>
          </div>
        </div>

        {/* Min Rating */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
            ⭐ Avaliação Mínima
          </Label>
          <StarRating rating={filters.minRating} />
          <p className="text-xs text-muted-foreground">
            {filters.minRating > 0
              ? `Exibindo ${filters.minRating}+ estrelas`
              : "Todas as avaliações"}
          </p>
        </div>

        {/* Vehicle Types */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
            🚗 Tipo de Veículo
          </Label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { value: "sedan", label: "Sedan" },
              { value: "hatch", label: "Hatch" },
              { value: "suv", label: "SUV" },
              { value: "motorcycle", label: "Moto" },
            ].map((vehicle) => (
              <FilterCheckbox
                key={vehicle.value}
                id={`vehicle-${vehicle.value}`}
                checked={filters.vehicleTypes.includes(vehicle.value)}
                onChange={() => toggleArrayFilter("vehicleTypes", vehicle.value)}
                label={vehicle.label}
              />
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
            ✨ Características
          </Label>
          <div className="space-y-1.5">
            {[
              { value: "Carro Adaptado", label: "♿ Veículo Adaptado" },
              { value: "Carro Automático", label: "🅰️ Câmbio Automático" },
              { value: "Aulas em Inglês", label: "🌍 Aulas em Inglês" },
              { value: "Horário Noturno", label: "🌙 Horário Noturno" },
            ].map((feature) => (
              <FilterCheckbox
                key={feature.value}
                id={`feature-${feature.value}`}
                checked={filters.features.includes(feature.value)}
                onChange={() => toggleArrayFilter("features", feature.value)}
                label={feature.label}
              />
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
            📅 Disponibilidade
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: "Segunda", label: "Seg" },
              { value: "Terça", label: "Ter" },
              { value: "Quarta", label: "Qua" },
              { value: "Quinta", label: "Qui" },
              { value: "Sexta", label: "Sex" },
              { value: "Sábado", label: "Sáb" },
              { value: "Domingo", label: "Dom" },
            ].map((day) => (
              <button
                key={day.value}
                onClick={() => toggleArrayFilter("availability", day.value)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                  filters.availability.includes(day.value)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-8 pt-6 border-t border-border">
        <Button 
          variant="outline" 
          onClick={onClear} 
          className="flex-1 gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
        >
          <RotateCcw className="w-4 h-4" />
          Limpar
        </Button>
        <Button onClick={onApply} className="flex-1 shadow-md">
          Aplicar Filtros
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 lg:w-80 shrink-0">
        <div className="bg-card border border-border/50 rounded-xl p-5 sticky top-36 shadow-sm">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Bottom Sheet */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            onClick={onClose}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl z-50 md:hidden max-h-[85vh] overflow-y-auto p-6 animate-slide-up shadow-2xl">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
};

export default FilterSidebar;
