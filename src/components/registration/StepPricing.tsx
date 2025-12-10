import { DollarSign, Clock, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RegistrationData } from '@/hooks/useRegistrationForm';
import { cn } from '@/lib/utils';

interface StepPricingProps {
  data: RegistrationData;
  onChange: (data: Partial<RegistrationData>) => void;
  errors: Record<string, string>;
}

const daysOfWeek = [
  { id: 'monday', label: 'Segunda-feira' },
  { id: 'tuesday', label: 'Terça-feira' },
  { id: 'wednesday', label: 'Quarta-feira' },
  { id: 'thursday', label: 'Quinta-feira' },
  { id: 'friday', label: 'Sexta-feira' },
  { id: 'saturday', label: 'Sábado' },
  { id: 'sunday', label: 'Domingo' },
];

const timeSlots = [
  { id: 'morning', label: 'Manhã', time: '6h-12h' },
  { id: 'afternoon', label: 'Tarde', time: '12h-18h' },
  { id: 'evening', label: 'Noite', time: '18h-22h' },
];

const specialties = [
  { id: 'first-license', label: 'Primeira habilitação' },
  { id: 'recycling', label: 'Reciclagem' },
  { id: 'anxious', label: 'Alunos ansiosos' },
  { id: 'elderly', label: 'Terceira idade' },
  { id: 'english', label: 'Aulas em inglês' },
  { id: 'defensive', label: 'Direção defensiva' },
];

export function StepPricing({ data, onChange, errors }: StepPricingProps) {
  const vehicles = data.vehicles.filter((v) => v.category);

  const updatePricing = (
    vehicleId: string,
    field: 'single' | 'pack5' | 'pack10',
    value: string
  ) => {
    const numericValue = value.replace(/\D/g, '');
    onChange({
      pricing: {
        ...data.pricing,
        [vehicleId]: {
          ...data.pricing[vehicleId],
          [field]: numericValue,
        },
      },
    });
  };

  const toggleAvailability = (day: string, slot: string) => {
    const currentSlots = data.availability[day] || [];
    const hasSlot = currentSlots.includes(slot);
    onChange({
      availability: {
        ...data.availability,
        [day]: hasSlot
          ? currentSlots.filter((s) => s !== slot)
          : [...currentSlots, slot],
      },
    });
  };

  const toggleSpecialty = (specialtyId: string) => {
    const hasSpecialty = data.specialties.includes(specialtyId);
    onChange({
      specialties: hasSpecialty
        ? data.specialties.filter((s) => s !== specialtyId)
        : [...data.specialties, specialtyId],
    });
  };

  const formatCurrency = (value: string) => {
    const num = parseInt(value || '0', 10);
    return num > 0 ? `R$ ${num}` : '';
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Defina seus valores e horários
        </h2>
        <p className="text-muted-foreground">
          Configure preços, disponibilidade e apresentação
        </p>
      </div>

      {/* Pricing Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Precificação
        </h3>

        {vehicles.length === 0 ? (
          <div className="bg-muted/50 rounded-lg p-6 text-center">
            <p className="text-muted-foreground">
              Cadastre pelo menos um veículo na etapa anterior para definir preços.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-card border border-border rounded-lg p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                    CAT {vehicle.category}
                  </span>
                  <span className="font-medium">
                    {vehicle.brand} {vehicle.model}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Aula avulsa (1h) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        R$
                      </span>
                      <Input
                        value={data.pricing[vehicle.id]?.single || ''}
                        onChange={(e) =>
                          updatePricing(vehicle.id, 'single', e.target.value)
                        }
                        placeholder="120"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Pacote 5 aulas (opcional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        R$
                      </span>
                      <Input
                        value={data.pricing[vehicle.id]?.pack5 || ''}
                        onChange={(e) =>
                          updatePricing(vehicle.id, 'pack5', e.target.value)
                        }
                        placeholder="550"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Pacote 10 aulas (opcional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        R$
                      </span>
                      <Input
                        value={data.pricing[vehicle.id]?.pack10 || ''}
                        onChange={(e) =>
                          updatePricing(vehicle.id, 'pack10', e.target.value)
                        }
                        placeholder="1000"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Availability Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Disponibilidade
        </h3>

        <div className="space-y-3">
          {daysOfWeek.map((day) => (
            <div
              key={day.id}
              className="flex flex-col md:flex-row md:items-center gap-3 p-4 bg-muted/30 rounded-lg"
            >
              <span className="font-medium w-32 flex-shrink-0">{day.label}</span>
              <div className="flex flex-wrap gap-2">
                {timeSlots.map((slot) => (
                  <label
                    key={slot.id}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all text-sm',
                      data.availability[day.id]?.includes(slot.id)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Checkbox
                      checked={data.availability[day.id]?.includes(slot.id)}
                      onCheckedChange={() => toggleAvailability(day.id, slot.id)}
                      className="hidden"
                    />
                    <span>{slot.label}</span>
                    <span className="text-xs text-muted-foreground">
                      ({slot.time})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label>Observações sobre disponibilidade</Label>
          <Textarea
            value={data.availabilityNotes}
            onChange={(e) => onChange({ availabilityNotes: e.target.value })}
            placeholder="Ex: Não atendo em feriados. Disponível para aulas extras aos finais de semana mediante agendamento prévio."
            rows={3}
          />
        </div>
      </div>

      {/* About Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Sobre você
        </h3>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Escreva uma breve apresentação</Label>
            <span className="text-xs text-muted-foreground">
              {data.bio.length}/500 caracteres
            </span>
          </div>
          <Textarea
            value={data.bio}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                onChange({ bio: e.target.value });
              }
            }}
            placeholder="Conte um pouco sobre sua experiência, metodologia de ensino e o que te diferencia como instrutor..."
            rows={5}
            className={cn(errors.bio && 'border-destructive')}
          />
          {errors.bio && (
            <p className="text-sm text-destructive">{errors.bio}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Especialidades</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {specialties.map((specialty) => (
              <label
                key={specialty.id}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all',
                  data.specialties.includes(specialty.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Checkbox
                  checked={data.specialties.includes(specialty.id)}
                  onCheckedChange={() => toggleSpecialty(specialty.id)}
                />
                <span className="text-sm">{specialty.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
