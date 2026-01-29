import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: 'Consegui minha CNH em 3 meses! O instrutor era excelente e o app facilitou muito o agendamento das aulas. Recomendo demais!',
    name: 'Maria Silva',
    role: 'Aluna',
    avatar: 'https://i.pravatar.cc/100?img=5',
    initials: 'MS',
  },
  {
    quote: 'Como instrutor, triplicaram meus alunos em apenas 2 meses. A plataforma é muito intuitiva e o suporte é excelente.',
    name: 'João Santos',
    role: 'Instrutor',
    avatar: 'https://i.pravatar.cc/100?img=12',
    initials: 'JS',
  },
  {
    quote: 'O white label transformou nossa autoescola. Agora temos nosso próprio app e os dashboards nos dão insights valiosos.',
    name: 'Ana Oliveira',
    role: 'Diretora de Autoescola',
    avatar: 'https://i.pravatar.cc/100?img=9',
    initials: 'AO',
  },
  {
    quote: 'Tinha muito medo de dirigir, mas o instrutor foi super paciente. Hoje tenho minha carteira e dirijo todos os dias!',
    name: 'Pedro Costa',
    role: 'Aluno',
    avatar: 'https://i.pravatar.cc/100?img=3',
    initials: 'PC',
  },
  {
    quote: 'A gestão de agenda pelo app é incrível. Economizo horas por semana que antes gastava organizando horários manualmente.',
    name: 'Carlos Ferreira',
    role: 'Instrutor',
    avatar: 'https://i.pravatar.cc/100?img=8',
    initials: 'CF',
  },
  {
    quote: 'Melhor investimento que fizemos na autoescola. Os relatórios de BI nos ajudam a tomar decisões muito mais assertivas.',
    name: 'Juliana Lima',
    role: 'Gerente de Autoescola',
    avatar: 'https://i.pravatar.cc/100?img=20',
    initials: 'JL',
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 md:py-28 gradient-mesh">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-medium mb-4"
          >
            Depoimentos Reais
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4"
          >
            O que nossos usuários dizem
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground"
          >
            Milhares de pessoas já conquistaram sua CNH com o Conduz Brasil
          </motion.p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-border"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-brand-orange text-brand-orange" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground leading-relaxed mb-6 italic">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border-2 border-brand-orange/20">
                  <AvatarImage src={testimonial.avatar} />
                  <AvatarFallback className="bg-brand-orange/10 text-brand-orange font-semibold">
                    {testimonial.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
