import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  LogOut,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/system-admin', badge: null },
  { icon: Users, label: 'Cadastros Pendentes', path: '/system-admin/pendentes', badge: null },
  { icon: FileText, label: 'Documentos', path: '/system-admin/documentos', badge: null },
  { icon: CheckCircle, label: 'Aprovados', path: '/system-admin/aprovados', badge: null },
  { icon: XCircle, label: 'Rejeitados', path: '/system-admin/rejeitados', badge: null },
];

export function SystemAdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
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
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-zinc-900 border-r border-zinc-800 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-800">
        <Link to="/system-admin" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-yellow-400 flex items-center justify-center">
            <Shield className="h-5 w-5 text-zinc-900" />
          </div>
          <span className="text-xl font-bold text-white">Admin Sistema</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-yellow-400">
            <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'Admin'} />
            <AvatarFallback className="bg-yellow-400 text-zinc-900 font-bold">
              {profile?.full_name ? getInitials(profile.full_name) : 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{profile?.full_name || 'Administrador'}</p>
            <Badge className="text-xs bg-yellow-400/20 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/30">
              Admin Sistema
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/system-admin' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-zinc-800 text-yellow-400'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-yellow-400")} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge className="bg-yellow-400 text-zinc-900 hover:bg-yellow-500">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Back to Site & Logout */}
      <div className="p-4 border-t border-zinc-800 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={() => navigate('/')}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Voltar ao Site</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </Button>
      </div>
    </aside>
  );
}
