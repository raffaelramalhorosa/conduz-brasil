import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: string;
  plate: string;
  category: string;
  features: string[];
  photos: File[];
}

export interface RegistrationData {
  // Step 1 - Basic Data
  accountType: 'instructor' | 'school' | '';
  fullName: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  birthDate: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;

  // Step 2 - Documentation
  cnhFile: File | null;
  credentialFile: File | null;
  profilePhoto: File | null;
  businessLicense: File | null;
  documentsVerified: boolean;

  // Step 3 - Vehicles
  vehicles: Vehicle[];

  // Step 4 - Pricing
  pricing: Record<string, { single: string; pack5: string; pack10: string }>;
  availability: Record<string, string[]>;
  availabilityNotes: string;
  bio: string;
  specialties: string[];

  // Step 5 - Finalization
  termsAccepted: boolean;
  privacyAccepted: boolean;
  feeAccepted: boolean;
  referralCode: string;
}

const initialData: RegistrationData = {
  accountType: '',
  fullName: '',
  cpfCnpj: '',
  email: '',
  phone: '',
  birthDate: '',
  cep: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
  complement: '',
  cnhFile: null,
  credentialFile: null,
  profilePhoto: null,
  businessLicense: null,
  documentsVerified: false,
  vehicles: [],
  pricing: {},
  availability: {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  },
  availabilityNotes: '',
  bio: '',
  specialties: [],
  termsAccepted: false,
  privacyAccepted: false,
  feeAccepted: false,
  referralCode: '',
};

const STORAGE_KEY = 'autoconnect_registration';

export function useRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegistrationData>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Files can't be stored in localStorage, so we skip them
        setFormData(prev => ({
          ...prev,
          ...parsed,
          cnhFile: null,
          credentialFile: null,
          profilePhoto: null,
          businessLicense: null,
          vehicles: parsed.vehicles?.map((v: Vehicle) => ({ ...v, photos: [] })) || [],
        }));
        if (parsed.currentStep) {
          setCurrentStep(parsed.currentStep);
        }
      } catch (e) {
        console.error('Error loading saved data:', e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    const dataToSave = {
      ...formData,
      currentStep,
      cnhFile: null,
      credentialFile: null,
      profilePhoto: null,
      businessLicense: null,
      vehicles: formData.vehicles.map(v => ({ ...v, photos: [] })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [formData, currentStep]);

  const updateFormData = (data: Partial<RegistrationData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 5) {
      setCurrentStep(step);
      window.scrollTo(0, 0);
    }
  };

  const resetForm = () => {
    setFormData(initialData);
    setCurrentStep(1);
    localStorage.removeItem(STORAGE_KEY);
  };

  const submitForm = async () => {
    setIsLoading(true);
    
    try {
      // Build full address for geocoding
      const fullAddress = [
        formData.street,
        formData.number,
        formData.neighborhood,
        formData.city,
        formData.state,
        formData.cep,
        'Brasil'
      ].filter(Boolean).join(', ');

      // Call geocode function to get coordinates
      let latitude: number | null = null;
      let longitude: number | null = null;

      try {
        const { data: geoData } = await supabase.functions.invoke('geocode', {
          body: { address: fullAddress },
        });

        if (geoData && !geoData.error) {
          latitude = geoData.latitude;
          longitude = geoData.longitude;
          console.log('Geocoded address:', fullAddress, '->', { latitude, longitude });
        }
      } catch (geoError) {
        console.warn('Geocoding failed, continuing without coordinates:', geoError);
      }

      // Store the coordinates for use in instructor profile creation
      // This data would be used when creating the instructor_profiles record
      console.log('Form data ready for submission with coordinates:', { ...formData, latitude, longitude });

      // Simulate remaining API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsLoading(false);
      resetForm();
      return true;
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsLoading(false);
      return false;
    }
  };

  return {
    currentStep,
    formData,
    isLoading,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    resetForm,
    submitForm,
  };
}
