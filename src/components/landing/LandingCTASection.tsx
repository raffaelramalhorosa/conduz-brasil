import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Shield, CreditCard, Zap } from "lucide-react";

const LandingCTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-28 gradient-orange relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        <div className="max-w-4xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-display leading-tight">
              Pronto para começar sua jornada rumo à CNH?
            </h2>
            
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-2xl mx-auto">
              Junte-se a milhares de pessoas que já conquistaram sua habilitação com o Conduz Brasil
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="xl" 
                className="bg-white text-brand-orange hover:bg-white/90 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
                onClick={() => navigate("/signup")}
              >
                Começar Gratuitamente
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                size="xl" 
                variant="outline"
                className="border-2 border-white text-white bg-transparent hover:bg-white/10"
                onClick={() => navigate("/contato")}
              >
                <Calendar className="mr-2 w-5 h-5" />
                Agendar Demonstração
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 pt-8 text-white/80">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>100% Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <span>Sem Cartão de Crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                <span>Ativação Imediata</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LandingCTASection;
