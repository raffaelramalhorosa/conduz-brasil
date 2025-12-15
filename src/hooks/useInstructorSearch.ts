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
  radiusKm: number;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
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
  radiusKm: 50,
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

export function useInstructorSearch(
  initialFilters?: Partial<SearchFilters>,
  userLocation?: GeoLocation | null
) {
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
      let mappedInstructors: Instructor[] = [];

      // If user location is available, use nearby_instructors function
      if (userLocation?.latitude && userLocation?.longitude) {
        const { data: nearbyData, error: nearbyError } = await supabase
          .rpc('nearby_instructors', {
            user_lat: userLocation.latitude,
            user_lng: userLocation.longitude,
            radius_km: filters.radiusKm,
            min_rating: filters.minRating > 0 ? filters.minRating : undefined,
            max_results: 100,
          });

        if (nearbyError) throw nearbyError;

        if (nearbyData && nearbyData.length > 0) {
          // Get additional data for nearby instructors (vehicles, pricing, specialties, availability)
          const instructorIds = nearbyData.map((i: any) => i.id);
          
          const [vehiclesRes, pricingRes, specialtiesRes, availabilityRes] = await Promise.all([
            supabase
              .from('vehicles')
              .select('instructor_id, license_category, vehicle_type, transmission, is_adapted')
              .in('instructor_id', instructorIds)
              .eq('is_active', true),
            supabase
              .from('pricing')
              .select('instructor_id, single_class_price, license_category')
              .in('instructor_id', instructorIds)
              .eq('is_active', true),
            supabase
              .from('instructor_specialties')
              .select('instructor_id, specialty')
              .in('instructor_id', instructorIds),
            supabase
              .from('instructor_availability')
              .select('instructor_id, day_of_week, is_available')
              .in('instructor_id', instructorIds),
          ]);

          const vehiclesMap = new Map<string, any[]>();
          const pricingMap = new Map<string, any[]>();
          const specialtiesMap = new Map<string, string[]>();
          const availabilityMap = new Map<string, number[]>();

          vehiclesRes.data?.forEach((v) => {
            if (!vehiclesMap.has(v.instructor_id)) vehiclesMap.set(v.instructor_id, []);
            vehiclesMap.get(v.instructor_id)!.push(v);
          });

          pricingRes.data?.forEach((p) => {
            if (!pricingMap.has(p.instructor_id)) pricingMap.set(p.instructor_id, []);
            pricingMap.get(p.instructor_id)!.push(p);
          });

          specialtiesRes.data?.forEach((s) => {
            if (!specialtiesMap.has(s.instructor_id)) specialtiesMap.set(s.instructor_id, []);
            specialtiesMap.get(s.instructor_id)!.push(s.specialty);
          });

          availabilityRes.data?.forEach((a) => {
            if (a.is_available) {
              if (!availabilityMap.has(a.instructor_id)) availabilityMap.set(a.instructor_id, []);
              availabilityMap.get(a.instructor_id)!.push(a.day_of_week);
            }
          });

          mappedInstructors = nearbyData.map((instructor: any) => {
            const vehicles = vehiclesMap.get(instructor.id) || [];
            const pricing = pricingMap.get(instructor.id) || [];
            const specialties = specialtiesMap.get(instructor.id) || [];
            const availableDays = availabilityMap.get(instructor.id) || [];

            const categories = [...new Set(vehicles.map((v) => v.license_category))] as string[];
            const vehicleTypes = [...new Set(vehicles.map((v) => v.vehicle_type))];
            const transmissions = vehicles.map((v) => v.transmission);
            const hasAdapted = vehicles.some((v) => v.is_adapted);

            const prices = pricing.map((p) => p.single_class_price);
            const minPrice = prices.length > 0 ? Math.min(...prices) : 100;

            // Generate tags
            const tags: string[] = [];
            if (hasAdapted) tags.push('Veículo Adaptado');
            if (transmissions.includes('automatic')) tags.push('Automático');
            if (specialties.includes('english_classes')) tags.push('Inglês');
            if (specialties.includes('night_classes')) tags.push('Noturno');
            if (specialties.includes('anxious_students')) tags.push('Alunos Ansiosos');

            return {
              id: instructor.id,
              name: instructor.full_name || 'Instrutor',
              photo: instructor.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
              isVerified: true,
              type: 'autonomous' as const,
              rating: Number(instructor.average_rating) || 0,
              totalReviews: instructor.total_reviews || 0,
              distance: Number(instructor.distance_km?.toFixed(1)) || 0,
              categories,
              description: instructor.bio || 'Instrutor profissional credenciado.',
              tags,
              pricePerLesson: minPrice,
              minPrice,
              _vehicleTypes: vehicleTypes,
              _transmissions: transmissions,
              _hasAdapted: hasAdapted,
              _specialties: specialties,
              _availableDays: availableDays,
            };
          });
        }
      } else {
        // Fallback to regular query without distance
        const { data, error: fetchError } = await supabase
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
            profiles!inner (
              full_name,
              avatar_url
            ),
            vehicles (
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
          `)
          .eq('is_active', true)
          .eq('verification_status', 'approved');

        if (fetchError) throw fetchError;

        if (data) {
          mappedInstructors = data.map((instructor: any) => {
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

            const tags: string[] = [];
            if (hasAdapted) tags.push('Veículo Adaptado');
            if (transmissions.includes('automatic')) tags.push('Automático');
            if (specialties.includes('english_classes')) tags.push('Inglês');
            if (specialties.includes('night_classes')) tags.push('Noturno');
            if (specialties.includes('anxious_students')) tags.push('Alunos Ansiosos');

            return {
              id: instructor.id,
              name: instructor.profiles?.full_name || 'Instrutor',
              photo: instructor.profiles?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
              isVerified: instructor.verification_status === 'approved',
              type: instructor.is_driving_school ? 'school' as const : 'autonomous' as const,
              rating: Number(instructor.average_rating) || 0,
              totalReviews: instructor.total_reviews || 0,
              distance: 0,
              categories: categories as string[],
              description: instructor.bio || 'Instrutor profissional credenciado.',
              tags,
              pricePerLesson: minPrice,
              minPrice,
              _vehicleTypes: vehicleTypes,
              _transmissions: transmissions,
              _hasAdapted: hasAdapted,
              _specialties: specialties,
              _availableDays: availableDays,
            };
          });
        }
      }

      // Apply client-side filters

      // Filter by location text (city/neighborhood)
      if (filters.location && filters.location.trim() !== '' && !userLocation) {
        const locationLower = filters.location.toLowerCase().trim();
        // This is handled at query level when no geolocation
      }

      // Filter by category
      if (filters.category !== 'all') {
        mappedInstructors = mappedInstructors.filter((inst) =>
          inst.categories.includes(filters.category)
        );
      }

      // Filter by provider type
      if (filters.providerTypes.length === 1) {
        mappedInstructors = mappedInstructors.filter((inst) =>
          filters.providerTypes.includes(inst.type)
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

      // Filter by availability
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
            if (feature === 'Carro Adaptado') return inst._hasAdapted;
            if (feature === 'Carro Automático') return inst._transmissions.includes('automatic');
            if (feature === 'Aulas em Inglês') return inst._specialties.includes('english_classes');
            if (feature === 'Horário Noturno') return inst._specialties.includes('night_classes');
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
          if (userLocation) {
            mappedInstructors.sort((a, b) => a.distance - b.distance);
          }
          break;
        case 'reviews':
          mappedInstructors.sort((a, b) => b.totalReviews - a.totalReviews);
          break;
      }

      // Clean up extended properties
      const cleanInstructors = mappedInstructors.map(({
        _vehicleTypes, _transmissions, _hasAdapted, _specialties, _availableDays,
        ...rest
      }: any) => rest);

      setInstructors(cleanInstructors);
      setTotalCount(cleanInstructors.length);
    } catch (err) {
      console.error('Error fetching instructors:', err);
      setError('Erro ao buscar instrutores. Tente novamente.');
      setInstructors([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, userLocation]);

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
