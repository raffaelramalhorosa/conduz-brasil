import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Car,
  Package,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ScheduledSlot } from "./MultiSlotCalendar";
import type { PackageType } from "./PackageSelector";

interface VehicleInfo {
  brand: string;
  model: string;
  license_category: string;
  transmission: string;
  main_photo_url: string | null;
}

interface BookingSummaryProps {
  packageType: PackageType;
  packageLabel: string;
  vehicle: VehicleInfo;
  slots: ScheduledSlot[];
  pickupAddress: string;
  totalPrice: number;
  pricePerLesson?: number;
  discount?: number;
}

export function BookingSummary({
  packageType,
  packageLabel,
  vehicle,
  slots,
  pickupAddress,
  totalPrice,
  pricePerLesson,
  discount,
}: BookingSummaryProps) {
  const sortedSlots = [...slots].sort(
    (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
  );

  return (
    <div className="space-y-6">
      {/* Vehicle info */}
      <div className="flex items-start gap-4 pb-4 border-b border-border">
        <img
          src={
            vehicle.main_photo_url ||
            "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&h=300&fit=crop"
          }
          alt="Veículo"
          className="w-20 h-16 object-cover rounded"
        />
        <div className="flex-1">
          <p className="font-medium text-foreground">
            {vehicle.brand} {vehicle.model}
          </p>
          <p className="text-sm text-muted-foreground">
            Categoria {vehicle.license_category} •{" "}
            {vehicle.transmission === "automatic" ? "Automático" : "Manual"}
          </p>
        </div>
      </div>

      {/* Package info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <span className="font-medium">{packageLabel}</span>
        </div>
        <Badge variant="secondary">{slots.length} aulas</Badge>
      </div>

      {/* Scheduled dates */}
      <div className="space-y-2">
        <h4 className="font-medium flex items-center gap-2 text-sm">
          <CalendarIcon className="w-4 h-4" />
          Datas agendadas
        </h4>
        <ScrollArea className="max-h-48">
          <div className="space-y-1">
            {sortedSlots.map((slot, index) => (
              <div
                key={`${slot.date}-${slot.time}`}
                className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {index + 1}
                  </Badge>
                  <span>
                    {format(new Date(slot.date + "T00:00:00"), "EEE, dd/MM", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {slot.time}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Pickup location */}
      <div className="flex items-start gap-2">
        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium">Local de partida</p>
          <p className="text-sm text-muted-foreground">
            {pickupAddress.length > 60
              ? pickupAddress.slice(0, 60) + "..."
              : pickupAddress}
          </p>
        </div>
      </div>

      <Separator />

      {/* Pricing */}
      <div className="space-y-2">
        {pricePerLesson && packageType !== 'single' && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {slots.length} aulas × R$ {pricePerLesson.toFixed(2).replace(".", ",")}
            </span>
            {discount && discount > 0 && (
              <Badge variant="secondary" className="text-xs">
                -{discount}% economia
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-lg font-bold">
          <span className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Total
          </span>
          <span className="text-primary">
            R$ {totalPrice.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>
    </div>
  );
}
