import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, AlertTriangle, Loader2, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StudentCheckinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  onSuccess?: () => void;
}

type CheckinState = 'idle' | 'loading' | 'success_validated' | 'success_distance' | 'error';

export function StudentCheckinModal({
  open,
  onOpenChange,
  bookingId,
  onSuccess,
}: StudentCheckinModalProps) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [state, setState] = useState<CheckinState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setDigits(['', '', '', '', '', '']);
      setState('idle');
      setErrorMsg('');
      setDistanceMeters(null);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open]);

  const handleDigitChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async () => {
    const code = digits.join('');
    if (code.length < 6) {
      setErrorMsg('Digite o código completo de 6 dígitos');
      return;
    }

    setState('loading');
    setErrorMsg('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-checkin`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`,
              },
              body: JSON.stringify({
                booking_id: bookingId,
                code,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }),
            }
          );
          const data = await res.json();
          if (!res.ok) {
            setState('error');
            setErrorMsg(data.error || 'Erro ao confirmar presença');
            return;
          }

          setDistanceMeters(data.distance_meters ?? null);
          setState(data.validated ? 'success_validated' : 'success_distance');
          onSuccess?.();
        } catch (err) {
          console.error('Student checkin error:', err);
          setState('error');
          setErrorMsg('Erro de conexão. Tente novamente.');
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setState('error');
        setErrorMsg('Não foi possível obter sua localização. Verifique as permissões do navegador.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const isSuccess = state === 'success_validated' || state === 'success_distance';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Presença</DialogTitle>
        </DialogHeader>

        {!isSuccess ? (
          <div className="space-y-6 py-2">
            <p className="text-sm text-muted-foreground text-center">
              Digite o código de 6 dígitos fornecido pelo seu instrutor para confirmar sua presença.
            </p>

            {/* 6-digit code input */}
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={cn(
                    'w-12 h-14 text-center text-2xl font-mono font-bold p-0',
                    'border-2 focus:border-primary',
                    state === 'error' && 'border-red-500'
                  )}
                  disabled={state === 'loading'}
                />
              ))}
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{errorMsg}</p>
              </div>
            )}

            <div className="flex items-center gap-2 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
              <p className="text-xs text-blue-300">
                Sua localização será registrada para validar a proximidade com o instrutor.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={state === 'loading' || digits.join('').length < 6}
              className="w-full"
            >
              {state === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirmando...
                </>
              ) : (
                'Confirmar Presença'
              )}
            </Button>
          </div>
        ) : (
          <div className="py-6 text-center space-y-4">
            {state === 'success_validated' ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
                <div>
                  <p className="text-lg font-semibold text-green-400">Presença confirmada!</p>
                  <p className="text-sm text-muted-foreground mt-1">Boa aula!</p>
                  {distanceMeters !== null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Distância do instrutor: {distanceMeters}m
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto" />
                <div>
                  <p className="text-lg font-semibold text-yellow-400">Check-in registrado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sua localização parece estar distante do instrutor
                    {distanceMeters !== null ? ` (${distanceMeters}m)` : ''}.
                    Isso ficará registrado.
                  </p>
                </div>
              </>
            )}
            <Button onClick={() => onOpenChange(false)} className="w-full mt-2">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
