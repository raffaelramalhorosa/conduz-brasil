import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfileHeader from "@/components/profile/ProfileHeader";
import AboutCard from "@/components/profile/AboutCard";
import VehiclesCard from "@/components/profile/VehiclesCard";
import ReviewsCard from "@/components/profile/ReviewsCard";
import ReviewsCardLive from "@/components/profile/ReviewsCardLive";
import LocationCard from "@/components/profile/LocationCard";
import BookingCard from "@/components/profile/BookingCard";
import InfoCard from "@/components/profile/InfoCard";
import type { InstructorProfile as MockProfile } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const isValidUUID = (value: string | undefined | null): boolean => {
  if (!value) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

const InstructorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<MockProfile | null>(null);
  const [instructorDbId, setInstructorDbId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstructor = async () => {
      if (!id || !isValidUUID(id)) {
        // Fallback to mock data when id is missing or not a valid UUID (e.g. demo routes like /instrutores/3)
        setProfile(mockInstructorProfile);
        setLoading(false);
        return;
      }

      try {
        // Try to fetch from database first
        const { data: instructorData, error } = await supabase
          .from('instructor_profiles')
          .select(`
            id,
            user_id,
            bio,
            experience_years,
            average_rating,
            total_reviews,
            total_classes,
            acceptance_rate,
            is_driving_school,
            verification_status,
            city,
            state,
            neighborhood,
            street,
            latitude,
            longitude,
            created_at
          `)
          .eq('id', id)
          .maybeSingle();

        if (error || !instructorData) {
          // Fallback to mock data for demo
          setProfile(mockInstructorProfile);
          setLoading(false);
          return;
        }

        // Get profile info
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, email, phone')
          .eq('id', instructorData.user_id)
          .single();

        // Get vehicles
        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('*')
          .eq('instructor_id', id)
          .eq('is_active', true);

        // Get specialties
        const { data: specialties } = await supabase
          .from('instructor_specialties')
          .select('specialty')
          .eq('instructor_id', id);

        // Build profile object matching mock structure
        const specialtyLabels: Record<string, string> = {
          first_license: 'Primeira habilitação',
          renewal: 'Reciclagem',
          anxious_students: 'Alunos ansiosos',
          elderly: 'Terceira idade',
          english_classes: 'Aulas em inglês',
          defensive_driving: 'Direção defensiva',
          night_classes: 'Aulas noturnas',
        };

        const mappedProfile: MockProfile = {
          id: instructorData.id,
          name: profileData?.full_name || 'Instrutor',
          type: instructorData.is_driving_school ? 'school' : 'autonomous',
          isVerified: instructorData.verification_status === 'approved',
          profilePhoto: profileData?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
          coverPhoto: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&h=300&fit=crop',
          categories: [...new Set(vehicles?.map(v => v.license_category) || ['B'])],
          rating: Number(instructorData.average_rating) || 0,
          totalReviews: instructorData.total_reviews || 0,
          about: instructorData.bio || 'Instrutor dedicado e profissional.',
          specialties: specialties?.map(s => specialtyLabels[s.specialty] || s.specialty) || [],
          vehicles: vehicles?.map(v => ({
            id: v.id,
            model: `${v.brand} ${v.model} ${v.year}`,
            year: v.year,
            category: v.license_category,
            features: [
              v.transmission === 'automatic' ? 'Automático' : 'Manual',
              v.has_air_conditioning ? 'Ar-condicionado' : null,
              v.has_power_steering ? 'Direção hidráulica' : null,
              v.is_adapted ? 'Adaptado PCD' : null,
            ].filter(Boolean) as string[],
            photo: v.main_photo_url || 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&h=300&fit=crop',
          })) || mockInstructorProfile.vehicles,
          reviews: [], // Will be loaded by ReviewsCardLive
          location: {
            address: [instructorData.street, instructorData.neighborhood, instructorData.city, instructorData.state].filter(Boolean).join(', ') || 'São Paulo, SP',
            neighborhoods: instructorData.neighborhood ? [instructorData.neighborhood] : ['Centro'],
            coordinates: {
              lat: Number(instructorData.latitude) || -23.55,
              lng: Number(instructorData.longitude) || -46.63,
            },
          },
          pricing: mockInstructorProfile.pricing, // Would need pricing table query
          stats: {
            responseTime: '~2h',
            acceptanceRate: `${instructorData.acceptance_rate || 95}%`,
            memberSince: new Date(instructorData.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            documentVerified: instructorData.verification_status === 'approved',
          },
          contact: {
            whatsapp: profileData?.phone || '',
            email: profileData?.email || '',
          },
          availability: mockInstructorProfile.availability,
        };

        setInstructorDbId(instructorData.id);
        setProfile(mappedProfile);
      } catch (error) {
        console.error('Error fetching instructor:', error);
        setProfile(mockInstructorProfile);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructor();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="h-[300px] bg-muted animate-pulse" />
        <div className="container-custom py-8">
          <div className="grid lg:grid-cols-[1fr_380px] gap-6">
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container-custom py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Instrutor não encontrado</h1>
          <p className="text-muted-foreground">O perfil que você está procurando não existe.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Profile Header */}
      <ProfileHeader profile={profile} />

      {/* Main Content */}
      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <AboutCard profile={profile} />
            <VehiclesCard profile={profile} />
            {instructorDbId ? (
              <ReviewsCardLive instructorId={instructorDbId} />
            ) : (
              <ReviewsCard profile={profile} />
            )}
            <LocationCard profile={profile} />
          </div>

          {/* Right Column - Sticky */}
          <div className="space-y-6">
            <BookingCard profile={profile} instructorId={instructorDbId || profile.id} />
            <InfoCard profile={profile} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default InstructorProfile;
