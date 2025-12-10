import { MapPin, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  location: string;
  setLocation: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  onToggleFilters: () => void;
  showFiltersButton?: boolean;
}

const FilterBar = ({
  location,
  setLocation,
  category,
  setCategory,
  sortBy,
  setSortBy,
  onToggleFilters,
  showFiltersButton = true,
}: FilterBarProps) => {
  return (
    <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40">
      <div className="container-custom py-4">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center">
          {/* Location Input */}
          <div className="relative flex-1 max-w-xs">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Localização"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Select */}
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Categoria CNH" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              <SelectItem value="A">Categoria A (Moto)</SelectItem>
              <SelectItem value="B">Categoria B (Carro)</SelectItem>
              <SelectItem value="AB">Categoria AB</SelectItem>
              <SelectItem value="C">Categoria C (Caminhão)</SelectItem>
              <SelectItem value="D">Categoria D (Ônibus)</SelectItem>
              <SelectItem value="E">Categoria E (Carreta)</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By Select */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Melhor Avaliado</SelectItem>
              <SelectItem value="price_low">Menor Preço</SelectItem>
              <SelectItem value="price_high">Maior Preço</SelectItem>
              <SelectItem value="distance">Mais Próximo</SelectItem>
            </SelectContent>
          </Select>

          {/* Filters Button (Mobile) */}
          {showFiltersButton && (
            <Button
              variant="outline"
              onClick={onToggleFilters}
              className="md:hidden flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros Avançados
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
