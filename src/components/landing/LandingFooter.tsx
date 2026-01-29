import { Link } from "react-router-dom";
import { Car, Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";

const LandingFooter = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    produto: [
      { label: "Para Alunos", href: "/cadastro" },
      { label: "Para Instrutores", href: "/cadastro-instrutor" },
      { label: "Para Autoescolas", href: "/contato" },
      { label: "Preços", href: "#precos" },
    ],
    empresa: [
      { label: "Sobre Nós", href: "/sobre" },
      { label: "Blog", href: "/blog" },
      { label: "Carreiras", href: "/carreiras" },
      { label: "Contato", href: "/contato" },
    ],
    suporte: [
      { label: "Central de Ajuda", href: "/ajuda" },
      { label: "FAQ", href: "#faq" },
      { label: "Comunidade", href: "/comunidade" },
      { label: "Status", href: "/status" },
    ],
    legal: [
      { label: "Termos de Uso", href: "/termos" },
      { label: "Privacidade", href: "/privacidade" },
      { label: "Cookies", href: "/cookies" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com/conduzbrasil", label: "Facebook" },
    { icon: Instagram, href: "https://instagram.com/conduzbrasil", label: "Instagram" },
    { icon: Twitter, href: "https://twitter.com/conduzbrasil", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com/company/conduzbrasil", label: "LinkedIn" },
    { icon: Youtube, href: "https://youtube.com/@conduzbrasil", label: "YouTube" },
  ];

  return (
    <footer className="bg-foreground text-background pt-16 pb-8">
      <div className="container-custom">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold font-display text-background">
                Conduz Brasil
              </span>
            </Link>
            <p className="text-background/60 text-sm leading-relaxed mb-6">
              Conectando você ao instrutor ideal para conquistar sua CNH.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-brand-orange hover:text-white transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-semibold text-background mb-4">Produto</h4>
            <ul className="space-y-3">
              {footerLinks.produto.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-background/60 hover:text-brand-orange transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-background mb-4">Empresa</h4>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-background/60 hover:text-brand-orange transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-background mb-4">Suporte</h4>
            <ul className="space-y-3">
              {footerLinks.suporte.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-background/60 hover:text-brand-orange transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-background mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-background/60 hover:text-brand-orange transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-background/50 text-sm">
              © {currentYear} Conduz Brasil. Todos os direitos reservados.
            </p>
            <p className="text-background/50 text-sm">
              Feito com ❤️ no Brasil 🇧🇷
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
