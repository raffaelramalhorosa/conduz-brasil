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
  saveProgress: () => Promise<boolean>;
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

    console.log('[DS-Onboarding] loadProgress iniciado', { userId: user.id, email: user.email });

    try {
      // Load from localStorage first
      const saved = localStorage.getItem(`${STORAGE_KEY}:${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setData(parsed.data || initialData);
        setCurrentStep(parsed.currentStep || 1);
        console.log('[DS-Onboarding] loadProgress: dados carregados do localStorage', parsed);
      }

      // Verificar sessão antes de consultar o banco
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[DS-Onboarding] loadProgress: sessão atual', {
        hasSession: !!session,
        userId: session?.user?.id,
        expiresAt: session?.expires_at,
      });

      // Then load from database
      const { data: profileRows, error } = await supabase
        .from('instructor_profiles')
        .select('id, business_name, razao_social, cnpj, zipcode, street, number, complement, neighborhood, city, state, license_url, vehicle_photo_url, crlv_url')
        .eq('user_id', user.id)
        .limit(1);

      console.log('[DS-Onboarding] loadProgress: resultado da query', { profileRows, error });

      if (error) {
        console.error('[DS-Onboarding] loadProgress ERRO na query:', error);
      }

      const instructorProfile = profileRows?.[0] ?? null;
      console.log('[DS-Onboarding] loadProgress: instructorProfile encontrado?', !!instructorProfile, instructorProfile?.id);

      if (instructorProfile) {
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

  const saveProgress = async (): Promise<boolean> => {
    if (!user) return false;

    console.log('[DS-Onboarding] saveProgress iniciado', {
      userId: user.id,
      instructorProfileId,
      cnpj: data.cnpj,
      businessName: data.businessName,
    });

    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(`${STORAGE_KEY}:${user.id}`, JSON.stringify({
        data,
        currentStep,
      }));

      // Geocode address if city is set
      let geoLatitude: number | null = null;
      let geoLongitude: number | null = null;
      if (data.city) {
        try {
          const addressParts = [data.street, data.number, data.neighborhood, data.city, data.state, data.zipcode, 'Brasil'];
          const fullAddress = addressParts.filter(Boolean).join(', ');
          const { data: geoData } = await supabase.functions.invoke('geocode', { body: { address: fullAddress } });
          if (geoData && !geoData.error) {
            geoLatitude = geoData.latitude;
            geoLongitude = geoData.longitude;
          }
        } catch (e) {
          console.warn('Geocoding failed, saving without coordinates:', e);
        }
      }

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
        ...(geoLatitude !== null && { latitude: geoLatitude, longitude: geoLongitude }),
        license_url: data.licenseUrl,
        vehicle_photo_url: data.vehiclePhotoUrl,
        crlv_url: data.crlvUrl,
        verification_status: 'pending',
        updated_at: new Date().toISOString(),
      };

      console.log('[DS-Onboarding] saveProgress: enviando upsert', profileUpdate);

      const { data: savedProfile, error: saveError } = await supabase
        .from('instructor_profiles')
        .upsert(profileUpdate, { onConflict: 'user_id' })
        .select('id')
        .single();

      console.log('[DS-Onboarding] saveProgress: resultado do upsert', { savedProfile, saveError });

      if (saveError) {
        // CNPJ já existe em outra conta com onboarding não finalizado → limpa e retenta
        if (saveError.code === '23505' && saveError.message?.includes('cnpj')) {
          console.log('[DS-Onboarding] saveProgress: conflito de CNPJ detectado, tentando limpar registro órfão...');
          const { data: cleared, error: rpcError } = await supabase.rpc('clear_orphaned_cnpj', {
            p_cnpj: data.cnpj,
            p_user_id: user.id,
          });
          console.log('[DS-Onboarding] saveProgress: clear_orphaned_cnpj resultado', { cleared, rpcError });

          if (cleared) {
            const { data: retryProfile, error: retryError } = await supabase
              .from('instructor_profiles')
              .upsert(profileUpdate, { onConflict: 'user_id' })
              .select('id')
              .single();
            console.log('[DS-Onboarding] saveProgress: retry do upsert', { retryProfile, retryError });
            if (retryError) throw retryError;
            if (retryProfile) {
              setInstructorProfileId(retryProfile.id);
            }
          } else {
            toast({
              title: 'CNPJ já cadastrado',
              description: 'Este CNPJ já possui um cadastro ativo no sistema. Entre em contato com o suporte.',
              variant: 'destructive',
            });
            throw saveError;
          }
        } else {
          console.error('[DS-Onboarding] saveProgress ERRO no upsert:', {
            message: saveError.message,
            code: saveError.code,
            details: saveError.details,
            hint: saveError.hint,
          });
          throw saveError;
        }
      }

      if (savedProfile) {
        console.log('[DS-Onboarding] saveProgress: instructorProfileId definido como', savedProfile.id);
        setInstructorProfileId(savedProfile.id);
      }

      // Update phone in profiles table
      if (data.phone) {
        await supabase
          .from('profiles')
          .update({ phone: data.phone })
          .eq('id', user.id);
      }

      return true;
    } catch (error) {
      console.error('Error saving progress:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const submitOnboarding = async (): Promise<boolean> => {
    if (!user) return false;

    console.log('[DS-Onboarding] submitOnboarding iniciado', {
      userId: user.id,
      instructorProfileId,
      termsAccepted: data.termsAccepted,
      privacyAccepted: data.privacyAccepted,
    });

    // Ensure we have the profile ID even if loadProgress failed earlier
    let profileId = instructorProfileId;
    if (!profileId) {
      console.log('[DS-Onboarding] submitOnboarding: instructorProfileId é null, buscando no banco...');
      const { data: existing, error: fetchError } = await supabase
        .from('instructor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      console.log('[DS-Onboarding] submitOnboarding: busca de fallback', { existing, fetchError });
      profileId = existing?.id ?? null;
      if (profileId) setInstructorProfileId(profileId);
    }

    console.log('[DS-Onboarding] submitOnboarding: profileId resolvido como', profileId);

    if (!profileId) {
      console.error('[DS-Onboarding] submitOnboarding: sem profileId, abortando');
      return false;
    }

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
        .eq('id', profileId);

      // Save instructors
      if (data.instructors.length > 0) {
        // Delete existing and insert new
        await supabase
          .from('driving_school_instructors')
          .delete()
          .eq('driving_school_id', profileId);

        await supabase
          .from('driving_school_instructors')
          .insert(
            data.instructors.map(i => ({
              driving_school_id: profileId,
              name: i.name,
              email: i.email,
              photo_url: i.photo_url,
              status: 'pending',
            }))
          );
      }

      // Notify admin of new registration (non-blocking)
      try {
        await supabase.functions.invoke('notify-admin-new-registration', {
          body: {
            userName: data.businessName || profile?.full_name || '',
            userEmail: profile?.email || '',
            userType: 'driving_school',
            userCity: data.city || null,
            userState: data.state || null,
          },
        });
      } catch (e) {
        console.error('Falha ao notificar admin:', e);
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
