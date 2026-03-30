import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  Settings,
  Heart,
  Accessibility,
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

interface StudentProfile {
  id: string;
  user_id: string;
  cpf: string | null;
  date_of_birth: string | null;
  preferred_transmission: string | null;
  needs_adapted_vehicle: boolean | null;
  has_anxiety: boolean | null;
  total_classes_taken: number | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipcode: string | null;
}

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [instructorProfile, setInstructorProfile] = useState<InstructorProfile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
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

  const isInstructor = profile?.user_type === 'instructor' || profile?.user_type === 'driving_school';
  const isStudent = profile?.user_type === 'student';

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Fetch base profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      setProfile(profileData as Profile);
      
      // Fetch specific data based on user type
      if (profileData.user_type === 'instructor' || profileData.user_type === 'driving_school') {
        const { data: instructorData, error: instructorError } = await supabase
          .from('instructor_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!instructorError && instructorData) {
          setInstructorProfile(instructorData as InstructorProfile);
          
          // Fetch specialties
          const { data: specialtiesData } = await supabase
            .from('instructor_specialties')
            .select('specialty')
            .eq('instructor_id', instructorData.id);
          
          setSpecialties(specialtiesData?.map(s => s.specialty) || []);
        }
        
      } else if (profileData.user_type === 'student') {
        const { data: studentData, error: studentError } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!studentError && studentData) {
          setStudentProfile(studentData as StudentProfile);
        }
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
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return false;
    }

    // Validate file size (max 5MB)
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

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the drop zone entirely
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

      // Delete old avatar if exists
      await supabase.storage
        .from('avatars')
        .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.jpeg`, `${user.id}/avatar.webp`]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
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

  // Helper functions
  const getUserTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      student: 'Aluno',
      instructor: 'Instrutor',
      driving_school: 'Autoescola',
    };
    return labels[type] || type;
  };

  const getFullAddress = () => {
    const data = isInstructor ? instructorProfile : studentProfile;
    if (!data?.street) return null;
    
    return `${data.street}, ${data.number}${data.complement ? `, ${data.complement}` : ''} - ${data.neighborhood}, ${data.city}/${data.state}`;
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

  const getTransmissionLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      manual: 'Manual',
      automatic: 'Automático',
      both: 'Ambos',
    };
    return type ? labels[type] || 'Não especificado' : 'Não especificado';
  };

  const getEditRoute = () => {
    if (isInstructor) return '/admin/perfil';
    return '/aluno/perfil/editar';
  };

  const handleDeleteAccount = async () => {
    // This would typically involve more complex logic
    toast.error('Funcionalidade em desenvolvimento');
    setDeleteAccountModal(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-sm border">
              <Skeleton className="h-32 rounded-t-lg" />
              <div className="px-6 pb-6">
                <Skeleton className="w-32 h-32 rounded-full mx-auto -mt-16 mb-4" />
                <Skeleton className="h-8 w-48 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto mb-4" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <Skeleton className="h-6 w-48 mb-6" />
              <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-sm border sticky top-24">
              
              {/* Header with cover photo */}
              <div className="h-32 rounded-t-lg relative overflow-hidden">
                {isInstructor && instructorProfile?.cover_photo_url ? (
                  <img 
                    src={instructorProfile.cover_photo_url} 
                    alt="Banner do perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary to-primary/70" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                {isInstructor && (
                  <>
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
                  </>
                )}
              </div>
              
              {/* Profile photo */}
              <div className="px-6 pb-6">
                <div className="relative -mt-16 mb-4">
                  <img
                    src={profile?.avatar_url || '/placeholder.svg'}
                    alt={profile?.full_name}
                    className="w-32 h-32 rounded-full border-4 border-card object-cover mx-auto shadow-lg bg-muted"
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
                  <h1 className="text-2xl font-bold text-foreground mb-1">
                    {profile?.full_name}
                  </h1>
                  <p className="text-muted-foreground text-sm mb-2">
                    {getUserTypeLabel(profile?.user_type || '')}
                  </p>
                  
                  {/* Verification badge (if approved instructor) */}
                  {isInstructor && instructorProfile?.verification_status === 'approved' && (
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-3 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Verificado
                    </span>
                  )}
                </div>
                
                {/* Quick stats */}
                {isInstructor ? (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-xl font-bold text-foreground">
                          {instructorProfile?.average_rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Avaliação</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-foreground">
                        {instructorProfile?.total_reviews || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Avaliações</p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-3 text-center col-span-2">
                      <p className="text-xl font-bold text-foreground">
                        {instructorProfile?.total_classes || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Aulas realizadas</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4 text-center mb-4">
                    <p className="text-2xl font-bold text-foreground mb-1">
                      {studentProfile?.total_classes_taken || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Aulas realizadas</p>
                  </div>
                )}
                
                {/* Edit profile button */}
                <Link
                  to={getEditRoute()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar Perfil
                </Link>
              </div>
            </div>
          </div>
          
          {/* RIGHT COLUMN - Detailed Information */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personal Information Card */}
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Informações Pessoais</h2>
                <Link
                  to={getEditRoute()}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  Editar
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <p className="text-foreground">{profile?.email}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <Phone className="w-4 h-4" />
                    Telefone
                  </label>
                  <p className="text-foreground">{formatPhone(profile?.phone) || 'Não informado'}</p>
                </div>
                
                {isInstructor && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4" />
                        {instructorProfile?.is_driving_school ? 'CNPJ' : 'CPF'}
                      </label>
                      <p className="text-foreground">
                        {formatDocument(instructorProfile?.cnpj || instructorProfile?.cpf) || 'Não informado'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4" />
                        Experiência
                      </label>
                      <p className="text-foreground">
                        {instructorProfile?.experience_years || 0} anos
                      </p>
                    </div>
                  </>
                )}
                
                {isStudent && studentProfile?.date_of_birth && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4" />
                      Data de Nascimento
                    </label>
                    <p className="text-foreground">
                      {format(new Date(studentProfile.date_of_birth), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Address Card */}
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Endereço</h2>
                <Link
                  to={getEditRoute()}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  Editar
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4" />
                    Endereço Completo
                  </label>
                  <p className="text-foreground">
                    {getFullAddress() || 'Endereço não informado'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1">Cidade</label>
                  <p className="text-foreground">
                    {(isInstructor ? instructorProfile?.city : studentProfile?.city) || 'Não informado'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1">Estado</label>
                  <p className="text-foreground">
                    {(isInstructor ? instructorProfile?.state : studentProfile?.state) || 'Não informado'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Bio Card (instructor only) */}
            {isInstructor && (
              <div className="bg-card rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">Sobre</h2>
                  <Link
                    to={getEditRoute()}
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    Editar
                  </Link>
                </div>
                
                <p className="text-muted-foreground leading-relaxed">
                  {instructorProfile?.bio || 'Nenhuma descrição adicionada ainda.'}
                </p>
              </div>
            )}
            
            {/* Specialties Card (instructor) */}
            {isInstructor && specialties.length > 0 && (
              <div className="bg-card rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Especialidades</h2>
                
                <div className="flex flex-wrap gap-2">
                  {specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {getSpecialtyLabel(specialty)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Preferences Card (student) */}
            {isStudent && (
              <div className="bg-card rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">Preferências</h2>
                  <Link
                    to={getEditRoute()}
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    Editar
                  </Link>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tipo de Câmbio</p>
                      <p className="text-foreground">
                        {getTransmissionLabel(studentProfile?.preferred_transmission)}
                      </p>
                    </div>
                  </div>
                  
                  {studentProfile?.needs_adapted_vehicle && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Accessibility className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-foreground">Necessita veículo adaptado</p>
                      </div>
                    </div>
                  )}
                  
                  {studentProfile?.has_anxiety && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-foreground">Prefere instrutores pacientes (ansiedade)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Security Card */}
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Segurança</h2>
              
              <div className="space-y-4">
                <Link
                  to={isInstructor ? '/admin/configuracoes' : '/aluno/configuracoes'}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Alterar Senha</p>
                      <p className="text-sm text-muted-foreground">Mantenha sua conta segura</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
                
                <Link
                  to={isInstructor ? '/admin/configuracoes' : '/aluno/configuracoes'}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Notificações</p>
                      <p className="text-sm text-muted-foreground">Gerenciar preferências</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
                
                <button
                  onClick={() => setDeleteAccountModal(true)}
                  className="w-full flex items-center justify-between p-4 border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors text-destructive"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os seus dados, incluindo histórico de aulas e avaliações, serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Avatar Upload Modal */}
      <Dialog open={avatarModalOpen} onOpenChange={(open) => !open && closeAvatarModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Foto de Perfil</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-6 py-4">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-48 h-48 rounded-full object-cover border-4 border-muted"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
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
                  w-full h-36 sm:h-40 md:h-48 border-2 border-dashed rounded-xl cursor-pointer
                  flex flex-col items-center justify-center gap-3 transition-all
                  ${isDragging 
                    ? 'border-primary bg-primary/10 scale-[1.02]' 
                    : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <div className={`
                  p-4 rounded-full transition-colors
                  ${isDragging ? 'bg-primary/20' : 'bg-muted'}
                `}>
                  {isDragging ? (
                    <Upload className="w-8 h-8 text-primary" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="text-center">
                  <p className={`font-medium ${isDragging ? 'text-primary' : 'text-foreground'}`}>
                    {isDragging ? 'Solte a imagem aqui' : 'Arraste uma imagem ou clique para selecionar'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PNG, JPG ou WEBP (máx. 5MB)
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={closeAvatarModal}
                className="flex-1"
                disabled={uploadingAvatar}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUploadAvatar}
                className="flex-1"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Banner do Perfil</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative w-full aspect-[3/1] rounded-lg overflow-hidden bg-muted">
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
              className="w-full"
              onClick={() => bannerInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Imagem
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Recomendamos imagens com proporção 3:1 (ex: 1200x400). Máximo 5MB.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={closeBannerModal}
                className="flex-1"
                disabled={uploadingBanner}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUploadBanner}
                className="flex-1"
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

export default UserProfile;
