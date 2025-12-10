import { User, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InstructorProfile } from "@/data/mockInstructorProfile";

interface AboutCardProps {
  profile: InstructorProfile;
}

const AboutCard = ({ profile }: AboutCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Sobre {profile.type === "school" ? "a empresa" : "mim"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">{profile.about}</p>

        <div>
          <h4 className="font-semibold text-foreground mb-3">
            Especialidades e Diferenciais:
          </h4>
          <ul className="space-y-2">
            {profile.specialties.map((specialty, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{specialty}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AboutCard;
