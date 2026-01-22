import { MapPin, SlidersHorizontal, Search } from "lucide-react";
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
    <div className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-16 md:top-20 z-40 shadow-sm">
      <div className="container-custom py-4 md:py-5">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center">
          {/* Location Input */}
          <div className="relative flex-1 max-w-xs group">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Buscar por cidade ou bairro..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 pr-10 h-11 bg-background/50 border-border/80 focus:border-primary focus:ring-primary/20 transition-all"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          </div>

          {/* Category Select */}
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-44 h-11 bg-background/50 border-border/80 focus:border-primary">
              <SelectValue placeholder="Categoria CNH" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              <SelectItem value="A">Categoria A (Moto)</SelectItem>
              <SelectItem value="B">Categoria B (Carro)</SelectItem>
              <SelectItem value="C">Categoria C (Caminhão)</SelectItem>
              <SelectItem value="D">Categoria D (Ônibus)</SelectItem>
              <SelectItem value="E">Categoria E (Carreta)</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By Select */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-44 h-11 bg-background/50 border-border/80 focus:border-primary">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">⭐ Melhor Avaliado</SelectItem>
              <SelectItem value="reviews">💬 Mais Avaliações</SelectItem>
              <SelectItem value="price_low">💰 Menor Preço</SelectItem>
              <SelectItem value="price_high">💎 Maior Preço</SelectItem>
              <SelectItem value="distance">📍 Mais Próximo</SelectItem>
            </SelectContent>
          </Select>

          {/* Filters Button (Mobile) */}
          {showFiltersButton && (
            <Button
              variant="outline"
              onClick={onToggleFilters}
              className="md:hidden flex items-center gap-2 h-11 border-primary/30 hover:border-primary hover:bg-primary/5"
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
