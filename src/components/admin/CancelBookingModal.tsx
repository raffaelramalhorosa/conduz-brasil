import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Car, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const cancellationReasons = [
  { value: 'imprevisto', label: 'Tive um imprevisto', icon: '🚗' },
  { value: 'no_show', label: 'Aluno não compareceu', icon: '👤' },
  { value: 'veiculo', label: 'Carro com defeito', icon: '🔧' },
];

interface CancelBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<boolean>;
  studentName: string;
  isLoading?: boolean;
}

export function CancelBookingModal({
  open,
  onOpenChange,
  onConfirm,
  studentName,
  isLoading = false,
}: CancelBookingModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');

  const handleConfirm = async () => {
    if (!selectedReason) return;
    const success = await onConfirm(selectedReason);
    if (success) {
      setSelectedReason('');
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md bg-[#1A1A1A] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-red-500/10 border-b border-red-500/20 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Cancelar Aula</h2>
                  <p className="text-sm text-gray-400">com {studentName}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <p className="text-sm text-red-300">
                  <strong>Atenção:</strong> Esta ação não pode ser desfeita. O aluno será notificado sobre o cancelamento.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-white font-medium">
                  Selecione o motivo do cancelamento <span className="text-red-400">*</span>
                </Label>
                
                <RadioGroup
                  value={selectedReason}
                  onValueChange={setSelectedReason}
                  className="space-y-2"
                >
                  {cancellationReasons.map((reason) => (
                    <div
                      key={reason.value}
                      className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer
                        ${selectedReason === reason.value 
                          ? 'bg-red-500/10 border-red-500/40' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      onClick={() => setSelectedReason(reason.value)}
                    >
                      <RadioGroupItem 
                        value={reason.value} 
                        id={reason.value}
                        className="border-gray-500 text-red-400 data-[state=checked]:border-red-400"
                      />
                      <Label
                        htmlFor={reason.value}
                        className="flex-1 flex items-center gap-3 cursor-pointer"
                      >
                        <span className="text-xl">{reason.icon}</span>
                        <span className="text-white font-medium">{reason.label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#1A1A1A] border-t border-white/10 p-4 flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/10 h-11"
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={!selectedReason || isLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white h-11 font-semibold disabled:opacity-50"
              >
                {isLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
