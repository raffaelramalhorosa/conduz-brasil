import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckinCodePanelProps {
  bookingId: string;
  initialCode?: string;
  initialExpiresAt?: string;
  onStudentCheckedIn?: () => void;
}

export function CheckinCodePanel({
  bookingId,
  initialCode,
  initialExpiresAt,
  onStudentCheckedIn,
}: CheckinCodePanelProps) {
  const [code, setCode] = useState(initialCode || '');
  const [expiresAt, setExpiresAt] = useState<Date | null>(
    initialExpiresAt ? new Date(initialExpiresAt) : null
  );
  const [studentCheckinAt, setStudentCheckinAt] = useState<string | null>(null);
  const [checkinValidated, setCheckinValidated] = useState<boolean | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [loading, setLoading] = useState(!initialCode);
  const [timeLeft, setTimeLeft] = useState('');

  const fetchCheckinData = useCallback(async () => {
    const { data } = await supabase
      .from('bookings')
      .select('checkin_code, checkin_code_expires_at, student_checkin_at, checkin_validated, checkin_distance_meters')
      .eq('id', bookingId)
      .single();

    if (data) {
      if (data.checkin_code) setCode(data.checkin_code);
      if (data.checkin_code_expires_at) setExpiresAt(new Date(data.checkin_code_expires_at as string));
      if (data.student_checkin_at) {
        setStudentCheckinAt(data.student_checkin_at as string);
        setCheckinValidated(data.checkin_validated as boolean | null);
        setDistanceMeters(data.checkin_distance_meters as number | null);
        onStudentCheckedIn?.();
      }
    }
    setLoading(false);
  }, [bookingId, onStudentCheckedIn]);

  // Initial fetch if no code provided
  useEffect(() => {
    if (!initialCode) {
      fetchCheckinData();
    }
  }, [initialCode, fetchCheckinData]);

  // Poll every 10s for student checkin
  useEffect(() => {
    if (studentCheckinAt) return;
    const interval = setInterval(fetchCheckinData, 10000);
    return () => clearInterval(interval);
  }, [studentCheckinAt, fetchCheckinData]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const updateCountdown = () => {
      const diff = expiresAt.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expirado');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h > 0 ? `${h}h ` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (studentCheckinAt) {
    return (
      <div
        className={cn(
          'p-4 rounded-lg border text-center',
          checkinValidated
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-yellow-500/10 border-yellow-500/30',
        )}
      >
        {checkinValidated ? (
          <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
        ) : (
          <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
        )}
        <p
          className={cn(
            'font-semibold text-sm',
            checkinValidated ? 'text-green-400' : 'text-yellow-400',
          )}
        >
          {checkinValidated ? 'Aluno confirmado!' : 'Check-in registrado (localização distante)'}
        </p>
        {distanceMeters !== null && (
          <p className="text-xs text-muted-foreground mt-1">Distância: {distanceMeters}m</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Você já pode concluir a aula.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
      <p className="text-xs text-purple-300 mb-2 uppercase tracking-wider font-medium">
        Código de check-in
      </p>
      <div className="text-5xl font-mono font-bold tracking-widest text-white mb-3">
        {code || '------'}
      </div>
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <span>Expira em:</span>
        <span
          className={cn(
            'font-mono font-semibold',
            timeLeft === 'Expirado' ? 'text-red-400' : 'text-purple-300',
          )}
        >
          {timeLeft || '...'}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">Aguardando o aluno confirmar presença...</p>
      <div className="flex items-center justify-center gap-1 mt-1">
        <RefreshCw className="h-3 w-3 text-muted-foreground/40" />
        <span className="text-[10px] text-muted-foreground/40">Atualizando a cada 10s</span>
      </div>
    </div>
  );
}
