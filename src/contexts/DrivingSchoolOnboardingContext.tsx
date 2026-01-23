import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DrivingSchoolInstructor {
  id: string;
  name: string;
  email: string;
  photo_url?: string;
  status: 'pending' | 'active';
}

export interface DrivingSchoolOnboardingData {
  // Step 1: Basic Data
  businessName: string;
  razaoSocial: string;
  cnpj: string;
  phone: string;
  email: string;
  
  // Address
  zipcode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  
  // Step 2: Documentation
  licenseUrl: string;
  vehiclePhotoUrl: string;
  crlvUrl: string;
  
  // Step 3: Instructors
  instructors: DrivingSchoolInstructor[];
  
  // Step 4: Terms
  termsAccepted: boolean;
  privacyAccepted: boolean;
  feeAccepted: boolean;
}

interface DrivingSchoolOnboardingContextType {
  data: DrivingSchoolOnboardingData;
  updateData: (updates: Partial<DrivingSchoolOnboardingData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  submitOnboarding: () => Promise<boolean>;
  isLoading: boolean;
  isSaving: boolean;
  instructorProfileId: string | null;
}

const initialData: DrivingSchoolOnboardingData = {
  businessName: '',
  razaoSocial: '',
  cnpj: '',
  phone: '',
  email: '',
  zipcode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  licenseUrl: '',
  vehiclePhotoUrl: '',
  crlvUrl: '',
  instructors: [],
  termsAccepted: false,
  privacyAccepted: false,
  feeAccepted: false,
};

const STORAGE_KEY = 'driving-school-onboarding';

const DrivingSchoolOnboardingContext = createContext<DrivingSchoolOnboardingContextType | null>(null);

export const DrivingSchoolOnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<DrivingSchoolOnboardingData>(initialData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [instructorProfileId, setInstructorProfileId] = useState<string | null>(null);
  
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const updateData = (updates: Partial<DrivingSchoolOnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const loadProgress = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Load from localStorage first
      const saved = localStorage.getItem(`${STORAGE_KEY}:${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setData(parsed.data || initialData);
        setCurrentStep(parsed.currentStep || 1);
      }

      // Then load from database
      const { data: instructorProfile, error } = await supabase
        .from('instructor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (instructorProfile && !error) {
        setInstructorProfileId(instructorProfile.id);
        
        // Hydrate form with existing data
        setData(prev => ({
          ...prev,
          businessName: instructorProfile.business_name || profile?.full_name || '',
          razaoSocial: instructorProfile.razao_social || '',
          cnpj: instructorProfile.cnpj || '',
          phone: profile?.phone || '',
          email: profile?.email || '',
          zipcode: instructorProfile.zipcode || '',
          street: instructorProfile.street || '',
          number: instructorProfile.number || '',
          complement: instructorProfile.complement || '',
          neighborhood: instructorProfile.neighborhood || '',
          city: instructorProfile.city || '',
          state: instructorProfile.state || '',
          licenseUrl: instructorProfile.license_url || '',
          vehiclePhotoUrl: instructorProfile.vehicle_photo_url || '',
          crlvUrl: instructorProfile.crlv_url || '',
        }));

        // Load instructors
        const { data: instructors } = await supabase
          .from('driving_school_instructors')
          .select('*')
          .eq('driving_school_id', instructorProfile.id);

        if (instructors) {
          setData(prev => ({
            ...prev,
            instructors: instructors.map(i => ({
              id: i.id,
              name: i.name,
              email: i.email,
              photo_url: i.photo_url || undefined,
              status: i.status as 'pending' | 'active',
            })),
          }));
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(`${STORAGE_KEY}:${user.id}`, JSON.stringify({
        data,
        currentStep,
      }));

      // Save to database
      const profileUpdate = {
        user_id: user.id,
        is_driving_school: true,
        business_name: data.businessName,
        razao_social: data.razaoSocial,
        cnpj: data.cnpj,
        zipcode: data.zipcode,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        license_url: data.licenseUrl,
        vehicle_photo_url: data.vehiclePhotoUrl,
        crlv_url: data.crlvUrl,
        verification_status: 'pending',
        updated_at: new Date().toISOString(),
      };

      if (instructorProfileId) {
        await supabase
          .from('instructor_profiles')
          .update(profileUpdate)
          .eq('id', instructorProfileId);
      } else {
        const { data: newProfile } = await supabase
          .from('instructor_profiles')
          .insert(profileUpdate)
          .select()
          .single();
        
        if (newProfile) {
          setInstructorProfileId(newProfile.id);
        }
      }

      // Update phone in profiles table
      if (data.phone) {
        await supabase
          .from('profiles')
          .update({ phone: data.phone })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar seu progresso.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const submitOnboarding = async (): Promise<boolean> => {
    if (!user || !instructorProfileId) return false;

    setIsSaving(true);
    try {
      // Mark onboarding as completed
      await supabase
        .from('instructor_profiles')
        .update({
          onboarding_completed: true,
          verification_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', instructorProfileId);

      // Save instructors
      if (data.instructors.length > 0) {
        // Delete existing and insert new
        await supabase
          .from('driving_school_instructors')
          .delete()
          .eq('driving_school_id', instructorProfileId);

        await supabase
          .from('driving_school_instructors')
          .insert(
            data.instructors.map(i => ({
              driving_school_id: instructorProfileId,
              name: i.name,
              email: i.email,
              photo_url: i.photo_url,
              status: 'pending',
            }))
          );
      }

      // Clear localStorage
      localStorage.removeItem(`${STORAGE_KEY}:${user.id}`);

      toast({
        title: 'Cadastro enviado!',
        description: 'Sua autoescola foi enviada para análise.',
      });

      return true;
    } catch (error) {
      console.error('Error submitting onboarding:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar seu cadastro.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, [user]);

  return (
    <DrivingSchoolOnboardingContext.Provider
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
        instructorProfileId,
      }}
    >
      {children}
    </DrivingSchoolOnboardingContext.Provider>
  );
};

export const useDrivingSchoolOnboarding = () => {
  const context = useContext(DrivingSchoolOnboardingContext);
  if (!context) {
    throw new Error('useDrivingSchoolOnboarding must be used within DrivingSchoolOnboardingProvider');
  }
  return context;
};
