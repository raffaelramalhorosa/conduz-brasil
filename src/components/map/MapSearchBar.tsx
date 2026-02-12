import { useState, useRef, useEffect } from 'react';
import { Search, X, SlidersHorizontal, Building2 } from 'lucide-react';
import { useNominatimGeocode } from '@/hooks/useNominatimGeocode';
import type { FiltrosMapa, GeocodingResult } from '@/types/map';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

const CATEGORIES = ['A', 'B', 'AB', 'C', 'D', 'E'];
const RATINGS = [
  { label: 'Qualquer', value: 0 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
  { label: '4.5+', value: 4.5 },
];

interface Props {
  filters: FiltrosMapa;
  onFiltersChange: (f: FiltrosMapa) => void;
  onLocationSelect: (lat: number, lng: number) => void;
  resultCount: number;
  showDrivingSchoolTeam: boolean;
  onToggleDrivingSchoolTeam: () => void;
}

export default function MapSearchBar({ filters, onFiltersChange, onLocationSelect, resultCount, showDrivingSchoolTeam, onToggleDrivingSchoolTeam }: Props) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { search, results, isSearching, clearResults } = useNominatimGeocode();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    const res = await search(query);
    if (res.length > 0) {
      setShowSuggestions(true);
    } else {
      toast.error('Endereço não encontrado');
    }
  };

  const handleSelect = (result: GeocodingResult) => {
    onLocationSelect(parseFloat(result.lat), parseFloat(result.lon));
    setQuery(result.display_name.split(',')[0]);
    setShowSuggestions(false);
    clearResults();
  };

  const toggleCategory = (cat: string) => {
    const next = filters.categorias.includes(cat)
      ? filters.categorias.filter((c) => c !== cat)
      : [...filters.categorias, cat];
    onFiltersChange({ ...filters, categorias: next });
  };

  return (
    <div
      ref={wrapperRef}
      className="absolute top-4 left-4 z-[1000] w-[calc(100vw-32px)] md:w-[400px]"
    >
      <div className="bg-white rounded-xl shadow-lg p-3 space-y-2">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Busque por bairro, cidade ou CEP..."
            className="w-full pl-9 pr-8 h-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); clearResults(); setShowSuggestions(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && results.length > 0 && (
          <div className="bg-white border rounded-lg shadow-md max-h-48 overflow-auto">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSelect(r)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-b-0"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {/* Radius chip */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors bg-white text-foreground border-border hover:border-primary">
                Raio: {filters.raioKm}km
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-4" align="start">
              <Label className="text-xs font-medium">Raio de busca: {filters.raioKm} km</Label>
              <Slider
                value={[filters.raioKm]}
                onValueChange={([v]) => onFiltersChange({ ...filters, raioKm: v })}
                min={5} max={50} step={5}
                className="mt-3"
              />
            </PopoverContent>
          </Popover>

          {/* Categories chip */}
          <Popover>
            <PopoverTrigger asChild>
              <button className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filters.categorias.length > 0
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-foreground border-border hover:border-primary'
              }`}>
                Categorias{filters.categorias.length > 0 ? ` (${filters.categorias.length})` : ''}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3" align="start">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      filters.categorias.includes(cat)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-foreground border-border hover:border-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Rating chip */}
          <Popover>
            <PopoverTrigger asChild>
              <button className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filters.minRating > 0
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-foreground border-border hover:border-primary'
              }`}>
                {filters.minRating > 0 ? `⭐ ${filters.minRating}+` : 'Avaliação'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2" align="start">
              {RATINGS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => onFiltersChange({ ...filters, minRating: r.value })}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                    filters.minRating === r.value ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Online toggle */}
          <button
            onClick={() => onFiltersChange({ ...filters, apenasOnline: !filters.apenasOnline })}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filters.apenasOnline
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-foreground border-border hover:border-primary'
            }`}
          >
            🟢 Online
          </button>

          {/* Driving school team toggle */}
          <button
            onClick={onToggleDrivingSchoolTeam}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
              showDrivingSchoolTeam
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-foreground border-border hover:border-blue-500'
            }`}
          >
            <Building2 className="h-3 w-3" />
            Equipe
          </button>
        </div>

        {/* Result count */}
        <p className="text-[11px] text-muted-foreground px-1">
          {resultCount} instrutor{resultCount !== 1 ? 'es' : ''} encontrado{resultCount !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
