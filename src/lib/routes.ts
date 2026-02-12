// AutoConnect Route Configuration
// Centralized route definitions for the entire application

export const routes = {
  // Public routes
  home: '/',
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  
  // Marketplace (Public/Authenticated)
  marketplace: '/instrutores',
  instructorMap: '/mapa',
  instructorProfile: (id: string) => `/instrutores/${id}`,
  
  // Student area (Protected: student)
  student: {
    dashboard: '/aluno',
    lessons: '/aluno/aulas',
    calendar: '/aluno/calendario',
    favorites: '/aluno/favoritos',
    messages: '/aluno/mensagens',
    map: '/aluno/mapa',
    profile: '/aluno/perfil',
  },
  
  // Instructor/Driving School area (Protected: instructor/driving_school)
  instructor: {
    dashboard: '/admin',
    appointments: '/admin/agendamentos',
    calendar: '/admin/calendario',
    messages: '/admin/mensagens',
    history: '/admin/historico',
    reviews: '/admin/avaliacoes',
    vehicles: '/admin/veiculos',
    instructors: '/admin/instrutores',
    media: '/admin/midias',
    financial: '/admin/financeiro',
    customize: '/admin/personalizar',
    profile: '/admin/perfil',
    settings: '/admin/configuracoes',
  },
  
  // Instructor Registration (Onboarding)
  instructorRegistration: '/cadastro-instrutor',
  instructorOnboarding: '/onboarding-instrutor',
} as const;

// Route labels for breadcrumbs and navigation
export const routeLabels: Record<string, string> = {
  '/': 'Início',
  '/login': 'Entrar',
  '/signup': 'Cadastrar',
  '/forgot-password': 'Recuperar Senha',
  '/instrutores': 'Buscar Instrutores',
  '/mapa': 'Mapa de Instrutores',
  '/aluno': 'Dashboard',
  '/aluno/aulas': 'Minhas Aulas',
  '/aluno/calendario': 'Calendário',
  '/aluno/favoritos': 'Favoritos',
  '/aluno/mensagens': 'Mensagens',
  '/aluno/mapa': 'Mapa',
  '/aluno/perfil': 'Meu Perfil',
  '/admin': 'Dashboard',
  '/admin/agendamentos': 'Agendamentos',
  '/admin/calendario': 'Calendário',
  '/admin/mensagens': 'Mensagens',
  '/admin/historico': 'Histórico',
  '/admin/avaliacoes': 'Avaliações',
  '/admin/veiculos': 'Veículos',
  '/admin/instrutores': 'Instrutores',
  '/admin/midias': 'Mídias',
  '/admin/financeiro': 'Financeiro',
  '/admin/personalizar': 'Personalizar Dashboard',
  '/admin/perfil': 'Meu Perfil',
  '/admin/configuracoes': 'Configurações',
  '/cadastro-instrutor': 'Cadastro de Instrutor',
};

// Helper to get dashboard route based on user type
export const getDashboardRoute = (userType: 'student' | 'instructor' | 'driving_school' | null): string => {
  if (!userType) return routes.home;
  return userType === 'student' ? routes.student.dashboard : routes.instructor.dashboard;
};

// Helper to check if a route is protected
export const isProtectedRoute = (pathname: string): boolean => {
  return pathname.startsWith('/admin') || pathname.startsWith('/aluno');
};

// Helper to check if a route is instructor-only
export const isInstructorRoute = (pathname: string): boolean => {
  return pathname.startsWith('/admin');
};

// Helper to check if a route is student-only
export const isStudentRoute = (pathname: string): boolean => {
  return pathname.startsWith('/aluno');
};
