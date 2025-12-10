import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const InstructorsSection = () => {
  const benefits = [
    "Receba pagamentos diretamente na sua conta",
    "Defina seus próprios horários e preços",
    "Alcance milhares de alunos na sua região",
    "Sem taxas de adesão ou mensalidades",
    "Suporte dedicado para parceiros",
  ];

  return (
    <section id="instrutores" className="section-padding bg-primary">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-primary-foreground">
            <span className="inline-block px-4 py-2 rounded-full bg-primary-foreground/20 text-primary-foreground text-sm font-medium mb-6">
              Para Instrutores
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Seja um Parceiro AutoConnect
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-lg">
              Aumente sua renda e alcance mais alunos. Cadastre-se gratuitamente e comece a receber solicitações de aulas hoje mesmo.
            </p>

            {/* Benefits List */}
            <ul className="space-y-4 mb-10">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <span className="text-primary-foreground/90">{benefit}</span>
                </li>
              ))}
            </ul>

            <Button
              variant="accent"
              size="xl"
              className="group"
              asChild
            >
              <Link to="/cadastro-instrutor">
                Cadastrar como Instrutor
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Right - Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20">
              <p className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2">R$ 5k+</p>
              <p className="text-primary-foreground/70">Renda média mensal</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20">
              <p className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2">0%</p>
              <p className="text-primary-foreground/70">Taxa de adesão</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20">
              <p className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2">24h</p>
              <p className="text-primary-foreground/70">Aprovação rápida</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-6 border border-primary-foreground/20">
              <p className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2">50+</p>
              <p className="text-primary-foreground/70">Cidades atendidas</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstructorsSection;
