import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Image as ImageIcon,
  Video,
  Plus,
  Upload,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Play,
  Loader2,
  Link as LinkIcon,
  ExternalLink,
  FileVideo,
  FileImage,
  X,
  LayoutGrid,
} from 'lucide-react';

interface InstructorMedia {
  id: string;
  instructor_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  is_public: boolean;
  display_order: number;
  video_type: string;
  media_type: string;
  created_at: string;
}

const AdminMedia: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState<InstructorMedia[]>([]);
  const [instructorId, setInstructorId] = useState<string | null>(null);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<InstructorMedia | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<InstructorMedia | null>(null);
  
  // Form states
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  
  // Upload states
  const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInstructorAndMedia();
    }
  }, [user]);

  const fetchInstructorAndMedia = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: instructorData, error: instructorError } = await supabase
        .from('instructor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (instructorError) throw instructorError;
      setInstructorId(instructorData.id);

      const { data: mediaData, error: mediaError } = await supabase
        .from('instructor_videos')
        .select('*')
        .eq('instructor_id', instructorData.id)
        .order('display_order', { ascending: true });

      if (mediaError) throw mediaError;
      setMediaItems(mediaData || []);

    } catch (error) {
      console.error('Error fetching media:', error);
      toast.error('Erro ao carregar mídias');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingMedia(null);
    setTitle('');
    setDescription('');
    setMediaUrl('');
    setIsPublic(true);
    setMediaType('video');
    setUploadMode('url');
    setSelectedFile(null);
    setUploadProgress(0);
    setModalOpen(true);
  };

  const openEditModal = (media: InstructorMedia) => {
    setEditingMedia(media);
    setTitle(media.title);
    setDescription(media.description || '');
    setMediaUrl(media.video_url);
    setIsPublic(media.is_public);
    setMediaType(media.media_type as 'video' | 'image');
    setUploadMode(media.video_type === 'upload' ? 'upload' : 'url');
    setSelectedFile(null);
    setUploadProgress(0);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingMedia(null);
    setTitle('');
    setDescription('');
    setMediaUrl('');
    setIsPublic(true);
    setMediaType('video');
    setUploadMode('url');
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const getAcceptedFileTypes = () => {
    if (mediaType === 'image') {
      return 'image/jpeg,image/png,image/webp,image/gif';
    }
    return 'video/mp4,video/quicktime,video/webm,video/x-msvideo';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const videoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
      
      if (mediaType === 'image' && !imageTypes.includes(file.type)) {
        toast.error('Formato não suportado. Use JPG, PNG, WebP ou GIF.');
        return;
      }
      if (mediaType === 'video' && !videoTypes.includes(file.type)) {
        toast.error('Formato não suportado. Use MP4, MOV, WebM ou AVI.');
        return;
      }
      
      if (file.size > 100 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 100MB');
        return;
      }
      
      setSelectedFile(file);
      setMediaUrl('');
    }
  };

  const uploadMediaFile = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from('instructor-videos')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      setUploadProgress(100);

      const { data: urlData } = supabase.storage
        .from('instructor-videos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao fazer upload do arquivo');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!instructorId) return;
    
    if (uploadMode === 'url' && !mediaUrl.trim()) {
      toast.error('Preencha a URL da mídia');
      return;
    }
    if (uploadMode === 'upload' && !selectedFile && !editingMedia) {
      toast.error('Selecione um arquivo');
      return;
    }
    if (!title.trim()) {
      toast.error('Preencha o título');
      return;
    }

    setSaving(true);
    try {
      let finalMediaUrl = mediaUrl;
      let videoType = 'url';

      if (uploadMode === 'upload' && selectedFile) {
        const uploadedUrl = await uploadMediaFile();
        if (!uploadedUrl) {
          setSaving(false);
          return;
        }
        finalMediaUrl = uploadedUrl;
        videoType = 'upload';
      } else if (uploadMode === 'upload' && editingMedia) {
        finalMediaUrl = editingMedia.video_url;
        videoType = 'upload';
      }

      if (editingMedia) {
        const { error } = await supabase
          .from('instructor_videos')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            video_url: finalMediaUrl.trim(),
            is_public: isPublic,
            video_type: videoType,
            media_type: mediaType,
          })
          .eq('id', editingMedia.id);

        if (error) throw error;
        toast.success('Mídia atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('instructor_videos')
          .insert({
            instructor_id: instructorId,
            title: title.trim(),
            description: description.trim() || null,
            video_url: finalMediaUrl.trim(),
            is_public: isPublic,
            display_order: mediaItems.length,
            video_type: videoType,
            media_type: mediaType,
          });

        if (error) throw error;
        toast.success('Mídia adicionada com sucesso!');
      }

      closeModal();
      fetchInstructorAndMedia();

    } catch (error) {
      console.error('Error saving media:', error);
      toast.error('Erro ao salvar mídia');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!mediaToDelete) return;

    try {
      if (mediaToDelete.video_type === 'upload' && user) {
        try {
          const url = new URL(mediaToDelete.video_url);
          const pathParts = url.pathname.split('/');
          const filePath = pathParts.slice(-2).join('/');
          
          await supabase.storage
            .from('instructor-videos')
            .remove([filePath]);
        } catch (storageError) {
          console.error('Error deleting from storage:', storageError);
        }
      }

      const { error } = await supabase
        .from('instructor_videos')
        .delete()
        .eq('id', mediaToDelete.id);

      if (error) throw error;
      toast.success('Mídia removida com sucesso!');
      setDeleteModalOpen(false);
      setMediaToDelete(null);
      fetchInstructorAndMedia();

    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Erro ao remover mídia');
    }
  };

  const toggleVisibility = async (media: InstructorMedia) => {
    try {
      const { error } = await supabase
        .from('instructor_videos')
        .update({ is_public: !media.is_public })
        .eq('id', media.id);

      if (error) throw error;
      toast.success(media.is_public ? 'Mídia ocultada' : 'Mídia publicada');
      fetchInstructorAndMedia();

    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Erro ao alterar visibilidade');
    }
  };

  const getMediaThumbnail = (url: string, videoType: string, mediaTypeItem: string) => {
    if (mediaTypeItem === 'image') {
      return url;
    }
    if (videoType === 'upload') {
      return null;
    }
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
    }
    return null;
  };

  const isUploadedMedia = (media: InstructorMedia) => {
    return media.video_type === 'upload';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48 bg-white/5" />
          <Skeleton className="h-10 w-36 bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Minhas Mídias</h1>
          <p className="text-muted-foreground">
            Gerencie fotos e vídeos exibidos no seu perfil público
          </p>
        </div>
        <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Mídia
        </Button>
      </div>

      {/* Media Grid */}
      {mediaItems.length === 0 ? (
        <div className="bg-instructor-dark-card rounded-xl border border-white/10 p-12 text-center">
          <LayoutGrid className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Nenhuma mídia cadastrada</h3>
          <p className="text-muted-foreground mb-6">
            Adicione fotos e vídeos para mostrar seu trabalho no perfil público
          </p>
          <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeira Mídia
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaItems.map((media) => {
            const thumbnail = getMediaThumbnail(media.video_url, media.video_type, media.media_type);
            const isUploaded = isUploadedMedia(media);
            const isImage = media.media_type === 'image';
            
            return (
              <div
                key={media.id}
                className="bg-instructor-dark-card rounded-xl border border-white/10 overflow-hidden group"
              >
                {/* Media Thumbnail */}
                <div className="relative aspect-video bg-instructor-dark-primary">
                  {isImage ? (
                    <img
                      src={media.video_url}
                      alt={media.title}
                      className="w-full h-full object-cover"
                    />
                  ) : thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={media.title}
                      className="w-full h-full object-cover"
                    />
                  ) : isUploaded ? (
                    <video
                      src={media.video_url}
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                  )}
                  
                  {/* Overlay with title */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    {/* Play button for videos */}
                    {!isImage && (
                      <div className="flex-1 flex items-center justify-center">
                        <a
                          href={media.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 bg-primary rounded-full hover:bg-primary/90 transition-colors"
                        >
                          <Play className="w-8 h-8 text-primary-foreground" />
                        </a>
                      </div>
                    )}
                    
                    {/* Title overlay at bottom */}
                    <div className="mt-auto">
                      <p className="text-white text-sm font-medium truncate">{media.title}</p>
                    </div>
                  </div>
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      media.is_public 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-muted/20 text-muted-foreground'
                    }`}>
                      {media.is_public ? 'Público' : 'Oculto'}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isImage 
                        ? 'bg-purple-500/20 text-purple-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {isImage ? (
                        <><FileImage className="w-3 h-3 inline mr-1" />Imagem</>
                      ) : (
                        <><FileVideo className="w-3 h-3 inline mr-1" />{isUploaded ? 'Upload' : 'Link'}</>
                      )}
                    </div>
                  </div>
                </div>

                {/* Media Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-1 line-clamp-1">
                    {media.title}
                  </h3>
                  {media.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {media.description}
                    </p>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(media)}
                      className="flex-1 text-muted-foreground hover:text-white hover:bg-white/5"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleVisibility(media)}
                      className="text-muted-foreground hover:text-white hover:bg-white/5"
                    >
                      {media.is_public ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMediaToDelete(media);
                        setDeleteModalOpen(true);
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && !saving && !uploading && closeModal()}>
        <DialogContent className="sm:max-w-lg bg-instructor-dark-card border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {editingMedia ? 'Editar Mídia' : 'Adicionar Mídia'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Media Type Selection */}
            <div>
              <Label className="text-white font-medium mb-2 block">Tipo de Mídia *</Label>
              <Tabs 
                value={mediaType} 
                onValueChange={(v) => {
                  setMediaType(v as 'video' | 'image');
                  setSelectedFile(null);
                }}
                className="w-full"
              >
                <TabsList className="w-full bg-instructor-dark-primary border border-white/10 p-1">
                  <TabsTrigger 
                    value="video" 
                    className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
                    disabled={saving || uploading}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Vídeo
                  </TabsTrigger>
                  <TabsTrigger 
                    value="image" 
                    className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
                    disabled={saving || uploading}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Imagem
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Title */}
            <div>
              <Label className="text-white font-medium">Título *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={mediaType === 'image' ? 'Ex: Meu veículo' : 'Ex: Aula de estacionamento'}
                className="mt-1.5 bg-instructor-dark-primary border-white/10 text-white placeholder:text-muted-foreground focus:border-primary"
                disabled={saving || uploading}
              />
            </div>
            
            {/* Media Source Tabs */}
            <div>
              <Label className="text-white font-medium mb-2 block">
                {mediaType === 'image' ? 'Origem da Imagem *' : 'Origem do Vídeo *'}
              </Label>
              <Tabs 
                value={uploadMode} 
                onValueChange={(v) => setUploadMode(v as 'url' | 'upload')}
                className="w-full"
              >
                <TabsList className="w-full bg-instructor-dark-primary border border-white/10 p-1">
                  <TabsTrigger 
                    value="url" 
                    className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
                    disabled={saving || uploading}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Link Externo
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upload" 
                    className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground"
                    disabled={saving || uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="url" className="mt-3">
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder={mediaType === 'image' ? 'https://exemplo.com/imagem.jpg' : 'https://youtube.com/watch?v=...'}
                      className="pl-10 bg-instructor-dark-primary border-white/10 text-white placeholder:text-muted-foreground focus:border-primary"
                      disabled={saving || uploading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {mediaType === 'image' 
                      ? 'Cole o link direto da imagem (JPG, PNG, WebP)'
                      : 'Cole o link do YouTube, Vimeo ou outro serviço de vídeo'
                    }
                  </p>
                </TabsContent>
                
                <TabsContent value="upload" className="mt-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={getAcceptedFileTypes()}
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={saving || uploading}
                  />
                  
                  {selectedFile ? (
                    <div className="bg-instructor-dark-primary border border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {mediaType === 'image' ? (
                            <FileImage className="w-8 h-8 text-primary" />
                          ) : (
                            <FileVideo className="w-8 h-8 text-primary" />
                          )}
                          <div>
                            <p className="text-white text-sm font-medium truncate max-w-[200px]">
                              {selectedFile.name}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                          className="text-muted-foreground hover:text-white hover:bg-white/5"
                          disabled={saving || uploading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {uploading && (
                        <div className="mt-3">
                          <Progress value={uploadProgress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1 text-center">
                            {uploadProgress}% enviado...
                          </p>
                        </div>
                      )}
                    </div>
                  ) : editingMedia && uploadMode === 'upload' ? (
                    <div className="bg-instructor-dark-primary border border-white/10 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        {editingMedia.media_type === 'image' ? (
                          <FileImage className="w-8 h-8 text-primary" />
                        ) : (
                          <FileVideo className="w-8 h-8 text-primary" />
                        )}
                        <div>
                          <p className="text-white text-sm font-medium">Arquivo atual</p>
                          <p className="text-muted-foreground text-xs">
                            Selecione um novo arquivo para substituir
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full mt-3 bg-transparent border-dashed border-white/20 text-muted-foreground hover:text-white hover:bg-white/5"
                        disabled={saving || uploading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Escolher novo arquivo
                      </Button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-white/5 transition-colors"
                    >
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-white font-medium">Clique para selecionar</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        {mediaType === 'image' 
                          ? 'JPG, PNG, WebP ou GIF (máx. 100MB)'
                          : 'MP4, MOV, WebM ou AVI (máx. 100MB)'
                        }
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Description */}
            <div>
              <Label className="text-white font-medium">Descrição</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição do conteúdo..."
                rows={3}
                className="mt-1.5 bg-instructor-dark-primary border-white/10 text-white placeholder:text-muted-foreground focus:border-primary resize-none"
                disabled={saving || uploading}
              />
            </div>
            
            {/* Public Switch */}
            <div className="flex items-center justify-between py-2 px-3 bg-instructor-dark-primary rounded-lg border border-white/10">
              <div>
                <Label className="text-white font-medium">Mídia pública</Label>
                <p className="text-xs text-muted-foreground">
                  Visível no seu perfil para todos
                </p>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={saving || uploading}
              />
            </div>

            {/* Preview for URL mode */}
            {uploadMode === 'url' && mediaUrl && (
              <div>
                <Label className="text-white font-medium mb-2 block">Preview</Label>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-instructor-dark-primary border border-white/10">
                  {mediaType === 'image' ? (
                    <img
                      src={mediaUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : getMediaThumbnail(mediaUrl, 'url', 'video') ? (
                    <img
                      src={getMediaThumbnail(mediaUrl, 'url', 'video')!}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                  )}
                  <a
                    href={mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-2 bg-black/60 rounded-lg text-white hover:bg-black/80 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={closeModal}
              className="bg-transparent border-white/10 text-muted-foreground hover:bg-white/5 hover:text-white"
              disabled={saving || uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={
                saving || 
                uploading || 
                !title.trim() || 
                (uploadMode === 'url' && !mediaUrl.trim()) ||
                (uploadMode === 'upload' && !selectedFile && !editingMedia)
              }
            >
              {saving || uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploading ? 'Enviando...' : 'Salvando...'}
                </>
              ) : (
                editingMedia ? 'Salvar Alterações' : 'Adicionar Mídia'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="bg-instructor-dark-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remover mídia?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja remover "{mediaToDelete?.title}"? 
              {mediaToDelete?.video_type === 'upload' && (
                <> O arquivo também será excluído do servidor.</>
              )}
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-muted-foreground hover:bg-white/5 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMedia;
