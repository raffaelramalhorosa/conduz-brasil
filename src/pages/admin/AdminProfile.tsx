import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  Edit2, 
  CheckCircle, 
  Star, 
  Mail, 
  Phone, 
  FileText, 
  Calendar, 
  MapPin,
  Lock,
  Bell,
  Trash2,
  ChevronRight,
  Loader2,
  X,
  Upload,
  ImageIcon
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  user_type: 'student' | 'instructor' | 'driving_school';
  created_at: string;
  updated_at: string;
}

interface InstructorProfile {
  id: string;
  user_id: string;
  bio: string | null;
  cpf: string | null;
  cnpj: string | null;
  experience_years: number | null;
  average_rating: number | null;
  total_reviews: number | null;
  total_classes: number | null;
  is_driving_school: boolean | null;
  verification_status: string | null;
  cover_photo_url: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
}

const AdminProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [instructorProfile, setInstructorProfile] = useState<InstructorProfile | null>(null);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);
  
  // Avatar upload states
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Banner upload states
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      setProfile(profileData as Profile);
      
      const { data: instructorData, error: instructorError } = await supabase
        .from('instructor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!instructorError && instructorData) {
        setInstructorProfile(instructorData as InstructorProfile);
        
        const { data: specialtiesData } = await supabase
          .from('instructor_specialties')
          .select('specialty')
          .eq('instructor_id', instructorData.id);
        
        setSpecialties(specialtiesData?.map(s => s.specialty) || []);
      }
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  // Avatar upload functions
  const validateAndSetFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return false;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAvatarModalOpen(true);
    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile || !user) return;

    setUploadingAvatar(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      await supabase.storage
        .from('avatars')
        .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.jpeg`, `${user.id}/avatar.webp`]);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile, {
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

      setProfile(prev => prev ? { ...prev, avatar_url: urlData.publicUrl } : null);
      
      toast.success('Foto atualizada com sucesso!');
      closeAvatarModal();

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao atualizar foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const closeAvatarModal = () => {
    setAvatarModalOpen(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    setAvatarModalOpen(true);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Banner upload functions
  const handleBannerFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setSelectedBannerFile(file);
    setBannerPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadBanner = async () => {
    if (!selectedBannerFile || !user || !instructorProfile) return;

    setUploadingBanner(true);

    try {
      const fileExt = selectedBannerFile.name.split('.').pop();
      const fileName = `${user.id}/banner-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('instructor-banners')
        .upload(fileName, selectedBannerFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('instructor-banners')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('instructor_profiles')
        .update({ cover_photo_url: publicUrl })
        .eq('id', instructorProfile.id);

      if (updateError) throw updateError;

      setInstructorProfile(prev => prev ? { ...prev, cover_photo_url: publicUrl } : null);
      toast.success('Banner atualizado com sucesso!');
      closeBannerModal();
    } catch (error: any) {
      console.error('Error uploading banner:', error);
      toast.error('Erro ao fazer upload do banner: ' + (error.message || 'Tente novamente'));
    } finally {
      setUploadingBanner(false);
    }
  };

  const closeBannerModal = () => {
    setBannerModalOpen(false);
    setSelectedBannerFile(null);
    if (bannerPreviewUrl) {
      URL.revokeObjectURL(bannerPreviewUrl);
      setBannerPreviewUrl(null);
    }
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };

  const getUserTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      instructor: 'Instrutor',
      driving_school: 'Autoescola',
    };
    return labels[type] || type;
  };

  const getFullAddress = () => {
    if (!instructorProfile?.street) return null;
    
    return `${instructorProfile.street}, ${instructorProfile.number}${instructorProfile.complement ? `, ${instructorProfile.complement}` : ''} - ${instructorProfile.neighborhood}, ${instructorProfile.city}/${instructorProfile.state}`;
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  const formatDocument = (doc: string | null) => {
    if (!doc) return null;
    const cleaned = doc.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (cleaned.length === 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return doc;
  };

  const getSpecialtyLabel = (specialty: string) => {
    const labels: Record<string, string> = {
      first_license: 'Primeira Habilitação',
      renewal: 'Reciclagem',
      anxious_students: 'Alunos Ansiosos',
      elderly: 'Terceira Idade',
      english_classes: 'Aulas em Inglês',
      defensive_driving: 'Direção Defensiva',
      night_classes: 'Aulas Noturnas',
    };
    return labels[specialty] || specialty;
  };

  const handleDeleteAccount = async () => {
    toast.error('Funcionalidade em desenvolvimento');
    setDeleteAccountModal(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-instructor-dark-card rounded-xl border border-white/10">
              <Skeleton className="h-32 rounded-t-xl bg-white/5" />
              <div className="px-6 pb-6">
                <Skeleton className="w-32 h-32 rounded-full mx-auto -mt-16 mb-4 bg-white/5" />
                <Skeleton className="h-8 w-48 mx-auto mb-2 bg-white/5" />
                <Skeleton className="h-4 w-24 mx-auto mb-4 bg-white/5" />
                <Skeleton className="h-10 w-full bg-white/5" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-instructor-dark-card rounded-xl border border-white/10 p-6">
              <Skeleton className="h-6 w-48 mb-6 bg-white/5" />
              <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-12 bg-white/5" />
                <Skeleton className="h-12 bg-white/5" />
                <Skeleton className="h-12 bg-white/5" />
                <Skeleton className="h-12 bg-white/5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-instructor-dark-card rounded-xl border border-white/10 sticky top-24">
              
              {/* Header with cover photo */}
              <div className="h-32 rounded-t-xl relative overflow-hidden">
                {instructorProfile?.cover_photo_url ? (
                  <img 
                    src={instructorProfile.cover_photo_url} 
                    alt="Banner do perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary to-primary/70" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <input
                  type="file"
                  ref={bannerInputRef}
                  onChange={handleBannerFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button 
                  className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white transition-colors"
                  onClick={() => setBannerModalOpen(true)}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              
              {/* Profile photo */}
              <div className="px-6 pb-6">
                <div className="relative -mt-16 mb-4">
                  <img
                    src={profile?.avatar_url || '/placeholder.svg'}
                    alt={profile?.full_name}
                    className="w-32 h-32 rounded-full border-4 border-instructor-dark-card object-cover mx-auto shadow-lg bg-instructor-dark-tertiary"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    className="absolute bottom-2 right-1/2 translate-x-16 p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg transition-colors"
                    onClick={triggerFileInput}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Name and type */}
                <div className="text-center mb-4">
                  <h1 className="text-2xl font-bold text-white mb-1">
                    {profile?.full_name}
                  </h1>
                  <p className="text-instructor-text-secondary text-sm mb-2">
                    {getUserTypeLabel(profile?.user_type || '')}
                  </p>
                  
                  {/* Verification badge */}
                  {instructorProfile?.verification_status === 'approved' && (
                    <span className="inline-flex items-center gap-1 bg-primary/20 text-primary text-xs px-3 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Verificado
                    </span>
                  )}
                </div>
                
                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-4 h-4 text-primary fill-current" />
                      <span className="text-xl font-bold text-white">
                        {instructorProfile?.average_rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <p className="text-xs text-instructor-text-secondary">Avaliação</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-white">
                      {instructorProfile?.total_reviews || 0}
                    </p>
                    <p className="text-xs text-instructor-text-secondary">Avaliações</p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-3 text-center col-span-2">
                    <p className="text-xl font-bold text-white">
                      {instructorProfile?.total_classes || 0}
                    </p>
                    <p className="text-xs text-instructor-text-secondary">Aulas realizadas</p>
                  </div>
                </div>
                
                {/* Edit profile button */}
                <Button
                  onClick={() => navigate('/admin/perfil/editar')}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              </div>
            </div>
          </div>
          
          {/* RIGHT COLUMN - Detailed Information */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personal Information Card */}
            <div className="bg-instructor-dark-card rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Informações Pessoais</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/perfil/editar')}
                  className="text-primary hover:text-primary/80 hover:bg-white/5"
                >
                  Editar
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-instructor-text-secondary flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <p className="text-white">{profile?.email}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-instructor-text-secondary flex items-center gap-2 mb-1">
                    <Phone className="w-4 h-4" />
                    Telefone
                  </label>
                  <p className="text-white">{formatPhone(profile?.phone) || 'Não informado'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-instructor-text-secondary flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4" />
                    {instructorProfile?.is_driving_school ? 'CNPJ' : 'CPF'}
                  </label>
                  <p className="text-white">
                    {formatDocument(instructorProfile?.cnpj || instructorProfile?.cpf) || 'Não informado'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-instructor-text-secondary flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4" />
                    Experiência
                  </label>
                  <p className="text-white">
                    {instructorProfile?.experience_years || 0} anos
                  </p>
                </div>
              </div>
            </div>
            
            {/* Address Card */}
            <div className="bg-instructor-dark-card rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Endereço</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/perfil/editar')}
                  className="text-primary hover:text-primary/80 hover:bg-white/5"
                >
                  Editar
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-instructor-text-secondary flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4" />
                    Endereço Completo
                  </label>
                  <p className="text-white">
                    {getFullAddress() || 'Endereço não informado'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-instructor-text-secondary mb-1">Cidade</label>
                  <p className="text-white">
                    {instructorProfile?.city || 'Não informado'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-instructor-text-secondary mb-1">Estado</label>
                  <p className="text-white">
                    {instructorProfile?.state || 'Não informado'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Bio Card */}
            <div className="bg-instructor-dark-card rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Sobre</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/perfil/editar')}
                  className="text-primary hover:text-primary/80 hover:bg-white/5"
                >
                  Editar
                </Button>
              </div>
              
              <p className="text-instructor-text-secondary leading-relaxed">
                {instructorProfile?.bio || 'Nenhuma descrição adicionada ainda.'}
              </p>
            </div>
            
            {/* Specialties Card */}
            {specialties.length > 0 && (
              <div className="bg-instructor-dark-card rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Especialidades</h2>
                
                <div className="flex flex-wrap gap-2">
                  {specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-medium"
                    >
                      {getSpecialtyLabel(specialty)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Security Card */}
            <div className="bg-instructor-dark-card rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Segurança</h2>
              
              <div className="space-y-4">
                <Link
                  to="/admin/configuracoes"
                  className="flex items-center justify-between p-4 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-instructor-text-secondary" />
                    <div>
                      <p className="font-medium text-white">Alterar Senha</p>
                      <p className="text-sm text-instructor-text-secondary">Mantenha sua conta segura</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-instructor-text-secondary" />
                </Link>
                
                <Link
                  to="/admin/configuracoes"
                  className="flex items-center justify-between p-4 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-instructor-text-secondary" />
                    <div>
                      <p className="font-medium text-white">Notificações</p>
                      <p className="text-sm text-instructor-text-secondary">Gerenciar preferências</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-instructor-text-secondary" />
                </Link>
                
                <button
                  onClick={() => setDeleteAccountModal(true)}
                  className="w-full flex items-center justify-between p-4 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors text-red-400"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium">Excluir Conta</p>
                      <p className="text-sm opacity-80">Ação irreversível</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <AlertDialog open={deleteAccountModal} onOpenChange={setDeleteAccountModal}>
        <AlertDialogContent className="bg-instructor-dark-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription className="text-instructor-text-secondary">
              Esta ação é irreversível. Todos os seus dados, incluindo histórico de aulas e avaliações, serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Excluir Conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Avatar Upload Modal */}
      <Dialog open={avatarModalOpen} onOpenChange={(open) => !open && closeAvatarModal()}>
        <DialogContent className="sm:max-w-md bg-background border border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Atualizar Foto de Perfil</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-6 py-4">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-48 h-48 rounded-full object-cover border-4 border-white/10"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={openFilePicker}
                className={`
                  w-full h-48 border-2 border-dashed rounded-xl cursor-pointer
                  flex flex-col items-center justify-center gap-3 transition-all
                  ${isDragging 
                    ? 'border-primary bg-primary/10 scale-[1.02]' 
                    : 'border-white/20 hover:border-primary/50 hover:bg-white/5'
                  }
                `}
              >
                <div className={`
                  p-4 rounded-full transition-colors
                  ${isDragging ? 'bg-primary/20' : 'bg-white/5'}
                `}>
                  {isDragging ? (
                    <Upload className="w-8 h-8 text-primary" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-instructor-text-secondary" />
                  )}
                </div>
                <div className="text-center">
                  <p className={`font-medium ${isDragging ? 'text-primary' : 'text-white'}`}>
                    {isDragging ? 'Solte a imagem aqui' : 'Arraste uma imagem ou clique para selecionar'}
                  </p>
                  <p className="text-sm text-instructor-text-secondary mt-1">
                    PNG, JPG ou WEBP (máx. 5MB)
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={closeAvatarModal}
                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                disabled={uploadingAvatar}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUploadAvatar}
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={uploadingAvatar || !selectedFile}
              >
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Foto'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Banner Upload Modal */}
      <Dialog open={bannerModalOpen} onOpenChange={(open) => !open && closeBannerModal()}>
        <DialogContent className="sm:max-w-md bg-background border border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Alterar Banner do Perfil</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden bg-white/5">
              {bannerPreviewUrl ? (
                <img
                  src={bannerPreviewUrl}
                  alt="Preview do banner"
                  className="w-full h-full object-cover"
                />
              ) : instructorProfile?.cover_photo_url ? (
                <img
                  src={instructorProfile.cover_photo_url}
                  alt="Banner atual"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-white/50" />
                </div>
              )}
            </div>

            {/* Upload button */}
            <Button
              variant="outline"
              className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
              onClick={() => bannerInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Imagem
            </Button>

            <p className="text-xs text-instructor-text-secondary text-center">
              Recomendamos imagens com proporção 3:1 (ex: 1200x400). Máximo 5MB.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={closeBannerModal}
                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                disabled={uploadingBanner}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUploadBanner}
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={uploadingBanner || !selectedBannerFile}
              >
                {uploadingBanner ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Banner'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminProfile;
