import { useState } from "react";
import { Calendar as CalendarIcon, Clock, Minus, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { InstructorProfile } from "@/data/mockInstructorProfile";

interface BookingCardProps {
  profile: InstructorProfile;
}

const BookingCard = ({ profile }: BookingCardProps) => {
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [lessonCount, setLessonCount] = useState(1);

  const subtotal = profile.pricing.basePrice * lessonCount;
  const total = subtotal + profile.pricing.serviceFee;

  const availableSlots =
    selectedDate && profile.availability[format(selectedDate, "yyyy-MM-dd")]
      ? profile.availability[format(selectedDate, "yyyy-MM-dd")]
      : [];

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Reserve suas aulas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vehicle Selection */}
        <div className="space-y-2">
          <Label>Selecione o veículo</Label>
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um veículo" />
            </SelectTrigger>
            <SelectContent>
              {profile.vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.model} ({vehicle.year})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Selection */}
        <div className="space-y-2">
          <Label>Categoria de habilitação</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha a categoria" />
            </SelectTrigger>
            <SelectContent>
              {profile.categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  Categoria {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <Label>Data da aula</Label>
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
                  format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
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
        {selectedDate && (
          <div className="space-y-2">
            <Label>Horário</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha o horário" />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.length > 0 ? (
                  availableSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {slot}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    Nenhum horário disponível
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Lesson Count */}
        <div className="space-y-2">
          <Label>Quantidade de aulas</Label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLessonCount(Math.max(1, lessonCount - 1))}
              disabled={lessonCount <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center font-semibold">{lessonCount}</div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLessonCount(lessonCount + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Price Summary */}
        <div className="pt-4 border-t border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {lessonCount} aula{lessonCount > 1 ? "s" : ""} de 1h
            </span>
            <span className="text-foreground">
              R$ {profile.pricing.basePrice} x {lessonCount} = R$ {subtotal}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxa de serviço</span>
            <span className="text-foreground">
              R$ {profile.pricing.serviceFee}
            </span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
            <span>Total</span>
            <span className="text-primary">R$ {total}</span>
          </div>
        </div>

        {/* Booking Button */}
        <Button className="w-full" size="lg">
          Solicitar Agendamento
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Você não será cobrado agora
        </p>
      </CardContent>
    </Card>
  );
};

export default BookingCard;
