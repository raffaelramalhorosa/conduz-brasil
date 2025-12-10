import { useState } from 'react';
import { User, Building2, Mail, Phone, Calendar, MapPin, Home } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RegistrationData } from '@/hooks/useRegistrationForm';
import { maskCPFCNPJ, maskPhone, maskCEP, maskDate } from '@/lib/masks';
import { cn } from '@/lib/utils';

interface StepBasicDataProps {
  data: RegistrationData;
  onChange: (data: Partial<RegistrationData>) => void;
  errors: Record<string, string>;
}

export function StepBasicData({ data, onChange, errors }: StepBasicDataProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const handleCepBlur = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const result = await response.json();
        if (!result.erro) {
          onChange({
            street: result.logradouro || '',
            neighborhood: result.bairro || '',
            city: result.localidade || '',
            state: result.uf || '',
          });
        }
      } catch (error) {
        console.error('Error fetching CEP:', error);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Vamos começar com suas informações
        </h2>
        <p className="text-muted-foreground">
          Preencha seus dados básicos para criar sua conta
        </p>
      </div>

      {/* Account Type */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Tipo de conta</Label>
        <RadioGroup
          value={data.accountType}
          onValueChange={(value) => onChange({ accountType: value as 'instructor' | 'school' })}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <label
            className={cn(
              'flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all',
              data.accountType === 'instructor'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            )}
          >
            <RadioGroupItem value="instructor" id="instructor" />
            <User className="w-8 h-8 text-primary" />
            <div>
              <p className="font-medium">Sou instrutor autônomo</p>
              <p className="text-sm text-muted-foreground">
                Trabalho de forma independente
              </p>
            </div>
          </label>

          <label
            className={cn(
              'flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all',
              data.accountType === 'school'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            )}
          >
            <RadioGroupItem value="school" id="school" />
            <Building2 className="w-8 h-8 text-primary" />
            <div>
              <p className="font-medium">Represento uma autoescola</p>
              <p className="text-sm text-muted-foreground">
                Cadastro empresarial
              </p>
            </div>
          </label>
        </RadioGroup>
        {errors.accountType && (
          <p className="text-sm text-destructive">{errors.accountType}</p>
        )}
      </div>

      {/* Personal/Business Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">
            {data.accountType === 'school' ? 'Nome da autoescola' : 'Nome completo'}
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="fullName"
              value={data.fullName}
              onChange={(e) => onChange({ fullName: e.target.value })}
              placeholder={data.accountType === 'school' ? 'Autoescola ABC' : 'João da Silva'}
              className={cn('pl-10', errors.fullName && 'border-destructive')}
            />
          </div>
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpfCnpj">
            {data.accountType === 'school' ? 'CNPJ' : 'CPF'}
          </Label>
          <Input
            id="cpfCnpj"
            value={data.cpfCnpj}
            onChange={(e) => onChange({ cpfCnpj: maskCPFCNPJ(e.target.value) })}
            placeholder={data.accountType === 'school' ? '00.000.000/0001-00' : '000.000.000-00'}
            className={cn(errors.cpfCnpj && 'border-destructive')}
          />
          {errors.cpfCnpj && (
            <p className="text-sm text-destructive">{errors.cpfCnpj}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="email@exemplo.com"
              className={cn('pl-10', errors.email && 'border-destructive')}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone/WhatsApp</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="phone"
              value={data.phone}
              onChange={(e) => onChange({ phone: maskPhone(e.target.value) })}
              placeholder="(11) 99999-9999"
              className={cn('pl-10', errors.phone && 'border-destructive')}
            />
          </div>
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone}</p>
          )}
        </div>

        {data.accountType === 'instructor' && (
          <div className="space-y-2">
            <Label htmlFor="birthDate">Data de nascimento</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="birthDate"
                value={data.birthDate}
                onChange={(e) => onChange({ birthDate: maskDate(e.target.value) })}
                placeholder="DD/MM/AAAA"
                className={cn('pl-10', errors.birthDate && 'border-destructive')}
              />
            </div>
            {errors.birthDate && (
              <p className="text-sm text-destructive">{errors.birthDate}</p>
            )}
          </div>
        )}
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Endereço
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              value={data.cep}
              onChange={(e) => onChange({ cep: maskCEP(e.target.value) })}
              onBlur={(e) => handleCepBlur(e.target.value)}
              placeholder="00000-000"
              className={cn(errors.cep && 'border-destructive')}
            />
            {isLoadingCep && (
              <p className="text-sm text-muted-foreground">Buscando...</p>
            )}
            {errors.cep && (
              <p className="text-sm text-destructive">{errors.cep}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="street">Rua</Label>
            <Input
              id="street"
              value={data.street}
              onChange={(e) => onChange({ street: e.target.value })}
              placeholder="Rua das Flores"
              className={cn(errors.street && 'border-destructive')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="number">Número</Label>
            <Input
              id="number"
              value={data.number}
              onChange={(e) => onChange({ number: e.target.value })}
              placeholder="123"
              className={cn(errors.number && 'border-destructive')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              value={data.complement}
              onChange={(e) => onChange({ complement: e.target.value })}
              placeholder="Apto 10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              value={data.neighborhood}
              onChange={(e) => onChange({ neighborhood: e.target.value })}
              placeholder="Centro"
              className={cn(errors.neighborhood && 'border-destructive')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={data.city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="São Paulo"
              className={cn(errors.city && 'border-destructive')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">Estado</Label>
            <Input
              id="state"
              value={data.state}
              onChange={(e) => onChange({ state: e.target.value })}
              placeholder="SP"
              maxLength={2}
              className={cn(errors.state && 'border-destructive')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
