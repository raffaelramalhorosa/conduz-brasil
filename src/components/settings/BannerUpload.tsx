import { useState, useRef } from 'react';
import { Image, Upload, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface BannerUploadProps {
  currentBannerUrl?: string | null;
  instructorProfileId?: string;
  onBannerUpdate?: (url: string | null) => void;
}

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&h=400&fit=crop';

const BannerUpload = ({ currentBannerUrl, instructorProfileId, onBannerUpdate }: BannerUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentBannerUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !instructorProfileId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/banner-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError, data } = await supabase.storage
        .from('instructor-banners')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('instructor-banners')
        .getPublicUrl(fileName);

      // Update instructor profile
      const { error: updateError } = await supabase
        .from('instructor_profiles')
        .update({ cover_photo_url: publicUrl })
        .eq('id', instructorProfileId);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      onBannerUpdate?.(publicUrl);
      toast.success('Banner atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error uploading banner:', error);
      toast.error('Erro ao fazer upload do banner: ' + (error.message || 'Tente novamente'));
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveBanner = async () => {
    if (!instructorProfileId) return;

    setRemoving(true);

    try {
      // Update instructor profile to remove banner
      const { error } = await supabase
        .from('instructor_profiles')
        .update({ cover_photo_url: null })
        .eq('id', instructorProfileId);

      if (error) throw error;

      setPreviewUrl(null);
      onBannerUpdate?.(null);
      toast.success('Banner removido com sucesso!');
    } catch (error: any) {
      console.error('Error removing banner:', error);
      toast.error('Erro ao remover banner');
    } finally {
      setRemoving(false);
    }
  };

  const displayUrl = previewUrl || DEFAULT_BANNER;
  const hasCustomBanner = !!previewUrl;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" />
          <CardTitle>Banner do Perfil</CardTitle>
        </div>
        <CardDescription>
          Personalize o banner do seu perfil público. Recomendamos imagens com proporção 3:1 (ex: 1200x400)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden bg-muted">
          <img
            src={displayUrl}
            alt="Preview do banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Overlay info */}
          <div className="absolute bottom-3 left-3 text-white text-sm">
            {hasCustomBanner ? 'Banner personalizado' : 'Banner padrão'}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || removing}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {hasCustomBanner ? 'Trocar Banner' : 'Enviar Banner'}
              </>
            )}
          </Button>

          {hasCustomBanner && (
            <Button
              variant="outline"
              onClick={handleRemoveBanner}
              disabled={uploading || removing}
            >
              {removing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Formatos aceitos: JPG, PNG, WebP. Tamanho máximo: 5MB
        </p>
      </CardContent>
    </Card>
  );
};

export default BannerUpload;
