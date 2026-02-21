import { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface CityComboboxProps {
  state: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

export function CityCombobox({
  state,
  value,
  onValueChange,
  disabled = false,
  className,
  error = false,
}: CityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!state || state.length !== 2) {
      setCities([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios?orderBy=nome`
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const cityNames = (data as { nome: string }[]).map((c) => c.nome).sort();
        setCities(cityNames);
      })
      .catch((err) => {
        console.error('Error fetching cities:', err);
        if (!cancelled) setCities([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [state]);

  const filteredCities = useMemo(() => {
    if (!search) return cities.slice(0, 50);
    const lower = search.toLowerCase();
    return cities.filter((c) => c.toLowerCase().includes(lower)).slice(0, 50);
  }, [cities, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || !state}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            error && 'border-destructive',
            className
          )}
        >
          {value || 'Selecione a cidade'}
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar cidade..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? 'Carregando cidades...' : 'Nenhuma cidade encontrada.'}
            </CommandEmpty>
            <CommandGroup>
              {filteredCities.map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={() => {
                    onValueChange(city);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === city ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {city}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
