import { Clock, ShieldCheck, Mail, XCircle } from 'lucide-react';

interface PendingApprovalGateProps {
  verificationStatus: string | null;
  children: React.ReactNode;
  userName?: string;
}

const PendingApprovalGate = ({ verificationStatus, children, userName }: PendingApprovalGateProps) => {
  if (verificationStatus === 'approved') {
    return <>{children}</>;
  }

  if (verificationStatus === 'rejected') {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f0f23]"
        tabIndex={0}
        onKeyDown={(e) => e.preventDefault()}
      >
        <div className="max-w-md w-full mx-4 text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">
            Cadastro não aprovado
          </h1>

          <p className="text-zinc-400 leading-relaxed">
            Infelizmente seu cadastro não foi aprovado. Se acredita que houve um erro,
            entre em contato conosco pelo email{' '}
            <span className="text-[#FF8C00] font-medium">atendimento@r3d3s.com.br</span>
          </p>
        </div>
      </div>
    );
  }

  // Pendente (default)
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f0f23]"
      tabIndex={0}
      onKeyDown={(e) => e.preventDefault()}
    >
      <div className="max-w-md w-full mx-4 text-center">
        {/* Animated clock icon */}
        <div className="w-20 h-20 rounded-full bg-[#FF8C00]/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Clock className="w-10 h-10 text-[#FF8C00]" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Aguarde a aprovação
        </h1>

        <p className="text-zinc-400 leading-relaxed mb-8">
          {userName ? `Olá, ${userName.split(' ')[0]}! ` : ''}Seu cadastro está sendo analisado pela nossa equipe.
          Você receberá um email quando sua conta for aprovada.
        </p>

        <div className="space-y-3 text-left">
          <div className="flex items-center gap-3 bg-[#1a1a2e] rounded-lg p-4 border border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-sm text-zinc-300">Cadastro realizado com sucesso</span>
          </div>

          <div className="flex items-center gap-3 bg-[#1a1a2e] rounded-lg p-4 border border-[#FF8C00]/30">
            <div className="w-8 h-8 rounded-full bg-[#FF8C00]/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-[#FF8C00]" />
            </div>
            <span className="text-sm text-[#FF8C00] font-medium">Aguardando aprovação do administrador</span>
          </div>

          <div className="flex items-center gap-3 bg-[#1a1a2e] rounded-lg p-4 border border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-zinc-500" />
            </div>
            <span className="text-sm text-zinc-500">Notificação por email quando aprovado</span>
          </div>
        </div>

        <p className="text-xs text-zinc-500 mt-8">
          Dúvidas? Entre em contato:{' '}
          <span className="text-[#FF8C00]">atendimento@r3d3s.com.br</span>
        </p>
      </div>
    </div>
  );
};

export default PendingApprovalGate;
