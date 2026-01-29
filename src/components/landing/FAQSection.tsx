import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircle } from "lucide-react";

const faqs = [
  {
    question: 'Como funciona o Conduz Brasil?',
    answer: 'O Conduz Brasil é uma plataforma que conecta alunos que querem tirar a CNH com instrutores qualificados. Você se cadastra gratuitamente, busca instrutores na sua região, vê avaliações e agenda suas aulas online.',
  },
  {
    question: 'É realmente grátis para alunos?',
    answer: 'Sim! Alunos não pagam nada para usar a plataforma. Você paga apenas pelas aulas que agendar diretamente com o instrutor.',
  },
  {
    question: 'Como são verificados os instrutores?',
    answer: 'Todos os instrutores passam por um processo de verificação que inclui validação de documentos (CNH, certificado de instrutor), antecedentes criminais e avaliação inicial.',
  },
  {
    question: 'Posso cancelar ou reagendar uma aula?',
    answer: 'Sim, você pode cancelar ou reagendar com até 24 horas de antecedência sem custos. Cancelamentos com menos de 24h podem estar sujeitos a taxas definidas pelo instrutor.',
  },
  {
    question: 'Como funcionam os pagamentos?',
    answer: 'Os pagamentos são processados de forma segura pela plataforma. Para instrutores, há uma mensalidade de R$ 22. Para autoescolas, R$ 399/mês com todos os recursos inclusos.',
  },
  {
    question: 'O que está incluído no plano de autoescola?',
    answer: 'O plano inclui até 15 instrutores, alunos ilimitados, white label (app com sua marca), BI e dashboards completos, gestão financeira, relatórios customizados e suporte VIP com gerente dedicado.',
  },
  {
    question: 'Posso testar antes de assinar?',
    answer: 'Sim! Oferecemos 14 dias de teste grátis para instrutores e 30 dias para autoescolas. Sem compromisso e sem cartão de crédito necessário.',
  },
  {
    question: 'Como funciona o white label para autoescolas?',
    answer: 'Com o white label, sua autoescola tem um app personalizado com seu logo, cores e identidade visual. Seus alunos baixam o app da sua marca na loja.',
  },
];

const FAQSection = () => {
  return (
    <section className="py-20 md:py-28 gradient-mesh">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-medium mb-4"
          >
            Dúvidas Frequentes
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4"
          >
            Perguntas Frequentes
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground"
          >
            Tire suas dúvidas sobre o Conduz Brasil
          </motion.p>
        </div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white rounded-xl border border-border px-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left font-semibold text-lg hover:text-brand-orange transition-colors py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12 p-8 bg-brand-orange/5 rounded-2xl border border-brand-orange/20"
        >
          <p className="text-lg text-foreground mb-4">
            Ainda tem dúvidas? Nossa equipe está pronta para ajudar!
          </p>
          <Button 
            variant="outline" 
            size="lg" 
            className="border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white transition-all"
          >
            <MessageCircle className="mr-2 w-5 h-5" />
            Falar com Suporte
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
