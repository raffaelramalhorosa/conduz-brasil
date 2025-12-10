import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import InstructorProfile from "./pages/InstructorProfile";
import InstructorRegistration from "./pages/InstructorRegistration";
import NotFound from "./pages/NotFound";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminFinancial from "./pages/admin/AdminFinancial";
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";
import { StudentLayout } from "./components/student/StudentLayout";
import StudentLessons from "./pages/student/StudentLessons";
import StudentFavorites from "./pages/student/StudentFavorites";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/instrutores" element={<Marketplace />} />
          <Route path="/instrutores/:id" element={<InstructorProfile />} />
          <Route path="/cadastro-instrutor" element={<InstructorRegistration />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="agendamentos" element={<AdminAppointments />} />
            <Route path="financeiro" element={<AdminFinancial />} />
            <Route path="historico" element={<AdminPlaceholder title="Histórico" />} />
            <Route path="avaliacoes" element={<AdminPlaceholder title="Avaliações" />} />
            <Route path="veiculos" element={<AdminPlaceholder title="Veículos" />} />
            <Route path="perfil" element={<AdminPlaceholder title="Meu Perfil" />} />
            <Route path="configuracoes" element={<AdminPlaceholder title="Configurações" />} />
          </Route>

          {/* Student Routes */}
          <Route path="/aluno" element={<StudentLayout />}>
            <Route index element={<StudentLessons />} />
            <Route path="favoritos" element={<StudentFavorites />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
