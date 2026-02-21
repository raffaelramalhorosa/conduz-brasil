import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Mail, Loader2, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Phone, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAutoescolaActions } from '@/hooks/useAutoescolaActions';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

interface NovoInstrutorModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'email' | 'form' | 'confirmation';
type EmailCheckResult = {
  scenario: 'not_found' | 'found_available' | 'found_affiliated';
  full_name?: string;
  user_id?: string;
  user_type?: string;
  affiliated_school_name?: string;
  avatar_url?: string;
} | null;

const LICENSE_CATEGORIES = ['A', 'B', 'C', 'D', 'E'];
const REFERENCE_LESSON_PRICE = 80;

export function NovoInstrutorModal({ open, onClose, onSuccess }: NovoInstrutorModalProps) {
  const isMobile = useIsMobile();
  const { profile } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(false);
  const [emailResult, setEmailResult] = useState<EmailCheckResult>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields for scenario A (not found)
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [bio, setBio] = useState('');
  const [categorias, setCategorias] = useState<string[]>(['B']);

  // Commission fields (shared)
  const [commissionType, setCommissionType] = useState<'percentage' | 'fixed'>('percentage');
  const [commissionValue, setCommissionValue] = useState('30');

  const [sentName, setSentName] = useState('');

  function resetForm() {
    setStep('email');
    setEmail('');
    setEmailResult(null);
    setNome('');
    setTelefone('');
    setBio('');
    setCategorias(['B']);
    setCommissionType('percentage');
    setCommissionValue('30');
    setSentName('');
    setSubmitting(false);
    setChecking(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleCheckEmail() {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Digite um email válido');
      return;
    }

    setChecking(true);
    setEmailResult(null);

    try {
      const { data, error } = await supabase.rpc('check_email_exists' as any, {
        check_email: email.trim(),
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        setEmailResult({ scenario: 'not_found' });
      } else {
        const result = data[0];
        if (result.is_already_affiliated) {
          setEmailResult({
            scenario: 'found_affiliated',
            full_name: result.full_name,
            user_id: result.user_id,
            affiliated_school_name: result.affiliated_school_name,
          });
        } else {
          setEmailResult({
            scenario: 'found_available',
            full_name: result.full_name,
            user_id: result.user_id,
            user_type: result.user_type,
          });
        }
      }
    } catch (err: any) {
      console.error('Error checking email:', err);
      toast.error('Erro ao verificar email');
    } finally {
      setChecking(false);
    }
  }

  async function getInstructorProfileId(): Promise<string | null> {
    if (!profile?.id) return null;
    const { data } = await supabase
      .from('instructor_profiles')
      .select('id, business_name')
      .eq('user_id', profile.id)
      .single();
    return data?.id || null;
  }

  async function getDrivingSchoolName(): Promise<string> {
    if (!profile?.id) return 'Autoescola';
    const { data } = await supabase
      .from('instructor_profiles')
      .select('business_name')
      .eq('user_id', profile.id)
      .single();
    return (data as any)?.business_name || profile.full_name || 'Autoescola';
  }

  function getCommissionValues() {
    const val = parseFloat(commissionValue) || 0;
    return {
      commission_rate: commissionType === 'percentage' ? val : 0,
      fixed_fee: commissionType === 'fixed' ? val : 0,
    };
  }

  async function handleSubmitNotFound() {
    if (!nome.trim()) {
      toast.error('Preencha o nome do instrutor');
      return;
    }

    setSubmitting(true);
    try {
      const drivingSchoolId = await getInstructorProfileId();
      if (!drivingSchoolId) throw new Error('Perfil de autoescola não encontrado');

      const schoolName = await getDrivingSchoolName();
      const { commission_rate, fixed_fee } = getCommissionValues();

      const { data: dsi, error: dsiError } = await supabase
        .from('driving_school_instructors')
        .insert({
          driving_school_id: drivingSchoolId,
          name: nome.trim(),
          email: email.trim(),
          phone: telefone || null,
          bio: bio || null,
          license_categories: categorias,
          status: 'pending',
          invitation_status: 'pending_invitation',
          is_account_linked: false,
          commission_rate,
          fixed_fee,
        } as any)
        .select()
        .single();

      if (dsiError) throw dsiError;

      const { data: invitation, error: invError } = await supabase
        .from('affiliation_invitations' as any)
        .insert({
          driving_school_id: drivingSchoolId,
          email: email.trim(),
          instructor_name: nome.trim(),
          email_exists: false,
        })
        .select()
        .single();

      if (invError) throw invError;

      await supabase.functions.invoke('send-affiliation-invite', {
        body: {
          email: email.trim(),
          instructor_name: nome.trim(),
          driving_school_name: schoolName,
          invitation_token: (invitation as any).token,
          email_exists: false,
        },
      });

      setSentName(nome.trim());
      setStep('confirmation');
      toast.success(`Convite enviado para ${email}!`);
    } catch (err: any) {
      console.error('Error submitting:', err);
      toast.error(err.message || 'Erro ao cadastrar instrutor');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitFoundAvailable() {
    setSubmitting(true);
    try {
      const drivingSchoolId = await getInstructorProfileId();
      if (!drivingSchoolId) throw new Error('Perfil de autoescola não encontrado');

      const schoolName = await getDrivingSchoolName();
      const instructorName = emailResult?.full_name || email;
      const { commission_rate, fixed_fee } = getCommissionValues();

      await supabase
        .from('driving_school_instructors')
        .insert({
          driving_school_id: drivingSchoolId,
          name: instructorName,
          email: email.trim(),
          linked_user_id: emailResult?.user_id || null,
          status: 'pending',
          invitation_status: 'pending_invitation',
          is_account_linked: false,
          commission_rate,
          fixed_fee,
        } as any)
        .select()
        .single();

      const { data: invitation } = await supabase
        .from('affiliation_invitations' as any)
        .insert({
          driving_school_id: drivingSchoolId,
          email: email.trim(),
          instructor_name: instructorName,
          email_exists: true,
        })
        .select()
        .single();

      await supabase.functions.invoke('send-affiliation-invite', {
        body: {
          email: email.trim(),
          instructor_name: instructorName,
          driving_school_name: schoolName,
          invitation_token: (invitation as any).token,
          email_exists: true,
        },
      });

      if (emailResult?.user_id) {
        await supabase.from('notifications').insert({
          user_id: emailResult.user_id,
          type: 'affiliation_invite',
          title: 'Convite de Filiação',
          message: `A autoescola ${schoolName} quer convidá-lo como instrutor filiado`,
          action_url: `/convite/${(invitation as any).token}`,
        });
      }

      setSentName(instructorName);
      setStep('confirmation');
      toast.success(`Convite de filiação enviado para ${instructorName}!`);
    } catch (err: any) {
      console.error('Error:', err);
      toast.error(err.message || 'Erro ao enviar convite');
    } finally {
      setSubmitting(false);
    }
  }

  function toggleCategoria(cat: string) {
    setCategorias(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Commission preview calculation
  function getCommissionPreview() {
    const val = parseFloat(commissionValue) || 0;
    if (commissionType === 'percentage') {
      const schoolAmount = (REFERENCE_LESSON_PRICE * val) / 100;
      const instructorAmount = REFERENCE_LESSON_PRICE - schoolAmount;
      return {
        school: schoolAmount.toFixed(2),
        instructor: instructorAmount.toFixed(2),
      };
    } else {
      const instructorAmount = REFERENCE_LESSON_PRICE - val;
      return {
        school: val.toFixed(2),
        instructor: Math.max(0, instructorAmount).toFixed(2),
      };
    }
  }

  // Commission fields component with RadioGroup + Slider + Preview
  const CommissionFields = () => {
    const preview = getCommissionPreview();
    return (
      <div className="space-y-4">
        <Label className="text-zinc-300">Comissão da autoescola</Label>
        
        <RadioGroup
          value={commissionType}
          onValueChange={(val) => {
            setCommissionType(val as 'percentage' | 'fixed');
            setCommissionValue(val === 'percentage' ? '30' : '15');
          }}
          className="flex gap-4"
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="percentage" />
            <span className="text-sm text-zinc-300">Porcentagem (%)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="fixed" />
            <span className="text-sm text-zinc-300">Valor fixo (R$)</span>
          </label>
        </RadioGroup>

        {commissionType === 'percentage' ? (
          <div className="space-y-3">
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="100"
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white pr-8"
                placeholder="30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">%</span>
            </div>
            <Slider
              value={[parseFloat(commissionValue) || 0]}
              onValueChange={([val]) => setCommissionValue(String(val))}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        ) : (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
            <Input
              type="number"
              min="0"
              value={commissionValue}
              onChange={(e) => setCommissionValue(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white pl-10"
              placeholder="15"
            />
          </div>
        )}

        <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-400">
          <span className="text-yellow-400">💡</span> Para uma aula de R$ {REFERENCE_LESSON_PRICE.toFixed(2)}, a autoescola receberá{' '}
          <strong className="text-white">R$ {preview.school}</strong> e o instrutor{' '}
          <strong className="text-white">R$ {preview.instructor}</strong>
        </div>
      </div>
    );
  };

  const content = (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* STEP 1: EMAIL VERIFICATION */}
        {step === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label className="text-zinc-300">Email do instrutor</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailResult(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleCheckEmail()}
                    className="bg-zinc-800 border-zinc-700 text-white pl-10"
                    placeholder="instrutor@email.com"
                  />
                </div>
                <Button
                  onClick={handleCheckEmail}
                  disabled={checking || !email.trim()}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-zinc-900 font-semibold"
                >
                  {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verificar'}
                </Button>
              </div>
            </div>

            {/* Result Cards */}
            {emailResult?.scenario === 'not_found' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-yellow-300 font-medium text-sm">Email não cadastrado</p>
                    <p className="text-zinc-400 text-xs mt-1">Este email não está na Conduz Brasil. Preencha os dados e enviaremos um convite.</p>
                  </div>
                </div>

                {/* Full form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Nome Completo *</Label>
                    <Input value={nome} onChange={(e) => setNome(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" placeholder="Nome do instrutor" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white pl-10" placeholder="(00) 00000-0000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Bio (opcional)</Label>
                    <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} className="bg-zinc-800 border-zinc-700 text-white resize-none" placeholder="Breve descrição do instrutor" rows={2} />
                    <p className="text-xs text-zinc-500">{bio.length}/200 caracteres</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Categorias de habilitação</Label>
                    <div className="flex flex-wrap gap-3">
                      {LICENSE_CATEGORIES.map(cat => (
                        <label key={cat} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={categorias.includes(cat)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCategorias([...categorias, cat]);
                              } else {
                                setCategorias(categorias.filter(c => c !== cat));
                              }
                            }}
                            className="data-[state=checked]:bg-yellow-400 data-[state=checked]:border-yellow-400"
                          />
                          <span className="font-medium text-zinc-300 text-sm">Cat {cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <CommissionFields />
                  <Button
                    onClick={handleSubmitNotFound}
                    disabled={submitting || !nome.trim()}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-zinc-900 font-semibold"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                    {submitting ? 'Enviando...' : 'Cadastrar e Enviar Convite'}
                  </Button>
                </div>
              </motion.div>
            )}

            {emailResult?.scenario === 'found_available' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-emerald-300 font-medium text-sm">Instrutor encontrado!</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 bg-zinc-800/50 rounded-lg p-3">
                    <Avatar className="h-12 w-12 border-2 border-emerald-400/30">
                      <AvatarImage src={emailResult.avatar_url || ''} />
                      <AvatarFallback className="bg-zinc-800 text-emerald-400 font-semibold">
                        {getInitials(emailResult.full_name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-semibold">{emailResult.full_name}</p>
                      <p className="text-zinc-400 text-sm">{email}</p>
                    </div>
                  </div>
                </div>
                <CommissionFields />
                <Button
                  onClick={handleSubmitFoundAvailable}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-zinc-900 font-semibold"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                  {submitting ? 'Enviando...' : 'Enviar Convite de Filiação'}
                </Button>
              </motion.div>
            )}

            {emailResult?.scenario === 'found_affiliated' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-red-300 font-medium text-sm">
                      Instrutor já filiado
                    </p>
                    <p className="text-zinc-400 text-xs mt-1">
                      <strong>{emailResult.full_name}</strong> já está filiado à autoescola <strong>{emailResult.affiliated_school_name}</strong>.
                    </p>
                    <p className="text-zinc-500 text-xs mt-2">
                      Um instrutor só pode ser filiado a uma autoescola por vez.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* STEP 2: CONFIRMATION */}
        {step === 'confirmation' && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 py-4"
          >
            <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Convite enviado!</h3>
              <p className="text-zinc-400 text-sm mt-2">
                O convite de filiação foi enviado para <strong className="text-white">{sentName}</strong> no email <strong className="text-white">{email}</strong>.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => { resetForm(); }}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-zinc-900 font-semibold"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastrar outro instrutor
              </Button>
              <Button
                variant="outline"
                onClick={() => { handleClose(); onSuccess?.(); }}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Fechar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const title = (
    <div className="flex items-center gap-2">
      <UserPlus className="h-5 w-5 text-yellow-400" />
      <span>{step === 'confirmation' ? 'Instrutor Cadastrado' : 'Novo Instrutor'}</span>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="bg-zinc-900 border-zinc-800 text-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold text-white">{title}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
