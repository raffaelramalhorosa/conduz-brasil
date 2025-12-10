import { User, FileText, Car, DollarSign, CheckCircle2, Gift } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RegistrationData } from '@/hooks/useRegistrationForm';
import { cn } from '@/lib/utils';

interface StepFinalizationProps {
  data: RegistrationData;
  onChange: (data: Partial<RegistrationData>) => void;
  errors: Record<string, string>;
}

export function StepFinalization({ data, onChange, errors }: StepFinalizationProps) {
  const completionStatus = [
    {
      icon: User,
      label: 'Dados básicos',
      completed: !!(data.fullName && data.email && data.phone && data.cep),
    },
    {
      icon: FileText,
      label: 'Documentação',
      completed: !!(data.cnhFile && data.credentialFile && data.documentsVerified),
    },
    {
      icon: Car,
      label: 'Veículos',
      completed: data.vehicles.length > 0,
    },
    {
      icon: DollarSign,
      label: 'Preços e disponibilidade',
      completed: Object.keys(data.pricing).some(
        (key) => data.pricing[key]?.single
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Quase lá!</h2>
        <p className="text-muted-foreground">
          Revise suas informações e aceite os termos para finalizar
        </p>
      </div>

      {/* Completion Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Resumo do cadastro</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {completionStatus.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={cn(
                  'flex flex-col items-center p-4 rounded-lg text-center',
                  item.completed ? 'bg-primary/5' : 'bg-muted/50'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center mb-2',
                    item.completed
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <span className="text-sm font-medium">{item.label}</span>
                <span
                  className={cn(
                    'text-xs mt-1',
                    item.completed ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.completed ? 'Completo' : 'Pendente'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terms */}
      <div className="space-y-4">
        <h3 className="font-semibold">Termos e condições</h3>

        <div
          className={cn(
            'flex items-start gap-3 p-4 rounded-lg border',
            errors.termsAccepted ? 'border-destructive' : 'border-border'
          )}
        >
          <Checkbox
            id="termsAccepted"
            checked={data.termsAccepted}
            onCheckedChange={(checked) =>
              onChange({ termsAccepted: checked as boolean })
            }
          />
          <div>
            <Label htmlFor="termsAccepted" className="cursor-pointer">
              Li e aceito os{' '}
              <a
                href="/termos"
                target="_blank"
                className="text-primary hover:underline"
              >
                Termos de Uso
              </a>
            </Label>
          </div>
        </div>

        <div
          className={cn(
            'flex items-start gap-3 p-4 rounded-lg border',
            errors.privacyAccepted ? 'border-destructive' : 'border-border'
          )}
        >
          <Checkbox
            id="privacyAccepted"
            checked={data.privacyAccepted}
            onCheckedChange={(checked) =>
              onChange({ privacyAccepted: checked as boolean })
            }
          />
          <div>
            <Label htmlFor="privacyAccepted" className="cursor-pointer">
              Li e aceito a{' '}
              <a
                href="/privacidade"
                target="_blank"
                className="text-primary hover:underline"
              >
                Política de Privacidade
              </a>
            </Label>
          </div>
        </div>

        <div
          className={cn(
            'flex items-start gap-3 p-4 rounded-lg border',
            errors.feeAccepted ? 'border-destructive' : 'border-border'
          )}
        >
          <Checkbox
            id="feeAccepted"
            checked={data.feeAccepted}
            onCheckedChange={(checked) =>
              onChange({ feeAccepted: checked as boolean })
            }
          />
          <div>
            <Label htmlFor="feeAccepted" className="cursor-pointer">
              Aceito pagar{' '}
              <span className="font-semibold text-primary">
                12% de taxa de serviço
              </span>{' '}
              sobre cada aula agendada pela plataforma
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              A taxa cobre custos de processamento, garantia de pagamento e
              suporte ao cliente
            </p>
          </div>
        </div>
      </div>

      {/* Referral Code */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-6 h-6 text-primary" />
          <div>
            <h4 className="font-semibold">Código de indicação</h4>
            <p className="text-sm text-muted-foreground">
              Se você foi indicado por alguém, insira o código abaixo
            </p>
          </div>
        </div>
        <Input
          value={data.referralCode}
          onChange={(e) =>
            onChange({ referralCode: e.target.value.toUpperCase() })
          }
          placeholder="Ex: JOAO2024"
          className="max-w-xs"
        />
      </div>

      {/* Final Notice */}
      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Após enviar seu cadastro, você receberá um email de confirmação. A
          análise dos documentos será realizada em até 48h úteis.
        </p>
      </div>
    </div>
  );
}
