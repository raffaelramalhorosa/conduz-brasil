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
  Users,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { routes } from '@/lib/routes';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAllUnreadCounts } from '@/hooks/useAllUnreadCounts';

interface InstructorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDrivingSchool?: boolean;
}

const baseMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: routes.instructor.dashboard, badge: null },
  { icon: Calendar, label: 'Agendamentos', path: routes.instructor.appointments, badge: null },
  { icon: MessageCircle, label: 'Mensagens', path: routes.instructor.messages, badge: null },
  { icon: BarChart3, label: 'Avaliações', path: routes.instructor.reviews, badge: null },
  { icon: Car, label: 'Veículos', path: routes.instructor.vehicles, badge: null },
];

const drivingSchoolItem = { icon: Users, label: 'Instrutores', path: routes.instructor.instructors, badge: null };
const customizeItem = { icon: Palette, label: 'Personalizar', path: routes.instructor.customize, badge: null };

const additionalMenuItems = [
  { icon: Video, label: 'Mídias', path: routes.instructor.media, badge: null },
  { icon: DollarSign, label: 'Financeiro', path: routes.instructor.financial, badge: null },
];

const secondaryItems = [
  { icon: User, label: 'Meu Perfil', path: routes.instructor.profile },
  { icon: Settings, label: 'Configurações', path: routes.instructor.settings },
];

export function InstructorSidebar({ isOpen, onClose, isDrivingSchool: isDrivingSchoolProp }: InstructorSidebarProps) {
  const location = useLocation();
  const { profile } = useAuth();
  const { totalUnread } = useAllUnreadCounts();
  
  const isDrivingSchool = isDrivingSchoolProp ?? profile?.user_type === 'driving_school';
  const menuItems = isDrivingSchool 
    ? [...baseMenuItems, drivingSchoolItem, customizeItem, ...additionalMenuItems]
    : [...baseMenuItems, ...additionalMenuItems];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside 
        className={cn(
          "fixed left-0 top-[70px] bottom-0 w-[240px] border-r border-white/10 z-50 transition-transform duration-300",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ backgroundColor: 'var(--school-secondary, rgb(15 15 35))' }}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-accent/10 rounded-lg lg:hidden"
        >
          <X className="w-5 h-5" style={{ color: 'var(--school-text, hsl(var(--foreground)))' }} />
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
                  isActive ? "font-medium" : ""
                )}
                style={{
                  color: isActive ? 'var(--school-text, hsl(var(--foreground)))' : 'var(--school-text-secondary, hsl(var(--muted-foreground)))',
                  ...(isActive ? { background: `linear-gradient(to right, color-mix(in srgb, var(--school-primary, #FF8C00) 20%, transparent), transparent)` } : {}),
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '';
                  }
                }}
              >
                <item.icon
                  className="w-5 h-5"
                  style={isActive ? { color: 'var(--school-accent, #F59E0B)' } : undefined}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <div
                    className="w-1.5 h-8 rounded-full"
                    style={{ backgroundColor: 'var(--school-primary, #FF8C00)' }}
                  />
                )}
                {item.label === 'Mensagens' && totalUnread > 0 && !isActive && (
                  <Badge className="bg-destructive text-destructive-foreground text-xs hover:bg-destructive">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </Badge>
                )}
                {item.badge && !isActive && item.label !== 'Mensagens' && (
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
                  isActive ? "font-medium" : ""
                )}
                style={{
                  color: isActive ? 'var(--school-text, hsl(var(--foreground)))' : 'var(--school-text-secondary, hsl(var(--muted-foreground)))',
                  ...(isActive ? { background: `linear-gradient(to right, color-mix(in srgb, var(--school-primary, #FF8C00) 20%, transparent), transparent)` } : {}),
                }}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {isActive && (
                  <div
                    className="ml-auto w-1.5 h-8 rounded-full"
                    style={{ backgroundColor: 'var(--school-primary, #FF8C00)' }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        
      </aside>
    </>
  );
}
