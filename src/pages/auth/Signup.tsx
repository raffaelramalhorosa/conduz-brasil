import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, Lock, User, Loader2, Car, GraduationCap, UserCog, ArrowLeft, 
  Eye, EyeOff, Phone, Building2, MapPin, Users, FileText
} from 'lucide-react';
import { z } from 'zod';
import { routes, getDashboardRoute } from '@/lib/routes';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { maskPhone, maskCNPJ, maskCPF, unmaskValue } from '@/lib/masks';
import { brazilStates, citiesByState } from '@/data/brazilStates';

type UserType = 'student' | 'instructor' | 'driving_school';

const baseSchemaObject = z.object({
  fullName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome muito longo'),
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
});

// Schema for Student and Instructor (with CPF)
const userSchema = baseSchemaObject.extend({
  cpf: z.string().min(14, 'CPF inválido'),
  phone: z.string().min(15, 'Celular inválido'),
  state: z.string().min(2, 'Selecione um estado'),
  city: z.string().min(2, 'Selecione uma cidade'),
  gender: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
});

// Schema for Driving School (with CNPJ)
const drivingSchoolSchema = baseSchemaObject.extend({
  cnpj: z.string().min(18, 'CNPJ inválido'),
  phone: z.string().min(15, 'Celular inválido'),
  state: z.string().min(2, 'Selecione um estado'),
  city: z.string().min(2, 'Selecione uma cidade'),
  gender: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
});

