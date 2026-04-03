import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Camera, Upload } from 'lucide-react';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { maskCPF, maskPhone, maskCEP, validateCPF } from '@/lib/masks';
import { useToast } from '@/hooks/use-toast';

const DadosBasicos = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { data, updateData, saveProgress, isSaving } = useOnboarding();
  const { toast } = useToast();
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load profile data on mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        // Fetch profile and instructor_profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url, phone')
          .eq('id', user.id)
          .single();

        const { data: instructorData } = await supabase
          .from('instructor_profiles')
          .select('cpf, city, state, zipcode, street, number, complement, neighborhood')
          .eq('user_id', user.id)
          .single();

        // Pre-fill avatar
        if (profileData?.avatar_url) {
          setPreviewUrl(profileData.avatar_url);
        }

        // Pre-fill data from signup (only if not already set in onboarding context)
        const updates: Record<string, string> = {};

        // From profiles table
        if (profileData?.phone && !data.phone) {
          updates.phone = profileData.phone;
        }

        // From instructor_profiles table
        if (instructorData) {
          if (instructorData.cpf && !data.cpf) {
            updates.cpf = instructorData.cpf;
          }
          if (instructorData.state && !data.state) {
            updates.state = instructorData.state;
          }
          if (instructorData.city && !data.city) {
            updates.city = instructorData.city;
          }
          if (instructorData.zipcode && !data.zipcode) {
            updates.zipcode = instructorData.zipcode;
          }
          if (instructorData.street && !data.street) {
            updates.street = instructorData.street;
          }
          if (instructorData.number && !data.number) {
            updates.number = instructorData.number;
          }
          if (instructorData.complement && !data.complement) {
            updates.complement = instructorData.complement;
          }
          if (instructorData.neighborhood && !data.neighborhood) {
            updates.neighborhood = instructorData.neighborhood;
          }
        }

        if (Object.keys(updates).length > 0) {
          updateData(updates);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfileData();
  }, [user]);

  // Update preview when profile changes
  useEffect(() => {
    if (profile?.avatar_url) {
      setPreviewUrl(profile.avatar_url);
    }
  }, [profile?.avatar_url]);

  const handleCepBlur = async () => {
    const cep = data.zipcode.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const result = await response.json();

      if (!result.erro) {
        updateData({
          street: result.logradouro || '',
          neighborhood: result.bairro || '',
          city: result.localidade || '',
          state: result.uf || '',
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Por favor, selecione uma imagem',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'A imagem deve ter no máximo 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      await supabase.storage
        .from('avatars')
        .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.jpeg`, `${user.id}/avatar.webp`]);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setPreviewUrl(urlData.publicUrl);
      await refreshProfile();

      toast({
        title: 'Foto atualizada com sucesso!',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Erro ao atualizar foto',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.cpf || !validateCPF(data.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    if (!data.phone || data.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Telefone inválido';
    }

    if (!data.zipcode || data.zipcode.replace(/\D/g, '').length !== 8) {
      newErrors.zipcode = 'CEP inválido';
    }

    if (!data.street?.trim()) {
      newErrors.street = 'Rua é obrigatória';
    }

    if (!data.number?.trim()) {
      newErrors.number = 'Número é obrigatório';
    }

    if (!data.neighborhood?.trim()) {
      newErrors.neighborhood = 'Bairro é obrigatório';
    }

    if (!data.city?.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    }

    if (!data.state?.trim()) {
      newErrors.state = 'Estado é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) {
      toast({
        title: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    await saveProgress();
    navigate('/onboarding-instrutor/documentacao');
  };

  // Loading skeleton
  if (isLoadingProfile) {
    return (
      <OnboardingLayout step={1}>
        <div className="bg-card rounded-xl border p-6 md:p-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72 mb-8" />

          {/* Photo skeleton */}
          <div className="mb-8">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
                <Skeleton className="h-9 w-32" />
              </div>
            </div>
          </div>

          {/* Personal data skeleton */}
          <div className="space-y-4 mb-8">
            <Skeleton className="h-5 w-32" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          {/* Address skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full md:col-span-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full md:col-span-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout step={1}>
      <div className="bg-card rounded-xl border p-6 md:p-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Dados Básicos</h2>
        <p className="text-muted-foreground mb-8">
          Confirme seus dados pessoais e endereço
        </p>

        {/* Foto de perfil */}
        <div className="mb-8">
          <Label className="text-base font-medium mb-4 block">Foto de Perfil</Label>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <Camera className="w-8 h-8 text-primary/50" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute bottom-0 right-0 p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg transition-colors disabled:opacity-50"
              >
                {isUploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium mb-1">
                Adicione uma foto profissional
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Esta foto aparecerá no seu perfil público e ajuda alunos a te reconhecerem
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Escolher foto
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Dados pessoais */}
        <div className="space-y-4 mb-8">
          <h3 className="font-medium text-foreground">Dados Pessoais</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={data.cpf}
                onChange={(e) => updateData({ cpf: maskCPF(e.target.value) })}
                placeholder="000.000.000-00"
                className={errors.cpf ? 'border-destructive' : ''}
              />
              {errors.cpf && (
                <p className="text-sm text-destructive mt-1">{errors.cpf}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Telefone (WhatsApp) *</Label>
              <Input
                id="phone"
                value={data.phone}
                onChange={(e) => updateData({ phone: maskPhone(e.target.value) })}
                placeholder="(11) 99999-9999"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">{errors.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-4">
          <h3 className="font-medium text-foreground">Endereço</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="zipcode">CEP *</Label>
              <div className="relative">
                <Input
                  id="zipcode"
                  value={data.zipcode}
                  onChange={(e) => updateData({ zipcode: maskCEP(e.target.value) })}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  className={errors.zipcode ? 'border-destructive' : ''}
                />
                {isLoadingCep && (
                  <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                )}
              </div>
              {errors.zipcode && (
                <p className="text-sm text-destructive mt-1">{errors.zipcode}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="street">Rua *</Label>
              <Input
                id="street"
                value={data.street}
                onChange={(e) => updateData({ street: e.target.value })}
                placeholder="Rua Exemplo"
                className={errors.street ? 'border-destructive' : ''}
              />
              {errors.street && (
                <p className="text-sm text-destructive mt-1">{errors.street}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="number">Número *</Label>
              <Input
                id="number"
                value={data.number}
                onChange={(e) => updateData({ number: e.target.value })}
                placeholder="123"
                className={errors.number ? 'border-destructive' : ''}
              />
              {errors.number && (
                <p className="text-sm text-destructive mt-1">{errors.number}</p>
              )}
            </div>

            <div>
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={data.complement}
                onChange={(e) => updateData({ complement: e.target.value })}
                placeholder="Apto 101"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                value={data.neighborhood}
                onChange={(e) => updateData({ neighborhood: e.target.value })}
                placeholder="Centro"
                className={errors.neighborhood ? 'border-destructive' : ''}
              />
              {errors.neighborhood && (
                <p className="text-sm text-destructive mt-1">{errors.neighborhood}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                value={data.city}
                onChange={(e) => updateData({ city: e.target.value })}
                placeholder="São Paulo"
                className={errors.city ? 'border-destructive' : ''}
              />
              {errors.city && (
                <p className="text-sm text-destructive mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <Label htmlFor="state">Estado *</Label>
              <Input
                id="state"
                value={data.state}
                onChange={(e) => updateData({ state: e.target.value.toUpperCase() })}
                placeholder="SP"
                maxLength={2}
                className={errors.state ? 'border-destructive' : ''}
              />
              {errors.state && (
                <p className="text-sm text-destructive mt-1">{errors.state}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/onboarding-instrutor')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Button onClick={handleNext} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default DadosBasicos;
