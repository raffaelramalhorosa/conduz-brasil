import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import NavBar from "@/components/NavBar";
import ProfileHeader from "@/components/profile/ProfileHeader";
import AboutCard from "@/components/profile/AboutCard";
import VehiclesCard from "@/components/profile/VehiclesCard";
import ReviewsCard from "@/components/profile/ReviewsCard";
import ReviewsCardLive from "@/components/profile/ReviewsCardLive";
import LocationCard from "@/components/profile/LocationCard";
import BookingCard from "@/components/profile/BookingCard";
import InfoCard from "@/components/profile/InfoCard";
import MediaLightbox from "@/components/profile/MediaLightbox";
import LinkedInstructorsCard from "@/components/profile/LinkedInstructorsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Video, ExternalLink, Image as ImageIcon, LayoutGrid, ZoomIn, Building2 } from "lucide-react";
import type { InstructorProfile as InstructorProfileType } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useInstructorAffiliation } from "@/hooks/useAffiliationInfo";

interface InstructorMedia {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  video_type: string;
  media_type: string;
  is_public: boolean;
}

const isValidUUID = (value: string | undefined | null): boolean => {
  if (!value) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

const InstructorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<InstructorProfileType | null>(null);
  const [instructorDbId, setInstructorDbId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState<InstructorMedia[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<InstructorMedia | null>(null);
  const { data: affiliationInfo } = useInstructorAffiliation(id || null);
  const bookingCardRef = useRef<{ openModal: () => void; openWithVehicle: (vehicleId: string) => void; scrollToVehicles: () => void }>(null);

  const handleHeaderBooking = () => {
    bookingCardRef.current?.openModal();
  };
  useEffect(() => {
    const fetchInstructor = async () => {
      if (!id || !isValidUUID(id)) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
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
            created_at,
            cover_photo_url
          `)
          .eq('id', id)
          .maybeSingle();

        if (error || !instructorData) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, email, phone')
          .eq('id', instructorData.user_id)
          .single();

        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('*')
          .eq('instructor_id', id)
          .eq('is_active', true);

        const { data: specialties } = await supabase
          .from('instructor_specialties')
          .select('specialty')
          .eq('instructor_id', id);

        const { data: pricing } = await supabase
          .from('pricing')
          .select('*')
          .eq('instructor_id', id)
          .eq('is_active', true);

        const specialtyLabels: Record<string, string> = {
          first_license: 'Primeira habilitação',
          renewal: 'Reciclagem',
          anxious_students: 'Alunos ansiosos',
          elderly: 'Terceira idade',
          english_classes: 'Aulas em inglês',
          defensive_driving: 'Direção defensiva',
          night_classes: 'Aulas noturnas',
        };

        const mappedProfile: InstructorProfileType = {
          id: instructorData.id,
          name: profileData?.full_name || 'Instrutor',
          type: instructorData.is_driving_school ? 'school' : 'autonomous',
          isVerified: instructorData.verification_status === 'approved',
          profilePhoto: profileData?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
          coverPhoto: instructorData.cover_photo_url || 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&h=300&fit=crop',
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
          })) || [],
          reviews: [],
          location: {
            address: [instructorData.street, instructorData.neighborhood, instructorData.city, instructorData.state].filter(Boolean).join(', ') || 'São Paulo, SP',
            neighborhoods: instructorData.neighborhood ? [instructorData.neighborhood] : ['Centro'],
            coordinates: {
              lat: Number(instructorData.latitude) || -23.55,
              lng: Number(instructorData.longitude) || -46.63,
            },
          },
          pricing: pricing?.map(p => ({
            category: p.license_category,
            singleLesson: p.single_class_price,
            package5: p.package_5_price || undefined,
            package10: p.package_10_price || undefined,
          })) || [{ category: 'B', singleLesson: 100 }],
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
          availability: {
            morning: true,
            afternoon: true,
            evening: false,
          },
        };

        setInstructorDbId(instructorData.id);
        setProfile(mappedProfile);
        
        // Fetch public media
        fetchMedia(instructorData.id);
      } catch (error) {
        console.error('Error fetching instructor:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchMedia = async (instId: string) => {
      setLoadingMedia(true);
      try {
        const { data, error } = await supabase
          .from('instructor_videos')
          .select('id, title, description, video_url, thumbnail_url, video_type, media_type, is_public')
          .eq('instructor_id', instId)
          .eq('is_public', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setMediaItems(data || []);
      } catch (error) {
        console.error('Error fetching media:', error);
      } finally {
        setLoadingMedia(false);
      }
    };

    fetchInstructor();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="h-[300px] bg-muted animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Instrutor não encontrado</h1>
          <p className="text-muted-foreground">O perfil que você está procurando não existe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <ProfileHeader profile={profile} onBooking={handleHeaderBooking} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">
          {/* Main Content Area */}
          <div className="space-y-6">
            {/* Tabs for content organization */}
            <Tabs defaultValue="sobre" className="w-full">
              <TabsList className="w-full grid grid-cols-2 h-12 mb-6">
                <TabsTrigger value="sobre" className="text-sm md:text-base font-medium">
                  Sobre
                </TabsTrigger>
                <TabsTrigger value="midias" className="text-sm md:text-base font-medium">
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Mídias
                </TabsTrigger>
              </TabsList>

              {/* Fixed height container to prevent layout shifts */}
              <div className="min-h-[600px]">
                <TabsContent value="sobre" className="mt-0 space-y-6">
                  {/* Affiliation badge */}
                  {affiliationInfo && (
                    <Card className="border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-sky-800 dark:text-sky-300">
                            Este instrutor é filiado à autoescola{' '}
                            <Link 
                              to={`/instrutores/${affiliationInfo.driving_school_id}`}
                              className="underline hover:text-sky-600 dark:hover:text-sky-200"
                            >
                              {affiliationInfo.driving_school_name || 'Autoescola'}
                            </Link>
                          </p>
                          <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
                            A autoescola gerencia seus agendamentos e agenda.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <AboutCard profile={profile} />
                  
                  {/* Show linked instructors for driving schools */}
                  {profile.type === 'school' && instructorDbId && (
                    <LinkedInstructorsCard drivingSchoolId={instructorDbId} />
                  )}
                  
                  <VehiclesCard 
                    profile={profile} 
                    onSelectVehicle={(vehicle) => {
                      if (bookingCardRef.current) {
                        bookingCardRef.current.openWithVehicle(vehicle.id);
                      }
                    }}
                    selectionMode={true}
                  />
                  {instructorDbId ? (
                    <ReviewsCardLive instructorId={instructorDbId} />
                  ) : (
                    <ReviewsCard profile={profile} />
                  )}
                  <LocationCard profile={profile} />
                </TabsContent>

                <TabsContent value="midias" className="mt-0">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <LayoutGrid className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Mídias do Instrutor</h3>
                      </div>
                      
                      {loadingMedia ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[1, 2].map((i) => (
                            <Skeleton key={i} className="aspect-video rounded-lg" />
                          ))}
                        </div>
                      ) : mediaItems.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {mediaItems.map((media) => {
                            const isImage = media.media_type === 'image';
                            const isUpload = media.video_type === 'upload';
                            const youtubeMatch = media.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
                            const vimeoMatch = media.video_url.match(/vimeo\.com\/(\d+)/);
                            
                            return (
                              <div
                                key={media.id}
                                className="relative aspect-video bg-muted rounded-lg overflow-hidden group cursor-pointer"
                                onClick={() => setSelectedMedia(media)}
                              >
                                {isImage ? (
                                  // Image display
                                  <img
                                    src={media.video_url}
                                    alt={media.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                ) : isUpload ? (
                                  // Thumbnail or video preview for uploads
                                  <div className="w-full h-full bg-muted flex items-center justify-center">
                                    {media.thumbnail_url ? (
                                      <img
                                        src={media.thumbnail_url}
                                        alt={media.title}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                      />
                                    ) : (
                                      <video
                                        src={media.video_url}
                                        className="w-full h-full object-cover"
                                        preload="metadata"
                                        muted
                                      />
                                    )}
                                  </div>
                                ) : youtubeMatch ? (
                                  // YouTube thumbnail
                                  <img
                                    src={`https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`}
                                    alt={media.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                ) : vimeoMatch ? (
                                  // Vimeo placeholder
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/80 to-primary">
                                    <Play className="w-12 h-12 text-primary-foreground" />
                                  </div>
                                ) : (
                                  // Fallback
                                  <div className="w-full h-full flex items-center justify-center bg-muted">
                                    <ExternalLink className="w-8 h-8 text-muted-foreground" />
                                  </div>
                                )}
                                
                                {/* Hover overlay with zoom icon */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isImage ? (
                                      <ZoomIn className="w-10 h-10 text-white drop-shadow-lg" />
                                    ) : (
                                      <Play className="w-12 h-12 text-white drop-shadow-lg" />
                                    )}
                                  </div>
                                </div>
                                
                                {/* Title overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                  <p className="text-white text-sm font-medium truncate">{media.title}</p>
                                  {media.description && (
                                    <p className="text-white/70 text-xs truncate">{media.description}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <LayoutGrid className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                          <p className="text-muted-foreground text-sm">
                            Este instrutor ainda não adicionou mídias.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Sidebar - Static (not sticky) */}
          <div className="space-y-6">
            {/* Booking Card - Now static, positioned first in sidebar */}
            <BookingCard 
              ref={bookingCardRef}
              profile={profile} 
              instructorId={instructorDbId || profile.id} 
            />
            {/* Credentials Card */}
            <InfoCard profile={profile} />
          </div>
        </div>
      </div>
      
      {/* Media Lightbox */}
      <MediaLightbox 
        media={selectedMedia} 
        onClose={() => setSelectedMedia(null)} 
      />
    </div>
  );
};

export default InstructorProfile;
