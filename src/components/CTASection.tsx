import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Car } from "lucide-react";

const CTASection = () => {
  const navigate = useNavigate();
  return (
    <section className="section-padding gradient-cta relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary-foreground blur-3xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-primary-foreground blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          {/* Icon */}
          <div className="w-20 h-20 rounded-3xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-8">
            <Car className="w-10 h-10 text-primary-foreground" />
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Pronto para Começar?
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já estão aprendendo a dirigir de forma
            mais flexível e econômica.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="accent"
              size="xl"
              className="group"
              onClick={() => navigate("/instrutores")}
            >
              Encontrar Instrutores
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="hero-outline"
              size="xl"
              className="bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              Sou Instrutor
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
