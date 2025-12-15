import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { maskCPF, maskCNPJ, maskPhone, maskCEP } from '@/lib/masks';
import { useToast } from '@/hooks/use-toast';

const DadosBasicos = () => {
  const navigate = useNavigate();
  const { data, updateData, saveProgress, isSaving } = useOnboarding();
  const { toast } = useToast();
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCepBlur = async () => {
    const cep = data.zipcode.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const result = await response.json();

      if (!result.erro) {
        updateData({
          street: result.logradouro || '',
          neighborhood: result.bairro || '',
          city: result.localidade || '',
          state: result.uf || '',
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (data.is_driving_school) {
      if (!data.business_name?.trim()) {
        newErrors.business_name = 'Nome da autoescola é obrigatório';
      }
      if (!data.cnpj || data.cnpj.replace(/\D/g, '').length !== 14) {
        newErrors.cnpj = 'CNPJ inválido';
      }
    } else {
      if (!data.cpf || data.cpf.replace(/\D/g, '').length !== 11) {
        newErrors.cpf = 'CPF inválido';
      }
    }

    if (!data.phone || data.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Telefone inválido';
    }

    if (!data.zipcode || data.zipcode.replace(/\D/g, '').length !== 8) {
      newErrors.zipcode = 'CEP inválido';
    }

    if (!data.street?.trim()) {
      newErrors.street = 'Rua é obrigatória';
    }

    if (!data.number?.trim()) {
      newErrors.number = 'Número é obrigatório';
    }

    if (!data.neighborhood?.trim()) {
      newErrors.neighborhood = 'Bairro é obrigatório';
    }

    if (!data.city?.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    }

    if (!data.state?.trim()) {
      newErrors.state = 'Estado é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) {
      toast({
        title: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    await saveProgress();
    navigate('/onboarding-instrutor/documentacao');
  };

  return (
    <OnboardingLayout step={1}>
      <div className="bg-card rounded-xl border p-6 md:p-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Dados Básicos</h2>
        <p className="text-muted-foreground mb-8">
          Informe seus dados pessoais e endereço
        </p>

        {/* Tipo de conta */}
        <div className="mb-8">
          <Label className="text-base font-medium mb-4 block">Tipo de conta</Label>
          <RadioGroup
            value={data.is_driving_school ? 'school' : 'instructor'}
            onValueChange={(value) =>
              updateData({ is_driving_school: value === 'school' })
            }
            className="grid grid-cols-2 gap-4"
          >
            <label
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition ${
                !data.is_driving_school
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="instructor" />
              <div>
                <p className="font-medium text-foreground">Instrutor Autônomo</p>
                <p className="text-sm text-muted-foreground">Pessoa física</p>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition ${
                data.is_driving_school
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="school" />
              <div>
                <p className="font-medium text-foreground">Autoescola</p>
                <p className="text-sm text-muted-foreground">Pessoa jurídica</p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {/* Dados pessoais / empresariais */}
        <div className="space-y-4 mb-8">
          <h3 className="font-medium text-foreground">
            {data.is_driving_school ? 'Dados da Empresa' : 'Dados Pessoais'}
          </h3>

          {data.is_driving_school && (
            <div>
              <Label htmlFor="business_name">Nome da Autoescola *</Label>
              <Input
                id="business_name"
                value={data.business_name || ''}
                onChange={(e) => updateData({ business_name: e.target.value })}
                placeholder="Auto Escola Exemplo"
                className={errors.business_name ? 'border-destructive' : ''}
              />
              {errors.business_name && (
                <p className="text-sm text-destructive mt-1">{errors.business_name}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="document">
                {data.is_driving_school ? 'CNPJ *' : 'CPF *'}
              </Label>
              <Input
                id="document"
                value={data.is_driving_school ? (data.cnpj || '') : data.cpf}
                onChange={(e) => {
                  const masked = data.is_driving_school
                    ? maskCNPJ(e.target.value)
                    : maskCPF(e.target.value);
                  updateData(
                    data.is_driving_school ? { cnpj: masked } : { cpf: masked }
                  );
                }}
                placeholder={data.is_driving_school ? '00.000.000/0001-00' : '000.000.000-00'}
                className={
                  (data.is_driving_school ? errors.cnpj : errors.cpf)
                    ? 'border-destructive'
                    : ''
                }
              />
              {(data.is_driving_school ? errors.cnpj : errors.cpf) && (
                <p className="text-sm text-destructive mt-1">
                  {data.is_driving_school ? errors.cnpj : errors.cpf}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={data.phone}
                onChange={(e) => updateData({ phone: maskPhone(e.target.value) })}
                placeholder="(11) 99999-9999"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">{errors.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-4">
          <h3 className="font-medium text-foreground">Endereço</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="zipcode">CEP *</Label>
              <div className="relative">
                <Input
                  id="zipcode"
                  value={data.zipcode}
                  onChange={(e) => updateData({ zipcode: maskCEP(e.target.value) })}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  className={errors.zipcode ? 'border-destructive' : ''}
                />
                {isLoadingCep && (
                  <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                )}
              </div>
              {errors.zipcode && (
                <p className="text-sm text-destructive mt-1">{errors.zipcode}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="street">Rua *</Label>
              <Input
                id="street"
                value={data.street}
                onChange={(e) => updateData({ street: e.target.value })}
                placeholder="Rua Exemplo"
                className={errors.street ? 'border-destructive' : ''}
              />
              {errors.street && (
                <p className="text-sm text-destructive mt-1">{errors.street}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="number">Número *</Label>
              <Input
                id="number"
                value={data.number}
                onChange={(e) => updateData({ number: e.target.value })}
                placeholder="123"
                className={errors.number ? 'border-destructive' : ''}
              />
              {errors.number && (
                <p className="text-sm text-destructive mt-1">{errors.number}</p>
              )}
            </div>

            <div>
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={data.complement}
                onChange={(e) => updateData({ complement: e.target.value })}
                placeholder="Apto 101"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                value={data.neighborhood}
                onChange={(e) => updateData({ neighborhood: e.target.value })}
                placeholder="Centro"
                className={errors.neighborhood ? 'border-destructive' : ''}
              />
              {errors.neighborhood && (
                <p className="text-sm text-destructive mt-1">{errors.neighborhood}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                value={data.city}
                onChange={(e) => updateData({ city: e.target.value })}
                placeholder="São Paulo"
                className={errors.city ? 'border-destructive' : ''}
              />
              {errors.city && (
                <p className="text-sm text-destructive mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <Label htmlFor="state">Estado *</Label>
              <Input
                id="state"
                value={data.state}
                onChange={(e) => updateData({ state: e.target.value })}
                placeholder="SP"
                maxLength={2}
                className={errors.state ? 'border-destructive' : ''}
              />
              {errors.state && (
                <p className="text-sm text-destructive mt-1">{errors.state}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/onboarding-instrutor')}
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

export default DadosBasicos;
