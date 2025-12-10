import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Car, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  const isHomePage = location.pathname === "/";

  const navLinks = isHomePage
    ? [
        { name: "Como Funciona", href: "#como-funciona" },
        { name: "Para Instrutores", href: "#instrutores" },
        { name: "Para Alunos", href: "#alunos" },
        { name: "Sobre", href: "#sobre" },
      ]
    : [
        { name: "Buscar Instrutores", href: "/instrutores" },
        { name: "Como Funciona", href: "/#como-funciona" },
        { name: "Para Instrutores", href: "/#instrutores" },
      ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!profile) return '/aluno';
    return profile.user_type === 'student' ? '/aluno' : '/admin';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Car className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">AutoConnect</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-9 bg-muted animate-pulse rounded-md" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[120px] truncate text-sm">
                      {profile?.full_name || 'Usuário'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardLink()} className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Meu Painel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">Cadastrar-se</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 pb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{profile?.full_name || 'Usuário'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={getDashboardLink()} onClick={() => setIsMenuOpen(false)}>
                        Meu Painel
                      </Link>
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={() => { handleSignOut(); setIsMenuOpen(false); }}>
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/login" onClick={() => setIsMenuOpen(false)}>Entrar</Link>
                    </Button>
                    <Button className="w-full" asChild>
                      <Link to="/signup" onClick={() => setIsMenuOpen(false)}>Cadastrar-se</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
