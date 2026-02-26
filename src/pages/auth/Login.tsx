import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, Car } from 'lucide-react';
import { z } from 'zod';
import { routes, getDashboardRoute } from '@/lib/routes';
import { AuthLayout } from '@/components/auth/AuthLayout';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [userType, setUserType] = useState<'aluno' | 'instrutor'>('aluno');
  
  const { signIn, profile, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = location.state?.from || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      const redirectPath = from !== '/' ? from : getDashboardRoute(profile.user_type);
      navigate(redirectPath, { replace: true });
    }
  }, [user, profile, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate inputs
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setLoading(false);
      let errorMessage = 'Erro ao fazer login';
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha incorretos';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Por favor, confirme seu email antes de fazer login';
      }

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Bem-vindo!',
      description: 'Login realizado com sucesso'
    });

    setLoading(false);
  };

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
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="bg-primary rounded-lg p-2">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Conduz Brasil</span>
        </Link>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Entrar na sua conta</h1>
          <p className="text-muted-foreground mt-1">Digite seus dados para acessar</p>
        </div>

        {/* Google Button */}
        <Button 
          variant="outline" 
          className="w-full mb-6 py-5 border-border hover:bg-muted/50"
          type="button"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Entrar com Google
        </Button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              ou continue com e-mail
            </span>
          </div>
        </div>

        {/* User Type Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setUserType('aluno')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              userType === 'aluno'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-background border-2 border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            Sou Aluno
          </button>
          <button
            type="button"
            onClick={() => setUserType('instrutor')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              userType === 'instrutor'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-background border-2 border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            Sou Instrutor
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-10 py-5 ${errors.email ? 'border-destructive' : ''}`}
                disabled={loading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`pl-10 pr-10 py-5 ${errors.password ? 'border-destructive' : ''}`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm cursor-pointer text-muted-foreground">
                Manter conectado
              </Label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full py-5 bg-gradient-to-r from-primary to-[hsl(35,100%,50%)] hover:opacity-90 shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>

          {/* Signup Link */}
          <p className="text-sm text-muted-foreground text-center pt-4">
            Não tem conta?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Cadastre-se
            </Link>
          </p>
        </form>
      </motion.div>
    </AuthLayout>
  );
};

export default Login;
