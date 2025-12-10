import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Star,
  Car,
  DollarSign,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockInstructor } from '@/data/mockAdminData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', badge: null },
  { icon: Calendar, label: 'Agendamentos', path: '/admin/agendamentos', badge: 3 },
  { icon: Clock, label: 'Histórico', path: '/admin/historico', badge: null },
  { icon: Star, label: 'Avaliações', path: '/admin/avaliacoes', badge: null },
  { icon: Car, label: 'Veículos', path: '/admin/veiculos', badge: null },
  { icon: DollarSign, label: 'Financeiro', path: '/admin/financeiro', badge: null },
  { icon: User, label: 'Meu Perfil', path: '/admin/perfil', badge: null },
  { icon: Settings, label: 'Configurações', path: '/admin/configuracoes', badge: null },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">AutoConnect</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={mockInstructor.photo} alt={mockInstructor.name} />
            <AvatarFallback>{mockInstructor.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{mockInstructor.name}</p>
            <p className="text-sm text-gray-400 truncate">{mockInstructor.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge className="bg-orange-500 text-white hover:bg-orange-500">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-800"
          asChild
        >
          <Link to="/">
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </Link>
        </Button>
      </div>
    </aside>
  );
}
