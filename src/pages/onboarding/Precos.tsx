import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Clock, Info } from 'lucide-react';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { useOnboarding, OnboardingData } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type VehicleData = OnboardingData['vehicles'][0];

const daysOfWeek = [
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
  { value: 1, label: 'Seg', fullLabel: 'Segunda' },
  { value: 2, label: 'Ter', fullLabel: 'Terça' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
];

const timeSlots = [
  { id: 'morning', label: 'Manhã', start: '08:00', end: '12:00' },
  { id: 'afternoon', label: 'Tarde', start: '12:00', end: '18:00' },
  { id: 'evening', label: 'Noite', start: '18:00', end: '21:00' },
];

const specialties = [
  { value: 'first_license', label: 'Primeira habilitação' },
  { value: 'renewal', label: 'Reciclagem' },
  { value: 'anxious_students', label: 'Alunos ansiosos' },
  { value: 'elderly', label: 'Terceira idade' },
  { value: 'english_classes', label: 'Aulas em inglês' },
  { value: 'defensive_driving', label: 'Direção defensiva' },
  { value: 'night_classes', label: 'Aulas noturnas' },
];

const Precos = () => {
  const navigate = useNavigate();
  const { data, updateData, saveProgress, isSaving } = useOnboarding();
  const { toast } = useToast();

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const number = parseInt(numericValue) / 100;
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrency = (value: string): number => {
    const numericValue = value.replace(/\D/g, '');
    return parseInt(numericValue) / 100;
  };

  const updateVehiclePricing = (
    index: number,
    field: keyof VehicleData['pricing'],
    value: number | null
  ) => {
    const newVehicles = data.vehicles.map((v, i) =>
      i === index
        ? { ...v, pricing: { ...v.pricing, [field]: value } }
        : v
    );
    updateData({ vehicles: newVehicles });
  };

  const toggleAvailability = (dayOfWeek: number, slot: typeof timeSlots[0]) => {
    const existingIndex = data.availability.findIndex(
      (a) =>
        a.day_of_week === dayOfWeek &&
        a.start_time === slot.start &&
        a.end_time === slot.end
    );

    if (existingIndex >= 0) {
      const newAvailability = data.availability.filter(
        (_, i) => i !== existingIndex
      );
      updateData({ availability: newAvailability });
    } else {
      const newAvailability = [
        ...data.availability,
        { day_of_week: dayOfWeek, start_time: slot.start, end_time: slot.end },
      ];
      updateData({ availability: newAvailability });
    }
  };

  const isSlotSelected = (dayOfWeek: number, slot: typeof timeSlots[0]) => {
    return data.availability.some(
      (a) =>
        a.day_of_week === dayOfWeek &&
        a.start_time === slot.start &&
        a.end_time === slot.end
    );
  };

  const toggleSpecialty = (specialty: string) => {
    if (data.specialties.includes(specialty)) {
      updateData({
        specialties: data.specialties.filter((s) => s !== specialty),
      });
    } else {
      updateData({
        specialties: [...data.specialties, specialty],
      });
    }
  };

  const validate = () => {
    for (let i = 0; i < data.vehicles.length; i++) {
      const vehicle = data.vehicles[i];
      if (!vehicle.pricing.single_class_price || vehicle.pricing.single_class_price <= 0) {
        toast({
          title: `Defina o preço da aula avulsa para o veículo ${i + 1}`,
          variant: 'destructive',
        });
        return false;
      }
    }

    if (data.availability.length === 0) {
      toast({
        title: 'Selecione pelo menos um horário de disponibilidade',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    if (!validate()) return;

    await saveProgress();
    navigate('/onboarding-instrutor/finalizacao');
  };

  return (
    <OnboardingLayout step={4}>
      <div className="space-y-6">
        {/* Preços */}
        <div className="bg-card rounded-xl border p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Preços</h2>
          <p className="text-muted-foreground mb-6">
            Defina os valores das aulas para cada veículo
          </p>

          <div className="space-y-6">
            {data.vehicles.map((vehicle, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-4">
                  {vehicle.brand} {vehicle.model} - Cat. {vehicle.license_category}
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Aula Avulsa *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        R$
                      </span>
                      <Input
                        className="pl-10"
                        value={
                          vehicle.pricing.single_class_price
                            ? formatCurrency(
                                (vehicle.pricing.single_class_price * 100).toString()
                              )
                            : ''
                        }
                        onChange={(e) => {
                          const value = parseCurrency(e.target.value);
                          updateVehiclePricing(index, 'single_class_price', value);
                        }}
                        placeholder="80,00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Pacote 5 aulas</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        R$
                      </span>
                      <Input
                        className="pl-10"
                        value={
                          vehicle.pricing.package_5_price
                            ? formatCurrency(
                                (vehicle.pricing.package_5_price * 100).toString()
                              )
                            : ''
                        }
                        onChange={(e) => {
                          const value = parseCurrency(e.target.value);
                          updateVehiclePricing(
                            index,
                            'package_5_price',
                            value || null
                          );
                        }}
                        placeholder="350,00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Pacote 10 aulas</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        R$
                      </span>
                      <Input
                        className="pl-10"
                        value={
                          vehicle.pricing.package_10_price
                            ? formatCurrency(
                                (vehicle.pricing.package_10_price * 100).toString()
                              )
                            : ''
                        }
                        onChange={(e) => {
                          const value = parseCurrency(e.target.value);
                          updateVehiclePricing(
                            index,
                            'package_10_price',
                            value || null
                          );
                        }}
                        placeholder="650,00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Pacote 20 aulas</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        R$
                      </span>
                      <Input
                        className="pl-10"
                        value={
                          vehicle.pricing.package_20_price
                            ? formatCurrency(
                                (vehicle.pricing.package_20_price * 100).toString()
                              )
                            : ''
                        }
                        onChange={(e) => {
                          const value = parseCurrency(e.target.value);
                          updateVehiclePricing(
                            index,
                            'package_20_price',
                            value || null
                          );
                        }}
                        placeholder="1200,00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4 flex gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Uma taxa de serviço de 12% será descontada de cada aula realizada.
            </p>
          </div>
        </div>

        {/* Disponibilidade */}
        <div className="bg-card rounded-xl border p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground mb-2">Disponibilidade</h2>
          <p className="text-muted-foreground mb-6">
            Selecione os horários em que você está disponível
          </p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2 text-sm text-muted-foreground font-medium">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Horário
                  </th>
                  {daysOfWeek.map((day) => (
                    <th
                      key={day.value}
                      className="text-center p-2 text-sm text-muted-foreground font-medium"
                    >
                      <span className="hidden md:inline">{day.fullLabel}</span>
                      <span className="md:hidden">{day.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) => (
                  <tr key={slot.id}>
                    <td className="p-2 text-sm text-foreground">{slot.label}</td>
                    {daysOfWeek.map((day) => (
                      <td key={day.value} className="p-2 text-center">
                        <button
                          onClick={() => toggleAvailability(day.value, slot)}
                          className={cn(
                            'w-8 h-8 rounded-lg transition',
                            isSlotSelected(day.value, slot)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted-foreground/20'
                          )}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sobre você */}
        <div className="bg-card rounded-xl border p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground mb-2">Sobre Você</h2>
          <p className="text-muted-foreground mb-6">
            Conte um pouco sobre sua experiência
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Anos de experiência</Label>
                <Input
                  type="number"
                  value={data.experience_years || ''}
                  onChange={(e) =>
                    updateData({ experience_years: parseInt(e.target.value) || 0 })
                  }
                  min={0}
                  max={50}
                  placeholder="5"
                />
              </div>
            </div>

            <div>
              <Label>Bio / Descrição</Label>
              <Textarea
                value={data.bio}
                onChange={(e) => updateData({ bio: e.target.value })}
                placeholder="Conte um pouco sobre você, sua experiência e método de ensino..."
                rows={4}
              />
            </div>

            <div>
              <Label className="mb-3 block">Especialidades</Label>
              <div className="flex flex-wrap gap-2">
                {specialties.map((specialty) => (
                  <button
                    key={specialty.value}
                    onClick={() => toggleSpecialty(specialty.value)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium transition',
                      data.specialties.includes(specialty.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20'
                    )}
                  >
                    {specialty.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/onboarding-instrutor/veiculos')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Button onClick={handleNext} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Continuar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default Precos;
