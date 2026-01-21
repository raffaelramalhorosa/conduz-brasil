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
  created_at: string;
}

const AdminVideos: React.FC = () => {
  const { user } = useAuth();
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
    setModalOpen(true);
  };

  const openEditModal = (video: InstructorVideo) => {
    setEditingVideo(video);
    setTitle(video.title);
    setDescription(video.description || '');
    setVideoUrl(video.video_url);
    setIsPublic(video.is_public);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingVideo(null);
    setTitle('');
    setDescription('');
    setVideoUrl('');
    setIsPublic(true);
  };

  const handleSave = async () => {
    if (!instructorId) return;
    if (!title.trim() || !videoUrl.trim()) {
      toast.error('Preencha o título e URL do vídeo');
      return;
    }

    setSaving(true);
    try {
      if (editingVideo) {
        // Update existing video
        const { error } = await supabase
          .from('instructor_videos')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            video_url: videoUrl.trim(),
            is_public: isPublic,
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
            video_url: videoUrl.trim(),
            is_public: isPublic,
            display_order: videos.length,
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

  const getVideoThumbnail = (url: string) => {
    // Extract YouTube video ID if it's a YouTube URL
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
    }
    
    // Extract Vimeo ID
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return null; // Vimeo requires API call for thumbnail
    }
    
    return null;
  };

  const getEmbedUrl = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return url;
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
          <p className="text-instructor-text-secondary">
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
        <div className="bg-instructor-dark-card rounded-xl border border-white/10 p-12 text-center">
          <Video className="w-16 h-16 text-instructor-text-secondary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Nenhum vídeo cadastrado</h3>
          <p className="text-instructor-text-secondary mb-6">
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
            const thumbnail = getVideoThumbnail(video.video_url);
            
            return (
              <div
                key={video.id}
                className="bg-instructor-dark-card rounded-xl border border-white/10 overflow-hidden group"
              >
                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-white/5">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-12 h-12 text-instructor-text-secondary" />
                    </div>
                  )}
                  
                  {/* Overlay with play button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 bg-primary rounded-full hover:bg-primary/90 transition-colors"
                    >
                      <Play className="w-8 h-8 text-primary-foreground" />
                    </a>
                  </div>
                  
                  {/* Visibility badge */}
                  <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                    video.is_public 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {video.is_public ? 'Público' : 'Oculto'}
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-1 line-clamp-1">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-sm text-instructor-text-secondary line-clamp-2 mb-3">
                      {video.description}
                    </p>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(video)}
                      className="flex-1 text-instructor-text-secondary hover:text-white hover:bg-white/5"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleVisibility(video)}
                      className="text-instructor-text-secondary hover:text-white hover:bg-white/5"
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

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-lg bg-instructor-dark-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingVideo ? 'Editar Vídeo' : 'Adicionar Vídeo'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white">Título *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Aula de estacionamento"
                className="bg-white/5 border-white/10 text-white placeholder:text-instructor-text-secondary"
              />
            </div>
            
            <div>
              <Label className="text-white">URL do Vídeo *</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-instructor-text-secondary" />
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-instructor-text-secondary"
                />
              </div>
              <p className="text-xs text-instructor-text-secondary mt-1">
                Cole o link do YouTube, Vimeo ou outro serviço de vídeo
              </p>
            </div>
            
            <div>
              <Label className="text-white">Descrição</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição do conteúdo do vídeo..."
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-instructor-text-secondary"
              />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-white">Vídeo público</Label>
                <p className="text-xs text-instructor-text-secondary">
                  Visível no seu perfil para todos
                </p>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            {/* Preview */}
            {videoUrl && getVideoThumbnail(videoUrl) && (
              <div>
                <Label className="text-white mb-2 block">Preview</Label>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-white/5">
                  <img
                    src={getVideoThumbnail(videoUrl)!}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeModal}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90"
              disabled={saving || !title.trim() || !videoUrl.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : editingVideo ? (
                'Salvar Alterações'
              ) : (
                'Adicionar Vídeo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="bg-instructor-dark-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remover vídeo?</AlertDialogTitle>
            <AlertDialogDescription className="text-instructor-text-secondary">
              Esta ação não pode ser desfeita. O vídeo será removido permanentemente do seu perfil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
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
