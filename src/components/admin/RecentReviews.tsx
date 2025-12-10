import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockReviews } from '@/data/mockAdminData';
import { Link } from 'react-router-dom';

export function RecentReviews() {
  const recentReviews = mockReviews.slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Avaliações Recentes</CardTitle>
        <Link to="/admin/avaliacoes" className="text-sm text-primary hover:underline">
          Ver todas
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {recentReviews.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.studentPhoto} alt={review.studentName} />
                  <AvatarFallback>{review.studentName.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm text-foreground">{review.studentName}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-muted text-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(review.date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
