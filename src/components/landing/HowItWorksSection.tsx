import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UserPlus, Search, Calendar, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: 'Crie seu Perfil',
    description: 'Cadastre-se gratuitamente e complete seu perfil em menos de 2 minutos.',
  },
  {
    icon: Search,
    title: 'Encontre seu Instrutor',
    description: 'Busque por localização, veja avaliações e escolha o instrutor ideal para você.',
  },
  {
    icon: Calendar,
    title: 'Agende suas Aulas',
    description: 'Escolha horários que se encaixam na sua rotina e comece a dirigir!',
  },
];

const HowItWorksSection = () => {
  const navigate = useNavigate();

  return (
    <section id="como-funciona" className="py-20 md:py-28 gradient-mesh">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 rounded-full bg-brand-blue/10 text-brand-blue text-sm font-medium mb-4"
          >
            Simples e Rápido
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4"
          >
            Como funciona?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground"
          >
            Em apenas 3 passos simples você já pode começar suas aulas
          </motion.p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-brand-orange/20 via-brand-orange/40 to-brand-orange/20 -translate-y-1/2" />

          <div className="grid md:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                className="text-center"
              >
                {/* Number Badge */}
                <div className="relative inline-flex items-center justify-center w-20 h-20 gradient-orange rounded-full text-3xl font-bold text-white shadow-lg mb-6">
                  {index + 1}
                  {/* Decorative Ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-brand-orange/30 scale-125 opacity-50" />
                </div>

                {/* Icon */}
                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 border border-border">
                  <step.icon className="w-8 h-8 text-brand-orange" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold font-display mb-3 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <Button 
            size="xl" 
            className="gradient-orange text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
            onClick={() => navigate("/cadastro")}
          >
            Começar Agora Gratuitamente
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
