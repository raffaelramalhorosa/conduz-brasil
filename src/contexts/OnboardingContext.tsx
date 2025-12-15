import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VehicleData {
  id?: string;
  brand: string;
  model: string;
  year: number;
  license_plate: string;
  color: string;
  vehicle_type: string;
  license_category: string;
  transmission: string;
  has_air_conditioning: boolean;
  has_power_steering: boolean;
  is_adapted: boolean;
  main_photo: File | null;
  main_photo_url: string | null;
  pricing: {
    single_class_price: number;
    package_5_price: number | null;
    package_10_price: number | null;
    package_20_price: number | null;
  };
}

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
  
  // Veículos
  vehicles: VehicleData[];
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
  vehicles: [],
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
    if (!user) return;
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

      // Salvar parcialmente no banco (draft)
      const { data: instructorProfile } = await supabase
        .from('instructor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (instructorProfile) {
        await supabase
          .from('instructor_profiles')
          .update({
            is_driving_school: data.is_driving_school,
            business_name: data.business_name,
            cpf: data.cpf,
            cnpj: data.cnpj,
            zipcode: data.zipcode,
            street: data.street,
            number: data.number,
            complement: data.complement,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            bio: data.bio,
            experience_years: data.experience_years,
          })
          .eq('user_id', user.id);
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

        // Carregar veículos
        const { data: vehicles } = await supabase
          .from('vehicles')
          .select(`
            *,
            pricing (*)
          `)
          .eq('instructor_id', instructorProfile.id);

        if (vehicles) {
          setData(prev => ({
            ...prev,
            vehicles: vehicles.map(v => ({
              id: v.id,
              brand: v.brand,
              model: v.model,
              year: v.year,
              license_plate: v.license_plate,
              color: v.color || '',
              vehicle_type: v.vehicle_type,
              license_category: v.license_category,
              transmission: v.transmission,
              has_air_conditioning: v.has_air_conditioning || false,
              has_power_steering: v.has_power_steering || false,
              is_adapted: v.is_adapted || false,
              main_photo: null,
              main_photo_url: v.main_photo_url,
              pricing: v.pricing?.[0] ? {
                single_class_price: v.pricing[0].single_class_price || 0,
                package_5_price: v.pricing[0].package_5_price,
                package_10_price: v.pricing[0].package_10_price,
                package_20_price: v.pricing[0].package_20_price,
              } : {
                single_class_price: 0,
                package_5_price: null,
                package_10_price: null,
                package_20_price: null,
              }
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
    if (!user) return false;
    setIsLoading(true);

    try {
      // 1. Criar/Atualizar instructor_profile
      const { data: existingProfile } = await supabase
        .from('instructor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let instructorId: string;

      if (existingProfile) {
        const { error } = await supabase
          .from('instructor_profiles')
          .update({
            is_driving_school: data.is_driving_school,
            business_name: data.business_name,
            cpf: data.cpf,
            cnpj: data.cnpj,
            zipcode: data.zipcode,
            street: data.street,
            number: data.number,
            complement: data.complement,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            latitude: data.latitude,
            longitude: data.longitude,
            bio: data.bio,
            experience_years: data.experience_years,
            cnh_front_url: data.cnh_front_url,
            cnh_back_url: data.cnh_back_url,
            cnh_number: data.cnh_number,
            instructor_license_url: data.instructor_license_url,
            instructor_license: data.instructor_license,
            business_license_url: data.business_license_url,
            verification_status: 'pending',
            is_active: false,
          })
          .eq('user_id', user.id);

        if (error) throw error;
        instructorId = existingProfile.id;
      } else {
        const { data: newProfile, error } = await supabase
          .from('instructor_profiles')
          .insert({
            user_id: user.id,
            is_driving_school: data.is_driving_school,
            business_name: data.business_name,
            cpf: data.cpf,
            cnpj: data.cnpj,
            zipcode: data.zipcode,
            street: data.street,
            number: data.number,
            complement: data.complement,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            latitude: data.latitude,
            longitude: data.longitude,
            bio: data.bio,
            experience_years: data.experience_years,
            cnh_front_url: data.cnh_front_url,
            cnh_back_url: data.cnh_back_url,
            cnh_number: data.cnh_number,
            instructor_license_url: data.instructor_license_url,
            instructor_license: data.instructor_license,
            business_license_url: data.business_license_url,
            verification_status: 'pending',
            is_active: false,
          })
          .select()
          .single();

        if (error) throw error;
        instructorId = newProfile.id;
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

      // 4. Salvar veículos e preços
      for (const vehicle of data.vehicles) {
        let photoUrl = vehicle.main_photo_url;

        if (vehicle.main_photo) {
          const fileExt = vehicle.main_photo.name.split('.').pop();
          const fileName = `${instructorId}-${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('vehicle-photos')
            .upload(fileName, vehicle.main_photo);

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('vehicle-photos')
              .getPublicUrl(fileName);
            photoUrl = urlData.publicUrl;
          }
        }

        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .insert({
            instructor_id: instructorId,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            license_plate: vehicle.license_plate,
            color: vehicle.color,
            vehicle_type: vehicle.vehicle_type,
            license_category: vehicle.license_category,
            transmission: vehicle.transmission,
            has_air_conditioning: vehicle.has_air_conditioning,
            has_power_steering: vehicle.has_power_steering,
            is_adapted: vehicle.is_adapted,
            main_photo_url: photoUrl,
            is_active: true
          })
          .select()
          .single();

        if (vehicleError) throw vehicleError;

        await supabase
          .from('pricing')
          .insert({
            instructor_id: instructorId,
            vehicle_id: vehicleData.id,
            license_category: vehicle.license_category,
            single_class_price: vehicle.pricing.single_class_price,
            package_5_price: vehicle.pricing.package_5_price,
            package_10_price: vehicle.pricing.package_10_price,
            package_20_price: vehicle.pricing.package_20_price,
            is_active: true
          });
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
