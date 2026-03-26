import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { routes } from "@/lib/routes";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";

// Public pages
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import InstructorProfile from "./pages/InstructorProfile";
import InstructorRegistration from "./pages/InstructorRegistration";
import NotFound from "./pages/NotFound";
import AcceptInvite from "./pages/AcceptInvite";
import InstallElectron from "./pages/InstallElectron";

// Auth pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";

// Instructor/Driving School Dashboard
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminFinancial from "./pages/admin/AdminFinancial";
import AdminVehicles from "./pages/admin/AdminVehicles";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";
import AdminInstrutores from "./pages/admin/AdminInstrutores";
import AdminCalendario from "./pages/admin/AdminCalendario";
import PersonalizarDashboard from "./pages/admin/PersonalizarDashboard";
import AdminAssinaturas from "./pages/admin/AdminAssinaturas";

// System Admin
import { SystemAdminLayout } from "./components/system-admin/SystemAdminLayout";
import SystemAdminDashboard from "./pages/system-admin/SystemAdminDashboard";
import PendingInstructors from "./pages/system-admin/PendingInstructors";
import DocumentsList from "./pages/system-admin/DocumentsList";
import InstructorDocuments from "./pages/system-admin/InstructorDocuments";
import ApprovedInstructors from "./pages/system-admin/ApprovedInstructors";
import RejectedInstructors from "./pages/system-admin/RejectedInstructors";
import PlatformSettings from "./pages/system-admin/PlatformSettings";
import AdminRefunds from "./pages/system-admin/AdminRefunds";

// Onboarding pages
import OnboardingStart from "./pages/onboarding/OnboardingStart";
import DadosBasicos from "./pages/onboarding/DadosBasicos";
import Documentacao from "./pages/onboarding/Documentacao";
import InformacoesProfissionais from "./pages/onboarding/InformacoesProfissionais";
import Finalizacao from "./pages/onboarding/Finalizacao";
import Sucesso from "./pages/onboarding/Sucesso";

// Driving School Onboarding
import { DrivingSchoolOnboardingProvider } from "./contexts/DrivingSchoolOnboardingContext";
import Step1DadosBasicos from "./components/onboarding-autoescola/Step1DadosBasicos";
import Step2Documentacao from "./components/onboarding-autoescola/Step2Documentacao";
// Step3Instrutores removed from onboarding - available in dashboard instead
import Step4Revisao from "./components/onboarding-autoescola/Step4Revisao";
import DrivingSchoolOnboardingSuccess from "./pages/onboarding-autoescola/DrivingSchoolOnboardingSuccess";

// Student area
import { StudentLayout } from "./components/student/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentLessons from "./pages/student/StudentLessons";
import StudentFavorites from "./pages/student/StudentFavorites";
import StudentMessages from "./pages/student/StudentMessages";
import InstructorMap from "./pages/student/InstructorMap";
import PublicInstructorMap from "./pages/PublicInstructorMap";
import Simulado from "./pages/student/Simulado";
import StudentCalendario from "./pages/student/StudentCalendario";
import JornadaCNH from "./pages/student/JornadaCNH";
import StudentRefunds from "./pages/student/StudentRefunds";

// Profile
import UserProfile from "./pages/UserProfile";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";

// Payment return pages
import PagamentoSucesso from "./pages/pagamento/PagamentoSucesso";
import PagamentoPendente from "./pages/pagamento/PagamentoPendente";
import PagamentoErro from "./pages/pagamento/PagamentoErro";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // dados válidos por 5 min — sem refetch em remounts
      gcTime: 1000 * 60 * 10,      // mantém cache por 10 min após componente desmontar
      retry: 1,                    // apenas 1 retry em vez de 3 (falha mais rápido)
      refetchOnWindowFocus: false, // não refetch ao voltar para a aba
    },
  },
});

function MessageNotificationListener() {
  useMessageNotifications();
  return null;
}

