import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import NavBar from "@/components/NavBar";
import ProfileHeader from "@/components/profile/ProfileHeader";
import AboutCard from "@/components/profile/AboutCard";
import VehiclesCard from "@/components/profile/VehiclesCard";
import ReviewsCard from "@/components/profile/ReviewsCard";
import ReviewsCardLive from "@/components/profile/ReviewsCardLive";
import LocationCard from "@/components/profile/LocationCard";
import BookingCard from "@/components/profile/BookingCard";
import InfoCard from "@/components/profile/InfoCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Video, ExternalLink } from "lucide-react";
import type { InstructorProfile as InstructorProfileType } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface InstructorVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  video_type: string;
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
  const [videos, setVideos] = useState<InstructorVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const bookingCardRef = useRef<{ openModal: () => void }>(null);

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
        
        // Fetch public videos
        fetchVideos(instructorData.id);
      } catch (error) {
        console.error('Error fetching instructor:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchVideos = async (instId: string) => {
      setLoadingVideos(true);
      try {
        const { data, error } = await supabase
          .from('instructor_videos')
          .select('id, title, description, video_url, thumbnail_url, video_type, is_public')
          .eq('instructor_id', instId)
          .eq('is_public', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setVideos(data || []);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoadingVideos(false);
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
                <TabsTrigger value="videos" className="text-sm md:text-base font-medium">
                  <Video className="w-4 h-4 mr-2" />
                  Vídeos
                </TabsTrigger>
              </TabsList>

              {/* Fixed height container to prevent layout shifts */}
              <div className="min-h-[600px]">
                <TabsContent value="sobre" className="mt-0 space-y-6">
                  <AboutCard profile={profile} />
                  <VehiclesCard profile={profile} />
                  {instructorDbId ? (
                    <ReviewsCardLive instructorId={instructorDbId} />
                  ) : (
                    <ReviewsCard profile={profile} />
                  )}
                  <LocationCard profile={profile} />
                </TabsContent>

                <TabsContent value="videos" className="mt-0">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <Video className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Vídeos do Instrutor</h3>
                      </div>
                      
                      {loadingVideos ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[1, 2].map((i) => (
                            <Skeleton key={i} className="aspect-video rounded-lg" />
                          ))}
                        </div>
                      ) : videos.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {videos.map((video) => {
                            const isUpload = video.video_type === 'upload';
                            const youtubeMatch = video.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
                            const vimeoMatch = video.video_url.match(/vimeo\.com\/(\d+)/);
                            const thumbnail = youtubeMatch 
                              ? `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`
                              : null;
                            
                            return (
                              <div
                                key={video.id}
                                className="relative aspect-video bg-muted rounded-lg overflow-hidden group"
                              >
                                {isUpload ? (
                                  // Native video player for uploaded files
                                  <video
                                    src={video.video_url}
                                    controls
                                    className="w-full h-full object-cover"
                                    preload="metadata"
                                    poster={video.thumbnail_url || undefined}
                                  >
                                    Seu navegador não suporta vídeos HTML5.
                                  </video>
                                ) : youtubeMatch ? (
                                  // YouTube embed
                                  <iframe
                                    src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
                                    title={video.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                  />
                                ) : vimeoMatch ? (
                                  // Vimeo embed
                                  <iframe
                                    src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                                    title={video.title}
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                  />
                                ) : (
                                  // Fallback: link to external video
                                  <a
                                    href={video.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full h-full flex items-center justify-center bg-muted"
                                  >
                                    <div className="text-center">
                                      <ExternalLink className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                      <span className="text-sm text-muted-foreground">Abrir vídeo</span>
                                    </div>
                                  </a>
                                )}
                                
                                {/* Title overlay for non-player views */}
                                {!isUpload && !youtubeMatch && !vimeoMatch && (
                                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-white text-sm font-medium truncate">{video.title}</p>
                                    {video.description && (
                                      <p className="text-white/70 text-xs truncate">{video.description}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Video className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                          <p className="text-muted-foreground text-sm">
                            Este instrutor ainda não adicionou vídeos.
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
    </div>
  );
};

export default InstructorProfile;
