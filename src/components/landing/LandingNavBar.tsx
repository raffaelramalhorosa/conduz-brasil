import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Car, ChevronDown, User, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";

const LandingNavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useAdminRole();

  const isLoggedIn = !!user;

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getDashboardPath = () => {
    if (profile?.user_type === 'student') return '/aluno';
    return '/admin';
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#como-funciona", label: "Como Funciona" },
    { href: "#precos", label: "Preços" },
    { href: "/instrutores", label: "Encontrar Instrutor" },
    { href: "/mapa", label: "Mapa" },
  ];

  const scrollToSection = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    } else {
      navigate(href);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-md py-3"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container-custom">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold font-display text-foreground">
              Conduz <span className="text-brand-orange">Brasil</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-muted-foreground hover:text-brand-orange transition-colors font-medium"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop CTAs / User Badge */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-muted">
                    <Avatar className="h-8 w-8 border-2 border-brand-orange/30">
                      <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                      <AvatarFallback className="bg-brand-orange text-white text-xs">
                        {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">
                      {profile?.full_name?.split(' ')[0] || 'Usuário'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover">
                  <DropdownMenuItem onClick={() => navigate(getDashboardPath())} className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Meu Painel
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/system-admin')} className="cursor-pointer text-primary">
                        <Shield className="h-4 w-4 mr-2" />
                        Painel Admin
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="text-foreground hover:text-brand-orange"
                >
                  Entrar
                </Button>
                <Button
                  className="gradient-orange text-white shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  onClick={() => navigate("/signup")}
                >
                  Cadastrar-se
                </Button>
              </>
            )}
          </div>
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-border shadow-lg animate-fade-in">
            <div className="container-custom py-4 space-y-4">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="block w-full text-left py-2 text-foreground hover:text-brand-orange transition-colors font-medium"
                >
                  {link.label}
                </button>
              ))}
              <hr className="border-border" />
              <div className="flex flex-col gap-2 pt-2">
                {isLoggedIn ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => { navigate(getDashboardPath()); setIsMobileMenuOpen(false); }}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-brand-orange text-white text-[10px]">
                          {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {profile?.full_name?.split(' ')[0] || 'Meu Painel'}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-destructive"
                      onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/login")}
                    >
                      Entrar
                    </Button>
                    <Button
                      className="w-full gradient-orange text-white"
                      onClick={() => navigate("/signup")}
                    >
                      Cadastrar-se
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default LandingNavBar;
