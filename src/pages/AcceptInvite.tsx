import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Building2, AlertTriangle, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface InvitationData {
  id: string;
  driving_school_id: string;
  email: string;
  instructor_name: string;
  token: string;
  status: string;
  email_exists: boolean;
  expires_at: string;
  driving_school_name?: string;
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (token) fetchInvitation();
  }, [token]);

  async function fetchInvitation() {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('affiliation_invitations')
        .select('*, instructor_profiles!affiliation_invitations_driving_school_id_fkey(business_name, cover_photo_url)')
        .eq('token', token)
        .maybeSingle();

      if (fetchErr) {
        toast.error(fetchErr.message);
        setError('Erro ao buscar convite. Tente novamente.');
        return;
      }

      if (!data) {
        setError('Convite não encontrado ou inválido.');
        return;
      }

      const inv = data as any;

      if (inv.status === 'accepted') {
        setError('Este convite já foi aceito.');
        return;
      }
      if (inv.status === 'rejected') {
        setError('Este convite foi recusado.');
        return;
      }
      if (inv.status === 'expired' || new Date(inv.expires_at) < new Date()) {
        setError('Este convite expirou. Solicite um novo convite à autoescola.');
        return;
      }

      // Get driving school name from joined data
      const schoolName = (inv as any).instructor_profiles?.business_name || 'Autoescola';

      setInvitation({
        ...inv,
        driving_school_name: schoolName,
      });
    } catch (err) {
      setError('Erro ao carregar o convite.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error: rpcErr } = await supabase.rpc('accept_affiliation_invitation' as any, {
        p_token: token,
      });

      const result = data as any;
      if (rpcErr || !result?.success) {
        throw new Error(result?.error || rpcErr?.message || 'Erro ao aceitar convite');
      }

      toast.success('Filiação aceita com sucesso!');
      navigate('/admin', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao aceitar convite');
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!invitation) return;
    setProcessing(true);
    try {
      await supabase
        .from('affiliation_invitations' as any)
        .update({ status: 'rejected', rejected_at: new Date().toISOString() })
        .eq('id', invitation.id);

      await supabase
        .from('driving_school_instructors')
        .update({ invitation_status: 'rejected' } as any)
        .eq('driving_school_id', invitation.driving_school_id)
        .eq('email', invitation.email);

      toast.info('Convite recusado.');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error('Erro ao recusar convite');
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="max-w-md w-full">
            <CardContent className="pt-8 pb-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold">Convite Inválido</h2>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button asChild className="mt-4">
                <Link to="/">Voltar ao início</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!invitation) return null;

  // User not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="max-w-md w-full">
            <CardContent className="pt-8 pb-6 space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Convite de Filiação</h2>
                <p className="text-muted-foreground text-sm mt-2">
                  A autoescola <strong>{invitation.driving_school_name}</strong> quer convidá-lo como instrutor filiado.
                </p>
              </div>

              {invitation.email_exists ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Faça login na sua conta para aceitar o convite.
                  </p>
                  <Button asChild className="w-full">
                    <Link to={`/login?redirect=/convite/${token}`}>
                      <LogIn className="h-4 w-4 mr-2" /> Fazer login para aceitar
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Crie sua conta gratuita para aceitar o convite.
                  </p>
                  <Button asChild className="w-full">
                    <Link to={`/signup?invite=${token}&email=${encodeURIComponent(invitation.email)}`}>
                      <UserPlus className="h-4 w-4 mr-2" /> Criar conta para aceitar
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // User logged in
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Convite de Filiação</h2>
              <p className="text-muted-foreground text-sm mt-2">
                A autoescola <strong>{invitation.driving_school_name}</strong> quer convidá-lo como instrutor filiado.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
              <p>✅ A autoescola gerenciará seus agendamentos</p>
              <p>✅ Mais alunos na sua região</p>
              <p>✅ Suporte administrativo da autoescola</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={processing}
                className="flex-1"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Recusar'}
              </Button>
              <Button
                onClick={handleAccept}
                disabled={processing}
                className="flex-1 bg-gradient-to-r from-primary to-orange-500 hover:opacity-90"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Aceitar Filiação
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
