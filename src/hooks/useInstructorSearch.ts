import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Instructor } from '@/types';

export interface SearchFilters {
  location: string;
  category: string;
  sortBy: string;
  providerTypes: string[];
  priceRange: [number, number];
  minRating: number;
  availability: string[];
  vehicleTypes: string[];
  features: string[];
}

const defaultFilters: SearchFilters = {
  location: '',
  category: 'all',
  sortBy: 'rating',
  providerTypes: [],
  priceRange: [50, 200],
  minRating: 0,
  availability: [],
  vehicleTypes: [],
  features: [],
};

// Map day names to day_of_week numbers (0 = Sunday, 1 = Monday, etc.)
const dayNameToNumber: Record<string, number> = {
  'Domingo': 0,
  'Segunda': 1,
  'Terça': 2,
  'Quarta': 3,
  'Quinta': 4,
  'Sexta': 5,
  'Sábado': 6,
};

// Map feature names to database fields
const featureToDbField: Record<string, { table: string; field: string; value?: any }> = {
  'Carro Adaptado': { table: 'vehicles', field: 'is_adapted', value: true },
  'Aulas em Inglês': { table: 'specialties', field: 'specialty', value: 'english_classes' },
  'Horário Noturno': { table: 'specialties', field: 'specialty', value: 'night_classes' },
  'Carro Automático': { table: 'vehicles', field: 'transmission', value: 'automatic' },
};

