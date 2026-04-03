import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRegistrationForm } from '@/hooks/useRegistrationForm';
import { validateCPF, validateCNPJ, validateEmail } from '@/lib/masks';
import { RegistrationProgress } from '@/components/registration/RegistrationProgress';
import { StepBasicData } from '@/components/registration/StepBasicData';
import { StepDocumentation } from '@/components/registration/StepDocumentation';
import { StepVehicles } from '@/components/registration/StepVehicles';
import { StepPricing } from '@/components/registration/StepPricing';
import { StepFinalization } from '@/components/registration/StepFinalization';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default function InstructorRegistration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    currentStep,
    formData,
    isLoading,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    submitForm,
  } = useRegistrationForm();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.accountType) newErrors.accountType = 'Selecione o tipo de conta';
        if (!formData.fullName.trim()) newErrors.fullName = 'Nome é obrigatório';
        if (!formData.cpfCnpj.trim()) {
          newErrors.cpfCnpj = 'CPF/CNPJ é obrigatório';
        } else {
          const digits = formData.cpfCnpj.replace(/\D/g, '');
          if (digits.length <= 11 && !validateCPF(formData.cpfCnpj)) newErrors.cpfCnpj = 'CPF inválido';
          if (digits.length > 11 && !validateCNPJ(formData.cpfCnpj)) newErrors.cpfCnpj = 'CNPJ inválido';
        }
        if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
        else if (!validateEmail(formData.email)) newErrors.email = 'Email inválido';
        if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
        if (formData.accountType === 'instructor' && !formData.birthDate.trim())
          newErrors.birthDate = 'Data de nascimento é obrigatória';
        if (!formData.cep.trim()) newErrors.cep = 'CEP é obrigatório';
        if (!formData.street.trim()) newErrors.street = 'Rua é obrigatória';
        if (!formData.number.trim()) newErrors.number = 'Número é obrigatório';
        if (!formData.neighborhood.trim()) newErrors.neighborhood = 'Bairro é obrigatório';
        if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
        if (!formData.state.trim()) newErrors.state = 'Estado é obrigatório';
        break;

      case 2:
        if (!formData.cnhFile) newErrors.cnhFile = 'CNH é obrigatória';
        if (!formData.credentialFile)
          newErrors.credentialFile = 'Certidão de credenciamento é obrigatória';
        if (!formData.profilePhoto)
          newErrors.profilePhoto = 'Foto de perfil é obrigatória';
        if (formData.accountType === 'school' && !formData.businessLicense)
          newErrors.businessLicense = 'Alvará de funcionamento é obrigatório';
        if (!formData.documentsVerified)
          newErrors.documentsVerified = 'Você deve certificar que os documentos são verdadeiros';
        break;

      case 3:
        if (formData.vehicles.length === 0)
          newErrors.vehicles = 'Cadastre pelo menos um veículo';
        else {
          const incompleteVehicle = formData.vehicles.find(
            (v) => !v.brand || !v.model || !v.year || !v.plate || !v.category
          );
          if (incompleteVehicle)
            newErrors.vehicles = 'Preencha todos os campos obrigatórios dos veículos';
        }
        break;

      case 4:
        const hasPrice = Object.values(formData.pricing).some((p) => p?.single);
        if (!hasPrice) newErrors.pricing = 'Defina o preço para pelo menos um veículo';
        break;

      case 5:
        if (!formData.termsAccepted) newErrors.termsAccepted = 'Aceite os termos de uso';
        if (!formData.privacyAccepted)
          newErrors.privacyAccepted = 'Aceite a política de privacidade';
        if (!formData.feeAccepted) newErrors.feeAccepted = 'Aceite a taxa de serviço';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      nextStep();
    } else {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, aceite todos os termos para continuar.',
        variant: 'destructive',
      });
      return;
    }

    const success = await submitForm();
    if (success) {
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <NavBar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="max-w-md text-center px-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Cadastro enviado com sucesso!</h1>
            <p className="text-muted-foreground mb-8">
              Recebemos suas informações e entraremos em contato em até 48h após a
              análise dos documentos. Fique atento ao seu email!
            </p>
            <Button onClick={() => navigate('/')}>Voltar para o início</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepBasicData data={formData} onChange={updateFormData} errors={errors} />
        );
      case 2:
        return (
          <StepDocumentation
            data={formData}
            onChange={updateFormData}
            errors={errors}
          />
        );
      case 3:
        return (
          <StepVehicles data={formData} onChange={updateFormData} errors={errors} />
        );
      case 4:
        return (
          <StepPricing data={formData} onChange={updateFormData} errors={errors} />
        );
      case 5:
        return (
          <StepFinalization
            data={formData}
            onChange={updateFormData}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />

      <main className="flex-1 py-8">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Progress Bar */}
          <RegistrationProgress currentStep={currentStep} onStepClick={goToStep} />

          {/* Form Card */}
          <div className="bg-card border border-border rounded-xl shadow-lg p-6 md:p-10 mt-8">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>

            {currentStep < 5 ? (
              <Button onClick={handleNext} className="gap-2">
                Continuar
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="gap-2 min-w-[180px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Finalizar Cadastro'
                )}
              </Button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
