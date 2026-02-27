import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Bell, Eye, EyeOff, Loader2, Check, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import BannerUpload from '@/components/settings/BannerUpload';
import { UnlinkSchoolModal } from '@/components/instructor/UnlinkSchoolModal';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  
  // Instructor profile data
  const [instructorProfile, setInstructorProfile] = useState<{ id: string; cover_photo_url: string | null } | null>(null);
  const [affiliations, setAffiliations] = useState<{ schoolName: string; drivingSchoolId: string }[]>([]);
  const [unlinkOpen, setUnlinkOpen] = useState<string | null>(null);
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [bookingNotifications, setBookingNotifications] = useState(true);
  const [reviewNotifications, setReviewNotifications] = useState(true);
  const [marketingNotifications, setMarketingNotifications] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  const isInstructor = profile?.user_type === 'instructor' || profile?.user_type === 'driving_school';
  const backRoute = isInstructor ? '/admin/perfil' : '/aluno/perfil';

  // Fetch instructor profile for banner
  useEffect(() => {
    const fetchInstructorProfile = async () => {
      if (!user || !isInstructor) return;

      const { data, error } = await supabase
        .from('instructor_profiles')
        .select('id, cover_photo_url')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setInstructorProfile(data);

        // Check if affiliated (multi-affiliation)
        if (profile?.user_type === 'instructor') {
          const { data: dsiList } = await supabase
            .from('driving_school_instructors')
            .select('id, driving_school_id, name')
            .eq('linked_user_id', user.id)
            .eq('status', 'active')
            .eq('is_account_linked', true);

          if (dsiList && dsiList.length > 0) {
            const schoolIds = dsiList.map(d => d.driving_school_id);
            const { data: schoolProfiles } = await supabase
              .from('instructor_profiles')
              .select('id, user_id')
              .in('id', schoolIds);

            const schoolUserIds = (schoolProfiles || []).map(p => p.user_id);
            const { data: schoolUsers } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', schoolUserIds);

            const nameMap = new Map((schoolUsers || []).map(s => [s.id, s.full_name]));
            const profileMap = new Map((schoolProfiles || []).map(p => [p.id, p.user_id]));

            const affs = dsiList.map(d => ({
              schoolName: nameMap.get(profileMap.get(d.driving_school_id) || '') || 'Autoescola',
              drivingSchoolId: d.driving_school_id,
            }));
            setAffiliations(affs);
          }
        }
      }
    };

    fetchInstructorProfile();
  }, [user, isInstructor]);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos de senha.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e a confirmação devem ser iguais.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso."
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Ocorreu um erro ao alterar sua senha.",
        variant: "destructive"
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    
    // Simulate saving - in production this would save to a user_preferences table
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({
      title: "Preferências salvas",
      description: "Suas preferências de notificação foram atualizadas."
    });
    
    setSavingNotifications(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(backRoute)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        </div>

        <div className="space-y-6">
          {/* Banner Upload - Only for instructors */}
          {isInstructor && instructorProfile && (
            <BannerUpload
              currentBannerUrl={instructorProfile.cover_photo_url}
              instructorProfileId={instructorProfile.id}
              onBannerUpdate={(url) => setInstructorProfile(prev => prev ? { ...prev, cover_photo_url: url } : null)}
            />
          )}

          {/* Password Change */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle>Alterar Senha</CardTitle>
              </div>
              <CardDescription>
                Atualize sua senha para manter sua conta segura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua nova senha"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  'Alterar Senha'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Preferências de Notificação</CardTitle>
              </div>
              <CardDescription>
                Configure como você deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Notificações por E-mail</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba atualizações importantes por e-mail
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="booking-notifications">Agendamentos</Label>
                  <p className="text-sm text-muted-foreground">
                    {isInstructor 
                      ? 'Notificações de novas solicitações e confirmações'
                      : 'Notificações sobre suas aulas agendadas'
                    }
                  </p>
                </div>
                <Switch
                  id="booking-notifications"
                  checked={bookingNotifications}
                  onCheckedChange={setBookingNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="review-notifications">Avaliações</Label>
                  <p className="text-sm text-muted-foreground">
                    {isInstructor
                      ? 'Receba notificações quando receber novas avaliações'
                      : 'Lembretes para avaliar suas aulas'
                    }
                  </p>
                </div>
                <Switch
                  id="review-notifications"
                  checked={reviewNotifications}
                  onCheckedChange={setReviewNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing-notifications">Novidades e Promoções</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba informações sobre novidades e ofertas especiais
                  </p>
                </div>
                <Switch
                  id="marketing-notifications"
                  checked={marketingNotifications}
                  onCheckedChange={setMarketingNotifications}
                />
              </div>

              <Button 
                onClick={handleSaveNotifications}
                disabled={savingNotifications}
                className="w-full"
              >
                {savingNotifications ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Salvar Preferências
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Unlink from Driving School(s) */}
          {affiliations.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Unlink className="h-5 w-5 text-destructive" />
                  <CardTitle>Desvinculação de Autoescola</CardTitle>
                </div>
                <CardDescription>
                  Você está vinculado a {affiliations.length} autoescola{affiliations.length > 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {affiliations.map((aff) => (
                  <div key={aff.drivingSchoolId} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border">
                    <span className="text-sm font-medium text-foreground">{aff.schoolName}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setUnlinkOpen(aff.drivingSchoolId)}
                    >
                      <Unlink className="mr-2 h-3 w-3" />
                      Desvincular
                    </Button>
                    <UnlinkSchoolModal
                      open={unlinkOpen === aff.drivingSchoolId}
                      onOpenChange={(open) => setUnlinkOpen(open ? aff.drivingSchoolId : null)}
                      schoolName={aff.schoolName}
                      drivingSchoolId={aff.drivingSchoolId}
                      onSuccess={() => window.location.reload()}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