const Signup = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const inviteEmail = searchParams.get('email');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(inviteEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserType>(inviteToken ? 'instructor' : 'student');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Common fields for all user types
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  const { signUp, user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Update cities when state changes
  useEffect(() => {
    if (state) {
      setAvailableCities(citiesByState[state] || []);
      setCity(''); // Reset city when state changes
    }
  }, [state]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      const redirectPath = getDashboardRoute(profile.user_type);
      navigate(redirectPath, { replace: true });
    }
  }, [user, profile, navigate]);

  // Reset form when switching user types
  useEffect(() => {
    setErrors({});
  }, [userType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate based on user type
    const baseData = { fullName, email, password, confirmPassword };
    
    if (userType === 'driving_school') {
      const result = drivingSchoolSchema.safeParse({
        ...baseData,
        cnpj,
        phone,
        state,
        city,
        gender
      });
      
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    } else {
      // Use userSchema for student and instructor (with CPF)
      const result = userSchema.safeParse({
        ...baseData,
        cpf,
        phone,
        state,
        city,
        gender
      });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setLoading(true);

    // For driving school, we store as instructor with driving_school flag
    const actualUserType = userType === 'driving_school' ? 'driving_school' : userType;
    const { error } = await signUp(email, password, fullName, actualUserType);

    if (error) {
      setLoading(false);
      let errorMessage = 'Erro ao criar conta';
      
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        errorMessage = 'Este email já está cadastrado';
      } else if (error.message.includes('Password')) {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres';
      }

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return;
    }

    // Wait for auth state to update
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get the current user
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      setLoading(false);
      toast({
        title: 'Erro',
        description: 'Erro ao criar conta. Tente novamente.',
        variant: 'destructive'
      });
      return;
    }

    // Save profile data based on user type
    if (userType === 'instructor' || userType === 'driving_school') {
      const isDrivingSchool = userType === 'driving_school';
      
      const instructorData: Record<string, unknown> = {
        user_id: currentUser.id,
        cpf: isDrivingSchool ? null : cpf,
        cnpj: isDrivingSchool ? cnpj : null,
        is_driving_school: isDrivingSchool,
        city: city,
        state: state,
        onboarding_completed: false,
      };

      const { error: profileError } = await supabase
        .from('instructor_profiles')
        .upsert(instructorData as never, {
          onConflict: 'user_id'
        });

      if (profileError) {
        console.error('Error saving instructor profile:', profileError);
      }

      await supabase
        .from('profiles')
        .update({ phone })
        .eq('id', currentUser.id);
    } else if (userType === 'student') {
      const { error: studentError } = await supabase
        .from('student_profiles')
        .upsert({
          user_id: currentUser.id,
          cpf: cpf,
          city: city,
          state: state,
        }, {
          onConflict: 'user_id'
        });

      if (studentError) {
        console.error('Error saving student profile:', studentError);
      }

      await supabase
        .from('profiles')
        .update({ phone })
        .eq('id', currentUser.id);
    }

    // Send verification email via Resend
    try {
      const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
        body: {
          email,
          userId: currentUser.id,
          userName: fullName
        }
      });

      if (emailError) {
        console.error('Error sending verification email:', emailError);
        toast({
          title: 'Atenção',
          description: 'Conta criada, mas houve um erro ao enviar o email de verificação.',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('Error invoking send-verification-email:', err);
    }

    // Sign out the user (they need to verify email first)
    await supabase.auth.signOut();

    setLoading(false);

    // Navigate to verification page with necessary data
    navigate('/verificar-email', {
      state: {
        email,
        userId: currentUser.id,
        userName: fullName,
        userType: actualUserType,
        password, // Needed for auto-login after verification
        inviteToken: inviteToken || undefined, // Pass invite token for post-verification acceptance
      }
    });
  };

  const userTypeOptions = [
    { type: 'student' as UserType, label: 'Sou Aluno', icon: GraduationCap },
    { type: 'instructor' as UserType, label: 'Sou Instrutor', icon: UserCog },
    { type: 'driving_school' as UserType, label: 'Sou Autoescola', icon: Building2 },
  ];

  const inputStyles = "pl-11 h-12 rounded-lg border-border/60 bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";
  const errorInputStyles = "border-destructive focus:border-destructive focus:ring-destructive/20";

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
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="bg-primary rounded-lg p-2">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">AutoConnect</span>
        </Link>

        {/* Invite Banner */}
        {inviteToken && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg text-sm">
            <p className="text-primary font-medium">🏢 Você foi convidado por uma autoescola</p>
            <p className="text-muted-foreground text-xs mt-1">Complete seu cadastro como instrutor para aceitar o convite automaticamente.</p>
          </div>
        )}

        {/* Title */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-foreground">Criar uma conta</h1>
          <p className="text-muted-foreground mt-1 text-sm">Preencha os dados abaixo para se cadastrar</p>
        </div>

        {/* Google Button */}
        <Button 
          variant="outline" 
          className="w-full mb-5 h-12 border-border/60 hover:bg-muted/50 rounded-lg font-medium"
          type="button"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Cadastrar com Google
        </Button>

        {/* Divider */}
        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground">
              ou continue com e-mail
            </span>
          </div>
        </div>

        {/* User Type Selection - 3 buttons */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {userTypeOptions.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => setUserType(type)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                userType === type
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border/60 hover:border-primary/50'
              }`}
            >
              <Icon className={`h-6 w-6 ${userType === type ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-medium text-xs text-center leading-tight ${userType === type ? 'text-primary' : 'text-foreground'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={userType}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  {userType === 'driving_school' ? 'Nome da Autoescola' : 'Nome Completo'}
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={userType === 'driving_school' ? 'Nome da sua autoescola' : 'Seu nome completo'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`${inputStyles} ${errors.fullName ? errorInputStyles : ''}`}
                    disabled={loading}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inputStyles} ${errors.email ? errorInputStyles : ''}`}
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputStyles} pr-10 ${errors.password ? errorInputStyles : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputStyles} pr-10 ${errors.confirmPassword ? errorInputStyles : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              {/* CPF (for Student/Instructor) or CNPJ (for Driving School) */}
              {userType === 'driving_school' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="cnpj" className="text-sm font-medium">
                    CNPJ <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cnpj"
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                      maxLength={18}
                      className={`${inputStyles} ${errors.cnpj ? errorInputStyles : ''}`}
                      disabled={loading}
                    />
                  </div>
                  {errors.cnpj && (
                    <p className="text-xs text-destructive">{errors.cnpj}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="cpf" className="text-sm font-medium">
                    CPF <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(maskCPF(e.target.value))}
                      maxLength={14}
                      className={`${inputStyles} ${errors.cpf ? errorInputStyles : ''}`}
                      disabled={loading}
                    />
                  </div>
                  {errors.cpf && (
                    <p className="text-xs text-destructive">{errors.cpf}</p>
                  )}
                </div>
              )}

              {/* Phone (WhatsApp) */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Celular (WhatsApp) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    maxLength={15}
                    className={`${inputStyles} ${errors.phone ? errorInputStyles : ''}`}
                    disabled={loading}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              {/* State and City */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Estado <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select value={state} onValueChange={setState} disabled={loading}>
                      <SelectTrigger className={`h-12 pl-11 rounded-lg border-border/60 ${errors.state ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {brazilStates.map((s) => (
                          <SelectItem key={s.uf} value={s.uf}>
                            {s.uf} - {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.state && (
                    <p className="text-xs text-destructive">{errors.state}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Cidade <span className="text-destructive">*</span>
                  </Label>
                  <Select value={city} onValueChange={setCity} disabled={loading || !state}>
                    <SelectTrigger className={`h-12 rounded-lg border-border/60 ${errors.city ? 'border-destructive' : ''}`}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.city && (
                    <p className="text-xs text-destructive">{errors.city}</p>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {userType === 'driving_school' ? 'Sexo do Responsável' : 'Sexo'}
                </Label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Select value={gender} onValueChange={setGender} disabled={loading}>
                    <SelectTrigger className="h-12 pl-11 rounded-lg border-border/60">
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                      <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Essa informação ajuda alunas que preferem aprender com instrutoras mulheres por segurança.
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 rounded-lg bg-gradient-to-r from-primary to-[hsl(35,100%,50%)] hover:opacity-90 shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 font-semibold text-base" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar Conta'
            )}
          </Button>

          {/* Login Link */}
          <p className="text-sm text-muted-foreground text-center pt-2">
            Já tem uma conta?{' '}
            <Link to={routes.login} className="text-primary hover:underline font-medium">
              Faça login
            </Link>
          </p>
        </form>
      </motion.div>
    </AuthLayout>
  );
};

export default Signup;
