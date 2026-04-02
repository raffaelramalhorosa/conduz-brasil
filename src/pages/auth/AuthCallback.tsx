import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getDashboardRoute } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Car, GraduationCap, School, Loader2 } from "lucide-react";
import { toast } from "sonner";

type UserType = "student" | "instructor" | "driving_school";

const USER_TYPE_OPTIONS: { value: UserType; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: "student",
    label: "Sou Aluno",
    description: "Quero encontrar instrutores e tirar minha CNH",
    icon: GraduationCap,
  },
  {
    value: "instructor",
    label: "Sou Instrutor",
    description: "Quero oferecer aulas de direção pela plataforma",
    icon: Car,
  },
  {
    value: "driving_school",
    label: "Sou Autoescola",
    description: "Quero cadastrar minha autoescola e instrutores",
    icon: School,
  },
];

const AuthCallback = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"loading" | "select-type" | "saving">("loading");
  const [selectedType, setSelectedType] = useState<UserType>("student");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        toast.error("Erro ao autenticar com o Google. Tente novamente.");
        navigate("/login");
        return;
      }

      const user = session.user;

      // Detect if this is a new OAuth user (no user_type in metadata)
      const hasUserType = !!user.user_metadata?.user_type;

      if (!hasUserType) {
        // New Google user — needs to pick a type
        setUserId(user.id);
        setStep("select-type");
        return;
      }

      // Returning Google user — fetch profile and redirect
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        navigate(getDashboardRoute(profile.user_type), { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  const handleConfirmType = async () => {
    if (!userId) return;
    setStep("saving");

    // Update profile user_type
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ user_type: selectedType })
      .eq("id", userId);

    // Persist user_type in auth metadata so future logins skip this step
    await supabase.auth.updateUser({
      data: { user_type: selectedType },
    });

    if (profileError) {
      toast.error("Erro ao salvar o tipo de conta. Tente novamente.");
      setStep("select-type");
      return;
    }

    // Redirect based on type
    if (selectedType === "instructor") {
      navigate("/onboarding-instrutor", { replace: true });
    } else if (selectedType === "driving_school") {
      navigate("/onboarding-autoescola/dados-basicos", { replace: true });
    } else {
      navigate("/aluno", { replace: true });
    }
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Autenticando com o Google...</p>
        </div>
      </div>
    );
  }

  if (step === "saving") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Configurando sua conta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="bg-primary rounded-lg p-2">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground font-display">Conduz Brasil</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold font-display text-foreground mb-2">
            Bem-vindo à plataforma!
          </h1>
          <p className="text-muted-foreground text-sm">
            Como você vai usar o Conduz Brasil?
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {USER_TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedType(option.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 bg-card"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{option.description}</p>
                </div>
                {isSelected && (
                  <div className="ml-auto w-4 h-4 rounded-full bg-primary border-2 border-primary-foreground shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <Button
          className="w-full py-5 bg-gradient-to-r from-primary to-[hsl(35,100%,50%)] hover:opacity-90"
          onClick={handleConfirmType}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default AuthCallback;
