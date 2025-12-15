import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { routes } from "@/lib/routes";

// Public pages
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import InstructorProfile from "./pages/InstructorProfile";
import InstructorRegistration from "./pages/InstructorRegistration";
import NotFound from "./pages/NotFound";

// Auth pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Instructor/Driving School Dashboard
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminFinancial from "./pages/admin/AdminFinancial";
import AdminVehicles from "./pages/admin/AdminVehicles";
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";

// Onboarding pages
import OnboardingStart from "./pages/onboarding/OnboardingStart";
import DadosBasicos from "./pages/onboarding/DadosBasicos";
import Documentacao from "./pages/onboarding/Documentacao";
import Veiculos from "./pages/onboarding/Veiculos";
import Precos from "./pages/onboarding/Precos";
import Finalizacao from "./pages/onboarding/Finalizacao";
import Sucesso from "./pages/onboarding/Sucesso";

// Student area
import { StudentLayout } from "./components/student/StudentLayout";
import StudentLessons from "./pages/student/StudentLessons";
import StudentFavorites from "./pages/student/StudentFavorites";
import InstructorMap from "./pages/student/InstructorMap";

// Profile
import UserProfile from "./pages/UserProfile";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path={routes.home} element={<Index />} />
            <Route path={routes.marketplace} element={<Marketplace />} />
            <Route path="/instrutores/:id" element={<InstructorProfile />} />
            <Route path={routes.instructorMap} element={<InstructorMap />} />
            <Route path={routes.instructorRegistration} element={<InstructorRegistration />} />
            
            {/* Auth Routes */}
            <Route path={routes.login} element={<Login />} />
            <Route path={routes.signup} element={<Signup />} />
            <Route path={routes.forgotPassword} element={<ForgotPassword />} />
            
            {/* Instructor/Driving School Dashboard (Protected) */}
            <Route path="/admin" element={
              <ProtectedRoute allowedUserTypes={['instructor', 'driving_school']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="agendamentos" element={<AdminAppointments />} />
              <Route path="financeiro" element={<AdminFinancial />} />
              <Route path="historico" element={<AdminPlaceholder title="Histórico" />} />
              <Route path="avaliacoes" element={<AdminPlaceholder title="Avaliações" />} />
              <Route path="veiculos" element={<AdminVehicles />} />
              <Route path="perfil" element={<UserProfile />} />
              <Route path="perfil/editar" element={<EditProfile />} />
              <Route path="configuracoes" element={<Settings />} />
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
            <Route path="/onboarding-instrutor/veiculos" element={
              <ProtectedRoute allowedUserTypes={['instructor', 'driving_school']}>
                <OnboardingProvider>
                  <Veiculos />
                </OnboardingProvider>
              </ProtectedRoute>
            } />
            <Route path="/onboarding-instrutor/precos" element={
              <ProtectedRoute allowedUserTypes={['instructor', 'driving_school']}>
                <OnboardingProvider>
                  <Precos />
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

            {/* Student Area (Protected) */}
            <Route path="/aluno" element={
              <ProtectedRoute allowedUserTypes={['student']}>
                <StudentLayout />
              </ProtectedRoute>
            }>
              <Route index element={<StudentLessons />} />
              <Route path="favoritos" element={<StudentFavorites />} />
              <Route path="mapa" element={<InstructorMap />} />
              <Route path="perfil" element={<UserProfile />} />
              <Route path="perfil/editar" element={<EditProfile />} />
              <Route path="configuracoes" element={<Settings />} />
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
