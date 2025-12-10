import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown } from "lucide-react";
import heroImage from "@/assets/hero-driving.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="pt-24 md:pt-32 pb-16 md:pb-24 gradient-hero">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Aprenda a Dirigir{" "}
                <span className="text-gradient">do Seu Jeito</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
                Conectamos você aos melhores instrutores e autoescolas. Pague apenas
                pelas aulas que precisar, sem contratos fixos.
              </p>
            </div>

            {/* Search Box */}
            <div className="bg-card rounded-2xl p-4 card-shadow border border-border">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Location Input */}
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Localização
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cidade ou Bairro"
                      className="w-full h-12 px-4 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* License Type Dropdown */}
                <div className="md:w-48">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Habilitação
                  </label>
                  <div className="relative">
                    <select className="w-full h-12 px-4 pr-10 rounded-xl bg-secondary border-0 text-foreground appearance-none focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer">
                      <option value="">Selecione</option>
                      <option value="A">Categoria A (Moto)</option>
                      <option value="B">Categoria B (Carro)</option>
                      <option value="AB">Categoria AB</option>
                      <option value="C">Categoria C</option>
                      <option value="D">Categoria D</option>
                      <option value="E">Categoria E</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex items-end">
                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="w-full md:w-auto"
                    onClick={() => navigate("/instrutores")}
                  >
                    <Search className="w-5 h-5" />
                    Buscar
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-3xl font-bold text-foreground">500+</p>
                <p className="text-sm text-muted-foreground">Instrutores</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">10k+</p>
                <p className="text-sm text-muted-foreground">Alunos</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">4.9</p>
                <p className="text-sm text-muted-foreground">Avaliação média</p>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative animate-fade-in-right" style={{ animationDelay: "0.2s" }}>
            <div className="relative rounded-3xl overflow-hidden card-shadow-hover">
              <img
                src={heroImage}
                alt="Aluna feliz aprendendo a dirigir com instrutor"
                className="w-full h-auto object-cover aspect-[4/3]"
              />
              {/* Floating Card */}
              <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-md rounded-2xl p-4 card-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl">🚗</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Nova Lei Aprovada!</p>
                    <p className="text-sm text-muted-foreground">Aulas avulsas agora são permitidas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
