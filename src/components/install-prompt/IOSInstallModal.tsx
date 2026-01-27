import React from 'react';
import { X, Share, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IOSInstallModalProps {
  onClose: () => void;
}

export const IOSInstallModal: React.FC<IOSInstallModalProps> = ({ onClose }) => {
  const steps = [
    {
      number: 1,
      title: 'Toque no botão Compartilhar',
      description: 'Procure o ícone na barra do Safari',
      icon: <Share className="w-8 h-8 text-primary" />,
      visual: (
        <div className="w-full h-16 bg-card rounded-lg flex justify-end items-center px-4 shadow-md">
          <div className="animate-pulse">
            <Share className="w-6 h-6 text-primary" />
          </div>
        </div>
      )
    },
    {
      number: 2,
      title: 'Role para baixo no menu',
      description: 'Deslize para baixo para ver mais opções',
      icon: <ChevronDown className="w-8 h-8 text-primary" />,
      visual: (
        <div className="flex flex-col items-center">
          <ChevronDown className="w-10 h-10 text-muted-foreground animate-bounce" />
        </div>
      )
    },
    {
      number: 3,
      title: 'Toque em "Adicionar à Tela de Início"',
      description: 'O app será instalado como um ícone',
      icon: <Plus className="w-8 h-8 text-primary" />,
      visual: (
        <div className="bg-card rounded-lg px-5 py-3 flex items-center gap-3 shadow-md">
          <Plus className="w-5 h-5 text-primary" />
          <span className="text-primary font-medium">Adicionar à Tela de Início</span>
        </div>
      )
    }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[10000] flex items-end md:items-center md:justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-background rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[90vh] overflow-y-auto animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="p-6 text-center border-b relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="text-5xl mb-3">📱</div>
          <h2 className="text-2xl font-semibold text-foreground">Instale o Conduza Brasil</h2>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-8">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary text-primary-foreground text-xl font-bold flex items-center justify-center flex-shrink-0">
                {step.number}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground mb-4">{step.description}</p>
                <div className="bg-muted rounded-xl p-6 flex justify-center items-center min-h-[80px]">
                  {step.visual}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Confirm Button */}
        <div className="px-6 pb-6">
          <Button 
            onClick={onClose}
            className="w-full h-14 text-lg font-semibold"
            variant="accent"
          >
            Entendi!
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
