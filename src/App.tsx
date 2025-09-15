import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { DashboardSidebar } from "./components/DashboardSidebar";
import React, { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useUserAvatar } from "./hooks/useUserAvatar";
import { useUserTheme } from "./hooks/useUserTheme";
import { PeriodProvider } from "./contexts/PeriodContext";
import { getDescricaoTipoUsuario } from "./utils/userTypes";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Vendas from "./pages/Vendas";
import Metas from "./pages/Metas";
import MetasLojaPage from "./pages/MetasLojaPage";
import Campanhas from "./pages/Campanhas";
import Relatorios from "./pages/Relatorios";
import Usuarios from "./pages/Usuarios";
import EditarUsuario from "./pages/EditarUsuario";
import Configuracoes from "./pages/Configuracoes";
import Rankings from "./pages/Rankings";
import Graficos from "./pages/Graficos";
import Escala from "./pages/Escala";
import EscalaConsolidada from "./pages/EscalaConsolidada";
import Participacao from "./pages/Participacao";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();
function AppContent() {
  const {
    user,
    loading
  } = useAuth();
  const {
    avatarUrl
  } = useUserAvatar();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const location = useLocation();

  // Apply user theme
  useUserTheme();

  // Handle sidebar responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarExpanded(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (sidebarExpanded && !target.closest('.sidebar') && !target.closest('.menu-toggle')) {
        setSidebarExpanded(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sidebarExpanded]);

  // Debug logs
  console.log('🔍 AppContent - user:', user ? user.nome : 'null', 'location:', location.pathname, 'loading:', loading);

  // Verificar se estamos na página de login
  const isLoginPage = location.pathname === '/login';

  // Se ainda está carregando, mostrar loading
  if (loading) {
    console.log('⏳ Mostrando tela de loading...');
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="loading-container text-center">
          <div className="loading-spinner animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="loading-text text-foreground">
            Carregando<span className="dot-animation">...</span>
          </div>
        </div>
      </div>;
  }

  // Se não está logado e não está na página de login, redirecionar para login
  if (!user && !isLoginPage) {
    console.log('🔄 Redirecionando para login (usuário não logado)');
    return <Navigate to="/login" replace />;
  }

  // Se está na página de login mas está logado, redirecionar para dashboard
  if (isLoginPage && user) {
    console.log('🔄 Redirecionando para dashboard (usuário logado na página de login)');
    return <Navigate to="/" replace />;
  }
  return <div className="min-h-screen w-full bg-background">
      {user && <>
          <DashboardSidebar className={`${sidebarExpanded ? 'expanded' : ''}`} />
          {/* Mobile overlay */}
          <div className={`lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarExpanded(false)} />
        </>}
      
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${user ? 'lg:ml-16' : ''}`}>
        {user && <header className="header fixed top-0 left-0 lg:left-16 right-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="menu-toggle lg:hidden p-2 transition-colors text-base rounded-lg text-slate-200 font-thin text-left bg-stone-300 hover:bg-stone-200">
              <i className="fas fa-bars text-foreground"></i>
            </button>
            <h1 className="page-title text-lg font-semibold md:text-xl">Dashboard</h1>
          </div>
          
            <div className="flex items-center gap-4 text-sm">
            {/* Dados do usuário */}
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={`Avatar de ${user?.nome}`} className="object-cover" /> : null}
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
                  {user?.nome?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="text-foreground font-medium text-xs md:text-sm">
                  Mat: {user.matricula || '3794'}
                </div>
                <div className="text-muted-foreground text-xs">
                  {getDescricaoTipoUsuario(user.tipo || '')}
                </div>
              </div>
            </div>
            
            {/* Notificações */}
            <div className="relative">
              <button className="p-1.5 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors relative">
                <i className="fas fa-bell text-muted-foreground text-sm"></i>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                  3
                </span>
              </button>
            </div>
          </div>
          </header>}
        
        <div className={`content-area flex-1 ${user ? 'pt-16' : ''}`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Index />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/metas" element={<Metas />} />
            <Route path="/metas-loja" element={<MetasLojaPage />} />
            <Route path="/campanhas" element={<Campanhas />} />
            <Route path="/graficos" element={<Graficos />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/participacao" element={<Participacao />} />
            
            <Route path="/escala" element={<Escala />} />
            <Route path="/escala-consolidada" element={<EscalaConsolidada />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/usuarios/editar/:id" element={<EditarUsuario />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>;
}
const App = () => <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <PeriodProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </PeriodProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>;
export default App;