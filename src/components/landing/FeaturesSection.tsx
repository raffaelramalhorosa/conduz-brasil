import { motion } from "framer-motion";
import { Search, Calendar, CreditCard, BarChart3, Star, MessageSquare } from "lucide-react";

const features = [
  {
    icon: Search,
    title: 'Busca Inteligente',
    description: 'Encontre instrutores por localização, especialidade, avaliações e disponibilidade em tempo real.',
  },
  {
    icon: Calendar,
    title: 'Agendamento Fácil',
    description: 'Agende suas aulas em poucos cliques e receba lembretes automáticos no seu celular.',
  },
  {
    icon: CreditCard,
    title: 'Pagamento Seguro',
    description: 'Pagamentos online integrados com as principais formas de pagamento do mercado.',
  },
  {
    icon: BarChart3,
    title: 'Acompanhe seu Progresso',
    description: 'Dashboard completo com seu histórico de aulas, feedback dos instrutores e evolução.',
  },
  {
    icon: Star,
    title: 'Sistema de Avaliações',
    description: 'Avalie seus instrutores e veja avaliações reais de outros alunos antes de escolher.',
  },
  {
    icon: MessageSquare,
    title: 'Chat Integrado',
    description: 'Converse diretamente com seu instrutor pelo app. Tire dúvidas e confirme horários.',
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-medium mb-4"
          >
            Recursos Completos
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4"
          >
            Tudo que você precisa para 
            <span className="text-gradient"> conquistar sua CNH</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground"
          >
            Uma plataforma completa que acompanha você do início ao fim da jornada
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-white rounded-2xl p-8 border border-border hover:border-brand-orange/30 hover:shadow-2xl transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-16 h-16 gradient-orange rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold font-display mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>

              {/* Hover Gradient Border Effect */}
              <div className="absolute inset-0 rounded-2xl gradient-orange opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
