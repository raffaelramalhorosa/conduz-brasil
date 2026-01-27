import React from "react";
import { Zap, Bell, Wifi, Rocket, Monitor, Apple, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const benefits = [
  {
    icon: Zap,
    title: "Acesso Instantâneo",
    description: "Abra direto da área de trabalho sem navegador",
  },
  {
    icon: Bell,
    title: "Notificações em Tempo Real",
    description: "Receba alertas de aulas, mensagens e atualizações",
  },
  {
    icon: Wifi,
    title: "Funciona Offline",
    description: "Acesse informações mesmo sem internet",
  },
  {
    icon: Rocket,
    title: "Performance Otimizada",
    description: "Experiência mais rápida e fluida",
  },
];

const chromeInstructions = [
  {
    step: 1,
    text: "Clique no ícone de instalação na barra de endereço",
    icon: "⬇️",
  },
  {
    step: 2,
    text: 'Clique em "Instalar"',
    icon: "✅",
  },
  {
    step: 3,
    text: "Pronto! O app aparecerá na sua área de trabalho",
    icon: "🎉",
  },
];

const InstallElectron: React.FC = () => {
  const { isInstallable, promptInstall } = useInstallPrompt();

  const handleInstall = async () => {
    if (isInstallable) {
      await promptInstall();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <NavBar />

      <main className="container mx-auto px-4 py-16 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-accent to-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-5xl">🚗</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Instale o Conduz Brasil no seu computador
          </h1>
          <p className="text-lg text-muted-foreground">Acesso rápido e experiência nativa</p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                <benefit.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Installation Instructions */}
        <div className="bg-card border rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">Como instalar no navegador</h2>

          <div className="space-y-6">
            {chromeInstructions.map((instruction) => (
              <div key={instruction.step} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {instruction.step}
                </div>
                <div className="flex-1 pt-2">
                  <p className="text-foreground font-medium">
                    <span className="mr-2">{instruction.icon}</span>
                    {instruction.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {isInstallable && (
            <div className="mt-8 text-center">
              <Button onClick={handleInstall} size="lg" variant="accent" className="px-12">
                <Download className="w-5 h-5 mr-2" />
                Instalar Agora
              </Button>
            </div>
          )}
        </div>

        {/* Alternative Downloads - Placeholder for future Electron builds */}
        <div className="bg-muted/50 border border-dashed rounded-2xl p-8 text-center">
          <h3 className="font-semibold text-foreground mb-4">Ou baixe o instalador</h3>
          <p className="text-muted-foreground text-sm mb-6">Em breve disponível para download direto</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" disabled className="gap-2">
              <Monitor className="w-4 h-4" />
              Windows
            </Button>
            <Button variant="outline" disabled className="gap-2">
              <Apple className="w-4 h-4" />
              macOS
            </Button>
            <Button variant="outline" disabled className="gap-2">
              🐧 Linux
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Enquanto isso, use a instalação via navegador acima</p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default InstallElectron;
