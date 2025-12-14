import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar as CalendarIcon, Clock, Minus, Plus, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, addHours } from "date-fns";
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
}

interface Pricing {
  id: string;
  license_category: string;
  single_class_price: number;
  vehicle_id: string | null;
}

const PLATFORM_FEE_PERCENTAGE = 0.12;

const BookingModal = ({ profile, open, onOpenChange, instructorId }: BookingModalProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile: userProfile } = useAuth();
  
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [lessonCount, setLessonCount] = useState(1);
  const [pickupAddress, setPickupAddress] = useState("");
  const [studentMessage, setStudentMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch vehicles and pricing
  useEffect(() => {
    const fetchData = async () => {
      if (!instructorId || !open) return;
      
      setLoadingData(true);
      try {
        const [vehiclesRes, pricingRes] = await Promise.all([
          supabase
            .from('vehicles')
            .select('id, brand, model, year, license_category')
            .eq('instructor_id', instructorId)
            .eq('is_active', true),
          supabase
            .from('pricing')
            .select('id, license_category, single_class_price, vehicle_id')
            .eq('instructor_id', instructorId)
            .eq('is_active', true)
        ]);

        if (vehiclesRes.data) setVehicles(vehiclesRes.data);
        if (pricingRes.data) setPricing(pricingRes.data);
      } catch (error) {
        console.error('Error fetching booking data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [instructorId, open]);

  // Get price based on selection
  const getPrice = (): number => {
    if (!selectedVehicle || !selectedCategory) {
      return profile.pricing?.basePrice || 100;
    }
    
    const vehiclePricing = pricing.find(
      p => p.vehicle_id === selectedVehicle && p.license_category === selectedCategory
    );
    
    if (vehiclePricing) return vehiclePricing.single_class_price;
    
    const categoryPricing = pricing.find(p => p.license_category === selectedCategory);
    if (categoryPricing) return categoryPricing.single_class_price;
    
    return profile.pricing?.basePrice || 100;
  };

  const pricePerHour = getPrice();
  const subtotal = pricePerHour * lessonCount;
  const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENTAGE * 100) / 100;
  const total = subtotal + platformFee;

  // Generate available time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const availableSlots = generateTimeSlots();

  const handleSubmit = async () => {
    if (!user || !userProfile) {
      toast.error('Você precisa estar logado para agendar');
      return;
    }

    if (!selectedVehicle || !selectedCategory || !selectedDate || !selectedTime || !pickupAddress) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get student profile
      const { data: studentProfile, error: studentError } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (studentError || !studentProfile) {
        // Create student profile if doesn't exist
        const { data: newStudentProfile, error: createError } = await supabase
          .from('student_profiles')
          .insert({ user_id: user.id })
          .select('id')
          .single();

        if (createError) {
          toast.error('Erro ao criar perfil de aluno');
          return;
        }
        
        await createBooking(newStudentProfile.id);
      } else {
        await createBooking(studentProfile.id);
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Erro ao solicitar agendamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const createBooking = async (studentId: string) => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const endHour = hours + lessonCount;
    const endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    const instructorAmount = subtotal - platformFee;

    const { error } = await supabase
      .from('bookings')
      .insert({
        student_id: studentId,
        instructor_id: instructorId,
        vehicle_id: selectedVehicle,
        license_category: selectedCategory,
        scheduled_date: format(selectedDate!, 'yyyy-MM-dd'),
        start_time: selectedTime,
        end_time: endTime,
        duration_hours: lessonCount,
        pickup_address: pickupAddress,
        price_per_hour: pricePerHour,
        total_price: subtotal,
        platform_fee: platformFee,
        instructor_amount: instructorAmount,
        student_message: studentMessage || null,
        status: 'pending'
      });

    if (error) {
      console.error('Booking insert error:', error);
      toast.error('Erro ao criar agendamento');
      return;
    }

    toast.success('Solicitação de agendamento enviada!', {
      description: 'O instrutor irá analisar e responder em breve.'
    });
    
    onOpenChange(false);
    
    // Reset form
    setSelectedVehicle("");
    setSelectedCategory("");
    setSelectedDate(undefined);
    setSelectedTime("");
    setLessonCount(1);
    setPickupAddress("");
    setStudentMessage("");
  };

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);
  const availableCategories = selectedVehicleData 
    ? [selectedVehicleData.license_category]
    : [...new Set(vehicles.map(v => v.license_category))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Agendar Aula com {profile.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Vehicle Selection */}
          <div className="space-y-2">
            <Label>Selecione o veículo *</Label>
            <Select value={selectedVehicle} onValueChange={(value) => {
              setSelectedVehicle(value);
              setSelectedCategory("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um veículo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} ({vehicle.year}) - Cat. {vehicle.license_category}
                    </SelectItem>
                  ))
                ) : (
                  profile.vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.model} ({vehicle.year})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label>Categoria de habilitação *</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha a categoria" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    Categoria {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Data da aula *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    <span>Escolha uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Horário *</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha o horário" />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {slot}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lesson Count */}
          <div className="space-y-2">
            <Label>Quantidade de aulas (1h cada)</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLessonCount(Math.max(1, lessonCount - 1))}
                disabled={lessonCount <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center font-semibold text-lg">{lessonCount}</div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLessonCount(Math.min(5, lessonCount + 1))}
                disabled={lessonCount >= 5}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Pickup Address */}
          <div className="space-y-2">
            <Label>Local de embarque *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ex: Av. Paulista, 1000 - São Paulo"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Student Message */}
          <div className="space-y-2">
            <Label>Mensagem para o instrutor (opcional)</Label>
            <Textarea
              placeholder="Ex: Estou buscando primeira habilitação, nunca dirigi antes..."
              value={studentMessage}
              onChange={(e) => setStudentMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Price Summary */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {lessonCount} aula{lessonCount > 1 ? "s" : ""} × R$ {pricePerHour.toFixed(2)}
              </span>
              <span className="text-foreground font-medium">
                R$ {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa de serviço (12%)</span>
              <span className="text-foreground">
                R$ {platformFee.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedVehicle || !selectedCategory || !selectedDate || !selectedTime || !pickupAddress}
          >
            {isSubmitting ? 'Enviando...' : 'Solicitar Agendamento'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            O instrutor irá analisar sua solicitação. Você só será cobrado após a confirmação.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
