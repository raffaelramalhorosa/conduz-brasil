import { Search, Calendar, Star } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Search,
      title: "Encontre seu Instrutor",
      description: "Busque por localização, preço e avaliações",
      step: "01",
    },
    {
      icon: Calendar,
      title: "Agende suas Aulas",
      description: "Escolha data, horário e quantidade de aulas",
      step: "02",
    },
    {
      icon: Star,
      title: "Avalie a Experiência",
      description: "Ajude outros alunos com seu feedback",
      step: "03",
    },
  ];

  return (
    <section id="como-funciona" className="section-padding bg-background">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Simples e Rápido
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Como Funciona
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Em apenas 3 passos você encontra o instrutor ideal e agenda sua primeira aula
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Connector Line (hidden on last card and mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/30 to-transparent" />
              )}

              <div className="bg-card rounded-2xl p-8 card-shadow border border-border hover:card-shadow-hover transition-all duration-300 h-full">
                {/* Step Number */}
                <span className="absolute -top-4 -right-2 text-6xl font-bold text-primary/10">
                  {step.step}
                </span>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <step.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
