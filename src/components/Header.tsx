import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Car, LogOut, User, Search, MapPin, Calendar, Heart, LayoutDashboard, LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { routes, getDashboardRoute } from "@/lib/routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavLink {
  name: string;
  href: string;
  icon?: LucideIcon;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  const isHomePage = location.pathname === "/";

  // Public navigation links
  const publicNavLinks = isHomePage
    ? [
        { name: "Como Funciona", href: "#como-funciona" },
        { name: "Para Instrutores", href: "#instrutores" },
        { name: "Para Alunos", href: "#alunos" },
        { name: "Sobre", href: "#sobre" },
      ]
    : [
        { name: "Buscar Instrutores", href: routes.marketplace },
        { name: "Como Funciona", href: "/#como-funciona" },
        { name: "Para Instrutores", href: "/#instrutores" },
      ];

  // Student navigation links
  const studentNavLinks = [
    { name: "Buscar Instrutores", href: routes.marketplace, icon: Search },
    { name: "Mapa", href: routes.student.map, icon: MapPin },
    { name: "Minhas Aulas", href: routes.student.lessons, icon: Calendar },
    { name: "Favoritos", href: routes.student.favorites, icon: Heart },
  ];

  // Instructor navigation links
  const instructorNavLinks = [
    { name: "Dashboard", href: routes.instructor.dashboard, icon: LayoutDashboard },
    { name: "Agendamentos", href: routes.instructor.appointments, icon: Calendar },
  ];

  // Determine which nav links to show based on user type
  const getNavLinks = (): NavLink[] => {
    if (!user || !profile) return publicNavLinks;
    if (profile.user_type === "student") return studentNavLinks;
    return instructorNavLinks;
  };

  const navLinks = getNavLinks();
  const isLoggedInUser = !!user && !!profile;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-md">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary-foreground">Habilitaí</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors flex items-center gap-2"
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-9 bg-muted animate-pulse rounded-md" />
            ) : isLoggedInUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 text-primary-foreground hover:bg-primary-foreground/10">
                    <Avatar className="h-8 w-8 border-2 border-primary-foreground/20">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-primary-foreground text-primary text-xs">
                        {profile?.full_name ? getInitials(profile.full_name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[120px] truncate text-sm text-primary-foreground">{profile?.full_name || "Usuário"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link
                      to={getDashboardRoute(profile?.user_type || null)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Meu Painel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to={profile?.user_type === "student" ? routes.student.profile : routes.instructor.profile}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <User className="h-4 w-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 cursor-pointer text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  <Link to={routes.login}>Entrar</Link>
                </Button>
                <Button size="sm" asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  <Link to={routes.signup}>Cadastrar-se</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-primary-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary-foreground/20 animate-fade-in bg-primary">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-base font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors flex items-center gap-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    {link.name}
                  </Link>
                );
              })}
              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                {isLoggedInUser ? (
                  <>
                    <div className="flex items-center gap-3 pb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {profile?.full_name ? getInitials(profile.full_name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{profile?.full_name || "Usuário"}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={getDashboardRoute(profile?.user_type || null)} onClick={() => setIsMenuOpen(false)}>
                        Meu Painel
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                    >
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={routes.login} onClick={() => setIsMenuOpen(false)}>
                        Entrar
                      </Link>
                    </Button>
                    <Button className="w-full" asChild>
                      <Link to={routes.signup} onClick={() => setIsMenuOpen(false)}>
                        Cadastrar-se
                      </Link>
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
