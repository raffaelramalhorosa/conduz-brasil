import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
import type { InstructorProfile } from "@/data/mockInstructorProfile";

interface BookingModalProps {
  profile: InstructorProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorId: string;
}

interface Vehicle {
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
}

interface Pricing {
  id: string;
  license_category: string;
  single_class_price: number;
  vehicle_id: string | null;
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

const PLATFORM_FEE_PERCENTAGE = 0.12;

const STEPS = [
  { step: 1, label: 'Veículo' },
  { step: 2, label: 'Data/Hora' },
  { step: 3, label: 'Local' },
  { step: 4, label: 'Confirmar' }
];

const BookingModal = ({ profile, open, onOpenChange, instructorId }: BookingModalProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile: userProfile } = useAuth();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [pickupAddress, setPickupAddress] = useState("");
  const [studentMessage, setStudentMessage] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Data from DB
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setSelectedVehicle(null);
      setSelectedDate(undefined);
      setSelectedTime("");
      setSelectedDuration(1);
      setPickupAddress("");
      setStudentMessage("");
      setAgreedToTerms(false);
    }
  }, [open]);

  // Fetch vehicles, pricing and availability
  useEffect(() => {
    const fetchData = async () => {
      if (!instructorId || !open) return;
      
      setLoadingData(true);
      try {
        const [vehiclesRes, pricingRes, availabilityRes] = await Promise.all([
          supabase
            .from('vehicles')
            .select('id, brand, model, year, license_category, transmission, has_air_conditioning, has_power_steering, is_adapted, main_photo_url')
            .eq('instructor_id', instructorId)
            .eq('is_active', true),
          supabase
            .from('pricing')
            .select('id, license_category, single_class_price, vehicle_id')
            .eq('instructor_id', instructorId)
            .eq('is_active', true),
          supabase
            .from('instructor_availability')
            .select('day_of_week, start_time, end_time, is_available')
            .eq('instructor_id', instructorId)
            .eq('is_available', true)
        ]);

        if (vehiclesRes.data) setVehicles(vehiclesRes.data);
        if (pricingRes.data) setPricing(pricingRes.data);
        if (availabilityRes.data) setAvailability(availabilityRes.data);
      } catch (error) {
        console.error('Error fetching booking data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [instructorId, open]);

  // Generate time slots when date is selected
  useEffect(() => {
    const generateTimeSlots = async () => {
      if (!selectedDate) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      
      const dayOfWeek = selectedDate.getDay();
      const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek);
      
      if (dayAvailability.length === 0) {
        // Generate default slots if no availability configured
        const slots: TimeSlot[] = [];
        for (let hour = 7; hour <= 20; hour++) {
          slots.push({
            time: `${hour.toString().padStart(2, '0')}:00`,
            available: true
          });
        }
        setAvailableSlots(slots);
        setLoadingSlots(false);
        return;
      }

      // Check for existing bookings on this date
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('instructor_id', instructorId)
        .eq('scheduled_date', format(selectedDate, 'yyyy-MM-dd'))
        .in('status', ['pending', 'confirmed']);

      const bookedTimes = new Set(existingBookings?.map(b => b.start_time.slice(0, 5)) || []);

      const slots: TimeSlot[] = [];
      dayAvailability.forEach(avail => {
        const startHour = parseInt(avail.start_time.split(':')[0]);
        const endHour = parseInt(avail.end_time.split(':')[0]);
        
        for (let hour = startHour; hour < endHour; hour++) {
          const timeStr = `${hour.toString().padStart(2, '0')}:00`;
          slots.push({
            time: timeStr,
            available: !bookedTimes.has(timeStr)
          });
        }
      });

      // Sort slots by time
      slots.sort((a, b) => a.time.localeCompare(b.time));
      
      // Remove duplicates
      const uniqueSlots = slots.filter((slot, index, self) => 
        index === self.findIndex(s => s.time === slot.time)
      );

      setAvailableSlots(uniqueSlots);
      setLoadingSlots(false);
    };

    generateTimeSlots();
  }, [selectedDate, availability, instructorId]);

  // Get price for a vehicle
  const getPriceForVehicle = (vehicleId: string): number => {
    const vehiclePricing = pricing.find(p => p.vehicle_id === vehicleId);
    if (vehiclePricing) return vehiclePricing.single_class_price;
    
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      const categoryPricing = pricing.find(p => p.license_category === vehicle.license_category);
      if (categoryPricing) return categoryPricing.single_class_price;
    }
    
    return profile.pricing?.basePrice || 100;
  };

  const pricePerHour = selectedVehicle ? getPriceForVehicle(selectedVehicle.id) : (profile.pricing?.basePrice || 100);
  const subtotal = pricePerHour * selectedDuration;
  const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENTAGE * 100) / 100;
  const totalPrice = subtotal + platformFee;

  // Check if day has availability
  const isDayDisabled = (date: Date): boolean => {
    if (date < new Date()) return true;
    
    const dayOfWeek = date.getDay();
    const hasAvailability = availability.some(a => a.day_of_week === dayOfWeek);
    
    // If no availability configured, allow all days except past
    if (availability.length === 0) return false;
    
    return !hasAvailability;
  };

  // Navigation validation
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!selectedVehicle;
      case 2:
        return !!selectedDate && !!selectedTime;
      case 3:
        return pickupAddress.trim().length >= 10;
      case 4:
        return agreedToTerms;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleSubmitBooking = async () => {
    if (!user || !userProfile || !selectedVehicle || !selectedDate || !selectedTime) {
      toast.error('Dados incompletos');
      return;
    }

    setSubmitting(true);

    try {
      // Get or create student profile
      let studentId: string;
      
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!studentProfile) {
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
        studentId = studentProfile.id;
      }

      // Calculate end time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const endHour = hours + selectedDuration;
      const endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const instructorAmount = subtotal - platformFee;

      const { error } = await supabase
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
          total_price: subtotal,
          platform_fee: platformFee,
          instructor_amount: instructorAmount,
          student_message: studentMessage.trim() || null,
          status: 'pending'
        });

      if (error) {
        console.error('Booking insert error:', error);
        toast.error('Erro ao criar agendamento');
        return;
      }

      toast.success('Solicitação enviada com sucesso!', {
        description: 'O instrutor irá analisar e responder em breve.'
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Erro ao solicitar agendamento');
    } finally {
      setSubmitting(false);
    }
  };

  // Use mock vehicles if none from DB
  const displayVehicles = vehicles.length > 0 ? vehicles : profile.vehicles.map(v => ({
    id: v.id,
    brand: v.model.split(' ')[0] || 'Veículo',
    model: v.model.split(' ').slice(1).join(' ') || v.model,
    year: v.year,
    license_category: v.category,
    transmission: v.features.includes('Automático') ? 'automatic' : 'manual',
    has_air_conditioning: v.features.includes('Ar-condicionado'),
    has_power_steering: v.features.includes('Direção hidráulica'),
    is_adapted: v.features.includes('Adaptado PCD'),
    main_photo_url: v.photo
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Agendar Aula</DialogTitle>
          <DialogDescription>
            {profile.name} • {profile.location?.address?.split(',').slice(-2).join(',') || 'Local não informado'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((item, index) => (
              <div key={item.step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition",
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
                    "text-xs font-medium",
                    currentStep >= item.step ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </div>
                
                {index < 3 && (
                  <div className={cn(
                    "h-1 flex-1 mx-2 mb-8 transition rounded-full",
                    currentStep > item.step ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* STEP 1: Vehicle Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Escolha o veículo</h3>
              
              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {displayVehicles.map((vehicle) => (
                    <label
                      key={vehicle.id}
                      className={cn(
                        "border-2 rounded-lg p-4 cursor-pointer transition hover:border-primary/50",
                        selectedVehicle?.id === vehicle.id
                          ? "border-primary bg-primary/5"
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
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-bold text-foreground">
                              {vehicle.brand} {vehicle.model} {vehicle.year}
                            </h4>
                            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
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
                            R$ {getPriceForVehicle(vehicle.id).toFixed(0)}/hora
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
            <div className="space-y-4">
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
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={cn(
                            "w-full p-3 rounded-lg border-2 text-left transition",
                            !slot.available
                              ? "border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
                              : selectedTime === slot.time
                              ? "border-primary bg-primary/5 text-foreground"
                              : "border-border hover:border-primary/50 hover:bg-primary/5"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{slot.time}</span>
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
                            "flex-1 py-2 px-4 rounded-lg border-2 font-medium transition",
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
            <div className="space-y-4">
              <h3 className="font-bold text-lg">Local de partida</h3>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Endereço completo *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Ex: Rua XV de Novembro, 123 - Centro, São Paulo"
                    className="pl-10"
                    maxLength={200}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  📍 Informe onde deseja que a aula comece (mínimo 10 caracteres)
                </p>
              </div>
              
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
                <p className="text-xs text-muted-foreground mt-1">
                  {studentMessage.length}/300 caracteres
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Confirmation */}
          {currentStep === 4 && selectedVehicle && selectedDate && (
            <div className="space-y-6">
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
                      <MapPin className="w-4 h-4 mt-1" />
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
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de serviço (12%)</span>
                    <span>R$ {platformFee.toFixed(2)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">R$ {totalPrice.toFixed(2)}</span>
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
