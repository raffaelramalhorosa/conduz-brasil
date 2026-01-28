import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, ChevronDown, Shield } from "lucide-react";
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
    },
    {
      label: "Buscar Instrutores",
      path: routes.marketplace,
    },
    {
      label: "Minhas Aulas",
      path: routes.student.lessons,
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
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to={isLoggedIn ? routes.student.dashboard : routes.home} className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900">Conduz Brasil</span>
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
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive ? "bg-primary/10 text-primary" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-9 bg-gray-200 animate-pulse rounded-md" />
          ) : isLoggedIn ? (
            <>
              {/* Notifications */}
              <NotificationBell />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 text-gray-700 hover:bg-gray-100">
                    <Avatar className="h-8 w-8 border-2 border-gray-200">
                      <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "Usuário"} />
                      <AvatarFallback className="bg-primary text-white text-xs">
                        {profile?.full_name ? getInitials(profile.full_name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium text-gray-900 max-w-[120px] truncate">
                      {profile?.full_name?.split(" ")[0] || "Usuário"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
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
                variant="ghost"
                size="sm"
                asChild
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium"
              >
                <Link to={routes.login}>Entrar</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-primary text-white hover:bg-primary/90 font-medium shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Link to={routes.signup}>Cadastrar-se</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden py-4 border-t border-gray-200/50 animate-fade-in bg-white/80 backdrop-blur-lg">
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
                    "px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive ? "bg-primary/10 text-primary" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Auth section for mobile */}
            <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-gray-200">
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-3 px-4 pb-3">
                    <Avatar className="h-10 w-10 border-2 border-gray-200">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-primary text-white">
                        {profile?.full_name ? getInitials(profile.full_name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{profile?.full_name || "Usuário"}</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="mx-4 border-gray-300 text-gray-700 hover:bg-gray-50" asChild>
                    <Link to={routes.student.profile} onClick={() => setIsMenuOpen(false)}>
                      <User className="h-4 w-4 mr-2" />
                      Meu Perfil
                    </Link>
                  </Button>
                  {isAdmin && (
                    <Button variant="outline" className="mx-4 border-gray-300 text-gray-700 hover:bg-gray-50" asChild>
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
                  <Button
                    variant="ghost"
                    className="mx-4 text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium justify-start"
                    asChild
                  >
                    <Link to={routes.login} onClick={() => setIsMenuOpen(false)}>
                      Entrar
                    </Link>
                  </Button>
                  <Button className="mx-4 bg-primary text-white hover:bg-primary/90 font-medium shadow-sm" asChild>
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
