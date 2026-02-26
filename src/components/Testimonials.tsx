import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Marina Santos",
      role: "Aluna - Categoria B",
      avatar: "MS",
      rating: 5,
      text: "Consegui minha habilitação em tempo recorde! A flexibilidade de agendar aulas quando eu podia fez toda a diferença. Recomendo demais!",
    },
    {
      name: "Carlos Oliveira",
      role: "Instrutor Parceiro",
      avatar: "CO",
      rating: 5,
      text: "Como instrutor, triplicei minha renda desde que entrei na plataforma. Os alunos são comprometidos e os pagamentos sempre em dia.",
    },
    {
      name: "Ana Paula Ferreira",
      role: "Aluna - Categoria AB",
      avatar: "AF",
      rating: 5,
      text: "Tinha medo de dirigir há anos. Encontrei um instrutor super paciente pelo Conduz Brasil e hoje dirijo com confiança. Obrigada!",
    },
  ];

  return (
    <section className="section-padding bg-background">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Depoimentos
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            O que Dizem Sobre Nós
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Milhares de alunos já realizaram o sonho da habilitação
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="bg-card rounded-2xl p-8 card-shadow border border-border hover:card-shadow-hover transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-accent text-accent"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">
                    {testimonial.avatar}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
