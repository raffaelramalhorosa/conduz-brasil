import { Menu, Search, ChevronDown, Car, User, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface InstructorHeaderProps {
  onMenuToggle: () => void;
  logoUrl?: string | null;
}

export function InstructorHeader({ onMenuToggle, logoUrl }: InstructorHeaderProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const instructorName = profile?.full_name || "Instrutor";
  const instructorFirstName = instructorName.split(" ")[0];
  const instructorPhoto = profile?.avatar_url || "";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserTypeLabel = () => {
    if (profile?.user_type === "driving_school") return "Autoescola";
    return "Instrutor";
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 h-[70px] border-b border-white/10 z-50"
      style={{ backgroundColor: 'var(--school-secondary, rgb(15 15 35))' }}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Logo + Menu Toggle (mobile) */}
        <div className="flex items-center gap-4">
          <button onClick={onMenuToggle} className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors">
            <Menu className="w-6 h-6 text-white" />
          </button>
          <Link to="/admin" className="flex items-center gap-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-10 w-10 rounded-lg object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(to bottom right, var(--school-accent, #F59E0B), var(--school-primary, #FF8C00))` }}
              >
                <Car className="w-6 h-6" style={{ color: 'var(--school-secondary, #0f0f23)' }} />
              </div>
            )}
            <span className="text-xl font-bold text-white hidden md:block" style={{ color: 'var(--school-primary, white)' }}>
              Conduz Brasil
            </span>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Search (Desktop) */}
          <button className="hidden xl:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            <Search className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Buscar...</span>
            <kbd className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-500">⌘K</kbd>
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* Avatar + Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-white">{instructorFirstName}</p>
                  <p className="text-xs text-gray-400">{getUserTypeLabel()}</p>
                </div>
                <Avatar className="w-10 h-10" style={{ borderColor: 'var(--school-accent, #F59E0B)', borderWidth: 2 }}>
                  <AvatarImage src={instructorPhoto} alt={instructorName} />
                  <AvatarFallback
                    className="font-semibold"
                    style={{ backgroundColor: 'var(--school-accent, #F59E0B)', color: 'var(--school-secondary, #0f0f23)' }}
                  >
                    {getInitials(instructorName)}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-instructor-dark-secondary border-white/10 text-white w-48">
              <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer focus:bg-white/5 focus:text-white">
                <Link to="/admin/perfil" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer focus:bg-white/5 focus:text-white">
                <Link to="/admin/configuracoes" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="text-red-400 hover:bg-red-500/10 cursor-pointer focus:bg-red-500/10 focus:text-red-400"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
