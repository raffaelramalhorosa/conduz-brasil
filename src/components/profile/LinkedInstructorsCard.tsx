import { useState, useEffect } from "react";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface LinkedInstructor {
  id: string;
  name: string;
  email: string;
  photo_url: string | null;
  status: string;
}

interface LinkedInstructorsCardProps {
  drivingSchoolId: string;
}

const LinkedInstructorsCard = ({ drivingSchoolId }: LinkedInstructorsCardProps) => {
  const [instructors, setInstructors] = useState<LinkedInstructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstructors = async () => {
      if (!drivingSchoolId) return;

      try {
        const { data, error } = await supabase
          .from('driving_school_instructors')
          .select('id, name, email, photo_url, status')
          .eq('driving_school_id', drivingSchoolId)
          .eq('status', 'active');

        if (error) throw error;
        setInstructors(data || []);
      } catch (error) {
        console.error('Error fetching linked instructors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
  }, [drivingSchoolId]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Nossos Instrutores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[120px]">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (instructors.length === 0) {
    return null; // Don't show section if no instructors
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Nossos Instrutores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {instructors.length <= 3 ? (
          // Grid for 3 or less
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {instructors.map((instructor) => (
              <InstructorCard key={instructor.id} instructor={instructor} getInitials={getInitials} />
            ))}
          </div>
        ) : (
          // Carousel for more than 3
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {instructors.map((instructor) => (
                <CarouselItem key={instructor.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 lg:basis-1/4">
                  <InstructorCard instructor={instructor} getInitials={getInitials} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-3 md:-left-5" />
            <CarouselNext className="-right-3 md:-right-5" />
          </Carousel>
        )}
      </CardContent>
    </Card>
  );
};

interface InstructorCardProps {
  instructor: LinkedInstructor;
  getInitials: (name: string) => string;
}

const InstructorCard = ({ instructor, getInitials }: InstructorCardProps) => {
  return (
    <div className="flex flex-col items-center p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
      <Avatar className="w-16 h-16 mb-3 ring-2 ring-primary/20">
        <AvatarImage src={instructor.photo_url || undefined} alt={instructor.name} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {getInitials(instructor.name)}
        </AvatarFallback>
      </Avatar>
      
      <h4 className="font-medium text-foreground text-center text-sm line-clamp-1">
        {instructor.name}
      </h4>
      
      <Badge variant="secondary" className="mt-2 text-xs">
        Instrutor
      </Badge>
    </div>
  );
};

export default LinkedInstructorsCard;
