import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface OnboardingData {
  // Dados básicos
  is_driving_school: boolean;
  business_name: string | null;
  cpf: string;
  cnpj: string | null;
  phone: string;
  zipcode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  
  // Documentação
  cnh_front_url: string | null;
  cnh_back_url: string | null;
  cnh_number: string;
  instructor_license_url: string | null;
  instructor_license: string;
  business_license_url: string | null;
  
  // Profissional
  bio: string;
  experience_years: number;
  specialties: string[];
  
  // Disponibilidade
  availability: AvailabilitySlot[];
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  submitOnboarding: () => Promise<boolean>;
  isLoading: boolean;
  isSaving: boolean;
}

const initialData: OnboardingData = {
  is_driving_school: false,
  business_name: null,
  cpf: '',
  cnpj: null,
  phone: '',
  zipcode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  latitude: null,
  longitude: null,
  cnh_front_url: null,
  cnh_back_url: null,
  cnh_number: '',
  instructor_license_url: null,
  instructor_license: '',
  business_license_url: null,
  bio: '',
  experience_years: 0,
  specialties: [],
  availability: [],
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    ...initialData,
    phone: profile?.phone || '',
  });

  useEffect(() => {
    if (user) {
      loadProgress();
    }
  }, [user]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const saveProgress = async () => {
    if (!user) {
      console.error('Usuário não autenticado para salvar progresso');
      return;
    }
    setIsSaving(true);

    try {
      // Salvar no localStorage
      localStorage.setItem(
        `onboarding_${user.id}`,
        JSON.stringify({
          data,
          currentStep,
          savedAt: new Date().toISOString()
        })
      );

      // Verificar se já existe instructor_profile
      const { data: existingProfile, error: checkError } = await supabase
        .from('instructor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Erro ao verificar perfil existente:', checkError);
      }

      const profileData = {
        is_driving_school: data.is_driving_school,
        business_name: data.business_name,
        cpf: data.cpf?.replace(/\D/g, '') || null,
        cnpj: data.cnpj?.replace(/\D/g, '') || null,
        zipcode: data.zipcode?.replace(/\D/g, '') || null,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        latitude: data.latitude,
        longitude: data.longitude,
        bio: data.bio,
        experience_years: data.experience_years || null,
        // Document URLs
        cnh_front_url: data.cnh_front_url,
        cnh_back_url: data.cnh_back_url,
        cnh_number: data.cnh_number,
        instructor_license_url: data.instructor_license_url,
        instructor_license: data.instructor_license,
        business_license_url: data.business_license_url,
      };

      if (existingProfile) {
        // Atualizar perfil existente
        const { error: updateError } = await supabase
          .from('instructor_profiles')
          .update(profileData)
          .eq('user_id', user.id);
        
        if (updateError) {
          console.error('Erro ao atualizar instructor_profile:', updateError);
          throw updateError;
        }
        console.log('Perfil de instrutor atualizado com sucesso');
      } else {
        // Criar novo perfil de instrutor
        const { error: insertError } = await supabase
          .from('instructor_profiles')
          .insert({
            user_id: user.id,
            ...profileData,
            verification_status: 'pending',
            is_active: false,
          });
        
        if (insertError) {
          console.error('Erro ao criar instructor_profile:', insertError);
          throw insertError;
        }
        console.log('Perfil de instrutor criado com sucesso');
      }

      // Atualizar telefone no profile principal
      if (data.phone) {
        const { error: phoneError } = await supabase
          .from('profiles')
          .update({ phone: data.phone.replace(/\D/g, '') })
          .eq('id', user.id);
        
        if (phoneError) {
          console.error('Erro ao atualizar telefone:', phoneError);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const loadProgress = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Verificar se já tem dados no banco
      const { data: instructorProfile } = await supabase
        .from('instructor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (instructorProfile && instructorProfile.verification_status === 'pending') {
        // Carregar dados do banco
        setData(prev => ({
          ...prev,
          is_driving_school: instructorProfile.is_driving_school || false,
          business_name: instructorProfile.business_name,
          cpf: instructorProfile.cpf || '',
          cnpj: instructorProfile.cnpj || '',
          zipcode: instructorProfile.zipcode || '',
          street: instructorProfile.street || '',
          number: instructorProfile.number || '',
          complement: instructorProfile.complement || '',
          neighborhood: instructorProfile.neighborhood || '',
          city: instructorProfile.city || '',
          state: instructorProfile.state || '',
          latitude: instructorProfile.latitude ? Number(instructorProfile.latitude) : null,
          longitude: instructorProfile.longitude ? Number(instructorProfile.longitude) : null,
          bio: instructorProfile.bio || '',
          experience_years: instructorProfile.experience_years || 0,
          cnh_front_url: instructorProfile.cnh_front_url,
          cnh_back_url: instructorProfile.cnh_back_url,
          cnh_number: instructorProfile.cnh_number || '',
          instructor_license_url: instructorProfile.instructor_license_url,
          instructor_license: instructorProfile.instructor_license || '',
          business_license_url: instructorProfile.business_license_url,
        }));

        // Carregar especialidades
        const { data: specialties } = await supabase
          .from('instructor_specialties')
          .select('specialty')
          .eq('instructor_id', instructorProfile.id);

        if (specialties) {
          setData(prev => ({
            ...prev,
            specialties: specialties.map(s => s.specialty)
          }));
        }

        // Carregar disponibilidade
        const { data: availability } = await supabase
          .from('instructor_availability')
          .select('*')
          .eq('instructor_id', instructorProfile.id);

        if (availability) {
          setData(prev => ({
            ...prev,
            availability: availability.map(a => ({
              day_of_week: a.day_of_week,
              start_time: a.start_time,
              end_time: a.end_time
            }))
          }));
        }
      } else {
        // Tentar carregar do localStorage
        const saved = localStorage.getItem(`onboarding_${user.id}`);
        if (saved) {
          const { data: savedData, currentStep: savedStep } = JSON.parse(saved);
          setData(savedData);
          setCurrentStep(savedStep);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitOnboarding = async (): Promise<boolean> => {
    if (!user) {
      console.error('Usuário não autenticado para submeter onboarding');
      return false;
    }
    setIsLoading(true);

    try {
      // 1. Criar/Atualizar instructor_profile
      const { data: existingProfile, error: checkError } = await supabase
        .from('instructor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Erro ao verificar perfil existente:', checkError);
      }

      let instructorId: string;

      // Use dynamic object to avoid TypeScript issues with new column
      const profileData: Record<string, unknown> = {
        is_driving_school: data.is_driving_school,
        business_name: data.business_name,
        cpf: data.cpf?.replace(/\D/g, '') || null,
        cnpj: data.cnpj?.replace(/\D/g, '') || null,
        zipcode: data.zipcode?.replace(/\D/g, '') || null,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        latitude: data.latitude,
        longitude: data.longitude,
        bio: data.bio,
        experience_years: data.experience_years || null,
        cnh_front_url: data.cnh_front_url,
        cnh_back_url: data.cnh_back_url,
        cnh_number: data.cnh_number,
        instructor_license_url: data.instructor_license_url,
        instructor_license: data.instructor_license,
        business_license_url: data.business_license_url,
        verification_status: 'pending',
        is_active: false,
        onboarding_completed: true, // Mark onboarding as complete
      };

      if (existingProfile) {
        const { error } = await supabase
          .from('instructor_profiles')
          .update(profileData as never)
          .eq('user_id', user.id);

        if (error) {
          console.error('Erro ao atualizar instructor_profile:', error);
          throw error;
        }
        instructorId = existingProfile.id;
        console.log('Perfil atualizado com sucesso, ID:', instructorId);
      } else {
        const { data: newProfile, error } = await supabase
          .from('instructor_profiles')
          .insert({
            user_id: user.id,
            ...profileData,
          } as never)
          .select()
          .single();

        if (error) {
          console.error('Erro ao criar instructor_profile:', error);
          throw error;
        }
        instructorId = (newProfile as { id: string }).id;
        console.log('Perfil criado com sucesso, ID:', instructorId);
      }

      // Atualizar telefone no profile principal
      if (data.phone) {
        const { error: phoneError } = await supabase
          .from('profiles')
          .update({ phone: data.phone.replace(/\D/g, '') })
          .eq('id', user.id);
        
        if (phoneError) {
          console.error('Erro ao atualizar telefone:', phoneError);
        }
      }

      // 2. Salvar especialidades
      if (data.specialties.length > 0) {
        await supabase
          .from('instructor_specialties')
          .delete()
          .eq('instructor_id', instructorId);

        await supabase
          .from('instructor_specialties')
          .insert(
            data.specialties.map(specialty => ({
              instructor_id: instructorId,
              specialty
            }))
          );
      }

      // 3. Salvar disponibilidade
      if (data.availability.length > 0) {
        await supabase
          .from('instructor_availability')
          .delete()
          .eq('instructor_id', instructorId);

        await supabase
          .from('instructor_availability')
          .insert(
            data.availability.map(avail => ({
              instructor_id: instructorId,
              day_of_week: avail.day_of_week,
              start_time: avail.start_time,
              end_time: avail.end_time,
              is_available: true
            }))
          );
      }


      // 4. Notify admin of new registration (non-blocking)
      try {
        await supabase.functions.invoke('notify-admin-new-registration', {
          body: {
            userName: profile?.full_name || '',
            userEmail: profile?.email || user.email || '',
            userType: data.is_driving_school ? 'driving_school' : 'instructor',
            userCity: data.city || null,
            userState: data.state || null,
          },
        });
      } catch (e) {
        console.error('Falha ao notificar admin:', e);
      }

      // 5. Limpar localStorage
      localStorage.removeItem(`onboarding_${user.id}`);

      return true;
    } catch (error) {
      console.error('Erro ao submeter onboarding:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateData,
        currentStep,
        setCurrentStep,
        saveProgress,
        loadProgress,
        submitOnboarding,
        isLoading,
        isSaving,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};
