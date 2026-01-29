import { Shield, Lock, Smartphone, Star } from "lucide-react";

const TrustBadgesSection = () => {
  return (
    <section className="py-12 bg-muted/50 border-t border-border">
      <div className="container-custom">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-8 h-8" />
            <div className="text-left">
              <p className="font-semibold text-foreground text-sm">SSL Seguro</p>
              <p className="text-xs">Dados criptografados</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="w-8 h-8" />
            <div className="text-left">
              <p className="font-semibold text-foreground text-sm">PCI Compliant</p>
              <p className="text-xs">Pagamentos seguros</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Smartphone className="w-8 h-8" />
            <div className="text-left">
              <p className="font-semibold text-foreground text-sm">App Mobile</p>
              <p className="text-xs">iOS e Android</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="w-8 h-8" />
            <div className="text-left">
              <p className="font-semibold text-foreground text-sm">4.9/5 Estrelas</p>
              <p className="text-xs">+2.800 avaliações</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustBadgesSection;
