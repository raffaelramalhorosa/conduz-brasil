import { Link } from 'react-router-dom';
import { CheckCircle, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Sucesso = () => {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-card rounded-2xl shadow-xl p-8 md:p-12 text-center border">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-4">
          Cadastro Enviado!
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Obrigado, {profile?.full_name?.split(' ')[0]}! Seu perfil foi enviado para análise.
        </p>

        <div className="space-y-4 mb-8">
          <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-4 text-left">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Análise em até 48h</p>
              <p className="text-sm text-muted-foreground">
                Nossa equipe verificará seus documentos e informações
              </p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-4 text-left">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Fique de olho no email</p>
              <p className="text-sm text-muted-foreground">
                Você receberá uma notificação quando seu perfil for aprovado
              </p>
            </div>
          </div>
        </div>

        <Link to="/">
          <Button variant="outline" className="w-full">
            Voltar para a página inicial
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Sucesso;
