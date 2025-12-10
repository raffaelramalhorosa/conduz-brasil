import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

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

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => setFilters({ ...filters, minRating: star })}
          className={`w-6 h-6 ${
            star <= filters.minRating
              ? "text-yellow-400"
              : "text-muted-foreground/30"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
        <button
          onClick={onClose}
          className="md:hidden p-1 hover:bg-muted rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Provider Type */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Tipo de Prestador
          </Label>
          <div className="space-y-2">
            {[
              { value: "autonomous", label: "Instrutor Autônomo" },
              { value: "school", label: "Autoescola" },
            ].map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <Checkbox
                  id={`provider-${option.value}`}
                  checked={filters.providerTypes.includes(option.value)}
                  onCheckedChange={() =>
                    toggleArrayFilter("providerTypes", option.value)
                  }
                />
                <label
                  htmlFor={`provider-${option.value}`}
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Faixa de Preço
          </Label>
          <div className="px-2">
            <Slider
              value={filters.priceRange}
              min={50}
              max={200}
              step={10}
              onValueChange={(value) =>
                setFilters({ ...filters, priceRange: value as [number, number] })
              }
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>R$ {filters.priceRange[0]}</span>
              <span>R$ {filters.priceRange[1]}</span>
            </div>
          </div>
        </div>

        {/* Min Rating */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Avaliação Mínima
          </Label>
          <StarRating rating={filters.minRating} />
          <p className="text-xs text-muted-foreground mt-1">
            {filters.minRating > 0
              ? `${filters.minRating}+ estrelas`
              : "Qualquer avaliação"}
          </p>
        </div>

        {/* Availability */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Disponibilidade
          </Label>
          <div className="space-y-2">
            {[
              "Segunda",
              "Terça",
              "Quarta",
              "Quinta",
              "Sexta",
              "Sábado",
              "Domingo",
            ].map((day) => (
              <div key={day} className="flex items-center gap-2">
                <Checkbox
                  id={`day-${day}`}
                  checked={filters.availability.includes(day)}
                  onCheckedChange={() => toggleArrayFilter("availability", day)}
                />
                <label
                  htmlFor={`day-${day}`}
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  {day}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Types */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Tipo de Veículo
          </Label>
          <div className="space-y-2">
            {["Sedan", "Hatch", "SUV", "Moto"].map((vehicle) => (
              <div key={vehicle} className="flex items-center gap-2">
                <Checkbox
                  id={`vehicle-${vehicle}`}
                  checked={filters.vehicleTypes.includes(vehicle)}
                  onCheckedChange={() =>
                    toggleArrayFilter("vehicleTypes", vehicle)
                  }
                />
                <label
                  htmlFor={`vehicle-${vehicle}`}
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  {vehicle}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Características
          </Label>
          <div className="space-y-2">
            {[
              "Carro Adaptado",
              "Aulas em Inglês",
              "Horário Noturno",
              "Carro Automático",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <Checkbox
                  id={`feature-${feature}`}
                  checked={filters.features.includes(feature)}
                  onCheckedChange={() => toggleArrayFilter("features", feature)}
                />
                <label
                  htmlFor={`feature-${feature}`}
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  {feature}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-8 pt-6 border-t border-border">
        <Button variant="outline" onClick={onClear} className="flex-1">
          Limpar
        </Button>
        <Button onClick={onApply} className="flex-1">
          Aplicar Filtros
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 lg:w-80 shrink-0 bg-muted/30 border-r border-border p-6 h-fit sticky top-36">
        {sidebarContent}
      </aside>

      {/* Mobile Bottom Sheet */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={onClose}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl z-50 md:hidden max-h-[85vh] overflow-y-auto p-6 animate-slide-up">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
};

export default FilterSidebar;
