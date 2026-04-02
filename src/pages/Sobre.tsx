import { Link } from "react-router-dom";
import PublicLayout from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Star, Shield, Zap, Heart, Globe, Award } from "lucide-react";

const stats = [
  { label: "Alunos aprovados", value: "10.000+", icon: Users },
  { label: "Instrutores ativos", value: "500+", icon: MapPin },
  { label: "Avaliação média", value: "4.9 / 5", icon: Star },
  { label: "Taxa de aprovação", value: "98%", icon: Award },
];

const values = [
  {
    icon: Shield,
    title: "Segurança",
    description: "Verificamos documentação e credenciamento de todos os instrutores e autoescolas antes de liberar na plataforma.",
  },
  {
    icon: Heart,
    title: "Cuidado com o aluno",
    description: "Do primeiro agendamento à aprovação na prova, estamos ao lado do aluno em cada etapa da jornada CNH.",
  },
  {
    icon: Zap,
    title: "Praticidade",
    description: "Agendamento online, pagamento seguro e comunicação direta com o instrutor, tudo em um só lugar.",
  },
  {
    icon: Globe,
    title: "Acessibilidade",
    description: "Democratizamos o acesso a bons instrutores para alunos de todos os perfis e regiões do Brasil.",
  },
];

const steps = [
  {
    number: "01",
    title: "Encontre",
    description: "Busque instrutores certificados na sua região, veja avaliações e compare preços.",
  },
  {
    number: "02",
    title: "Reserve",
    description: "Agende aulas diretamente pelo app com pagamento seguro integrado.",
  },
  {
    number: "03",
    title: "Aprenda",
    description: "Faça suas aulas, acompanhe seu progresso e tire sua CNH com confiança.",
  },
];

const Sobre = () => {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-background via-muted/30 to-background py-16 sm:py-20">
        <div className="container-custom text-center max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Nossa história
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-foreground mb-4">
            Tirando a CNH do jeito{" "}
            <span className="text-gradient">certo</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A Conduz Brasil nasceu da frustração de quem já perdeu horas procurando um bom instrutor de direção. Nossa missão é simples: conectar alunos a profissionais qualificados de forma fácil, segura e transparente.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold font-display text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 sm:py-20">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block text-xs font-semibold text-primary uppercase tracking-wider mb-3">Nossa missão</span>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mb-4">
                Democratizar o acesso à CNH no Brasil
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Acreditamos que tirar a carteira de habilitação não precisa ser uma experiência estressante e cara. Com a Conduz Brasil, você encontra instrutores certificados, compara preços, lê avaliações de outros alunos e agenda aulas sem sair de casa.
                </p>
                <p>
                  Para instrutores e autoescolas, somos uma vitrine digital que aumenta a visibilidade, simplifica a gestão de agendamentos e garante recebimentos seguros.
                </p>
                <p>
                  Juntos, estamos transformando o mercado de instrução veicular no país.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 border border-primary/20">
              <blockquote className="text-lg font-medium text-foreground leading-relaxed italic">
                "Queremos que cada brasileiro encontre o instrutor certo na primeira tentativa e tire sua CNH com segurança e confiança."
              </blockquote>
              <p className="text-sm text-muted-foreground mt-4">— Equipe Conduz Brasil</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-wider mb-3">Como funciona</span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
              Simples do início ao fim
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-[60%] w-[80%] h-px bg-border" />
                )}
                <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold font-display text-lg mb-4">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold font-display text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-wider mb-3">Nossos valores</span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
              O que nos guia
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-primary to-orange-500">
        <div className="container-custom text-center">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white mb-4">
            Pronto para começar sua jornada?
          </h2>
          <p className="text-orange-100 mb-8 max-w-xl mx-auto">
            Junte-se a mais de 10.000 alunos que já encontraram o instrutor ideal pela Conduz Brasil.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/cadastro">Criar conta grátis</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link to="/instrutores">Ver instrutores</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Sobre;
