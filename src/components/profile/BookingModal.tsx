import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Check, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle,
  Settings,
  Wind,
  Accessibility,
  Timer,
  Loader2,
  Package,
  User,
  Users
} from "lucide-react";
import BookingLocationMap from "./BookingLocationMap";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { InstructorProfile } from "@/types";
import { formatSimpleAddress, formatDateForStorage } from "@/lib/addressFormatter";
import { PackageSelector, PackageType, getPackageLessonsCount } from "./booking/PackageSelector";
import { MultiSlotCalendar, ScheduledSlot } from "./booking/MultiSlotCalendar";
import { BookingSummary } from "./booking/BookingSummary";

interface LinkedInstructor {
  id: string;
  name: string;
  email: string;
  photo_url: string | null;
  status: string;
  linked_vehicle_ids?: string[] | null;
}

interface PreSelectedVehicle {
  id: string;
  brand?: string;
  model: string;
  year: number;
  category: string;
  features: string[];
  photo: string;
  pricing?: {
    single_class_price?: number;
    package_5_price?: number | null;
    package_10_price?: number | null;
    package_20_price?: number | null;
  };
}

interface BookingModalProps {
  profile: InstructorProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
  selectedLinkedInstructor?: LinkedInstructor | null;
  preSelectedVehicle?: PreSelectedVehicle | null;
  isDrivingSchool?: boolean;
}

interface VehicleWithPricing {
  id: string;
  brand: string;
  model: string;
  year: number;
  license_category: string;
  transmission: string;
  has_air_conditioning: boolean;
  has_power_steering: boolean;
  is_adapted: boolean;
  main_photo_url: string | null;
  pricing: {
    id: string;
    single_class_price: number;
    package_5_price?: number | null;
    package_10_price?: number | null;
    package_20_price?: number | null;
    license_category: string;
  }[];
}

interface Availability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

type StepType = 'instructor' | 'vehicle' | 'plan' | 'dates' | 'location' | 'confirm';

interface StepConfig {
  step: number;
  label: string;
  type: StepType;
}

// Dynamic steps based on context
const getSteps = (isDrivingSchool: boolean, hasPreSelectedVehicle: boolean): StepConfig[] => {
  const steps: StepConfig[] = [];
  let stepNum = 1;

  // Step 1: Instructor selection (only for driving schools)
  if (isDrivingSchool) {
    steps.push({ step: stepNum++, label: 'Instrutor', type: 'instructor' });
  }

  // Step 2: Vehicle selection (skip if pre-selected)
  if (!hasPreSelectedVehicle) {
    steps.push({ step: stepNum++, label: 'Veículo', type: 'vehicle' });
  }

  // Step 3: Plan selection
  steps.push({ step: stepNum++, label: 'Plano', type: 'plan' });

  // Step 4: Date selection
  steps.push({ step: stepNum++, label: 'Datas', type: 'dates' });

  // Step 5: Location
  steps.push({ step: stepNum++, label: 'Local', type: 'location' });

  // Step 6: Confirmation
  steps.push({ step: stepNum++, label: 'Confirmar', type: 'confirm' });

  return steps;
};

