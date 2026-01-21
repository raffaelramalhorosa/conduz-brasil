import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  Car,
  MapPin,
  Navigation,
  Star,
  Phone,
  MessageCircle,
  DollarSign,
  User,
  Receipt,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BookingWithDetails } from '@/hooks/useInstructorBookings';
import { formatBookingDate, formatSimpleAddress } from '@/lib/addressFormatter';
import { formatTimeHHMM, formatTimeRange } from '@/lib/timeFormatter';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  confirmed: { label: 'Confirmada', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  completed: { label: 'Concluída', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  cancelled_by_instructor: { label: 'Recusada', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  cancelled_by_student: { label: 'Cancelada', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  in_progress: { label: 'Em Andamento', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

interface BookingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithDetails | null;
  onWhatsApp?: (booking: BookingWithDetails) => void;
  onChat?: (booking: BookingWithDetails) => void;
}

export function BookingDetailsModal({
  open,
  onOpenChange,
  booking,
  onWhatsApp,
  onChat,
}: BookingDetailsModalProps) {
  if (!booking) return null;

  const bookingDate = formatBookingDate(booking.scheduled_date);
  const formattedDate = format(bookingDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const statusStyle = statusStyles[booking.status] || { label: booking.status, className: 'bg-gray-500/20 text-gray-400' };

  const openMapsDirection = () => {
    if (booking.pickup_latitude && booking.pickup_longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${booking.pickup_latitude},${booking.pickup_longitude}`,
        '_blank'
      );
    }
  };

  const handleWhatsAppClick = () => {
    if (booking.student.phone) {
      const cleanPhone = booking.student.phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 
                       w-auto md:w-full md:max-w-2xl max-h-[90vh] overflow-y-auto
                       bg-[#1A1A1A] rounded-2xl border border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#1A1A1A] border-b border-white/10 p-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-instructor-accent/30">
                  <AvatarImage
                    src={booking.student.avatar_url || undefined}
                    alt={booking.student.full_name}
                  />
                  <AvatarFallback className="bg-instructor-accent/20 text-instructor-accent font-semibold text-xl">
                    {booking.student.full_name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-white">{booking.student.full_name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    {booking.student.previous_classes > 0 ? (
                      <span className="text-sm text-gray-400">
                        {booking.student.previous_classes} aulas anteriores
                        {booking.student.average_rating && (
                          <span className="inline-flex items-center gap-1 ml-2">
                            <Star className="h-3.5 w-3.5 text-instructor-accent fill-instructor-accent" />
                            {booking.student.average_rating.toFixed(1)}
                          </span>
                        )}
                      </span>
                    ) : (
                      <Badge className="bg-instructor-accent/20 text-instructor-accent border-instructor-accent/30 text-xs">
                        Novo aluno
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge className={cn("border text-sm px-3 py-1.5", statusStyle.className)}>
                  {statusStyle.label}
                </Badge>
                <span className="text-sm text-gray-500">
                  ID: {booking.id.slice(0, 8)}...
                </span>
              </div>

              {/* Date & Time Section */}
              <div className="bg-white/5 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data e Horário
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Data</p>
                    <p className="text-white font-medium capitalize">{formattedDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Horário</p>
                    <p className="text-white font-medium text-lg">
                      {formatTimeRange(booking.start_time, booking.end_time)}
                    </p>
                    <p className="text-xs text-gray-500">Duração: {booking.duration_hours}h</p>
                  </div>
                </div>
              </div>

              {/* Vehicle & Category */}
              <div className="bg-white/5 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Veículo e Categoria
                </h3>
                <div className="flex items-center gap-4">
                  <Badge className="bg-instructor-accent/20 text-instructor-accent border-instructor-accent/30 text-base px-4 py-2">
                    Cat. {booking.license_category}
                  </Badge>
                  {booking.vehicle && (
                    <div>
                      <p className="text-white font-medium">{booking.vehicle.brand} {booking.vehicle.model}</p>
                      <p className="text-xs text-gray-500">{booking.vehicle.transmission}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pickup Location */}
              <div className="bg-instructor-accent/10 rounded-xl p-5 border border-instructor-accent/20 space-y-3">
                <h3 className="text-sm font-medium text-instructor-accent uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Local de Partida
                </h3>
                <p className="text-white font-medium">{formatSimpleAddress(booking.pickup_address)}</p>
                <p className="text-sm text-gray-400">{booking.pickup_address}</p>
                {booking.pickup_latitude && booking.pickup_longitude && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openMapsDirection}
                    className="mt-2 bg-instructor-accent/20 hover:bg-instructor-accent/30 text-instructor-accent border-instructor-accent/30"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Abrir no Google Maps
                  </Button>
                )}
              </div>

              {/* Student Message */}
              {booking.student_message && (
                <div className="bg-white/5 rounded-xl p-5 border-l-4 border-instructor-accent space-y-2">
                  <h3 className="text-sm font-medium text-gray-400">Mensagem do Aluno</h3>
                  <p className="text-white">{booking.student_message}</p>
                </div>
              )}

              {/* Financial Summary */}
              <div className="bg-white/5 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Resumo Financeiro
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Valor bruto da aula</span>
                    <span className="text-white font-medium">
                      R$ {booking.total_price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Taxa da plataforma (12%)</span>
                    <span className="text-red-400">
                      - R$ {booking.platform_fee.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-lg">Valor líquido</span>
                    <span className="text-green-400 font-bold text-xl">
                      R$ {booking.instructor_amount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-[#1A1A1A] border-t border-white/10 p-6 flex gap-3">
              {booking.student.phone && (
                <Button
                  variant="outline"
                  onClick={handleWhatsAppClick}
                  className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              )}
              {onChat && (booking.status === 'confirmed' || booking.status === 'completed') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onChat(booking);
                    onOpenChange(false);
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/10"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              )}
              <Button
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-instructor-accent hover:bg-instructor-accent/90 text-instructor-dark-primary font-semibold"
              >
                Fechar
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}