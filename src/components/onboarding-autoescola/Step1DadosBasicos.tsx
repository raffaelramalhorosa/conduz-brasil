import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDrivingSchoolOnboarding } from '@/contexts/DrivingSchoolOnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { maskCNPJ, maskPhone, maskCEP } from '@/lib/masks';
import { DrivingSchoolOnboardingLayout } from './DrivingSchoolOnboardingLayout';

export default function Step1DadosBasicos() {
  const { data, updateData, saveProgress, isLoading, isSaving } = useDrivingSchoolOnboarding();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.avatar_url) {
      setPreviewUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleCepBlur = async () => {
    const cep = data.zipcode.replace(/\D/g, '');
    if (cep.length !== 8) return;

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
      console.error('Error fetching CEP:', error);
    }
  };

  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Selecione uma imagem (JPG, PNG)',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'Tamanho máximo: 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      setPreviewUrl(urlData.publicUrl);
      refreshProfile?.();
      
      toast({
        title: 'Foto atualizada!',
        description: 'Sua foto de perfil foi salva.',
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Erro ao enviar foto',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!data.businessName?.trim()) newErrors.businessName = 'Nome fantasia é obrigatório';
    if (!data.razaoSocial?.trim()) newErrors.razaoSocial = 'Razão social é obrigatória';
    if (!data.cnpj || data.cnpj.replace(/\D/g, '').length !== 14) newErrors.cnpj = 'CNPJ inválido';
    if (!data.phone || data.phone.replace(/\D/g, '').length < 10) newErrors.phone = 'Telefone inválido';
    if (!data.zipcode || data.zipcode.replace(/\D/g, '').length !== 8) newErrors.zipcode = 'CEP inválido';
    if (!data.street?.trim()) newErrors.street = 'Rua é obrigatória';
    if (!data.number?.trim()) newErrors.number = 'Número é obrigatório';
    if (!data.neighborhood?.trim()) newErrors.neighborhood = 'Bairro é obrigatório';
    if (!data.city?.trim()) newErrors.city = 'Cidade é obrigatória';
    if (!data.state?.trim()) newErrors.state = 'Estado é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) {
      toast({
        title: 'Preencha todos os campos',
        description: 'Verifique os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    await saveProgress();
    navigate('/onboarding-autoescola/documentacao');
  };

  if (isLoading) {
    return (
      <DrivingSchoolOnboardingLayout step={1}>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-32 w-32 rounded-full mx-auto" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          </CardContent>
        </Card>
      </DrivingSchoolOnboardingLayout>
    );
  }

  return (
    <DrivingSchoolOnboardingLayout step={1}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Dados da Autoescola</CardTitle>
          <CardDescription>
            Preencha as informações básicas e adicione uma foto de perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Logo da autoescola"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                  />
                  <button
                    onClick={() => {
                      setPreviewUrl(null);
                    }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="w-32 h-32 rounded-full bg-muted border-2 border-dashed border-primary/30 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-primary mb-2" />
                      <span className="text-xs text-muted-foreground">Adicionar foto</span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            <p className="text-sm text-muted-foreground">JPG ou PNG, máximo 5MB</p>
          </div>

          {/* Business Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nome Fantasia *</Label>
              <Input
                id="businessName"
                value={data.businessName}
                onChange={(e) => updateData({ businessName: e.target.value })}
                placeholder="Auto Escola Volante"
                className={errors.businessName ? 'border-destructive' : ''}
              />
              {errors.businessName && (
                <p className="text-sm text-destructive">{errors.businessName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="razaoSocial">Razão Social *</Label>
              <Input
                id="razaoSocial"
                value={data.razaoSocial}
                onChange={(e) => updateData({ razaoSocial: e.target.value })}
                placeholder="Volante Educação de Trânsito LTDA"
                className={errors.razaoSocial ? 'border-destructive' : ''}
              />
              {errors.razaoSocial && (
                <p className="text-sm text-destructive">{errors.razaoSocial}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={data.cnpj}
                onChange={(e) => updateData({ cnpj: maskCNPJ(e.target.value) })}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className={errors.cnpj ? 'border-destructive' : ''}
              />
              {errors.cnpj && (
                <p className="text-sm text-destructive">{errors.cnpj}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={data.phone}
                onChange={(e) => updateData({ phone: maskPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={data.email || profile?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipcode">CEP *</Label>
                <Input
                  id="zipcode"
                  value={data.zipcode}
                  onChange={(e) => updateData({ zipcode: maskCEP(e.target.value) })}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  maxLength={9}
                  className={errors.zipcode ? 'border-destructive' : ''}
                />
                {errors.zipcode && (
                  <p className="text-sm text-destructive">{errors.zipcode}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street">Rua *</Label>
                <Input
                  id="street"
                  value={data.street}
                  onChange={(e) => updateData({ street: e.target.value })}
                  placeholder="Rua Principal"
                  className={errors.street ? 'border-destructive' : ''}
                />
                {errors.street && (
                  <p className="text-sm text-destructive">{errors.street}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  value={data.number}
                  onChange={(e) => updateData({ number: e.target.value })}
                  placeholder="123"
                  className={errors.number ? 'border-destructive' : ''}
                />
                {errors.number && (
                  <p className="text-sm text-destructive">{errors.number}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={data.complement}
                  onChange={(e) => updateData({ complement: e.target.value })}
                  placeholder="Sala 2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input
                  id="neighborhood"
                  value={data.neighborhood}
                  onChange={(e) => updateData({ neighborhood: e.target.value })}
                  placeholder="Centro"
                  className={errors.neighborhood ? 'border-destructive' : ''}
                />
                {errors.neighborhood && (
                  <p className="text-sm text-destructive">{errors.neighborhood}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={data.city}
                  onChange={(e) => updateData({ city: e.target.value })}
                  placeholder="São Paulo"
                  className={errors.city ? 'border-destructive' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city}</p>
                )}
              </div>

              <div className="space-y-2">
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
                  <p className="text-sm text-destructive">{errors.state}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4">
        <div className="max-w-4xl mx-auto flex justify-end">
          <Button onClick={handleNext} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Próxima Etapa →'
            )}
          </Button>
        </div>
      </div>
    </DrivingSchoolOnboardingLayout>
  );
}
