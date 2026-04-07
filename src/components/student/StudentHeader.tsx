import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Car, Search, Calendar, Heart, ChevronDown, User, LogOut, Menu, X, Shield, Home, MessageCircle, Map, Bell } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { cn } from '@/lib/utils';
import { routes } from '@/lib/routes';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const navItems = [
  { label: 'Início', path: routes.student.dashboard, icon: Home },
  { label: 'Buscar Instrutores', path: routes.marketplace, icon: Search },
  { label: 'Minhas Aulas', path: routes.student.lessons, icon: Calendar },
  { label: 'Mensagens', path: routes.student.messages, icon: MessageCircle },
  { label: 'Favoritos', path: routes.student.favorites, icon: Heart },
];

const mobileMenuItems = [
  { label: 'Início', path: routes.student.dashboard, icon: Home },
  { label: 'Buscar Instrutores', path: routes.marketplace, icon: Search },
  { label: 'Mapa', path: routes.student.map, icon: Map },
  { label: 'Minhas Aulas', path: routes.student.lessons, icon: Calendar },
  { label: 'Calendário', path: routes.student.calendar, icon: Calendar },
  { label: 'Mensagens', path: routes.student.messages, icon: MessageCircle },
  { label: 'Favoritos', path: routes.student.favorites, icon: Heart },
  { label: 'Meu Perfil', path: routes.student.profile, icon: User },
];

export function StudentHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
    navigate('/');
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
    <header className="sticky top-0 z-50 w-full bg-primary shadow-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary-foreground flex items-center justify-center">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold text-primary-foreground hidden md:inline">Habilitaí</span>
          <span className="text-lg font-bold text-primary-foreground md:hidden">HB</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Notifications - visible on desktop */}
          <div className="hidden md:block">
            <NotificationBell />
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 text-primary-foreground hover:bg-primary-foreground/10">
                  <Avatar className="h-8 w-8 border-2 border-primary-foreground/20">
                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'Usuário'} />
                    <AvatarFallback className="bg-primary-foreground text-primary text-xs">
                      {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-primary-foreground">
                    {profile?.full_name?.split(' ')[0] || 'Usuário'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-primary-foreground/70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover">
                <DropdownMenuItem asChild>
                  <Link to={routes.student.profile} className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Meu Perfil
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/system-admin" className="flex items-center gap-2 text-primary">
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

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden p-2 text-primary-foreground"
                aria-label="Abrir menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background p-0">
              <SheetHeader className="p-4 pb-2 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'Usuário'} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <SheetTitle className="text-sm font-semibold">
                      {profile?.full_name || 'Usuário'}
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
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
                    'text-foreground/80 hover:bg-accent hover:text-accent-foreground'
                  )}
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
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground'
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
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
