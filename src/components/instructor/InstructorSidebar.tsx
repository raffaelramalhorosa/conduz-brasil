import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Car,
  Video,
  DollarSign,
  User,
  Settings,
  Sparkles,
  X,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { routes } from '@/lib/routes';
import { Badge } from '@/components/ui/badge';

interface InstructorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: routes.instructor.dashboard, badge: null },
  { icon: Calendar, label: 'Agendamentos', path: routes.instructor.appointments, badge: null },
  { icon: MessageCircle, label: 'Mensagens', path: routes.instructor.messages, badge: null },
  { icon: BarChart3, label: 'Avaliações', path: routes.instructor.reviews, badge: null },
  { icon: Car, label: 'Veículos', path: routes.instructor.vehicles, badge: null },
  { icon: Video, label: 'Mídias', path: routes.instructor.media, badge: null },
  { icon: DollarSign, label: 'Financeiro', path: routes.instructor.financial, badge: null },
];

const secondaryItems = [
  { icon: User, label: 'Meu Perfil', path: routes.instructor.profile },
  { icon: Settings, label: 'Configurações', path: routes.instructor.settings },
];

export function InstructorSidebar({ isOpen, onClose }: InstructorSidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-[70px] bottom-0 w-[240px] bg-instructor-dark-sidebar border-r border-white/10 z-50 transition-transform duration-300",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Close button for mobile */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-lg lg:hidden"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        
        <nav className="p-4 space-y-2 mt-2 lg:mt-0">
          
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  isActive
                    ? "bg-gradient-to-r from-primary/20 to-transparent text-white font-medium"
                    : "text-instructor-text-secondary hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                )}
                {item.badge && !isActive && (
                  <Badge className="bg-instructor-danger text-white text-xs hover:bg-instructor-danger">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
          
          <div className="h-px bg-white/10 my-4"></div>
          
          {secondaryItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                  isActive
                    ? "bg-gradient-to-r from-primary/20 to-transparent text-white font-medium"
                    : "text-instructor-text-secondary hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-8 bg-primary rounded-full"></div>
                )}
              </Link>
            );
          })}
          
        </nav>
        
        {/* Card Promocional */}
        <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-br from-primary/10 to-amber-500/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-white">Destaque Premium</span>
          </div>
          <p className="text-xs text-instructor-text-secondary mb-3">
            Aumente sua visibilidade em até 300% com o plano Premium
          </p>
          <button className="w-full bg-primary hover:bg-primary/90 text-instructor-dark-primary font-medium text-sm py-2 rounded-lg transition-colors">
            Ativar Agora
          </button>
        </div>
      </aside>
    </>
  );
}
