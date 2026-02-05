import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GraduationCap, Car, Building, Check } from "lucide-react";

const studentFeatures = [
  'Busca ilimitada de instrutores',
  'Agendamento de aulas',
  'Chat com instrutores',
  'Acompanhamento de progresso',
  'Sistema de avaliações',
  'Suporte por e-mail',
];

const instructorFeatures = [
  'Perfil profissional destacado',
  'Receba solicitações de aulas',
  'Gestão de agenda integrada',
  'Pagamentos automáticos',
  'Sistema de avaliações',
  'Chat com alunos',
  'Relatórios de desempenho',
  'Suporte prioritário',
];

const schoolFeatures = [
  'Até 15 instrutores inclusos',
  'Alunos ilimitados',
  'White label completo',
  'App personalizado',
  'BI e Dashboards avançados',
  'Gestão financeira completa',
  'Relatórios customizados',
  'Gerente de contas dedicado',
  'Suporte VIP 24/7',
];

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="precos" className="py-20 md:py-28 bg-background">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-medium mb-4"
          >
            Planos e Preços
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4"
          >
            Planos para todos os perfis
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground"
          >
            Escolha o plano ideal para você e comece agora mesmo
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan - Students */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 border-2 border-border hover:border-brand-orange/30 transition-all duration-300 hover:shadow-xl"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-brand-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-brand-orange" />
              </div>
              <h3 className="text-2xl font-bold font-display mb-2">Aluno</h3>
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="text-4xl font-bold text-foreground">Grátis</span>
              </div>
              <p className="text-muted-foreground">Para quem quer tirar a CNH</p>
            </div>

            <ul className="space-y-4 mb-8">
              {studentFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full bg-foreground hover:bg-foreground/90 text-background"
              size="lg"
              onClick={() => navigate("/signup")}
            >
              Começar Gratuitamente
            </Button>
          </motion.div>

          {/* Instructor Plan - Featured */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="gradient-orange rounded-2xl p-8 relative transform md:scale-105 shadow-2xl"
          >
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-blue text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
              Mais Popular
            </div>

            <div className="text-center mb-8 text-white">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold font-display mb-2">Instrutor</h3>
              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span className="text-4xl font-bold">R$ 22</span>
                <span className="text-white/80">/mês</span>
              </div>
              <p className="text-white/90">Para instrutores autônomos</p>
            </div>

            <ul className="space-y-4 mb-8">
              {instructorFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-white">
                  <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full bg-white text-brand-orange hover:bg-white/90 font-semibold shadow-lg"
              size="lg"
              onClick={() => navigate("/cadastro-instrutor")}
            >
              Começar Agora
            </Button>
          </motion.div>

          {/* School Plan - Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 hover:shadow-xl"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold font-display mb-2">Autoescola</h3>
              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span className="text-4xl font-bold text-foreground">R$ 399</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <p className="text-muted-foreground">Solução completa para autoescolas</p>
            </div>

            <ul className="space-y-3 mb-8">
              {schoolFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              size="lg"
              onClick={() => navigate("/contato")}
            >
              Falar com Consultor
            </Button>
          </motion.div>
        </div>

        {/* Additional Info */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center text-muted-foreground mt-8"
        >
          Todos os planos incluem suporte técnico. Sem taxas de setup ou contratos de longo prazo.
        </motion.p>
      </div>
    </section>
  );
};

export default PricingSection;
