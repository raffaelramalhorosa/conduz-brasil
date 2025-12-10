import { FileX, DollarSign, ShieldCheck, Clock } from "lucide-react";

const Benefits = () => {
  const benefits = [
    {
      icon: FileX,
      title: "Sem Contratos Obrigatórios",
      description:
        "Pague apenas pelas aulas que você fizer, sem compromissos de longo prazo ou multas de cancelamento.",
    },
    {
      icon: DollarSign,
      title: "Preços Transparentes",
      description:
        "Compare preços de diferentes instrutores e escolha o que cabe no seu bolso. Sem taxas escondidas.",
    },
    {
      icon: ShieldCheck,
      title: "Instrutores Verificados",
      description:
        "Todos os nossos instrutores passam por verificação rigorosa de documentos e antecedentes.",
    },
    {
      icon: Clock,
      title: "Agende Quando Quiser",
      description:
        "Flexibilidade total para escolher dias e horários que funcionam para você.",
    },
  ];

  return (
    <section id="alunos" className="section-padding bg-secondary/50">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Por que escolher
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Vantagens para Você
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A forma mais inteligente de aprender a dirigir
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="group bg-card rounded-2xl p-8 card-shadow border border-border hover:card-shadow-hover hover:border-primary/20 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex gap-6">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                    <benefit.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
