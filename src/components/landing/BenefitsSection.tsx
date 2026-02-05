import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Car, Building, Check } from "lucide-react";

const studentBenefits = [
  { title: 'Instrutores Verificados', description: 'Todos os instrutores são certificados e passam por rigorosa verificação.' },
  { title: 'Preços Transparentes', description: 'Veja o valor das aulas antes de agendar. Sem taxas escondidas.' },
  { title: 'Flexibilidade Total', description: 'Escolha horários que funcionam para você. Reagende quando necessário.' },
  { title: 'Suporte 24/7', description: 'Nossa equipe está sempre disponível para ajudar você.' },
];

const instructorBenefits = [
  { title: 'Mais Visibilidade', description: 'Seu perfil será exibido para milhares de alunos na sua região.' },
  { title: 'Gestão Simplificada', description: 'Gerencie agenda, pagamentos e alunos em um só lugar.' },
  { title: 'Pagamentos Garantidos', description: 'Receba automaticamente após cada aula. Sem inadimplência.' },
  { title: 'Zero Burocracia', description: 'Foque em ensinar. Nós cuidamos do resto.' },
];

const schoolBenefits = [
  { title: '15 Instrutores Inclusos', description: 'Gerencie até 15 instrutores em uma única plataforma.' },
  { title: 'Alunos Ilimitados', description: 'Sem limite de alunos cadastrados. Escale seu negócio.' },
  { title: 'White Label Completo', description: 'Plataforma com sua marca. App personalizado para seus alunos.' },
  { title: 'BI e Dashboards', description: 'Relatórios avançados, métricas em tempo real e insights de negócio.' },
  { title: 'Gestão Financeira', description: 'Controle completo de receitas, despesas e comissões.' },
  { title: 'Suporte Prioritário', description: 'Atendimento VIP com gerente de contas dedicado.' },
];

const BenefitsSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-medium mb-4"
          >
            Para Todos os Perfis
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4"
          >
            Benefícios exclusivos para você
          </motion.h2>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="students" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-12 h-14 bg-muted">
            <TabsTrigger value="students" className="text-base gap-2 data-[state=active]:bg-brand-orange data-[state=active]:text-white">
              <GraduationCap className="w-5 h-5" />
              <span className="hidden sm:inline">Alunos</span>
            </TabsTrigger>
            <TabsTrigger value="instructors" className="text-base gap-2 data-[state=active]:bg-brand-orange data-[state=active]:text-white">
              <Car className="w-5 h-5" />
              <span className="hidden sm:inline">Instrutores</span>
            </TabsTrigger>
            <TabsTrigger value="schools" className="text-base gap-2 data-[state=active]:bg-brand-orange data-[state=active]:text-white">
              <Building className="w-5 h-5" />
              <span className="hidden sm:inline">Autoescolas</span>
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="mt-0">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl md:text-4xl font-bold font-display mb-6">
                  Aprenda a dirigir com 
                  <span className="text-gradient"> confiança e segurança</span>
                </h3>
                <div className="space-y-5">
                  {studentBenefits.map((benefit, index) => (
                    <motion.div 
                      key={index} 
                      className="flex gap-4"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-brand-orange" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-1">{benefit.title}</h4>
                        <p className="text-muted-foreground">{benefit.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <Button 
                  size="lg" 
                  className="mt-8 gradient-orange text-white hover:shadow-xl transition-all"
                  onClick={() => navigate("/signup")}
                >
                  Começar como Aluno
                </Button>
              </motion.div>
              <motion.div 
                className="relative"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80" 
                  alt="Aluno aprendendo a dirigir" 
                  className="rounded-2xl shadow-2xl w-full"
                />
              </motion.div>
            </div>
          </TabsContent>

          {/* Instructors Tab */}
          <TabsContent value="instructors" className="mt-0">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div 
                className="relative order-2 md:order-1"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=600&q=80" 
                  alt="Instrutor de direção" 
                  className="rounded-2xl shadow-2xl w-full"
                />
              </motion.div>
              <motion.div 
                className="order-1 md:order-2"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl md:text-4xl font-bold font-display mb-6">
                  Encontre mais alunos e
                  <span className="text-gradient-blue"> maximize seus ganhos</span>
                </h3>
                <div className="space-y-5">
                  {instructorBenefits.map((benefit, index) => (
                    <motion.div 
                      key={index} 
                      className="flex gap-4"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-brand-blue/10 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-brand-blue" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-1">{benefit.title}</h4>
                        <p className="text-muted-foreground">{benefit.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex items-baseline gap-2 mt-8">
                  <span className="text-lg text-muted-foreground">Apenas</span>
                  <span className="text-4xl font-bold text-brand-orange">R$ 22</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <Button 
                  size="lg" 
                  className="mt-4 gradient-blue text-white hover:shadow-xl transition-all"
                  onClick={() => navigate("/cadastro-instrutor")}
                >
                  Começar como Instrutor
                </Button>
              </motion.div>
            </div>
          </TabsContent>

          {/* Schools Tab */}
          <TabsContent value="schools" className="mt-0">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl md:text-4xl font-bold font-display mb-6">
                  Transforme sua autoescola com
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-400"> tecnologia de ponta</span>
                </h3>
                <div className="space-y-4">
                  {schoolBenefits.map((benefit, index) => (
                    <motion.div 
                      key={index} 
                      className="flex gap-4"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-1">{benefit.title}</h4>
                        <p className="text-muted-foreground text-sm">{benefit.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex items-baseline gap-2 mt-8">
                  <span className="text-lg text-muted-foreground">A partir de</span>
                  <span className="text-4xl font-bold text-brand-orange">R$ 399</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <Button 
                  size="lg" 
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white hover:shadow-xl transition-all"
                  onClick={() => navigate("/contato")}
                >
                  Falar com Consultor
                </Button>
              </motion.div>
              <motion.div 
                className="relative"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=600&q=80" 
                  alt="Dashboard de autoescola" 
                  className="rounded-2xl shadow-2xl w-full"
                />
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default BenefitsSection;