export function useInstructorSearch(initialFilters?: Partial<SearchFilters>) {
  const [filters, setFilters] = useState<SearchFilters>({
    ...defaultFilters,
    ...initialFilters,
  });
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchInstructors = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Base query - get all active approved instructors with their related data
      let query = supabase
        .from('instructor_profiles')
        .select(`
          id,
          user_id,
          bio,
          is_driving_school,
          average_rating,
          total_reviews,
          verification_status,
          city,
          neighborhood,
          state,
          latitude,
          longitude,
          available_morning,
          available_afternoon,
          available_evening,
          profiles!inner (
            full_name,
            avatar_url
          ),
          vehicles (
            id,
            license_category,
            vehicle_type,
            transmission,
            is_adapted
          ),
          pricing (
            single_class_price,
            license_category
          ),
          instructor_specialties (
            specialty
          ),
          instructor_availability (
            day_of_week,
            is_available
          )
        `, { count: 'exact' })
        .eq('is_active', true)
        .eq('verification_status', 'approved');

      // Filter by location (city or neighborhood)
      if (filters.location && filters.location.trim() !== '') {
        const locationLower = filters.location.toLowerCase().trim();
        query = query.or(`city.ilike.%${locationLower}%,neighborhood.ilike.%${locationLower}%,state.ilike.%${locationLower}%`);
      }

      // Filter by provider type
      if (filters.providerTypes.length === 1) {
        const isSchool = filters.providerTypes[0] === 'school';
        query = query.eq('is_driving_school', isSchool);
      }

      // Filter by minimum rating
      if (filters.minRating > 0) {
        query = query.gte('average_rating', filters.minRating);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      if (data) {
        let mappedInstructors: Instructor[] = data.map((instructor: any) => {
          const categories = [...new Set(instructor.vehicles?.map((v: any) => v.license_category) || [])];
          const vehicleTypes = [...new Set(instructor.vehicles?.map((v: any) => v.vehicle_type) || [])];
          const transmissions = instructor.vehicles?.map((v: any) => v.transmission) || [];
          const hasAdapted = instructor.vehicles?.some((v: any) => v.is_adapted) || false;
          const specialties = instructor.instructor_specialties?.map((s: any) => s.specialty) || [];
          const availableDays = instructor.instructor_availability
            ?.filter((a: any) => a.is_available)
            ?.map((a: any) => a.day_of_week) || [];
          
          const prices = instructor.pricing?.map((p: any) => p.single_class_price) || [];
          const minPrice = prices.length > 0 ? Math.min(...prices) : 100;

          // Generate tags based on features
          const tags: string[] = [];
          if (hasAdapted) tags.push('Veículo Adaptado');
          if (transmissions.includes('automatic')) tags.push('Automático');
          if (specialties.includes('english_classes')) tags.push('Inglês');
          if (specialties.includes('night_classes')) tags.push('Noturno');
          if (specialties.includes('anxious_students')) tags.push('Alunos Ansiosos');
          if (specialties.includes('defensive_driving')) tags.push('Direção Defensiva');

          return {
            id: instructor.id,
            name: instructor.profiles?.full_name || 'Instrutor',
            photo: instructor.profiles?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
            isVerified: instructor.verification_status === 'approved',
            type: instructor.is_driving_school ? 'school' as const : 'autonomous' as const,
            rating: Number(instructor.average_rating) || 0,
            totalReviews: instructor.total_reviews || 0,
            distance: 0, // Would need user geolocation
            categories: categories as string[],
            description: instructor.bio || 'Instrutor profissional credenciado.',
            tags,
            pricePerLesson: minPrice,
            minPrice: minPrice,
            // Extended data for filtering
            _vehicleTypes: vehicleTypes,
            _transmissions: transmissions,
            _hasAdapted: hasAdapted,
            _specialties: specialties,
            _availableDays: availableDays,
          };
        });

        // Client-side filtering for complex conditions

        // Filter by category
        if (filters.category !== 'all') {
          mappedInstructors = mappedInstructors.filter((inst) =>
            inst.categories.includes(filters.category)
          );
        }

        // Filter by price range
        mappedInstructors = mappedInstructors.filter(
          (inst) =>
            inst.pricePerLesson >= filters.priceRange[0] &&
            inst.pricePerLesson <= filters.priceRange[1]
        );

        // Filter by vehicle types
        if (filters.vehicleTypes.length > 0) {
          mappedInstructors = mappedInstructors.filter((inst: any) =>
            filters.vehicleTypes.some((vt) => 
              inst._vehicleTypes.map((t: string) => t.toLowerCase()).includes(vt.toLowerCase())
            )
          );
        }

        // Filter by availability (days of week)
        if (filters.availability.length > 0) {
          const requiredDays = filters.availability.map((day) => dayNameToNumber[day]);
          mappedInstructors = mappedInstructors.filter((inst: any) =>
            requiredDays.every((day) => inst._availableDays.includes(day))
          );
        }

        // Filter by features
        if (filters.features.length > 0) {
          mappedInstructors = mappedInstructors.filter((inst: any) => {
            return filters.features.every((feature) => {
              const featureConfig = featureToDbField[feature];
              if (!featureConfig) return true;
              
              if (feature === 'Carro Adaptado') {
                return inst._hasAdapted;
              }
              if (feature === 'Carro Automático') {
                return inst._transmissions.includes('automatic');
              }
              if (feature === 'Aulas em Inglês') {
                return inst._specialties.includes('english_classes');
              }
              if (feature === 'Horário Noturno') {
                return inst._specialties.includes('night_classes');
              }
              return true;
            });
          });
        }

        // Sort results
        switch (filters.sortBy) {
          case 'rating':
            mappedInstructors.sort((a, b) => b.rating - a.rating);
            break;
          case 'price_low':
            mappedInstructors.sort((a, b) => a.pricePerLesson - b.pricePerLesson);
            break;
          case 'price_high':
            mappedInstructors.sort((a, b) => b.pricePerLesson - a.pricePerLesson);
            break;
          case 'distance':
            mappedInstructors.sort((a, b) => a.distance - b.distance);
            break;
          case 'reviews':
            mappedInstructors.sort((a, b) => b.totalReviews - a.totalReviews);
            break;
        }

        // Clean up extended properties before setting state
        const cleanInstructors = mappedInstructors.map(({ 
          _vehicleTypes, _transmissions, _hasAdapted, _specialties, _availableDays, 
          ...rest 
        }: any) => rest);

        setInstructors(cleanInstructors);
        setTotalCount(cleanInstructors.length);
      }
    } catch (err) {
      console.error('Error fetching instructors:', err);
      setError('Erro ao buscar instrutores. Tente novamente.');
      setInstructors([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return {
    instructors,
    isLoading,
    error,
    totalCount,
    filters,
    updateFilters,
    resetFilters,
    refetch: fetchInstructors,
  };
}
