import { useState } from 'react';
import { Check, ChevronsUpDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { InstructorAvatar } from './InstructorAvatar';

export interface InstructorOption {
  id: string;
  name: string;
  photoUrl?: string | null;
}

interface InstructorComboboxProps {
  instructors: InstructorOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function InstructorCombobox({
  instructors,
  value,
  onValueChange,
  placeholder = 'Todos os instrutores',
  className,
}: InstructorComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = instructors.find(i => i.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'justify-between bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {selected ? (
              <>
                <InstructorAvatar photoUrl={selected.photoUrl} name={selected.name} size="sm" />
                <span className="truncate">{selected.name}</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">{placeholder}</span>
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0 bg-instructor-dark-secondary border-white/10">
        <Command className="bg-transparent">
          <CommandInput placeholder="Buscar instrutor..." className="text-white" />
          <CommandList>
            <CommandEmpty className="text-white/50 text-sm py-4 text-center">Nenhum instrutor encontrado</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => { onValueChange('all'); setOpen(false); }}
                className="text-white hover:bg-white/10"
              >
                <Users className="w-4 h-4 mr-2 text-gray-400" />
                <span>{placeholder}</span>
                {value === 'all' && <Check className="ml-auto h-4 w-4 text-primary" />}
              </CommandItem>
              {instructors.map(inst => (
                <CommandItem
                  key={inst.id}
                  value={inst.name}
                  onSelect={() => { onValueChange(inst.id); setOpen(false); }}
                  className="text-white hover:bg-white/10"
                >
                  <InstructorAvatar photoUrl={inst.photoUrl} name={inst.name} size="sm" className="mr-2" />
                  <span>{inst.name}</span>
                  {value === inst.id && <Check className="ml-auto h-4 w-4 text-primary" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
