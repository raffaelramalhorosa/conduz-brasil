import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReviewFormProps {
  instructorId: string;
  bookingId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const ReviewForm = ({ instructorId, bookingId, onSuccess, onCancel }: ReviewFormProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [overallRating, setOverallRating] = useState(0);
  const [teachingRating, setTeachingRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [vehicleRating, setVehicleRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState<{ type: string; value: number } | null>(null);

  const ratingCategories = [
    { key: 'overall', label: 'Avaliação Geral', value: overallRating, setter: setOverallRating, required: true },
    { key: 'teaching', label: 'Didática', value: teachingRating, setter: setTeachingRating },
    { key: 'punctuality', label: 'Pontualidade', value: punctualityRating, setter: setPunctualityRating },
    { key: 'vehicle', label: 'Veículo', value: vehicleRating, setter: setVehicleRating },
    { key: 'value', label: 'Custo-benefício', value: valueRating, setter: setValueRating },
  ];

  const renderStars = (category: typeof ratingCategories[0]) => {
    const currentHover = hoveredRating?.type === category.key ? hoveredRating.value : 0;
    const displayValue = currentHover || category.value;

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none transition-transform hover:scale-110"
            onMouseEnter={() => setHoveredRating({ type: category.key, value: star })}
            onMouseLeave={() => setHoveredRating(null)}
            onClick={() => category.setter(star)}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= displayValue
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/30 hover:text-yellow-400/50'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const handleSubmit = async () => {
    if (!user || !profile) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para avaliar.",
        variant: "destructive"
      });
      return;
    }

    if (overallRating === 0) {
      toast({
        title: "Avaliação obrigatória",
        description: "Selecione pelo menos a avaliação geral.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // Get student profile id
      const { data: studentProfile, error: studentError } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError || !studentProfile) {
        throw new Error('Perfil de aluno não encontrado');
      }

      const { error } = await supabase
        .from('reviews')
        .insert({
          instructor_id: instructorId,
          student_id: studentProfile.id,
          booking_id: bookingId,
          overall_rating: overallRating,
          teaching_rating: teachingRating || null,
          punctuality_rating: punctualityRating || null,
          vehicle_rating: vehicleRating || null,
          value_rating: valueRating || null,
          comment: comment.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Avaliação enviada!",
        description: "Obrigado pelo seu feedback."
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Erro ao enviar avaliação",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-muted/30 rounded-lg border">
      <h3 className="text-lg font-semibold text-foreground">Deixe sua avaliação</h3>
      
      {/* Rating Categories */}
      <div className="space-y-4">
        {ratingCategories.map((category) => (
          <div key={category.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Label className="w-32 text-sm font-medium">
              {category.label}
              {category.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {renderStars(category)}
          </div>
        ))}
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <Label htmlFor="comment">Comentário (opcional)</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Conte como foi sua experiência..."
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {comment.length}/500 caracteres
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || overallRating === 0}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar Avaliação'
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReviewForm;
