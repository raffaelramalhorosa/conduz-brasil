import { Car, Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    sobre: {
      title: "Sobre",
      links: [
        { name: "Quem Somos", href: "#" },
        { name: "Como Funciona", href: "#como-funciona" },
        { name: "Carreiras", href: "#" },
        { name: "Blog", href: "#" },
      ],
    },
    suporte: {
      title: "Suporte",
      links: [
        { name: "Central de Ajuda", href: "#" },
        { name: "Contato", href: "#" },
        { name: "FAQ", href: "#" },
        { name: "Comunidade", href: "#" },
      ],
    },
    legal: {
      title: "Legal",
      links: [
        { name: "Termos de Uso", href: "#" },
        { name: "Privacidade", href: "#" },
        { name: "Cookies", href: "#" },
        { name: "Licenças", href: "#" },
      ],
    },
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer className="bg-black text-white">
      <div className="container-custom py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Car className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-white">Habilitaí</span>
            </a>
            <p className="text-white/70 mb-6 max-w-xs">
              Conectando alunos aos melhores instrutores de direção. Aprenda no seu
              ritmo, sem contratos fixos.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.values(footerLinks).map((column) => (
            <div key={column.title}>
              <h3 className="font-semibold mb-4 text-white">{column.title}</h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-white/70 hover:text-primary transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} Habilitaí. Todos os direitos reservados.
          </p>
          <p className="text-white/60 text-sm">
            Feito com ❤️ no Brasil
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
