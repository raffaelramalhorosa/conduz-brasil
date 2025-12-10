import { Check, User, FileText, Car, DollarSign, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegistrationProgressProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const steps = [
  { id: 1, label: 'Dados Básicos', icon: User },
  { id: 2, label: 'Documentação', icon: FileText },
  { id: 3, label: 'Veículos', icon: Car },
  { id: 4, label: 'Preços', icon: DollarSign },
  { id: 5, label: 'Finalização', icon: Flag },
];

export function RegistrationProgress({ currentStep, onStepClick }: RegistrationProgressProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = step.id < currentStep;

          return (
            <div key={step.id} className="flex-1 flex items-center">
              <div className="flex flex-col items-center relative">
                <button
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300',
                    isCompleted && 'bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground',
                    isClickable && 'cursor-pointer'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </button>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center whitespace-nowrap',
                    (isCompleted || isCurrent) ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2">
                  <div
                    className={cn(
                      'h-1 rounded-full transition-all duration-300',
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
