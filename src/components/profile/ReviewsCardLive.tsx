import { useState } from "react";
import { Star, MessageSquare, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useInstructorReviews } from "@/hooks/useInstructorReviews";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReviewsCardLiveProps {
  instructorId: string;
}

const ReviewsCardLive = ({ instructorId }: ReviewsCardLiveProps) => {
  const { reviews, loading, averageRating, totalReviews, ratingBreakdown, refetch } = useInstructorReviews(instructorId);
  const [showAll, setShowAll] = useState(false);
  
  const displayedReviews = showAll ? reviews : reviews.slice(0, 5);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Avaliações ({totalReviews})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {totalReviews > 0 ? (
          <>
            {/* Rating Summary */}
            <div className="grid md:grid-cols-2 gap-6 p-6 bg-muted/30 rounded-lg">
              {/* Overall Rating */}
              <div className="text-center md:text-left">
                <div className="text-5xl font-bold text-foreground mb-2">
                  {averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center md:justify-start mb-2">
                  {renderStars(Math.round(averageRating))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Baseado em {totalReviews} avaliações
                </p>
              </div>

              {/* Rating Breakdown */}
              <div className="space-y-2">
                {ratingBreakdown.map(({ stars, count, percentage }) => (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-16">
                      {stars} estrelas
                    </span>
                    <Progress value={percentage} className="flex-1" />
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
              {displayedReviews.map((review) => (
                <div key={review.id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    {review.studentPhoto ? (
                      <img
                        src={review.studentPhoto}
                        alt={review.studentName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">
                          {review.studentName}
                        </h4>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(review.date), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      {renderStars(review.rating)}
                      
                      {review.comment && (
                        <p className="text-muted-foreground mt-2 leading-relaxed">
                          {review.comment}
                        </p>
                      )}

                      {/* Instructor Reply */}
                      {review.instructorReply && (
                        <div className="mt-3 ml-4 pl-4 border-l-2 border-primary/20 bg-muted/30 p-3 rounded-r-lg">
                          <p className="text-sm font-medium text-foreground mb-1">
                            Resposta do instrutor:
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {review.instructorReply}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Show More Button */}
            {reviews.length > 5 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Ver menos avaliações" : "Ver todas as avaliações"}
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Este instrutor ainda não possui avaliações.</p>
            <p className="text-sm mt-1">Seja o primeiro a avaliar!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewsCardLive;
