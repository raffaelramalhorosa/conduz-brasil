import { Menu, Search, Bell, Plus, ChevronDown, Car, TrendingUp, CheckCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface InstructorHeaderProps {
  onMenuToggle: () => void;
}

export function InstructorHeader({ onMenuToggle }: InstructorHeaderProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const instructorName = profile?.full_name || 'Instrutor';
  const instructorPhoto = profile?.avatar_url || '';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-[70px] bg-instructor-dark-primary border-b border-white/10 z-50">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        
        {/* Logo + Menu Toggle (mobile) */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-amber-500 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-instructor-dark-primary" />
            </div>
            <span className="text-xl font-bold text-white hidden md:block">
              Habilitai
            </span>
          </div>
        </div>
        
        {/* Stats Rápidas (Desktop) */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-6">
          
          {/* Faturamento Mensal */}
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg">
            <div className="text-left">
              <p className="text-xs text-instructor-text-muted">Faturamento</p>
              <p className="text-sm font-semibold text-white">R$ 3.240</p>
            </div>
            <div className="flex items-center gap-1 text-instructor-success text-xs">
              <TrendingUp className="w-3 h-3" />
              <span>+8%</span>
            </div>
          </div>
          
          {/* Aulas do Mês */}
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg">
            <div className="text-left">
              <p className="text-xs text-instructor-text-muted">Aulas (mês)</p>
              <p className="text-sm font-semibold text-white">24</p>
            </div>
            <div className="flex items-center gap-1 text-primary text-xs">
              <span>+12%</span>
            </div>
          </div>
          
          {/* Taxa de Aceitação */}
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg">
            <div className="text-left">
              <p className="text-xs text-instructor-text-muted">Aceitação</p>
              <p className="text-sm font-semibold text-white">94%</p>
            </div>
            <CheckCircle className="w-4 h-4 text-instructor-success" />
          </div>
          
        </div>
        
        {/* Ações da Direita */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* Busca (opcional) */}
          <button className="hidden xl:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            <Search className="w-4 h-4 text-instructor-text-muted" />
            <span className="text-sm text-instructor-text-muted">Buscar...</span>
            <kbd className="px-2 py-0.5 bg-white/10 rounded text-xs text-instructor-text-muted">⌘K</kbd>
          </button>
          
          {/* Notificações */}
          <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-instructor-danger rounded-full"></span>
          </button>
          
          {/* Botão Principal CTA */}
          <Button className="bg-gradient-to-r from-primary to-amber-500 hover:opacity-90 text-instructor-dark-primary font-semibold px-4 md:px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-primary/20 border-0">
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Nova Aula</span>
          </Button>
          
          {/* Avatar + Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-white">{instructorName.split(' ')[0]}</p>
                  <p className="text-xs text-instructor-text-muted">Instrutor</p>
                </div>
                <Avatar className="w-10 h-10 border-2 border-primary">
                  <AvatarImage src={instructorPhoto} alt={instructorName} />
                  <AvatarFallback className="bg-primary text-instructor-dark-primary font-semibold">
                    {getInitials(instructorName)}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-instructor-text-muted hidden md:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-instructor-dark-secondary border-white/10 text-white">
              <DropdownMenuItem className="hover:bg-white/5 cursor-pointer focus:bg-white/5 focus:text-white">
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-white/5 cursor-pointer focus:bg-white/5 focus:text-white">
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                className="text-instructor-danger hover:bg-white/5 cursor-pointer focus:bg-white/5 focus:text-instructor-danger"
                onClick={handleSignOut}
              >
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
        </div>
        
      </div>
    </header>
  );
}
