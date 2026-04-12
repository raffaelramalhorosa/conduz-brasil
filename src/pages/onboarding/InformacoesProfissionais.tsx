import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Clock,
  Info,
  Trash2,
  Check,
  GraduationCap,
  RotateCcw,
  Heart,
  Users,
  Globe,
  Shield,
  Moon,
  CheckCircle,
  Venus,
} from 'lucide-react';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const SPECIALTIES = [
  { value: 'first_license', label: 'Primeira Habilitação', icon: GraduationCap },
  { value: 'renewal', label: 'Reciclagem', icon: RotateCcw },
  { value: 'anxious_students', label: 'Alunos Ansiosos', icon: Heart },
  { value: 'elderly', label: 'Terceira Idade', icon: Users },
  { value: 'female_students', label: 'Público Feminino', icon: Venus },
  { value: 'english_classes', label: 'Aulas em Inglês', icon: Globe },
  { value: 'defensive_driving', label: 'Direção Defensiva', icon: Shield },
  { value: 'night_classes', label: 'Aulas Noturnas', icon: Moon },
];

const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' },
];

const InformacoesProfissionais = () => {
  const navigate = useNavigate();
  const { data, updateData, saveProgress, setCurrentStep, isSaving } = useOnboarding();
  const { toast } = useToast();

  useEffect(() => {
    setCurrentStep(3);
  }, [setCurrentStep]);

  const toggleSpecialty = (specialty: string) => {
    const newSpecialties = data.specialties.includes(specialty)
      ? data.specialties.filter((s) => s !== specialty)
      : [...data.specialties, specialty];
    updateData({ specialties: newSpecialties });
  };

  const addAvailability = (dayOfWeek: number) => {
    const newAvailability = [
      ...data.availability,
      { day_of_week: dayOfWeek, start_time: '08:00', end_time: '18:00' },
    ];
    updateData({ availability: newAvailability });
  };

  const removeAvailability = (index: number) => {
    const newAvailability = data.availability.filter((_, i) => i !== index);
    updateData({ availability: newAvailability });
  };

  const updateAvailabilityField = (index: number, field: string, value: string) => {
    const newAvailability = data.availability.map((a, i) =>
      i === index ? { ...a, [field]: field === 'day_of_week' ? parseInt(value) : value } : a
    );
    updateData({ availability: newAvailability });
  };

  const validate = () => {
    if (data.bio.trim().length < 50) {
      toast({
        title: 'Descrição muito curta',
        description: 'A descrição deve ter pelo menos 50 caracteres',
        variant: 'destructive',
      });
      return false;
    }

    if (data.specialties.length === 0) {
      toast({
        title: 'Selecione pelo menos uma especialidade',
        variant: 'destructive',
      });
      return false;
    }

    if (data.availability.length === 0) {
      toast({
        title: 'Defina sua disponibilidade',
        description: 'Adicione pelo menos um horário de disponibilidade',
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

  const getDayLabel = (dayValue: number) => {
    return DAYS_OF_WEEK.find((d) => d.value === dayValue)?.label || '';
  };

  return (
    <OnboardingLayout step={3}>
      <div className="space-y-6 pb-24">
        {/* Sobre você */}
        <div className="bg-card rounded-xl border p-6 md:p-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Informações Profissionais
          </h2>
          <p className="text-muted-foreground mb-6">
            Conte sobre sua experiência e defina sua disponibilidade
          </p>

          {/* Bio */}
          <div className="mb-6">
            <Label className="mb-2 block">Sobre você / sua autoescola *</Label>
            <Textarea
              value={data.bio}
              onChange={(e) => updateData({ bio: e.target.value })}
              rows={5}
              maxLength={500}
              placeholder="Conte um pouco sobre sua experiência como instrutor, sua metodologia de ensino e o que te diferencia..."
              className="resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-muted-foreground">Mínimo 50 caracteres</p>
              <p className="text-xs text-muted-foreground">{data.bio.length}/500</p>
            </div>
          </div>

          {/* Anos de experiência */}
          <div className="mb-6">
            <Label className="mb-2 block">Anos de experiência como instrutor</Label>
            <Input
              type="number"
              min={0}
              max={50}
              value={data.experience_years || ''}
              onChange={(e) => updateData({ experience_years: parseInt(e.target.value) || 0 })}
              className="w-full md:w-48"
              placeholder="5"
            />
          </div>

          {/* Especialidades */}
          <div>
            <Label className="mb-3 block">Especialidades * (selecione pelo menos uma)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SPECIALTIES.map((specialty) => {
                const isSelected = data.specialties.includes(specialty.value);
                const Icon = specialty.icon;
                return (
                  <label
                    key={specialty.value}
                    className={cn(
                      'flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSpecialty(specialty.value)}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        isSelected ? 'bg-primary' : 'bg-muted'
                      )}
                    >
                      <Icon
                        className={cn('w-5 h-5', isSelected ? 'text-primary-foreground' : 'text-muted-foreground')}
                      />
                    </div>
                    <span className="font-medium text-foreground">{specialty.label}</span>
                    {isSelected && <CheckCircle className="w-5 h-5 text-primary ml-auto" />}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Disponibilidade */}
        <div className="bg-card rounded-xl border p-6 md:p-8">
          <h3 className="text-xl font-bold text-foreground mb-2">Sua Disponibilidade</h3>
          <p className="text-muted-foreground mb-6">
            Defina os dias e horários em que você pode dar aulas
          </p>

          {/* Lista de disponibilidades */}
          <div className="space-y-4 mb-4">
            {data.availability.map((avail, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Dia da Semana
                    </Label>
                    <select
                      value={avail.day_of_week}
                      onChange={(e) => updateAvailabilityField(index, 'day_of_week', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Horário Início
                    </Label>
                    <Input
                      type="time"
                      value={avail.start_time}
                      onChange={(e) => updateAvailabilityField(index, 'start_time', e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Horário Fim
                    </Label>
                    <Input
                      type="time"
                      value={avail.end_time}
                      onChange={(e) => updateAvailabilityField(index, 'end_time', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeAvailability(index)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Botões para adicionar dias */}
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const hasDay = data.availability.some((a) => a.day_of_week === day.value);

              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => !hasDay && addAvailability(day.value)}
                  disabled={hasDay}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium text-sm transition',
                    hasDay
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  )}
                >
                  {hasDay && <Check className="w-4 h-4 inline mr-1" />}
                  {day.label}
                </button>
              );
            })}
          </div>

          {data.availability.length === 0 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Clique em um dia da semana para adicionar sua disponibilidade
            </p>
          )}
        </div>

        {/* Info sobre veículos */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground font-medium mb-1">📝 Sobre os veículos</p>
              <p className="text-xs text-muted-foreground">
                Você poderá cadastrar seus veículos e definir preços após a aprovação do seu
                perfil, diretamente no seu dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between">
          <Button variant="outline" onClick={() => navigate('/onboarding-instrutor/documentacao')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Button onClick={handleNext} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Continuar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default InformacoesProfissionais;
