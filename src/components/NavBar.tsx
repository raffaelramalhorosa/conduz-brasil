import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, Search, Calendar, Home, ChevronDown, Shield, Car } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { routes } from "@/lib/routes";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { cn } from "@/lib/utils";

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  const { isAdmin } = useAdminRole();

  const isLoggedIn = !!user && !!profile;

  // Navigation items - same for logged in and non-logged in users
  // Only "Início" link destination changes based on auth status
  const navItems = [
    {
      label: "Início",
      path: isLoggedIn ? routes.student.dashboard : routes.home,
      icon: Home,
    },
    {
      label: "Buscar Instrutores",
      path: routes.marketplace,
      icon: Search,
    },
    {
      label: "Minhas Aulas",
      path: routes.student.lessons,
      icon: Calendar,
    },
  ];

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
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-lg shadow-lg border-b border-white/10">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to={isLoggedIn ? routes.student.dashboard : routes.home} className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">Conduz Brasil</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.label}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-9 bg-white/20 animate-pulse rounded-md" />
          ) : isLoggedIn ? (
            <>
              {/* Notifications */}
              <NotificationBell />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 text-white hover:bg-white/10">
                    <Avatar className="h-8 w-8 border-2 border-white/20">
                      <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "Usuário"} />
                      <AvatarFallback className="bg-white text-black text-xs">
                        {profile?.full_name ? getInitials(profile.full_name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium text-white max-w-[120px] truncate">
                      {profile?.full_name?.split(" ")[0] || "Usuário"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-white/70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover">
                  <DropdownMenuItem asChild>
                    <Link to={routes.student.profile} className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/system-admin" className="flex items-center gap-2 text-primary cursor-pointer">
                          <Shield className="h-4 w-4" />
                          Painel Admin
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                <Link to={routes.login}>Entrar</Link>
              </Button>
              <Button size="sm" asChild className="bg-white text-black hover:bg-white/90">
                <Link to={routes.signup}>Cadastrar-se</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden py-4 border-t border-white/10 animate-fade-in bg-black/60 backdrop-blur-lg">
          <nav className="container flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}

            {/* Auth section for mobile */}
            <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-white/10">
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-3 px-4 pb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-white text-black">
                        {profile?.full_name ? getInitials(profile.full_name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-white">{profile?.full_name || "Usuário"}</p>
                      <p className="text-sm text-white/70">{user?.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="mx-4 border-white/30 text-white hover:bg-white/10" asChild>
                    <Link to={routes.student.profile} onClick={() => setIsMenuOpen(false)}>
                      <User className="h-4 w-4 mr-2" />
                      Meu Perfil
                    </Link>
                  </Button>
                  {isAdmin && (
                    <Button variant="outline" className="mx-4 border-white/30 text-white hover:bg-white/10" asChild>
                      <Link to="/system-admin" onClick={() => setIsMenuOpen(false)}>
                        <Shield className="h-4 w-4 mr-2" />
                        Painel Admin
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="mx-4"
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="mx-4 border-white/30 text-white hover:bg-white/10" asChild>
                    <Link to={routes.login} onClick={() => setIsMenuOpen(false)}>
                      Entrar
                    </Link>
                  </Button>
                  <Button className="mx-4 bg-white text-black hover:bg-white/90" asChild>
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
    </header>
  );
};

export default NavBar;
