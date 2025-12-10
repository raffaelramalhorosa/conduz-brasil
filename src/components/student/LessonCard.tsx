import { Calendar, Clock, MapPin, Car, MessageCircle, Star, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StudentLesson } from '@/data/mockStudentData';
import { cn } from '@/lib/utils';
import { differenceInDays, differenceInHours, parseISO } from 'date-fns';

interface LessonCardProps {
  lesson: StudentLesson;
  onCancel?: () => void;
  onChat?: () => void;
  onDetails?: () => void;
  onReview?: () => void;
}

const statusStyles = {
  confirmed: { label: 'Confirmada', className: 'bg-green-100 text-green-700' },
  pending: { label: 'Aguardando Confirmação', className: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Concluída', className: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
};

export function LessonCard({ lesson, onCancel, onChat, onDetails, onReview }: LessonCardProps) {
  const lessonDate = parseISO(`${lesson.date}T${lesson.time}`);
  const now = new Date();
  const daysUntil = differenceInDays(lessonDate, now);
  const hoursUntil = differenceInHours(lessonDate, now);

  const getCountdown = () => {
    if (lesson.status !== 'confirmed') return null;
    if (daysUntil > 1) return `Sua aula é em ${daysUntil} dias`;
    if (daysUntil === 1) return 'Sua aula é amanhã';
    if (hoursUntil > 0) return `Sua aula é em ${hoursUntil} horas`;
    return 'Sua aula é hoje!';
  };

  const formattedDate = new Date(lesson.date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Date/Time Highlight */}
          <div className="bg-primary/5 p-4 md:p-6 md:w-48 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r">
            <p className="text-sm text-muted-foreground capitalize">{formattedDate.split(',')[0]}</p>
            <p className="text-2xl font-bold text-primary">{lesson.time}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(lesson.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
            </p>
            {lesson.status === 'confirmed' && getCountdown() && (
              <Badge variant="secondary" className="mt-2 text-xs">
                {getCountdown()}
              </Badge>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              {/* Instructor Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                  <AvatarImage src={lesson.instructorPhoto} alt={lesson.instructorName} />
                  <AvatarFallback>{lesson.instructorName.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{lesson.instructorName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{lesson.instructorRating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({lesson.instructorReviews} avaliações)
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <Badge className={cn('shrink-0', statusStyles[lesson.status].className)}>
                {statusStyles[lesson.status].label}
              </Badge>
            </div>

            {/* Lesson Details */}
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Car className="h-4 w-4 text-primary" />
                <span>
                  {lesson.vehicle} • <Badge variant="outline" className="text-xs">Cat. {lesson.category}</Badge>
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>Duração: {lesson.duration}h</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="line-clamp-1">{lesson.location}</span>
              </div>
            </div>

            {/* Pending Message */}
            {lesson.status === 'pending' && (
              <p className="mt-3 text-sm text-orange-600 bg-orange-50 p-2 rounded-lg">
                Aguardando resposta do instrutor...
              </p>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              {lesson.status === 'confirmed' && (
                <>
                  <Button variant="outline" size="sm" onClick={onChat} className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Chat
                  </Button>
                  <Button variant="outline" size="sm" onClick={onDetails} className="gap-2">
                    Detalhes
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Cancelar
                  </Button>
                </>
              )}
              {lesson.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Cancelar Solicitação
                </Button>
              )}
              {lesson.status === 'completed' && !lesson.hasReviewed && (
                <Button size="sm" onClick={onReview} className="gap-2">
                  <Star className="h-4 w-4" />
                  Avaliar Aula
                </Button>
              )}
              {lesson.status === 'completed' && lesson.hasReviewed && (
                <Button variant="outline" size="sm" className="gap-2">
                  Ver Avaliação
                </Button>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="bg-muted/30 p-4 md:p-6 md:w-32 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l">
            <p className="text-sm text-muted-foreground">Valor</p>
            <p className="text-xl font-bold text-foreground">
              R$ {lesson.price.toFixed(0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
