import { useState, useEffect, useMemo } from "react";
import { format, addDays, isSameDay, startOfWeek, addWeeks, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  Trash2,
  Copy,
  CheckCircle,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface ScheduledSlot {
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface MultiSlotCalendarProps {
  requiredSlots: number;
  selectedSlots: ScheduledSlot[];
  onSlotsChange: (slots: ScheduledSlot[]) => void;
  availableSlots: TimeSlot[];
  loadingSlots: boolean;
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  isDayDisabled: (date: Date) => boolean;
  fetchSlotsForDate: (date: Date) => void;
}

export function MultiSlotCalendar({
  requiredSlots,
  selectedSlots,
  onSlotsChange,
  availableSlots,
  loadingSlots,
  selectedDate,
  onDateSelect,
  isDayDisabled,
  fetchSlotsForDate,
}: MultiSlotCalendarProps) {
  const [showReplicateModal, setShowReplicateModal] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ date: Date; time: string } | null>(null);
  const [justReplicated, setJustReplicated] = useState(false);

  const remainingSlots = requiredSlots - selectedSlots.length;
  const isComplete = remainingSlots === 0;

  // Handle time slot selection
  const handleTimeSelect = (time: string) => {
    if (!selectedDate) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const existingIndex = selectedSlots.findIndex(
      (s) => s.date === dateStr && s.time === time
    );

    if (existingIndex >= 0) {
      // Remove slot
      const newSlots = [...selectedSlots];
      newSlots.splice(existingIndex, 1);
      onSlotsChange(newSlots);
      setJustReplicated(false);
    } else if (selectedSlots.length < requiredSlots) {
      // Add slot
      const newSlot: ScheduledSlot = {
        date: dateStr,
        time,
        status: 'scheduled',
      };

      // If this is the first slot and we have multiple to fill, offer replication
      if (selectedSlots.length === 0 && requiredSlots > 1) {
        setPendingSlot({ date: selectedDate, time });
        setShowReplicateModal(true);
      } else {
        onSlotsChange([...selectedSlots, newSlot]);
      }
    }
  };

  // Handle replication confirmation
  const handleReplicate = (replicate: boolean) => {
    if (!pendingSlot) return;

    const dateStr = format(pendingSlot.date, "yyyy-MM-dd");
    const baseSlot: ScheduledSlot = {
      date: dateStr,
      time: pendingSlot.time,
      status: 'scheduled',
    };

    if (replicate) {
      // Generate slots for the same day of week
      const slots: ScheduledSlot[] = [baseSlot];
      let currentDate = pendingSlot.date;
      let attempts = 0;
      const maxAttempts = 100; // Prevent infinite loop

      while (slots.length < requiredSlots && attempts < maxAttempts) {
        currentDate = addDays(currentDate, 7); // Next week, same day
        attempts++;
        
        // Check if day is available (not in the past and instructor is available)
        if (!isDayDisabled(currentDate)) {
          slots.push({
            date: format(currentDate, "yyyy-MM-dd"),
            time: pendingSlot.time,
            status: 'scheduled',
          });
        }
      }

      onSlotsChange(slots);
      setJustReplicated(true);
      
      // Show success feedback
      toast.success(`${slots.length} aulas agendadas!`, {
        description: `Todas as ${format(pendingSlot.date, "EEEE", { locale: ptBR })}s às ${pendingSlot.time}`,
        icon: <Sparkles className="h-5 w-5 text-primary" />,
      });
    } else {
      onSlotsChange([baseSlot]);
      setJustReplicated(false);
    }

    setShowReplicateModal(false);
    setPendingSlot(null);
  };

  // Remove a specific slot
  const handleRemoveSlot = (index: number) => {
    const newSlots = [...selectedSlots];
    newSlots.splice(index, 1);
    onSlotsChange(newSlots);
    setJustReplicated(false);
  };

  // Clear all slots
  const handleClearAll = () => {
    onSlotsChange([]);
    setJustReplicated(false);
  };

  // Check if a time is already selected for current date
  const isTimeSelected = (time: string) => {
    if (!selectedDate) return false;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return selectedSlots.some((s) => s.date === dateStr && s.time === time);
  };

  // Get count of slots for a specific date (for calendar modifiers)
  const getDateSlotCount = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return selectedSlots.filter((s) => s.date === dateStr).length;
  };

  // Dates that have slots selected
  const datesWithSlots = useMemo(() => {
    return selectedSlots.map((s) => {
      // Parse date string as local date, not UTC
      const [year, month, day] = s.date.split('-').map(Number);
      return new Date(year, month - 1, day);
    });
  }, [selectedSlots]);

  // Group slots by week for summary
  const slotsByWeek = useMemo(() => {
    const grouped: Record<string, ScheduledSlot[]> = {};
    
    selectedSlots.forEach((slot) => {
      const [year, month, day] = slot.date.split('-').map(Number);
      const slotDate = new Date(year, month - 1, day);
      const weekStart = startOfWeek(slotDate, { locale: ptBR });
      const weekKey = format(weekStart, "yyyy-MM-dd");
      
      if (!grouped[weekKey]) grouped[weekKey] = [];
      grouped[weekKey].push(slot);
    });
    
    return grouped;
  }, [selectedSlots]);

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className={cn(
        "flex items-center justify-between p-3 rounded-lg transition-all duration-500",
        isComplete 
          ? "bg-green-50 border border-green-200" 
          : justReplicated 
            ? "bg-primary/10 border border-primary/30 animate-pulse" 
            : "bg-muted/50"
      )}>
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : justReplicated ? (
            <Sparkles className="w-5 h-5 text-primary" />
          ) : (
            <CalendarIcon className="w-5 h-5 text-primary" />
          )}
          <span className="font-medium">
            {isComplete ? (
              <span className="text-green-600 flex items-center gap-1">
                Todas as {requiredSlots} aulas agendadas!
              </span>
            ) : (
              <>
                {selectedSlots.length} de {requiredSlots} aulas selecionadas
                {justReplicated && (
                  <span className="text-primary ml-2">• Replicado automaticamente</span>
                )}
              </>
            )}
          </span>
        </div>
        {selectedSlots.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Selecione as datas
          </label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              onDateSelect(date);
              if (date) fetchSlotsForDate(date);
            }}
            disabled={isDayDisabled}
            className="rounded-md border pointer-events-auto"
            locale={ptBR}
            modifiers={{
              hasSlots: datesWithSlots,
            }}
            modifiersClassNames={{
              hasSlots: "bg-primary text-primary-foreground font-bold hover:bg-primary/90",
            }}
          />
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-primary" />
              <span>Aula agendada</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded border-2 border-primary bg-transparent" />
              <span>Hoje</span>
            </div>
          </div>
        </div>

        {/* Time slots */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Horários disponíveis
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
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum horário disponível
              </p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {availableSlots.map((slot) => {
                  const selected = isTimeSelected(slot.time);
                  const canSelect = selectedSlots.length < requiredSlots || selected;

                  return (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => slot.available && canSelect && handleTimeSelect(slot.time)}
                      disabled={!slot.available || (!selected && !canSelect)}
                      className={cn(
                        "w-full p-3 rounded-lg border-2 text-left transition-all duration-200",
                        !slot.available
                          ? "border-border bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60"
                          : selected
                          ? "border-primary bg-primary/10 text-foreground shadow-sm ring-2 ring-primary/20"
                          : !canSelect
                          ? "border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
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
                        {selected && <CheckCircle className="w-5 h-5 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Selected slots summary - Enhanced visual */}
      {selectedSlots.length > 0 && (
        <div className={cn(
          "border rounded-lg p-4 transition-all duration-300",
          isComplete ? "bg-green-50/50 border-green-200" : "bg-muted/30"
        )}>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Aulas agendadas ({selectedSlots.length}/{requiredSlots})
            {isComplete && <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />}
          </h4>
          <ScrollArea className="max-h-60">
            <div className="space-y-2">
              {selectedSlots
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                .map((slot, index) => {
                  // Parse as local date
                  const [year, month, day] = slot.date.split('-').map(Number);
                  const slotDate = new Date(year, month - 1, day);
                  
                  return (
                    <div
                      key={`${slot.date}-${slot.time}`}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all",
                        "bg-background hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold",
                            "bg-primary text-primary-foreground"
                          )}
                        >
                          {index + 1}
                        </Badge>
                        <div>
                          <span className="text-sm font-medium">
                            {format(slotDate, "EEEE, dd/MM", { locale: ptBR })}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">às {slot.time}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSlot(index)}
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
            </div>
          </ScrollArea>
          
          {/* Weekly summary */}
          {Object.keys(slotsByWeek).length > 1 && (
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                📅 Distribuição: {Object.keys(slotsByWeek).length} semanas
              </p>
            </div>
          )}
        </div>
      )}

      {/* Replicate modal */}
      <Dialog open={showReplicateModal} onOpenChange={setShowReplicateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="w-5 h-5 text-primary" />
              Replicar horário?
            </DialogTitle>
            <DialogDescription>
              Você selecionou{" "}
              <strong>
                {pendingSlot &&
                  format(pendingSlot.date, "EEEE", { locale: ptBR })} às {pendingSlot?.time}
              </strong>
              . Deseja agendar todas as {requiredSlots} aulas no mesmo dia da semana e horário?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-foreground mb-2">
                ✨ Isso preencherá automaticamente:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {requiredSlots} aulas às {pendingSlot?.time}</li>
                <li>• Todas nas próximas {pendingSlot && format(pendingSlot.date, "EEEE", { locale: ptBR }).toLowerCase()}s</li>
                <li>• Distribuídas semanalmente</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleReplicate(false)}>
              Não, selecionar manualmente
            </Button>
            <Button onClick={() => handleReplicate(true)} className="gap-2">
              <Copy className="w-4 h-4" />
              Sim, replicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