function AuthRedirectHome() {
  const { user, profile, loading } = useAuth();

  if (loading) return <LandingPage />;
  if (!user || !profile) return <LandingPage />;

  switch (profile.user_type) {
    case 'student':
      return <Navigate to="/aluno" replace />;
    case 'instructor':
    case 'driving_school':
      return <Navigate to="/admin" replace />;
    default:
      return <LandingPage />;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <MessageNotificationListener />
          <Routes>
            {/* Public Routes */}
            <Route path={routes.home} element={<AuthRedirectHome />} />
            <Route path="/old-home" element={<Index />} />
            <Route path={routes.marketplace} element={<Marketplace />} />
            <Route path="/instrutores/:id" element={<InstructorProfile />} />
            <Route path={routes.instructorMap} element={<PublicInstructorMap />} />
            <Route path={routes.instructorRegistration} element={<InstructorRegistration />} />
            <Route path="/install-electron" element={<InstallElectron />} />
            <Route path="/convite/:token" element={<AcceptInvite />} />
            
            {/* Auth Routes */}
            <Route path={routes.login} element={<Login />} />
            <Route path={routes.signup} element={<Signup />} />
            <Route path="/cadastro" element={<Signup />} />
            <Route path={routes.forgotPassword} element={<ForgotPassword />} />
            <Route path="/verificar-email" element={<VerifyEmail />} />
            
            {/* Instructor/Driving School Dashboard (Protected) */}
            <Route path="/admin" element={
              <ProtectedRoute allowedUserTypes={['instructor', 'driving_school']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="agendamentos" element={<AdminAppointments />} />
              <Route path="calendario" element={<AdminCalendario />} />
              <Route path="mensagens" element={<AdminMessages />} />
              <Route path="financeiro" element={<AdminFinancial />} />
              <Route path="historico" element={<AdminPlaceholder title="Histórico" />} />
              <Route path="avaliacoes" element={<AdminReviews />} />
              <Route path="veiculos" element={<AdminVehicles />} />
              <Route path="instrutores" element={<AdminInstrutores />} />
              <Route path="midias" element={<AdminMedia />} />
              <Route path="personalizar" element={<PersonalizarDashboard />} />
              <Route path="perfil" element={<AdminProfile />} />
              <Route path="perfil/editar" element={<EditProfile />} />
              <Route path="configuracoes" element={<Settings />} />
              <Route path="assinaturas" element={<AdminAssinaturas />} />
            </Route>

            {/* Instructor Onboarding (Protected) */}
            <Route path="/onboarding-instrutor" element={
              <ProtectedRoute allowedUserTypes={['instructor', 'driving_school']}>
                <OnboardingProvider>
                  <OnboardingStart />
                </OnboardingProvider>
              </ProtectedRoute>
            } />
            <Route path="/onboarding-instrutor/dados-basicos" element={
              <ProtectedRoute allowedUserTypes={['instructor', 'driving_school']}>
                <OnboardingProvider>
                  <DadosBasicos />
                </OnboardingProvider>
              </ProtectedRoute>
            } />
            <Route path="/onboarding-instrutor/documentacao" element={
              <ProtectedRoute allowedUserTypes={['instructor', 'driving_school']}>
                <OnboardingProvider>
                  <Documentacao />
                </OnboardingProvider>
              </ProtectedRoute>
            } />
            <Route path="/onboarding-instrutor/informacoes-profissionais" element={
              <ProtectedRoute allowedUserTypes={['instructor', 'driving_school']}>
                <OnboardingProvider>
                  <InformacoesProfissionais />
                </OnboardingProvider>
              </ProtectedRoute>
            } />
            <Route path="/onboarding-instrutor/finalizacao" element={
              <ProtectedRoute allowedUserTypes={['instructor', 'driving_school']}>
                <OnboardingProvider>
                  <Finalizacao />
                </OnboardingProvider>
              </ProtectedRoute>
            } />
            <Route path="/onboarding-instrutor/sucesso" element={
              <ProtectedRoute allowedUserTypes={['instructor', 'driving_school']}>
                <OnboardingProvider>
                  <Sucesso />
                </OnboardingProvider>
              </ProtectedRoute>
            } />

            {/* Driving School Onboarding (Protected) */}
            <Route path="/onboarding-autoescola/dados-basicos" element={
              <ProtectedRoute allowedUserTypes={['driving_school']}>
                <DrivingSchoolOnboardingProvider>
                  <Step1DadosBasicos />
                </DrivingSchoolOnboardingProvider>
              </ProtectedRoute>
            } />
            <Route path="/onboarding-autoescola/documentacao" element={
              <ProtectedRoute allowedUserTypes={['driving_school']}>
                <DrivingSchoolOnboardingProvider>
                  <Step2Documentacao />
                </DrivingSchoolOnboardingProvider>
              </ProtectedRoute>
            } />
            <Route path="/onboarding-autoescola/revisao" element={
              <ProtectedRoute allowedUserTypes={['driving_school']}>
                <DrivingSchoolOnboardingProvider>
                  <Step4Revisao />
                </DrivingSchoolOnboardingProvider>
              </ProtectedRoute>
            } />
            <Route path="/onboarding-autoescola/sucesso" element={
              <ProtectedRoute allowedUserTypes={['driving_school']}>
                <DrivingSchoolOnboardingSuccess />
              </ProtectedRoute>
            } />

            {/* Student Area (Protected) */}
            <Route path="/aluno" element={
              <ProtectedRoute allowedUserTypes={['student']}>
                <StudentLayout />
              </ProtectedRoute>
            }>
              <Route index element={<StudentDashboard />} />
              <Route path="aulas" element={<StudentLessons />} />
              <Route path="calendario" element={<StudentCalendario />} />
              <Route path="favoritos" element={<StudentFavorites />} />
              <Route path="mensagens" element={<StudentMessages />} />
              <Route path="mapa" element={<InstructorMap />} />
              <Route path="simulado" element={<Simulado />} />
              <Route path="jornada" element={<JornadaCNH />} />
              <Route path="reembolsos" element={<StudentRefunds />} />
              <Route path="perfil" element={<UserProfile />} />
              <Route path="perfil/editar" element={<EditProfile />} />
              <Route path="configuracoes" element={<Settings />} />
            </Route>

            {/* System Admin Panel (Protected - admin only) */}
            <Route path="/system-admin" element={
              <AdminProtectedRoute>
                <SystemAdminLayout />
              </AdminProtectedRoute>
            }>
              <Route index element={<SystemAdminDashboard />} />
              <Route path="pendentes" element={<PendingInstructors />} />
              <Route path="aprovados" element={<ApprovedInstructors />} />
              <Route path="rejeitados" element={<RejectedInstructors />} />
              <Route path="documentos" element={<DocumentsList />} />
              <Route path="documentos/:id" element={<InstructorDocuments />} />
              <Route path="configuracoes" element={<PlatformSettings />} />
              <Route path="reembolsos" element={<AdminRefunds />} />
            </Route>
            
            {/* Payment return pages */}
            <Route path="/pagamento/sucesso" element={<PagamentoSucesso />} />
            <Route path="/pagamento/pendente" element={<PagamentoPendente />} />
            <Route path="/pagamento/erro" element={<PagamentoErro />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
