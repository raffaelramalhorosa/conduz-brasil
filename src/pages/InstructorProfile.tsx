import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
import { Play, Video, ExternalLink, Image as ImageIcon, LayoutGrid, ZoomIn, Building2, ArrowLeft, Share2, Star, MapPin, Clock, Award, ThumbsUp, Car } from "lucide-react";
import type { InstructorProfile as InstructorProfileType } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useInstructorAffiliation } from "@/hooks/useAffiliationInfo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

const MOBILE_TABS = ["sobre", "veiculos", "precos", "avaliacoes", "fotos"] as const;
const TAB_LABELS: Record<string, string> = {
  sobre: "Sobre",
  veiculos: "Veículos",
  precos: "Preços",
  avaliacoes: "Avaliações",
  fotos: "Fotos",
};

const InstructorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<InstructorProfileType | null>(null);
  const [instructorDbId, setInstructorDbId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState<InstructorMedia[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<InstructorMedia | null>(null);
  const { data: affiliationInfo } = useInstructorAffiliation(id || null);
  const bookingCardRef = useRef<{ openModal: () => void; openWithVehicle: (vehicleId: string) => void; scrollToVehicles: () => void }>(null);

  // Mobile state
  const [activeMobileTab, setActiveMobileTab] = useState("sobre");
  const [showFullBio, setShowFullBio] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Raw DB data for mobile sections
  const [rawInstructor, setRawInstructor] = useState<any>(null);
  const [rawPricing, setRawPricing] = useState<any[]>([]);

  const handleHeaderBooking = () => {
    bookingCardRef.current?.openModal();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.name || "Instrutor",
          text: `Confira o perfil de ${profile?.name}`,
          url: window.location.href,
        });
      } catch (e) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  };

  // Intersection observer for mobile tabs
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveMobileTab(entry.target.id.replace("section-", ""));
          }
        });
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0.1 }
    );

    MOBILE_TABS.forEach((tab) => {
      const el = sectionRefs.current[tab];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [profile]);

  const scrollToSection = (tab: string) => {
    setActiveMobileTab(tab);
    const el = sectionRefs.current[tab];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
            id, user_id, bio, experience_years, average_rating, total_reviews,
            total_classes, acceptance_rate, is_driving_school, verification_status,
            city, state, neighborhood, street, latitude, longitude, created_at, cover_photo_url
          `)
          .eq('id', id)
          .maybeSingle();

        if (error || !instructorData) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setRawInstructor(instructorData);

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

        setRawPricing(pricing || []);

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

  // Build pricing packages for mobile
  const buildPackages = () => {
    if (!rawPricing.length) return [];
    const p = rawPricing[0];
    const packages: { quantity: number; totalPrice: number; perClass: number; discount: number; isBestValue: boolean }[] = [];
    const single = p.single_class_price;

    if (p.package_5_price) {
      const per = p.package_5_price / 5;
      packages.push({ quantity: 5, totalPrice: p.package_5_price, perClass: per, discount: Math.round((1 - per / single) * 100), isBestValue: false });
    }
    if (p.package_10_price) {
      const per = p.package_10_price / 10;
      packages.push({ quantity: 10, totalPrice: p.package_10_price, perClass: per, discount: Math.round((1 - per / single) * 100), isBestValue: false });
    }
    if (p.package_20_price) {
      const per = p.package_20_price / 20;
      packages.push({ quantity: 20, totalPrice: p.package_20_price, perClass: per, discount: Math.round((1 - per / single) * 100), isBestValue: false });
    }

    // Mark best value (highest discount)
    if (packages.length > 0) {
      const maxDiscount = Math.max(...packages.map((pk) => pk.discount));
      const best = packages.find((pk) => pk.discount === maxDiscount);
      if (best) best.isBestValue = true;
    }
    return packages;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="h-[300px] md:h-[300px] bg-muted animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-[1fr_380px] gap-6">
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="hidden lg:block space-y-6">
              <Skeleton className="h-80 w-full" />
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

  const minPrice = profile.pricing?.[0]?.singleLesson || 100;
  const packages = buildPackages();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop NavBar */}
      <div className="hidden md:block">
        <NavBar />
      </div>

      {/* ===== MOBILE HERO ===== */}
      <div className="md:hidden">
        <div className="relative h-36">
          {profile.coverPhoto ? (
            <img src={profile.coverPhoto} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10" />
          )}
          <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <button onClick={handleShare} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="px-4 -mt-12 relative z-10">
          <div className="flex items-end gap-3">
            <img
              src={profile.profilePhoto}
              alt={profile.name}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-background shadow-lg"
            />
            <div className="pb-1">
              <h1 className="text-lg font-bold leading-tight text-foreground">{profile.name}</h1>
              {profile.type === "school" && (
                <span className="inline-block px-2 py-0.5 rounded bg-secondary/15 text-secondary text-[11px] font-bold mt-0.5">
                  Autoescola
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 pb-3 border-b border-border/40">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-foreground">
                {profile.rating > 0 ? profile.rating.toFixed(1) : "--"}
              </span>
              <span className="text-xs text-muted-foreground">({profile.totalReviews})</span>
            </div>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-xs text-muted-foreground">{rawInstructor?.total_classes || 0}+ aulas</span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-xs text-muted-foreground">
              {rawInstructor?.city}, {rawInstructor?.state}
            </span>
          </div>
        </div>
      </div>

      {/* ===== MOBILE: Sticky tabs ===== */}
      <div className="md:hidden sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="flex overflow-x-auto no-scrollbar">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => scrollToSection(tab)}
              className={cn(
                "shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeMobileTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              )}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* ===== MOBILE CONTENT ===== */}
      <div className="md:hidden">
        {/* Sobre */}
        <div id="section-sobre" ref={(el) => { sectionRefs.current.sobre = el; }} className="px-4 py-5">
          <h2 className="text-base font-semibold text-foreground mb-2">Sobre</h2>
          <p className={cn("text-sm text-muted-foreground leading-relaxed", !showFullBio && "line-clamp-3")}>
            {profile.about}
          </p>
          {profile.about.length > 120 && (
            <button onClick={() => setShowFullBio(!showFullBio)} className="text-primary text-xs font-medium mt-1">
              {showFullBio ? "Ver menos" : "Ver mais"}
            </button>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs text-foreground">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {rawInstructor?.experience_years || "?"} anos de experiência
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs text-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              {rawInstructor?.city}, {rawInstructor?.state}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs text-foreground">
              <Award className="w-3.5 h-3.5 text-primary" />
              Cat {profile.categories.join(", ") || "B"}
            </span>
            {rawInstructor?.acceptance_rate > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs text-foreground">
                <ThumbsUp className="w-3.5 h-3.5 text-green-500" />
                {rawInstructor.acceptance_rate}% aceita
              </span>
            )}
          </div>
        </div>

        {/* Veículos */}
        <div id="section-veiculos" ref={(el) => { sectionRefs.current.veiculos = el; }} className="py-5">
          <h2 className="text-base font-semibold text-foreground mb-3 px-4">Veículos</h2>
          {profile.vehicles.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2">
              {profile.vehicles.map((v) => (
                <div key={v.id} className="shrink-0 w-56 rounded-xl overflow-hidden bg-muted/50 border border-border/40">
                  <div className="h-32 bg-muted">
                    <img src={v.photo} className="w-full h-full object-cover" loading="lazy" alt={v.model} />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-foreground">{v.model}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.features.join(" · ")} · Cat {v.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4">
              <Car className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhum veículo cadastrado</p>
            </div>
          )}
        </div>

        {/* Preços */}
        <div id="section-precos" ref={(el) => { sectionRefs.current.precos = el; }} className="px-4 py-5">
          <h2 className="text-base font-semibold text-foreground mb-3">Preços</h2>
          <div className="space-y-2">
            {rawPricing.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/40">
                <div>
                  <p className="text-sm font-medium text-foreground">Aula avulsa</p>
                  <p className="text-xs text-muted-foreground">1 aula</p>
                </div>
                <p className="text-base font-bold text-foreground">R$ {rawPricing[0].single_class_price?.toFixed(2)}</p>
              </div>
            )}
            {packages.map((pkg) => (
              <div
                key={pkg.quantity}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border",
                  pkg.isBestValue ? "bg-primary/10 border-primary/30" : "bg-muted/50 border-border/40"
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">Pacote {pkg.quantity} aulas</p>
                    {pkg.isBestValue && (
                      <span className="px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
                        Melhor valor
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">R$ {pkg.perClass.toFixed(2)}/aula</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-foreground">R$ {pkg.totalPrice.toFixed(2)}</p>
                  {pkg.discount > 0 && (
                    <span className="text-xs font-bold text-green-500">-{pkg.discount}%</span>
                  )}
                </div>
              </div>
            ))}
            {rawPricing.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Preços não disponíveis</p>
            )}
          </div>
        </div>

        {/* Avaliações */}
        <div id="section-avaliacoes" ref={(el) => { sectionRefs.current.avaliacoes = el; }} className="px-4 py-5">
          {instructorDbId ? (
            <ReviewsCardLive instructorId={instructorDbId} />
          ) : (
            <ReviewsCard profile={profile} />
          )}
        </div>

        {/* Fotos */}
        <div id="section-fotos" ref={(el) => { sectionRefs.current.fotos = el; }} className="py-5">
          <h2 className="text-base font-semibold text-foreground mb-3 px-4">Fotos e Vídeos</h2>
          {mediaItems.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-2">
              {mediaItems.map((item, i) => (
                <div
                  key={item.id}
                  className="shrink-0 w-36 h-36 rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => setSelectedMedia(item)}
                >
                  {item.media_type === "image" ? (
                    <img src={item.video_url} className="w-full h-full object-cover" loading="lazy" alt={item.title} />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Play className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4">
              <LayoutGrid className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhuma mídia adicionada</p>
            </div>
          )}
        </div>

        {/* Spacer for mobile CTA */}
        <div className="h-24" />
      </div>

      {/* ===== DESKTOP CONTENT ===== */}
      <div className="hidden md:block">
        <ProfileHeader profile={profile} onBooking={handleHeaderBooking} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
          <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">
            <div className="space-y-6">
              <Tabs defaultValue="sobre" className="w-full">
                <TabsList className="w-full grid grid-cols-2 h-12 mb-6">
                  <TabsTrigger value="sobre" className="text-sm md:text-base font-medium">Sobre</TabsTrigger>
                  <TabsTrigger value="midias" className="text-sm md:text-base font-medium">
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Mídias
                  </TabsTrigger>
                </TabsList>

                <div className="min-h-[600px]">
                  <TabsContent value="sobre" className="mt-0 space-y-6">
                    {affiliationInfo?.is_affiliated && affiliationInfo.affiliations.length > 0 && (
                      <Card className="border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Building2 className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                            <p className="text-sm font-medium text-sky-800 dark:text-sky-300">
                              Esse instrutor também trabalha em:
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {affiliationInfo.affiliations.map((aff) => (
                              <Link
                                key={aff.driving_school_id}
                                to={`/instrutores/${aff.driving_school_id}`}
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                              >
                                {aff.driving_school_logo ? (
                                  <img
                                    src={aff.driving_school_logo}
                                    alt={aff.driving_school_name || 'Autoescola'}
                                    className="w-9 h-9 rounded-full object-cover border-2 border-sky-200 dark:border-sky-700"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-800 flex items-center justify-center border-2 border-sky-200 dark:border-sky-700">
                                    <span className="text-xs font-bold text-sky-700 dark:text-sky-300">
                                      {(aff.driving_school_name || 'A').charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <span className="text-sm font-medium text-sky-700 dark:text-sky-300 underline">
                                  {aff.driving_school_name || 'Autoescola'}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    <AboutCard profile={profile} />
                    {profile.type === 'school' && instructorDbId && (
                      <LinkedInstructorsCard drivingSchoolId={instructorDbId} />
                    )}
                    <VehiclesCard
                      profile={profile}
                      onSelectVehicle={(vehicle) => {
                        bookingCardRef.current?.openWithVehicle(vehicle.id);
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
                                    <img src={media.video_url} alt={media.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                  ) : isUpload ? (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                      {media.thumbnail_url ? (
                                        <img src={media.thumbnail_url} alt={media.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                      ) : (
                                        <video src={media.video_url} className="w-full h-full object-cover" preload="metadata" muted />
                                      )}
                                    </div>
                                  ) : youtubeMatch ? (
                                    <img src={`https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`} alt={media.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                  ) : vimeoMatch ? (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/80 to-primary">
                                      <Play className="w-12 h-12 text-primary-foreground" />
                                    </div>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted">
                                      <ExternalLink className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      {isImage ? <ZoomIn className="w-10 h-10 text-white drop-shadow-lg" /> : <Play className="w-12 h-12 text-white drop-shadow-lg" />}
                                    </div>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                    <p className="text-white text-sm font-medium truncate">{media.title}</p>
                                    {media.description && <p className="text-white/70 text-xs truncate">{media.description}</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <LayoutGrid className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">Este instrutor ainda não adicionou mídias.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            <div className="space-y-6">
              <BookingCard ref={bookingCardRef} profile={profile} instructorId={instructorDbId || profile.id} />
              <InfoCard profile={profile} />
            </div>
          </div>
        </div>
      </div>

      {/* BookingCard (mobile bottom bar is rendered inside BookingCard) */}
      <div className="md:hidden">
        <BookingCard ref={bookingCardRef} profile={profile} instructorId={instructorDbId || profile.id} />
      </div>

      <MediaLightbox media={selectedMedia} onClose={() => setSelectedMedia(null)} />
    </div>
  );
};

export default InstructorProfile;
