import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, User, ChevronDown, Shield, MessageCircle, Home, Search, Map, Calendar, Heart, Bell } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { cn } from "@/lib/utils";
import { useAllUnreadCounts } from "@/hooks/useAllUnreadCounts";

const NavBar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  const { isAdmin } = useAdminRole();
  const { totalUnread } = useAllUnreadCounts();

  const isLoggedIn = !!user && !!profile;

  const desktopNavItems = [
    { label: "Início", path: isLoggedIn ? routes.student.dashboard : routes.home },
    { label: "Buscar Instrutores", path: routes.marketplace },
    { label: "Mapa", path: routes.instructorMap },
    { label: "Minhas Aulas", path: routes.student.lessons },
    { label: "Calendário", path: routes.student.calendar },
  ];

  const mobileMenuItems = [
    { label: "Início", path: isLoggedIn ? routes.student.dashboard : routes.home, icon: Home },
    { label: "Buscar Instrutores", path: routes.marketplace, icon: Search },
    { label: "Mapa", path: isLoggedIn ? routes.student.map : routes.instructorMap, icon: Map },
    { label: "Minhas Aulas", path: routes.student.lessons, icon: Calendar },
    { label: "Calendário", path: routes.student.calendar, icon: Calendar },
    { label: "Mensagens", path: routes.student.messages, icon: MessageCircle },
    { label: "Favoritos", path: routes.student.favorites, icon: Heart },
    { label: "Meu Perfil", path: routes.student.profile, icon: User },
  ];

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
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
          <span className="text-xl font-bold text-gray-900 hidden md:inline">Conduz Brasil</span>
          <span className="text-xl font-bold text-gray-900 md:hidden">CB</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {desktopNavItems.map((item) => {
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
              {/* Messages - desktop only */}
              <Link to={routes.student.messages} className="hidden md:block relative p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <MessageCircle className="h-5 w-5" />
                {totalUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </Link>

              {/* Notifications - desktop only */}
              <div className="hidden md:block">
                <NotificationBell />
              </div>

              {/* Desktop User Menu */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2 text-gray-700 hover:bg-gray-100">
                      <Avatar className="h-8 w-8 border-2 border-gray-200">
                        <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "Usuário"} />
                        <AvatarFallback className="bg-primary text-white text-xs">
                          {profile?.full_name ? getInitials(profile.full_name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-900 max-w-[120px] truncate">
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
              </div>
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

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Abrir menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background p-0">
              {isLoggedIn ? (
                <>
                  <SheetHeader className="p-4 pb-2 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "Usuário"} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {profile?.full_name ? getInitials(profile.full_name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <SheetTitle className="text-sm font-semibold">
                          {profile?.full_name || "Usuário"}
                        </SheetTitle>
                        <p className="text-xs text-muted-foreground">{profile?.email}</p>
                      </div>
                    </div>
                  </SheetHeader>

                  <nav className="flex flex-col py-2">
                    {/* Notifications */}
                    <Link
                      to={routes.student.dashboard}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Bell className="h-5 w-5" />
                      Notificações
                    </Link>

                    <div className="h-px bg-border mx-4 my-1" />

                    {/* Navigation Items */}
                    {mobileMenuItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path + item.label}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </Link>
                      );
                    })}

                    {/* Admin Panel */}
                    {isAdmin && (
                      <>
                        <div className="h-px bg-border mx-4 my-1" />
                        <Link
                          to="/system-admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <Shield className="h-5 w-5" />
                          Painel Admin
                        </Link>
                      </>
                    )}

                    <div className="h-px bg-border mx-4 my-1" />

                    {/* Sign Out */}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      Sair
                    </button>
                  </nav>
                </>
              ) : (
                <div className="p-4 flex flex-col gap-3">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 mt-4">
                    <Link
                      to={routes.home}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-accent rounded-lg"
                    >
                      <Home className="h-5 w-5" />
                      Início
                    </Link>
                    <Link
                      to={routes.marketplace}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-accent rounded-lg"
                    >
                      <Search className="h-5 w-5" />
                      Buscar Instrutores
                    </Link>
                    <Link
                      to={routes.instructorMap}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-accent rounded-lg"
                    >
                      <Map className="h-5 w-5" />
                      Mapa
                    </Link>
                  </nav>
                  <div className="h-px bg-border my-2" />
                  <Button asChild className="w-full">
                    <Link to={routes.login} onClick={() => setMobileMenuOpen(false)}>Entrar</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to={routes.signup} onClick={() => setMobileMenuOpen(false)}>Cadastrar-se</Link>
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
