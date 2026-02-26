import { Link } from 'react-router-dom';
import { CheckCircle, Clock, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function DrivingSchoolOnboardingSuccess() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Cadastro Enviado com Sucesso!
            </h1>
            <p className="text-muted-foreground">
              Sua autoescola foi enviada para análise.
            </p>
          </div>

          {/* Next Steps */}
          <div className="bg-muted/50 rounded-lg p-4 text-left space-y-4">
            <h3 className="font-semibold">Próximos passos:</h3>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Análise de documentos</p>
                <p className="text-sm text-muted-foreground">
                  Nossa equipe irá verificar seus documentos em até 48 horas úteis.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Notificação por e-mail</p>
                <p className="text-sm text-muted-foreground">
                  Você receberá um e-mail assim que a análise for concluída.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Acesso ao painel</p>
                <p className="text-sm text-muted-foreground">
                  Após aprovação, você terá acesso completo ao painel administrativo.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link to="/">
                Voltar para a Página Inicial
              </Link>
            </Button>
          </div>

          {/* Contact */}
          <p className="text-sm text-muted-foreground">
            Dúvidas? Entre em contato pelo{' '}
            <a href="mailto:suporte@conduzbrasil.com" className="text-primary hover:underline">
              suporte@conduzbrasil.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
