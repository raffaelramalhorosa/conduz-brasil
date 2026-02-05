import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Play, Star, CheckCircle, Users, Sparkles } from "lucide-react";

const LandingHeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="pt-24 md:pt-32 pb-16 md:pb-24 relative overflow-hidden gradient-mesh">
      {/* Background Gradient Orbs */}
      <div className="absolute -z-10 top-20 right-0 w-96 h-96 bg-brand-orange/20 rounded-full filter blur-3xl animate-pulse" />
      <div className="absolute -z-10 bottom-0 left-0 w-96 h-96 bg-brand-blue/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[80vh]">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange/10 text-brand-orange rounded-full text-sm font-medium border border-brand-orange/20"
            >
              <Sparkles className="w-4 h-4" />
              Mais de 10.000 alunos já aprovados
            </motion.div>

            {/* Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold font-display leading-tight text-foreground"
            >
              Tire sua CNH com
              <span className="text-gradient"> o instrutor ideal</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed"
            >
              Conectamos você ao instrutor perfeito para realizar seu sonho de dirigir. 
              Agende aulas, acompanhe seu progresso e conquiste sua primeira habilitação.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button 
                size="xl" 
                className="gradient-orange text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                onClick={() => navigate("/signup")}
              >
                Começar Agora
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                size="xl" 
                variant="outline"
                className="border-2 border-muted-foreground/20 hover:bg-muted"
                onClick={() => {
                  document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Play className="mr-2 w-5 h-5" />
                Ver Como Funciona
              </Button>
            </motion.div>

            {/* Social Proof */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center gap-6 pt-4"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Avatar key={i} className="border-2 border-background w-12 h-12 shadow-md">
                    <AvatarImage src={`https://i.pravatar.cc/100?img=${i + 10}`} />
                    <AvatarFallback>U{i}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-brand-orange text-brand-orange" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">4.9/5</strong> baseado em 2.847 avaliações
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Visual */}
          <div className="relative lg:pl-8">
            {/* Main Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative z-10"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-2 border border-border">
                <img 
                  src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80" 
                  alt="Aluno aprendendo a dirigir" 
                  className="w-full h-auto rounded-2xl object-cover aspect-[4/3]"
                />
              </div>
            </motion.div>

            {/* Floating Stats Card - Left */}
            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-4 lg:-left-8 top-1/4 bg-white rounded-xl shadow-xl p-4 border border-border z-20"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">98%</p>
                  <p className="text-sm text-muted-foreground">Taxa de aprovação</p>
                </div>
              </div>
            </motion.div>

            {/* Floating Stats Card - Right */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-4 lg:-right-8 bottom-1/4 bg-white rounded-xl shadow-xl p-4 border border-border z-20"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-blue/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-brand-blue" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">500+</p>
                  <p className="text-sm text-muted-foreground">Instrutores ativos</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHeroSection;
