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
  X,
} from 'lucide-react';

interface InstructorVideo {
  id: string;
  instructor_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  is_public: boolean;
  display_order: number;
  video_type: string;
  created_at: string;
}

const AdminVideos: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<InstructorVideo[]>([]);
  const [instructorId, setInstructorId] = useState<string | null>(null);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<InstructorVideo | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<InstructorVideo | null>(null);
  
  // Form states
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  
  // Upload states
  const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInstructorAndVideos();
    }
  }, [user]);

  const fetchInstructorAndVideos = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get instructor profile
      const { data: instructorData, error: instructorError } = await supabase
        .from('instructor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (instructorError) throw instructorError;
      setInstructorId(instructorData.id);

      // Get videos
      const { data: videosData, error: videosError } = await supabase
        .from('instructor_videos')
        .select('*')
        .eq('instructor_id', instructorData.id)
        .order('display_order', { ascending: true });

      if (videosError) throw videosError;
      setVideos(videosData || []);

    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Erro ao carregar vídeos');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingVideo(null);
    setTitle('');
    setDescription('');
    setVideoUrl('');
    setIsPublic(true);
    setUploadMode('url');
    setSelectedFile(null);
    setUploadProgress(0);
    setModalOpen(true);
  };

  const openEditModal = (video: InstructorVideo) => {
    setEditingVideo(video);
    setTitle(video.title);
    setDescription(video.description || '');
    setVideoUrl(video.video_url);
    setIsPublic(video.is_public);
    setUploadMode(video.video_type === 'upload' ? 'upload' : 'url');
    setSelectedFile(null);
    setUploadProgress(0);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingVideo(null);
    setTitle('');
    setDescription('');
    setVideoUrl('');
    setIsPublic(true);
    setUploadMode('url');
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Formato não suportado. Use MP4, MOV, WebM ou AVI.');
        return;
      }
      
      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 100MB');
        return;
      }
      
      setSelectedFile(file);
      setVideoUrl(''); // Clear URL if file is selected
    }
  };

  const uploadVideoFile = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Simulate progress for UX (Supabase doesn't provide real progress)
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

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('instructor-videos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Erro ao fazer upload do vídeo');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!instructorId) return;
    
    // Validate based on mode
    if (uploadMode === 'url' && !videoUrl.trim()) {
      toast.error('Preencha a URL do vídeo');
      return;
    }
    if (uploadMode === 'upload' && !selectedFile && !editingVideo) {
      toast.error('Selecione um arquivo de vídeo');
      return;
    }
    if (!title.trim()) {
      toast.error('Preencha o título do vídeo');
      return;
    }

    setSaving(true);
    try {
      let finalVideoUrl = videoUrl;
      let videoType = 'url';

      // Upload file if in upload mode
      if (uploadMode === 'upload' && selectedFile) {
        const uploadedUrl = await uploadVideoFile();
        if (!uploadedUrl) {
          setSaving(false);
          return;
        }
        finalVideoUrl = uploadedUrl;
        videoType = 'upload';
      } else if (uploadMode === 'upload' && editingVideo) {
        // Keep existing uploaded video
        finalVideoUrl = editingVideo.video_url;
        videoType = 'upload';
      }

      if (editingVideo) {
        // Update existing video
        const { error } = await supabase
          .from('instructor_videos')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            video_url: finalVideoUrl.trim(),
            is_public: isPublic,
            video_type: videoType,
          })
          .eq('id', editingVideo.id);

        if (error) throw error;
        toast.success('Vídeo atualizado com sucesso!');
      } else {
        // Create new video
        const { error } = await supabase
          .from('instructor_videos')
          .insert({
            instructor_id: instructorId,
            title: title.trim(),
            description: description.trim() || null,
            video_url: finalVideoUrl.trim(),
            is_public: isPublic,
            display_order: videos.length,
            video_type: videoType,
          });

        if (error) throw error;
        toast.success('Vídeo adicionado com sucesso!');
      }

      closeModal();
      fetchInstructorAndVideos();

    } catch (error) {
      console.error('Error saving video:', error);
      toast.error('Erro ao salvar vídeo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!videoToDelete) return;

    try {
      // If it's an uploaded video, delete from storage too
      if (videoToDelete.video_type === 'upload' && user) {
        try {
          const url = new URL(videoToDelete.video_url);
          const pathParts = url.pathname.split('/');
          const filePath = pathParts.slice(-2).join('/'); // user_id/filename
          
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
        .eq('id', videoToDelete.id);

      if (error) throw error;
      toast.success('Vídeo removido com sucesso!');
      setDeleteModalOpen(false);
      setVideoToDelete(null);
      fetchInstructorAndVideos();

    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Erro ao remover vídeo');
    }
  };

  const toggleVisibility = async (video: InstructorVideo) => {
    try {
      const { error } = await supabase
        .from('instructor_videos')
        .update({ is_public: !video.is_public })
        .eq('id', video.id);

      if (error) throw error;
      toast.success(video.is_public ? 'Vídeo ocultado' : 'Vídeo publicado');
      fetchInstructorAndVideos();

    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Erro ao alterar visibilidade');
    }
  };

  const getVideoThumbnail = (url: string, videoType: string) => {
    if (videoType === 'upload') {
      return null; // For uploaded videos, show a placeholder
    }
    
    // Extract YouTube video ID if it's a YouTube URL
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
    }
    
    return null;
  };

  const isUploadedVideo = (video: InstructorVideo) => {
    return video.video_type === 'upload';
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
          <h1 className="text-2xl font-bold text-white">Meus Vídeos</h1>
          <p className="text-gray-400">
            Gerencie os vídeos exibidos no seu perfil público
          </p>
        </div>
        <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Vídeo
        </Button>
      </div>

      {/* Videos Grid */}
      {videos.length === 0 ? (
        <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-12 text-center">
          <Video className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Nenhum vídeo cadastrado</h3>
          <p className="text-gray-400 mb-6">
            Adicione vídeos para mostrar seu trabalho no perfil público
          </p>
          <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Vídeo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => {
            const thumbnail = getVideoThumbnail(video.video_url, video.video_type);
            const isUploaded = isUploadedVideo(video);
            
            return (
              <div
                key={video.id}
                className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden group"
              >
                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-[#0D0D0D]">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : isUploaded ? (
                    <video
                      src={video.video_url}
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                  
                  {/* Overlay with play button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {isUploaded ? (
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-primary rounded-full hover:bg-primary/90 transition-colors"
                      >
                        <Play className="w-8 h-8 text-primary-foreground" />
                      </a>
                    ) : (
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-primary rounded-full hover:bg-primary/90 transition-colors"
                      >
                        <Play className="w-8 h-8 text-primary-foreground" />
                      </a>
                    )}
                  </div>
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      video.is_public 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {video.is_public ? 'Público' : 'Oculto'}
                    </div>
                    {isUploaded && (
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                        <FileVideo className="w-3 h-3 inline mr-1" />
                        Upload
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-1 line-clamp-1">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                      {video.description}
                    </p>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(video)}
                      className="flex-1 text-gray-400 hover:text-white hover:bg-white/5"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleVisibility(video)}
                      className="text-gray-400 hover:text-white hover:bg-white/5"
                    >
                      {video.is_public ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setVideoToDelete(video);
                        setDeleteModalOpen(true);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
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

      {/* Add/Edit Modal - Fixed solid background */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && !saving && !uploading && closeModal()}>
        <DialogContent className="sm:max-w-lg bg-[#1A1A1A] border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {editingVideo ? 'Editar Vídeo' : 'Adicionar Vídeo'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Title */}
            <div>
              <Label className="text-white font-medium">Título *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Aula de estacionamento"
                className="mt-1.5 bg-[#0D0D0D] border-white/10 text-white placeholder:text-gray-500 focus:border-primary"
                disabled={saving || uploading}
              />
            </div>
            
            {/* Video Source Tabs */}
            <div>
              <Label className="text-white font-medium mb-2 block">Origem do Vídeo *</Label>
              <Tabs 
                value={uploadMode} 
                onValueChange={(v) => setUploadMode(v as 'url' | 'upload')}
                className="w-full"
              >
                <TabsList className="w-full bg-[#0D0D0D] border border-white/10 p-1">
                  <TabsTrigger 
                    value="url" 
                    className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-gray-400"
                    disabled={saving || uploading}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Link Externo
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upload" 
                    className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-gray-400"
                    disabled={saving || uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="url" className="mt-3">
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="pl-10 bg-[#0D0D0D] border-white/10 text-white placeholder:text-gray-500 focus:border-primary"
                      disabled={saving || uploading}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Cole o link do YouTube, Vimeo ou outro serviço de vídeo
                  </p>
                </TabsContent>
                
                <TabsContent value="upload" className="mt-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={saving || uploading}
                  />
                  
                  {selectedFile ? (
                    <div className="bg-[#0D0D0D] border border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileVideo className="w-8 h-8 text-primary" />
                          <div>
                            <p className="text-white text-sm font-medium truncate max-w-[200px]">
                              {selectedFile.name}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                          className="text-gray-400 hover:text-white hover:bg-white/5"
                          disabled={saving || uploading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {uploading && (
                        <div className="mt-3">
                          <Progress value={uploadProgress} className="h-2" />
                          <p className="text-xs text-gray-400 mt-1 text-center">
                            {uploadProgress}% enviado...
                          </p>
                        </div>
                      )}
                    </div>
                  ) : editingVideo && uploadMode === 'upload' ? (
                    <div className="bg-[#0D0D0D] border border-white/10 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <FileVideo className="w-8 h-8 text-primary" />
                        <div>
                          <p className="text-white text-sm font-medium">Vídeo atual</p>
                          <p className="text-gray-500 text-xs">
                            Selecione um novo arquivo para substituir
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full mt-3 bg-transparent border-dashed border-white/20 text-gray-400 hover:text-white hover:bg-white/5"
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
                      <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                      <p className="text-white font-medium">Clique para selecionar</p>
                      <p className="text-gray-500 text-sm mt-1">MP4, MOV, WebM ou AVI (máx. 100MB)</p>
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
                placeholder="Breve descrição do conteúdo do vídeo..."
                rows={3}
                className="mt-1.5 bg-[#0D0D0D] border-white/10 text-white placeholder:text-gray-500 focus:border-primary resize-none"
                disabled={saving || uploading}
              />
            </div>
            
            {/* Public Switch */}
            <div className="flex items-center justify-between py-2 px-3 bg-[#0D0D0D] rounded-lg border border-white/10">
              <div>
                <Label className="text-white font-medium">Vídeo público</Label>
                <p className="text-xs text-gray-500">
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
            {uploadMode === 'url' && videoUrl && getVideoThumbnail(videoUrl, 'url') && (
              <div>
                <Label className="text-white font-medium mb-2 block">Preview</Label>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-[#0D0D0D] border border-white/10">
                  <img
                    src={getVideoThumbnail(videoUrl, 'url')!}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <a
                    href={videoUrl}
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
              className="bg-transparent border-white/10 text-gray-300 hover:bg-white/5 hover:text-white"
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
                (uploadMode === 'url' && !videoUrl.trim()) ||
                (uploadMode === 'upload' && !selectedFile && !editingVideo)
              }
            >
              {saving || uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploading ? 'Enviando...' : 'Salvando...'}
                </>
              ) : (
                editingVideo ? 'Salvar Alterações' : 'Adicionar Vídeo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="bg-[#1A1A1A] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remover vídeo?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Tem certeza que deseja remover "{videoToDelete?.title}"? 
              {videoToDelete?.video_type === 'upload' && (
                <> O arquivo também será excluído do servidor.</>
              )}
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-gray-300 hover:bg-white/5 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminVideos;