const BookingModal = ({ 
  profile, 
  open, 
  onOpenChange, 
  instructorId, 
  preSelectedVehicle,
  isDrivingSchool = false
}: BookingModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Determine context
  const hasPreSelectedVehicle = !!preSelectedVehicle;
  const STEPS = getSteps(isDrivingSchool, hasPreSelectedVehicle);
  const maxStep = STEPS.length;
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [selectedInstructor, setSelectedInstructor] = useState<LinkedInstructor | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageType>('single');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithPricing | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlots, setSelectedSlots] = useState<ScheduledSlot[]>([]);
  const [pickupAddress, setPickupAddress] = useState("");
  const [studentMessage, setStudentMessage] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Data from DB
  const [linkedInstructors, setLinkedInstructors] = useState<LinkedInstructor[]>([]);
  const [vehicles, setVehicles] = useState<VehicleWithPricing[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  // Reset form
  const resetBookingForm = () => {
    setCurrentStep(1);
    setSelectedInstructor(null);
    setSelectedPackage('single');
    setSelectedVehicle(null);
    setSelectedDate(undefined);
    setSelectedSlots([]);
    setPickupAddress("");
    setStudentMessage("");
    setAgreedToTerms(false);
    setAvailableSlots([]);
  };

  // Helper to check if ID is a valid UUID
  const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      resetBookingForm();
    }
  }, [open]);

  // Handle pre-selected vehicle when modal opens
  useEffect(() => {
    if (open && preSelectedVehicle) {
      const vehicleWithPricing: VehicleWithPricing = {
        id: preSelectedVehicle.id,
        brand: preSelectedVehicle.brand || preSelectedVehicle.model.split(' ')[0] || 'Veículo',
        model: preSelectedVehicle.brand ? preSelectedVehicle.model : (preSelectedVehicle.model.split(' ').slice(1).join(' ') || preSelectedVehicle.model),
        year: preSelectedVehicle.year,
        license_category: preSelectedVehicle.category,
        transmission: preSelectedVehicle.features.includes('Automático') ? 'automatic' : 'manual',
        has_air_conditioning: preSelectedVehicle.features.includes('Ar-condicionado'),
        has_power_steering: preSelectedVehicle.features.includes('Direção hidráulica'),
        is_adapted: preSelectedVehicle.features.includes('Adaptado PCD'),
        main_photo_url: preSelectedVehicle.photo,
        pricing: preSelectedVehicle.pricing ? [{
          id: preSelectedVehicle.id,
          single_class_price: preSelectedVehicle.pricing.single_class_price || profile.pricing?.[0]?.singleLesson || 100,
          package_5_price: preSelectedVehicle.pricing.package_5_price,
          package_10_price: preSelectedVehicle.pricing.package_10_price,
          package_20_price: preSelectedVehicle.pricing.package_20_price,
          license_category: preSelectedVehicle.category
        }] : []
      };
      setSelectedVehicle(vehicleWithPricing);
    }
  }, [open, preSelectedVehicle, profile.pricing]);

  // Fetch data when modal opens
  useEffect(() => {
    if (open && instructorId && isValidUUID(instructorId)) {
      fetchAllData();
    } else if (open) {
      setLoadingData(false);
    }
  }, [open, instructorId]);

  const fetchAllData = async () => {
    if (!isValidUUID(instructorId)) {
      setLoadingData(false);
      return;
    }
    
    setLoadingData(true);
    try {
      // Fetch vehicles, availability, and linked instructors in parallel
      const [vehiclesRes, availabilityRes, instructorsRes] = await Promise.all([
        supabase
          .from('vehicles')
          .select(`
            id, brand, model, year, license_category, transmission,
            has_air_conditioning, has_power_steering, is_adapted, main_photo_url,
            pricing (id, single_class_price, package_5_price, package_10_price, package_20_price, license_category)
          `)
          .eq('instructor_id', instructorId)
          .eq('is_active', true),
        supabase
          .from('instructor_availability')
          .select('day_of_week, start_time, end_time, is_available')
          .eq('instructor_id', instructorId)
          .eq('is_available', true),
        isDrivingSchool ? supabase
          .from('driving_school_instructors')
          .select('id, name, email, photo_url, status, linked_vehicle_ids')
          .eq('driving_school_id', instructorId)
          .eq('status', 'active') : Promise.resolve({ data: [], error: null })
      ]);

      if (vehiclesRes.error) throw vehiclesRes.error;
      if (vehiclesRes.data) setVehicles(vehiclesRes.data as VehicleWithPricing[]);
      if (availabilityRes.data) setAvailability(availabilityRes.data);
      if (instructorsRes.data) setLinkedInstructors(instructorsRes.data as LinkedInstructor[]);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Helper to check if a time slot is in the past for today
  const isSlotInPast = (slotTime: string, date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate.getTime() !== today.getTime()) return false;
    
    const now = new Date();
    const [hours] = slotTime.split(':').map(Number);
    return hours <= now.getHours();
  };

  const fetchAvailableSlots = async (date: Date) => {
    setLoadingSlots(true);
    
    try {
      const dayOfWeek = date.getDay();
      
      if (!isValidUUID(instructorId)) {
        const defaultSlots: TimeSlot[] = [];
        for (let hour = 7; hour <= 20; hour++) {
          const slotTime = `${hour.toString().padStart(2, '0')}:00`;
          defaultSlots.push({
            time: slotTime,
            available: !isSlotInPast(slotTime, date)
          });
        }
        setAvailableSlots(defaultSlots);
        setLoadingSlots(false);
        return;
      }
      
      const { data: availabilityData, error: availError } = await supabase
        .from('instructor_availability')
        .select('*')
        .eq('instructor_id', instructorId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);
      
      if (availError) throw availError;
      
      if (!availabilityData || availabilityData.length === 0) {
        const defaultSlots: TimeSlot[] = [];
        for (let hour = 7; hour <= 20; hour++) {
          const slotTime = `${hour.toString().padStart(2, '0')}:00`;
          defaultSlots.push({
            time: slotTime,
            available: !isSlotInPast(slotTime, date)
          });
        }
        setAvailableSlots(defaultSlots);
        setLoadingSlots(false);
        return;
      }
      
      const { data: bookingsData, error: bookError } = await supabase
        .from('bookings')
        .select('start_time, end_time, scheduled_slots')
        .eq('instructor_id', instructorId)
        .in('status', ['pending', 'confirmed']);
      
      if (bookError) throw bookError;

      // Get all booked times for the selected date
      const dateStr = format(date, 'yyyy-MM-dd');
      const bookedTimes: string[] = [];
      
      bookingsData?.forEach(booking => {
        if (booking.start_time) {
          bookedTimes.push(booking.start_time.slice(0, 5));
        }
        if (booking.scheduled_slots && Array.isArray(booking.scheduled_slots)) {
          (booking.scheduled_slots as unknown as ScheduledSlot[]).forEach(slot => {
            if (slot.date === dateStr && slot.status !== 'cancelled') {
              bookedTimes.push(slot.time);
            }
          });
        }
      });
      
      const slots: TimeSlot[] = [];
      
      availabilityData.forEach(period => {
        const startHour = parseInt(period.start_time.split(':')[0]);
        const endHour = parseInt(period.end_time.split(':')[0]);
        
        for (let hour = startHour; hour < endHour; hour++) {
          const slotTime = `${hour.toString().padStart(2, '0')}:00`;
          const isBooked = bookedTimes.includes(slotTime);
          
          slots.push({
            time: slotTime,
            available: !isBooked && !isSlotInPast(slotTime, date)
          });
        }
      });
      
      const uniqueSlots = slots
        .filter((slot, index, self) => index === self.findIndex(s => s.time === slot.time))
        .sort((a, b) => a.time.localeCompare(b.time));
      
      setAvailableSlots(uniqueSlots);
      
    } catch (error) {
      console.error('Erro ao buscar slots:', error);
      toast.error('Erro ao carregar horários');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Get pricing for selected vehicle and package
  const getPricing = () => {
    if (!selectedVehicle?.pricing?.[0]) {
      return { 
        singlePrice: profile.pricing?.[0]?.singleLesson || 100,
        package5Price: profile.pricing?.[0]?.package5 || null,
        package10Price: profile.pricing?.[0]?.package10 || null,
        package20Price: null
      };
    }
    const pricing = selectedVehicle.pricing[0];
    return {
      singlePrice: pricing.single_class_price,
      package5Price: pricing.package_5_price,
      package10Price: pricing.package_10_price,
      package20Price: pricing.package_20_price
    };
  };

  const getPackagePrice = (): number => {
    const { singlePrice, package5Price, package10Price, package20Price } = getPricing();
    
    switch (selectedPackage) {
      case 'package_5': return package5Price || singlePrice * 5;
      case 'package_10': return package10Price || singlePrice * 10;
      case 'package_20': return package20Price || singlePrice * 20;
      default: return singlePrice;
    }
  };

  const getPackageLabel = (): string => {
    switch (selectedPackage) {
      case 'package_5': return 'Pacote 5 Aulas';
      case 'package_10': return 'Pacote 10 Aulas';
      case 'package_20': return 'Pacote 20 Aulas';
      default: return 'Aula Avulsa';
    }
  };

  const requiredSlots = getPackageLessonsCount(selectedPackage);
  const totalPrice = getPackagePrice();
  const platformFee = Math.round(totalPrice * 0.12 * 100) / 100;
  const instructorAmount = totalPrice - platformFee;

  // Check if day has availability
  const isDayDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate < today) return true;
    
    if (availability.length === 0) return false;
    
    const dayOfWeek = date.getDay();
    return !availability.some(a => a.day_of_week === dayOfWeek);
  };

  // Get current step type
  const getCurrentStepType = (): StepType => {
    const currentStepConfig = STEPS.find(s => s.step === currentStep);
    return currentStepConfig?.type || 'vehicle';
  };

  const stepType = getCurrentStepType();

  // Navigation validation
  const canProceed = (): boolean => {
    switch (stepType) {
      case 'instructor':
        return selectedInstructor !== null;
      case 'vehicle':
        return selectedVehicle !== null;
      case 'plan':
        return true; // Package always has a default
      case 'dates':
        return selectedSlots.length === requiredSlots;
      case 'location':
        return pickupAddress.trim().length > 10;
      case 'confirm':
        return agreedToTerms;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleVehicleSelect = (vehicle: VehicleWithPricing) => {
    setSelectedVehicle(vehicle);
    // Reset package selection when vehicle changes
    setSelectedPackage('single');
    setSelectedSlots([]);
  };

  const handleInstructorSelect = (instructor: LinkedInstructor) => {
    setSelectedInstructor(instructor);
    // Reset vehicle selection when instructor changes (if not in linked vehicles)
    if (selectedVehicle && instructor.linked_vehicle_ids?.length) {
      if (!instructor.linked_vehicle_ids.includes(selectedVehicle.id)) {
        setSelectedVehicle(null);
      }
    }
  };

  const isDemoProfile = !instructorId || !isValidUUID(instructorId);

  // Filter vehicles by selected instructor's linked vehicles (for driving schools)
  const filteredVehicles = isDrivingSchool && selectedInstructor?.linked_vehicle_ids?.length
    ? vehicles.filter(v => selectedInstructor.linked_vehicle_ids!.includes(v.id))
    : vehicles;

  // Submit booking
  const handleSubmitBooking = async () => {
    if (!agreedToTerms) {
      toast.error('Você precisa concordar com os termos');
      return;
    }

    if (!user || !selectedVehicle || selectedSlots.length !== requiredSlots) {
      toast.error('Dados incompletos');
      return;
    }

    if (isDrivingSchool && !selectedInstructor) {
      toast.error('Selecione um instrutor');
      return;
    }

    if (isDemoProfile) {
      toast.info('Este é um perfil de demonstração.', { duration: 5000 });
      return;
    }

    setSubmitting(true);

    try {
      const { data: studentData, error: studentError } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let studentId: string;

      if (studentError || !studentData) {
        const { data: newStudent, error: createError } = await supabase
          .from('student_profiles')
          .upsert({ user_id: user.id }, { onConflict: 'user_id' })
          .select('id')
          .single();

        if (createError) {
          toast.error('Erro ao criar perfil de aluno');
          setSubmitting(false);
          return;
        }
        studentId = newStudent.id;
      } else {
        studentId = studentData.id;
      }

      // Use first slot for main booking record
      const firstSlot = selectedSlots[0];
      const [hours, minutes] = firstSlot.time.split(':').map(Number);
      const endHour = hours + 1;
      const endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      const bookingData = {
        student_id: studentId,
        instructor_id: instructorId,
        vehicle_id: selectedVehicle.id,
        license_category: selectedVehicle.license_category,
        scheduled_date: firstSlot.date,
        start_time: firstSlot.time,
        end_time: endTime,
        duration_hours: 1,
        pickup_address: pickupAddress.trim(),
        price_per_hour: getPricing().singlePrice,
        total_price: totalPrice,
        platform_fee: platformFee,
        instructor_amount: instructorAmount,
        student_message: studentMessage.trim() || null,
        status: 'pending',
        package_type: selectedPackage,
        package_lessons_count: requiredSlots,
        scheduled_slots: selectedSlots, // Send as array, not JSON string - Supabase handles JSONB
        package_price: totalPrice,
        completed_lessons_count: 0,
        // Include instructor message with selected linked instructor info for driving schools
        instructor_message: isDrivingSchool && selectedInstructor 
          ? `Instrutor designado: ${selectedInstructor.name}` 
          : null
      };

      const { data: bookingResult, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData as any)
        .select('id')
        .single();

      if (bookingError || !bookingResult) {
        console.error('Booking insert error:', bookingError);
        toast.error('Erro ao enviar solicitação. Tente novamente.');
        return;
      }

      // Create or get conversation for this student-instructor pair
      // This ensures messages are visible to both parties
      try {
        // First check if conversation already exists
        const { data: existingConversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('student_id', studentId)
          .eq('instructor_id', instructorId)
          .maybeSingle();

        let conversationId = existingConversation?.id;

        // Create conversation if it doesn't exist
        if (!conversationId) {
          const { data: newConversation, error: convError } = await supabase
            .from('conversations')
            .insert({
              student_id: studentId,
              instructor_id: instructorId,
            })
            .select('id')
            .single();

          if (!convError && newConversation) {
            conversationId = newConversation.id;
          }
        }

        // If student included a message, send it as a chat message linked to the conversation
        if (studentMessage.trim() && conversationId) {
          await supabase.from('chat_messages').insert({
            conversation_id: conversationId,
            booking_id: bookingResult.id,
            sender_id: user.id,
            message: studentMessage.trim(),
          });
        }
      } catch (convError) {
        console.error('Error creating conversation:', convError);
        // Don't fail the booking if conversation creation fails
      }

      // Send email notification to instructor
      try {
        // Get instructor email
        const { data: instructorProfile } = await supabase
          .from('instructor_profiles')
          .select('user_id')
          .eq('id', instructorId)
          .single();

        if (instructorProfile) {
          const { data: instructorData } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', instructorProfile.user_id)
            .single();

          // Get student name
          const { data: studentProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

          if (instructorData?.email) {
            // Format date
            const formattedDate = new Date(firstSlot.date + 'T12:00:00').toLocaleDateString('pt-BR');

            await supabase.functions.invoke('notify-new-booking', {
              body: {
                bookingId: bookingResult.id,
                instructorEmail: instructorData.email,
                instructorName: instructorData.full_name || 'Instrutor',
                studentName: studentProfile?.full_name || 'Aluno',
                scheduledDate: formattedDate,
                startTime: firstSlot.time,
                pickupAddress: pickupAddress.trim(),
                packageType: selectedPackage,
                lessonsCount: requiredSlots,
                totalPrice: totalPrice,
                studentMessage: studentMessage.trim() || undefined,
              },
            });
          }
        }
      } catch (notifyError) {
        console.error('Error sending new booking notification:', notifyError);
        // Don't fail the booking if notification fails
      }

      onOpenChange(false);
      resetBookingForm();

      toast.success('Solicitação enviada com sucesso!', {
        description: selectedPackage === 'single' 
          ? 'O instrutor foi notificado e responderá em breve.'
          : `Seu pacote de ${requiredSlots} aulas foi enviado para aprovação.`,
        action: {
          label: 'Ver Minhas Aulas',
          onClick: () => navigate('/aluno/aulas')
        },
        duration: 10000
      });

    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Use mock vehicles if none from DB
  const displayVehicles: VehicleWithPricing[] = filteredVehicles.length > 0 ? filteredVehicles : profile.vehicles.map(v => ({
    id: v.id,
    brand: v.model.split(' ')[0] || 'Veículo',
    model: v.model.split(' ').slice(1).join(' ') || v.model,
    year: v.year,
    license_category: v.category,
    transmission: v.features.includes('Automático') ? 'automatic' : 'manual',
    has_air_conditioning: v.features.includes('Ar-condicionado'),
    has_power_steering: v.features.includes('Direção hidráulica'),
    is_adapted: v.features.includes('Adaptado PCD'),
    main_photo_url: v.photo,
    pricing: []
  }));

  const { singlePrice, package5Price, package10Price, package20Price } = selectedVehicle 
    ? getPricing() 
    : { singlePrice: profile.pricing?.[0]?.singleLesson || 100, package5Price: null, package10Price: null, package20Price: null };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Agendar Aula</DialogTitle>
          <DialogDescription>
            {profile.name} • {profile.location?.address?.split(',').slice(-2).join(',').trim() || 'Local não informado'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((item, index) => (
              <div key={item.step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all duration-300",
                    currentStep >= item.step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {currentStep > item.step ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      item.step
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-medium transition-colors text-center",
                    currentStep >= item.step ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </div>
                
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "h-1 flex-1 mx-2 mb-8 transition-all duration-300 rounded-full",
                    currentStep > item.step ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* STEP: Instructor Selection (Driving Schools only) */}
          {stepType === 'instructor' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">Escolha seu instrutor</h3>
              </div>
              
              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : linkedInstructors.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-lg">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum instrutor disponível</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {linkedInstructors.map((instructor) => (
                    <label
                      key={instructor.id}
                      className={cn(
                        "border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md",
                        selectedInstructor?.id === instructor.id
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border"
                      )}
                    >
                      <input
                        type="radio"
                        name="instructor"
                        value={instructor.id}
                        checked={selectedInstructor?.id === instructor.id}
                        onChange={() => handleInstructorSelect(instructor)}
                        className="sr-only"
                      />
                      
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                          {instructor.photo_url ? (
                            <img
                              src={instructor.photo_url}
                              alt={instructor.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-primary font-semibold text-lg">
                              {getInitials(instructor.name)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground truncate">
                            {instructor.name}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {instructor.email}
                          </p>
                        </div>
                        
                        {selectedInstructor?.id === instructor.id && (
                          <CheckCircle className="w-6 h-6 text-primary shrink-0" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP: Vehicle Selection */}
          {stepType === 'vehicle' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Instructor Summary Header (for driving schools) */}
              {isDrivingSchool && selectedInstructor && (
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                    {selectedInstructor.photo_url ? (
                      <img
                        src={selectedInstructor.photo_url}
                        alt={selectedInstructor.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-primary font-semibold">
                        {getInitials(selectedInstructor.name)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Instrutor selecionado</p>
                    <h4 className="font-semibold text-foreground">
                      {selectedInstructor.name}
                    </h4>
                  </div>
                </div>
              )}
              
              <h3 className="font-bold text-lg">Escolha o veículo</h3>
              
              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : displayVehicles.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-lg">
                  <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum veículo disponível</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {displayVehicles.map((vehicle) => (
                    <label
                      key={vehicle.id}
                      className={cn(
                        "border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md",
                        selectedVehicle?.id === vehicle.id
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border"
                      )}
                    >
                      <input
                        type="radio"
                        name="vehicle"
                        value={vehicle.id}
                        checked={selectedVehicle?.id === vehicle.id}
                        onChange={() => handleVehicleSelect(vehicle)}
                        className="sr-only"
                      />
                      
                      <div className="flex items-center gap-4">
                        <img
                          src={vehicle.main_photo_url || 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&h=300&fit=crop'}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-24 h-20 object-cover rounded-lg"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-bold text-foreground truncate">
                              {vehicle.brand} {vehicle.model} {vehicle.year}
                            </h4>
                            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded shrink-0">
                              Cat. {vehicle.license_category}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Settings className="w-4 h-4" />
                              {vehicle.transmission === 'automatic' ? 'Automático' : 'Manual'}
                            </span>
                            {vehicle.has_air_conditioning && (
                              <span className="flex items-center gap-1">
                                <Wind className="w-4 h-4" />
                                A/C
                              </span>
                            )}
                            {vehicle.is_adapted && (
                              <span className="flex items-center gap-1">
                                <Accessibility className="w-4 h-4" />
                                Adaptado
                              </span>
                            )}
                          </div>

                          {/* Show pricing preview */}
                          {vehicle.pricing?.[0] && (
                            <p className="text-sm font-medium text-primary">
                              A partir de R$ {vehicle.pricing[0].single_class_price}/aula
                            </p>
                          )}
                        </div>
                        
                        {selectedVehicle?.id === vehicle.id && (
                          <CheckCircle className="w-6 h-6 text-primary shrink-0" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP: Package Selection */}
          {stepType === 'plan' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Context Summary Header */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border mb-4">
                {selectedVehicle && (
                  <>
                    <img
                      src={selectedVehicle.main_photo_url || 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&h=300&fit=crop'}
                      alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      {isDrivingSchool && selectedInstructor && (
                        <p className="text-xs text-muted-foreground">
                          Instrutor: {selectedInstructor.name}
                        </p>
                      )}
                      <h4 className="font-semibold text-foreground">
                        {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.year}
                      </h4>
                    </div>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                      Cat. {selectedVehicle.license_category}
                    </span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">Escolha seu plano</h3>
              </div>
              
              <PackageSelector
                singlePrice={singlePrice}
                package5Price={package5Price}
                package10Price={package10Price}
                package20Price={package20Price}
                selectedPackage={selectedPackage}
                onSelect={(pkg) => {
                  setSelectedPackage(pkg);
                  setSelectedSlots([]); // Reset slots when package changes
                }}
              />
              
              <p className="text-xs text-muted-foreground text-center mt-4">
                💡 Pacotes oferecem desconto e garantem sua agenda com o instrutor
              </p>
            </div>
          )}

          {/* STEP: Multi-Slot Calendar */}
          {stepType === 'dates' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Booking Context Summary */}
              {selectedVehicle && (
                <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <img
                    src={selectedVehicle.main_photo_url || 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&h=300&fit=crop'}
                    alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                    className="w-12 h-10 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {isDrivingSchool && selectedInstructor ? `${selectedInstructor.name} • ` : ''}{selectedVehicle.brand} {selectedVehicle.model}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getPackageLabel()} • R$ {totalPrice.toFixed(0)}
                    </p>
                  </div>
                </div>
              )}
              
              <h3 className="font-bold text-lg">
                {requiredSlots === 1 ? 'Escolha data e horário' : `Agende suas ${requiredSlots} aulas`}
              </h3>
              
              <MultiSlotCalendar
                requiredSlots={requiredSlots}
                selectedSlots={selectedSlots}
                onSlotsChange={setSelectedSlots}
                availableSlots={availableSlots}
                loadingSlots={loadingSlots}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                isDayDisabled={isDayDisabled}
                fetchSlotsForDate={fetchAvailableSlots}
              />
            </div>
          )}

          {/* STEP: Location */}
          {stepType === 'location' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h3 className="font-bold text-lg">Local de partida</h3>
              
              <BookingLocationMap
                address={pickupAddress}
                onAddressChange={setPickupAddress}
                instructorLocation={
                  profile.location?.coordinates 
                    ? { lat: profile.location.coordinates.lat, lng: profile.location.coordinates.lng }
                    : undefined
                }
                instructorAddress={profile.location?.address}
              />
              
              {pickupAddress && pickupAddress.length > 10 && (
                <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Local selecionado:</span>{' '}
                    {formatSimpleAddress(pickupAddress).length > 80 ? formatSimpleAddress(pickupAddress).slice(0, 80) + '...' : formatSimpleAddress(pickupAddress)}
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mensagem para o instrutor (opcional)
                </label>
                <Textarea
                  value={studentMessage}
                  onChange={(e) => setStudentMessage(e.target.value)}
                  placeholder="Compartilhe informações importantes: experiência com direção, objetivos, etc."
                  className="h-24 resize-none"
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {studentMessage.length}/300 caracteres
                </p>
              </div>
            </div>
          )}

          {/* STEP: Confirmation */}
          {stepType === 'confirm' && selectedVehicle && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="font-bold text-lg">Confirme os detalhes</h3>
              
              <div className="bg-muted/50 rounded-lg p-6">
                {/* Instructor info for driving schools */}
                {isDrivingSchool && selectedInstructor && (
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                      {selectedInstructor.photo_url ? (
                        <img
                          src={selectedInstructor.photo_url}
                          alt={selectedInstructor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-primary font-semibold text-sm">
                          {getInitials(selectedInstructor.name)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Instrutor</p>
                      <p className="font-medium text-foreground">{selectedInstructor.name}</p>
                    </div>
                  </div>
                )}
                
                <BookingSummary
                  packageType={selectedPackage}
                  packageLabel={getPackageLabel()}
                  vehicle={{
                    brand: selectedVehicle.brand,
                    model: selectedVehicle.model,
                    license_category: selectedVehicle.license_category,
                    transmission: selectedVehicle.transmission,
                    main_photo_url: selectedVehicle.main_photo_url
                  }}
                  slots={selectedSlots}
                  pickupAddress={pickupAddress}
                  totalPrice={totalPrice}
                  pricePerLesson={totalPrice / requiredSlots}
                />
              </div>
              
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm font-medium text-foreground mb-2">
                  ℹ️ Informações Importantes:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• O instrutor tem até 24h para aceitar sua solicitação</li>
                  <li>• Você só será cobrado após as aulas serem realizadas</li>
                  <li>• Cancelamento gratuito até 24h antes de cada aula</li>
                  {requiredSlots > 1 && (
                    <li>• Seu pacote de {requiredSlots} aulas será aprovado de uma vez</li>
                  )}
                </ul>
              </div>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  className="mt-1"
                />
                <span className="text-sm text-muted-foreground">
                  Concordo com os{' '}
                  <Link to="/termos" className="text-primary hover:underline">
                    Termos de Uso
                  </Link>
                  {' '}e{' '}
                  <Link to="/politica" className="text-primary hover:underline">
                    Política de Cancelamento
                  </Link>
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <DialogFooter className="gap-2 sm:gap-2">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          )}
          
          {stepType !== 'confirm' ? (
            <Button
              onClick={handleNextStep}
              disabled={!canProceed()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2"
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmitBooking}
              disabled={!agreedToTerms || submitting}
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {selectedPackage === 'single' ? 'Solicitar Aula' : `Solicitar Pacote (${requiredSlots} aulas)`}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
