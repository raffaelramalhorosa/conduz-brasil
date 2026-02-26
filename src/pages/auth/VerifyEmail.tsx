import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Car, Loader2, ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';

const VerifyEmail = () => {
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Get email and user data from navigation state
  const { email, userId, userName, userType, password, inviteToken } = location.state || {};

  // Redirect if no email in state
  useEffect(() => {
    if (!email || !userId) {
      navigate('/signup', { replace: true });
    }
  }, [email, userId, navigate]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue.length <= 1) {
      const newCode = [...code];
      newCode[index] = numericValue;
      setCode(newCode);
      setError(null);

      // Auto-advance to next input
      if (numericValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = useCallback(async () => {
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      setError('Digite o código completo de 6 dígitos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('verify-email-code', {
        body: { email, code: fullCode }
      });

      if (invokeError) {
        throw invokeError;
      }

      if (data.success) {
        toast({
          title: 'Email verificado!',
          description: 'Seu email foi confirmado com sucesso.',
        });

        // Auto login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          console.error('Auto login error:', signInError);
          navigate('/login', { replace: true });
          return;
        }

        // Accept invitation if present
        if (inviteToken) {
          try {
            const { data: rpcData, error: rpcErr } = await supabase.rpc('accept_affiliation_invitation' as any, {
              p_token: inviteToken,
            });
            const result = rpcData as any;
            if (!rpcErr && result?.success) {
              toast({
                title: 'Filiação aceita!',
                description: 'Conta criada e filiação aceita com sucesso!',
              });
            }
          } catch (err) {
            console.error('Error accepting invitation:', err);
          }
        }

        // Redirect based on user type
        setTimeout(() => {
          if (userType === 'driving_school') {
            navigate('/onboarding-autoescola/dados-basicos', { replace: true });
          } else if (userType === 'instructor') {
            navigate('/onboarding-instrutor', { replace: true });
          } else {
            navigate('/instrutores', { replace: true });
          }
        }, 500);
      } else {
        setError(data.error || 'Código inválido');
        if (data.remaining_attempts !== undefined) {
          setRemainingAttempts(data.remaining_attempts);
        }
        // Clear code on error
        setCode(Array(6).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError('Erro ao verificar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [code, email, password, userType, navigate, toast]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setResending(true);
    setError(null);

    try {
      const { error: invokeError } = await supabase.functions.invoke('send-verification-email', {
        body: { email, userId, userName }
      });

      if (invokeError) {
        throw invokeError;
      }

      toast({
        title: 'Código reenviado!',
        description: 'Verifique sua caixa de entrada.',
      });
      
      setResendCooldown(60);
      setCode(Array(6).fill(''));
      setRemainingAttempts(null);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.error('Resend error:', err);
      setError('Erro ao reenviar código. Tente novamente.');
    } finally {
      setResending(false);
    }
  };

  // Auto-submit when code is complete
  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && !loading) {
      // Small delay to show the last digit
      const timer = setTimeout(() => {
        handleVerify();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [code, loading, handleVerify]);

  const isCodeComplete = code.every(digit => digit !== '');

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        {/* Back Button */}
        <button
          onClick={() => navigate('/signup')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao cadastro
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-primary rounded-lg p-2">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Conduz Brasil</span>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Verifique seu email</h1>
          <p className="text-muted-foreground text-sm">
            Enviamos um código de 6 dígitos para
          </p>
          <p className="text-foreground font-medium mt-1">{email}</p>
        </div>

        {/* OTP Inputs */}
        <div className="flex justify-center gap-2 sm:gap-3 mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={loading}
              className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                error 
                  ? 'border-destructive bg-destructive/5' 
                  : digit 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border/60 bg-background hover:border-primary/50'
              }`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4"
          >
            <p className="text-destructive text-sm">{error}</p>
            {remainingAttempts !== null && remainingAttempts > 0 && (
              <p className="text-muted-foreground text-xs mt-1">
                {remainingAttempts} tentativa{remainingAttempts !== 1 ? 's' : ''} restante{remainingAttempts !== 1 ? 's' : ''}
              </p>
            )}
          </motion.div>
        )}

        {/* Verify Button */}
        <Button
          onClick={handleVerify}
          disabled={!isCodeComplete || loading}
          className="w-full h-12 rounded-xl text-base font-semibold mb-4"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            'Verificar código'
          )}
        </Button>

        {/* Resend Link */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-2">
            Não recebeu o código?
          </p>
          <button
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {resending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {resendCooldown > 0 
              ? `Reenviar em ${resendCooldown}s` 
              : 'Reenviar código'
            }
          </button>
        </div>

        {/* Help text */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          O código expira em 30 minutos. Verifique também sua pasta de spam.
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default VerifyEmail;
