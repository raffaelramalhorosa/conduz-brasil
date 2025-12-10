import { useState } from 'react';
import { X, Star, Phone, Calendar, Clock, MapPin, Car, Tag, Percent } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Appointment } from '@/data/mockAdminData';
import { toast } from 'sonner';

interface ConfirmAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onConfirm: (appointmentId: string) => void;
}

export function ConfirmAppointmentModal({
  open,
  onOpenChange,
  appointment,
  onConfirm,
}: ConfirmAppointmentModalProps) {
  const [message, setMessage] = useState('');
  const [offerDiscount, setOfferDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  if (!appointment) return null;

  const basePrice = appointment.price;
  const discount = offerDiscount && discountPercent ? (basePrice * Number(discountPercent)) / 100 : 0;
  const priceAfterDiscount = basePrice - discount;
  const fee = priceAfterDiscount * 0.12;
  const netValue = priceAfterDiscount - fee;

  const formattedDate = new Date(appointment.date).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleConfirm = async () => {
    setIsConfirming(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    onConfirm(appointment.id);
    onOpenChange(false);
    
    toast.success('Agendamento confirmado! O aluno foi notificado.', {
      description: `Aula com ${appointment.studentName} em ${formattedDate}`,
    });

    // Optional: Open WhatsApp with pre-filled message
    const whatsappMessage = message || `Olá ${appointment.studentName}! Confirmei sua aula para ${formattedDate} às ${appointment.time}. Nos vemos lá!`;
    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(whatsappMessage)}`;
    
    // Uncomment to auto-open WhatsApp
    // window.open(whatsappUrl, '_blank');

    // Reset form
    setMessage('');
    setOfferDiscount(false);
    setDiscountPercent('');
    setIsConfirming(false);
  };

  const handleWhatsAppClick = () => {
    const whatsappUrl = `https://wa.me/5511999999999`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] p-0 gap-0 overflow-hidden animate-scale-in">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-semibold">Confirmar Agendamento</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Student Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Informações do Aluno
            </h3>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-background">
                  <AvatarImage src={appointment.studentPhoto} alt={appointment.studentName} />
                  <AvatarFallback>{appointment.studentName.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground text-lg">{appointment.studentName}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < 4 ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-1">(Aluno recorrente)</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                onClick={handleWhatsAppClick}
              >
                <Phone className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Lesson Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Detalhes da Aula
            </h3>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Tag className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <Badge className="mt-1 bg-primary/10 text-primary hover:bg-primary/10">
                    Cat. {appointment.category}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Car className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Veículo</p>
                  <p className="font-medium text-foreground">{appointment.vehicle}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Calendar className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium text-foreground">{formattedDate}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Clock className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium text-foreground">{appointment.time} ({appointment.lessonsCount}h)</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Local de partida</p>
                  <p className="font-medium text-foreground">{appointment.location}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Você Receberá
            </h3>
            <div className="p-4 rounded-lg bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Valor da aula ({appointment.lessonsCount}x)</span>
                <span className="font-medium">R$ {basePrice.toFixed(2).replace('.', ',')}</span>
              </div>
              {offerDiscount && discountPercent && (
                <div className="flex items-center justify-between text-orange-600">
                  <span>Desconto ({discountPercent}%)</span>
                  <span>-R$ {discount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-destructive">
                <span className="text-muted-foreground">Taxa AutoConnect (12%)</span>
                <span>-R$ {fee.toFixed(2).replace('.', ',')}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">Valor líquido</span>
                <span className="font-bold text-green-600">
                  R$ {netValue.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Message */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Mensagem para o Aluno (Opcional)
            </h3>
            <Textarea
              placeholder="Ex: Confirmo o horário! Nos vemos em frente ao prédio."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Discount Option */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="discount"
                checked={offerDiscount}
                onCheckedChange={(checked) => setOfferDiscount(checked as boolean)}
              />
              <label
                htmlFor="discount"
                className="text-sm font-medium cursor-pointer flex items-center gap-2"
              >
                <Percent className="h-4 w-4 text-orange-500" />
                Desejo oferecer um desconto especial
              </label>
            </div>
            
            {offerDiscount && (
              <div className="flex items-center gap-3 pl-7 animate-fade-in">
                <Input
                  type="number"
                  placeholder="0"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-24"
                  min="1"
                  max="50"
                />
                <span className="text-sm text-muted-foreground">% de desconto</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="bg-green-600 hover:bg-green-700 text-white min-w-[180px]"
          >
            {isConfirming ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Confirmando...
              </span>
            ) : (
              'Confirmar Agendamento'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
