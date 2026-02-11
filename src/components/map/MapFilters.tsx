import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export interface MapFilterValues {
  radiusKm: number;
  categories: string[];
  minRating: number;
}

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearch: () => void;
  filters: MapFilterValues;
  onFiltersChange: (f: MapFilterValues) => void;
  isSearching: boolean;
}

const CATEGORIES = ['A', 'B', 'C', 'D', 'E'];
const RADIUS_MARKS = [5, 10, 15, 20, 30, 50];

function FilterContent({ filters, onFiltersChange }: { filters: MapFilterValues; onFiltersChange: (f: MapFilterValues) => void }) {
  return (
    <div className="space-y-6">
      {/* Radius */}
      <div>
        <Label className="text-sm font-medium">Raio de busca: {filters.radiusKm} km</Label>
        <Slider
          value={[filters.radiusKm]}
          onValueChange={([v]) => onFiltersChange({ ...filters, radiusKm: v })}
          min={5}
          max={50}
          step={5}
          className="mt-2"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          {RADIUS_MARKS.map((r) => <span key={r}>{r}km</span>)}
        </div>
      </div>

      {/* Categories */}
      <div>
        <Label className="text-sm font-medium">Categoria de habilitação</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {CATEGORIES.map((cat) => {
            const active = filters.categories.includes(cat);
            return (
              <Badge
                key={cat}
                variant={active ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => {
                  const next = active
                    ? filters.categories.filter((c) => c !== cat)
                    : [...filters.categories, cat];
                  onFiltersChange({ ...filters, categories: next });
                }}
              >
                {cat}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Min Rating */}
      <div>
        <Label className="text-sm font-medium">Avaliação mínima</Label>
        <Select
          value={String(filters.minRating)}
          onValueChange={(v) => onFiltersChange({ ...filters, minRating: Number(v) })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Qualquer</SelectItem>
            <SelectItem value="3">3+ estrelas</SelectItem>
            <SelectItem value="4">4+ estrelas</SelectItem>
            <SelectItem value="4.5">4.5+ estrelas</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function MapFilters({ searchQuery, onSearchChange, onSearch, filters, onFiltersChange, isSearching }: Props) {
  return (
    <div className="p-4 border-b bg-background space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por endereço, bairro ou CEP..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={onSearch} disabled={isSearching}>
          Buscar
        </Button>

        {/* Mobile filter toggle */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh]">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterContent filters={filters} onFiltersChange={onFiltersChange} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop filters inline */}
      <div className="hidden md:block">
        <FilterContent filters={filters} onFiltersChange={onFiltersChange} />
      </div>
    </div>
  );
}
