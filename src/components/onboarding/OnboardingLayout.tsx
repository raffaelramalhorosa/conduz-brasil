import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { User, FileText, Car, DollarSign, CheckCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingLayoutProps {
  children: ReactNode;
  step: number;
}

const steps = [
  { number: 1, title: 'Dados Básicos', icon: User },
  { number: 2, title: 'Documentação', icon: FileText },
  { number: 3, title: 'Veículos', icon: Car },
  { number: 4, title: 'Preços e Horários', icon: DollarSign },
  { number: 5, title: 'Finalização', icon: CheckCircle },
];

export const OnboardingLayout = ({ children, step }: OnboardingLayoutProps) => {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">AC</span>
              </div>
              <span className="text-xl font-bold text-foreground">AutoConnect</span>
            </Link>

            <div className="text-sm text-muted-foreground">
              Etapa {step} de {steps.length}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-card border-b">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between py-6">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2 transition-colors",
                      step >= s.number
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {step > s.number ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <s.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium text-center hidden sm:block",
                      step >= s.number ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {s.title}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-1 flex-1 mx-2 mb-8 transition-colors hidden sm:block rounded-full",
                      step > s.number ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 pb-32">
        {children}
      </main>
    </div>
  );
};
