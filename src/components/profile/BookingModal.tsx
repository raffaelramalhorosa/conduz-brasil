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
  Loader2
} from "lucide-react";
import BookingLocationMap from "./BookingLocationMap";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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

interface BookingModalProps {
  profile: InstructorProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
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

const STEPS = [
  { step: 1, label: 'Veículo' },
  { step: 2, label: 'Data/Hora' },
  { step: 3, label: 'Local' },
  { step: 4, label: 'Confirmar' }
];

const BookingModal = ({ profile, open, onOpenChange, instructorId }: BookingModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithPricing | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [pickupAddress, setPickupAddress] = useState("");
  const [studentMessage, setStudentMessage] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Data from DB
  const [vehicles, setVehicles] = useState<VehicleWithPricing[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  // Reset form
  const resetBookingForm = () => {
    setCurrentStep(1);
    setSelectedVehicle(null);
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedDuration(1);
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

  // Fetch vehicles with pricing when modal opens (only if valid UUID)
  useEffect(() => {
    if (open && instructorId && isValidUUID(instructorId)) {
      fetchVehiclesAndAvailability();
    } else if (open) {
      // Using mock data - no need to fetch
      setLoadingData(false);
    }
  }, [open, instructorId]);

  const fetchVehiclesAndAvailability = async () => {
    if (!isValidUUID(instructorId)) {
      setLoadingData(false);
      return;
    }
    
    setLoadingData(true);
    try {
      const [vehiclesRes, availabilityRes] = await Promise.all([
        supabase
          .from('vehicles')
          .select(`
            id, brand, model, year, license_category, transmission,
            has_air_conditioning, has_power_steering, is_adapted, main_photo_url,
            pricing (id, single_class_price, license_category)
          `)
          .eq('instructor_id', instructorId)
          .eq('is_active', true),
        supabase
          .from('instructor_availability')
          .select('day_of_week, start_time, end_time, is_available')
          .eq('instructor_id', instructorId)
          .eq('is_available', true)
      ]);

      if (vehiclesRes.error) throw vehiclesRes.error;
      if (vehiclesRes.data) setVehicles(vehiclesRes.data as VehicleWithPricing[]);
      if (availabilityRes.data) setAvailability(availabilityRes.data);
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
      // Don't show toast - will use mock data
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch available slots when date is selected
  useEffect(() => {
    if (selectedDate && currentStep === 2) {
      fetchAvailableSlots();
    }
  }, [selectedDate, currentStep]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return;
    
    setLoadingSlots(true);
    
    try {
      const dayOfWeek = selectedDate.getDay();
      
      // If not a valid UUID, just generate default slots
      if (!isValidUUID(instructorId)) {
        const defaultSlots: TimeSlot[] = [];
        for (let hour = 7; hour <= 20; hour++) {
          defaultSlots.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            available: true
          });
        }
        setAvailableSlots(defaultSlots);
        setLoadingSlots(false);
        return;
      }
      
      // Fetch instructor availability for this day
      const { data: availabilityData, error: availError } = await supabase
        .from('instructor_availability')
        .select('*')
        .eq('instructor_id', instructorId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);
      
      if (availError) throw availError;
      
      if (!availabilityData || availabilityData.length === 0) {
        // If no availability configured, generate default slots
        const defaultSlots: TimeSlot[] = [];
        for (let hour = 7; hour <= 20; hour++) {
          defaultSlots.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            available: true
          });
        }
        setAvailableSlots(defaultSlots);
        setLoadingSlots(false);
        return;
      }
      
      // Fetch existing bookings for this date
      const { data: bookingsData, error: bookError } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('instructor_id', instructorId)
        .eq('scheduled_date', format(selectedDate, 'yyyy-MM-dd'))
        .in('status', ['pending', 'confirmed']);
      
      if (bookError) throw bookError;
      
      // Generate available slots
      const slots: TimeSlot[] = [];
      
      availabilityData.forEach(period => {
        const startHour = parseInt(period.start_time.split(':')[0]);
        const endHour = parseInt(period.end_time.split(':')[0]);
        
        for (let hour = startHour; hour < endHour; hour++) {
          const slotTime = `${hour.toString().padStart(2, '0')}:00`;
          
          // Check if slot is booked
          const isBooked = bookingsData?.some(booking => {
            const bookingStart = booking.start_time.slice(0, 5);
            const bookingEnd = booking.end_time.slice(0, 5);
            return slotTime >= bookingStart && slotTime < bookingEnd;
          });
          
          slots.push({
            time: slotTime,
            available: !isBooked
          });
        }
      });
      
      // Sort and remove duplicates
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

  // Get price for a vehicle
  const getPriceForVehicle = (vehicle: VehicleWithPricing): number => {
    if (vehicle.pricing && vehicle.pricing.length > 0) {
      return vehicle.pricing[0].single_class_price;
    }
    return profile.pricing?.basePrice || 100;
  };

  const pricePerHour = selectedVehicle ? getPriceForVehicle(selectedVehicle) : (profile.pricing?.basePrice || 100);
  const totalPrice = pricePerHour * selectedDuration;
  const platformFee = Math.round(totalPrice * 0.12 * 100) / 100;
  const instructorAmount = totalPrice - platformFee;

  // Check if day has availability
  const isDayDisabled = (date: Date): boolean => {
    if (date < new Date()) return true;
    
    // If no availability configured, allow all future days
    if (availability.length === 0) return false;
    
    const dayOfWeek = date.getDay();
    return !availability.some(a => a.day_of_week === dayOfWeek);
  };

  // Navigation validation
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return selectedVehicle !== null;
      case 2:
        return !!selectedDate && !!selectedTime && selectedDuration > 0;
      case 3:
        return pickupAddress.trim().length > 10;
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
  };

  // Check if this is a demo profile (not a real instructor)
  const isDemoProfile = !instructorId || !isValidUUID(instructorId);

  // Submit booking
  const handleSubmitBooking = async () => {
    if (!agreedToTerms) {
      toast.error('Você precisa concordar com os termos');
      return;
    }

    if (!user || !selectedVehicle || !selectedDate || !selectedTime) {
      toast.error('Dados incompletos');
      return;
    }

    // Prevent booking for demo profiles
    if (isDemoProfile) {
      toast.info('Este é um perfil de demonstração. Para agendar uma aula, acesse um instrutor real na busca.', {
        duration: 5000
      });
      return;
    }

    setSubmitting(true);

    try {
      // Get or create student profile
      const { data: studentData, error: studentError } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let studentId: string;

      if (studentError || !studentData) {
        // Create student profile if doesn't exist
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

      // Calculate end time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const endHour = hours + Math.floor(selectedDuration);
      const endMinutes = minutes + ((selectedDuration % 1) * 60);
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

      // Insert booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          student_id: studentId,
          instructor_id: instructorId,
          vehicle_id: selectedVehicle.id,
          license_category: selectedVehicle.license_category,
          scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: selectedTime,
          end_time: endTime,
          duration_hours: selectedDuration,
          pickup_address: pickupAddress.trim(),
          price_per_hour: pricePerHour,
          total_price: totalPrice,
          platform_fee: platformFee,
          instructor_amount: instructorAmount,
          student_message: studentMessage.trim() || null,
          status: 'pending'
        });

      if (bookingError) {
        console.error('Booking insert error:', bookingError);
        toast.error('Erro ao enviar solicitação. Tente novamente.');
        return;
      }

      // Close modal
      onOpenChange(false);

      // Reset form
      resetBookingForm();

      // Success feedback
      toast.success('Solicitação enviada com sucesso!', {
        description: 'O instrutor foi notificado e responderá em breve.',
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
  const displayVehicles: VehicleWithPricing[] = vehicles.length > 0 ? vehicles : profile.vehicles.map(v => ({
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
                    "text-xs font-medium transition-colors",
                    currentStep >= item.step ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </div>
                
                {index < 3 && (
                  <div className={cn(
                    "h-1 flex-1 mx-2 mb-8 transition-all duration-300 rounded-full",
                    currentStep > item.step ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* STEP 1: Vehicle Selection */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
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
                          
                          <p className="text-lg font-bold text-primary">
                            R$ {getPriceForVehicle(vehicle).toFixed(0)}/hora
                          </p>
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

          {/* STEP 2: Date and Time Selection */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h3 className="font-bold text-lg">Escolha data e horário</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Data da aula
                  </label>
                  
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedTime("");
                    }}
                    disabled={isDayDisabled}
                    className="rounded-md border pointer-events-auto"
                    locale={ptBR}
                  />
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    📅 Datas disponíveis baseadas na agenda do instrutor
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Horário
                  </label>
                  
                  {!selectedDate ? (
                    <div className="text-center py-8 bg-muted/50 rounded-lg">
                      <CalendarIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Selecione uma data primeiro
                      </p>
                    </div>
                  ) : loadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8 bg-muted/50 rounded-lg">
                      <CalendarIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum horário disponível
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tente outra data
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={cn(
                            "w-full p-3 rounded-lg border-2 text-left transition-all duration-200",
                            !slot.available
                              ? "border-border bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60"
                              : selectedTime === slot.time
                              ? "border-primary bg-primary/5 text-foreground shadow-sm"
                              : "border-border hover:border-primary/50 hover:bg-primary/5"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {slot.time}
                            </span>
                            {!slot.available && (
                              <span className="text-xs text-muted-foreground">Ocupado</span>
                            )}
                            {selectedTime === slot.time && (
                              <CheckCircle className="w-5 h-5 text-primary" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Duration */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Duração
                    </label>
                    <div className="flex gap-2">
                      {[1, 1.5, 2].map((duration) => (
                        <button
                          key={duration}
                          type="button"
                          onClick={() => setSelectedDuration(duration)}
                          className={cn(
                            "flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all duration-200",
                            selectedDuration === duration
                              ? "border-primary bg-primary/5 text-foreground"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {duration}h
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Location */}
          {currentStep === 3 && (
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
              />
              
              {pickupAddress && pickupAddress.length > 10 && (
                <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Local selecionado:</span>{' '}
                    {pickupAddress.length > 80 ? pickupAddress.slice(0, 80) + '...' : pickupAddress}
                  </p>
                </div>
              )}
              
              {/* Message */}
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

          {/* STEP 4: Confirmation */}
          {currentStep === 4 && selectedVehicle && selectedDate && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="font-bold text-lg">Confirme os detalhes</h3>
              
              {/* Summary Card */}
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b border-border">
                  <img
                    src={selectedVehicle.main_photo_url || 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&h=300&fit=crop'}
                    alt="Veículo"
                    className="w-20 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Categoria {selectedVehicle.license_category} • {selectedVehicle.transmission === 'automatic' ? 'Automático' : 'Manual'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Data
                    </span>
                    <span className="font-medium">
                      {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Horário
                    </span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      Duração
                    </span>
                    <span className="font-medium">{selectedDuration}h</span>
                  </div>
                  
                  <div className="flex items-start justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      Local
                    </span>
                    <span className="font-medium text-right max-w-[200px] break-words">
                      {pickupAddress}
                    </span>
                  </div>
                </div>
                
                <Separator />
                
                {/* Price Calculation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {selectedDuration}h × R$ {pricePerHour.toFixed(2)}
                    </span>
                    <span>R$ {totalPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de serviço (12%)</span>
                    <span>R$ {platformFee.toFixed(2)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">R$ {(totalPrice + platformFee).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Important Info */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm font-medium text-foreground mb-2">
                  ℹ️ Informações Importantes:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• O instrutor tem até 24h para aceitar sua solicitação</li>
                  <li>• Você só será cobrado após a aula ser realizada</li>
                  <li>• Cancelamento gratuito até 24h antes da aula</li>
                  <li>• Você receberá notificação quando o instrutor responder</li>
                </ul>
              </div>
              
              {/* Terms */}
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
          
          {currentStep < 4 ? (
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
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Solicitar Agendamento
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
