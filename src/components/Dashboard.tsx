import { MetricCard } from "./MetricCard";
import { PeriodSelector } from "./PeriodSelector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import { ProgressoIndividual } from "./ProgressoIndividual";
import { usePeriodContext } from "@/contexts/PeriodContext";
import { Navigate } from "react-router-dom";
import { getDescricaoTipoUsuario } from "@/utils/userTypes";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { ColaboradoresProgress } from "./ColaboradoresProgress";
import { ShareButton } from "./ShareButton";
import { StoreSelector } from "./StoreSelector";
import { useUserAvatar } from "@/hooks/useUserAvatar";

function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const { selectedPeriod } = usePeriodContext();
  const { avatarUrl } = useUserAvatar();
  const [lojaInfo, setLojaInfo] = useState<{ numero: string; nome: string } | null>(null);
  const [selectedLojaId, setSelectedLojaId] = useState<number | null>(null);
  const { metrics, loading } = useDashboardData(user, selectedPeriod, selectedLojaId);

  // Verificar se é um tipo de usuário que deve mostrar dados individuais
  const shouldShowIndividualData = ['auxiliar', 'sublider', 'subgerente', 'consultora'].includes(user?.tipo || '');
  
  // Verificar se é um tipo de usuário que deve ver o seletor de lojas
  const shouldShowStoreSelector = ['admin', 'supervisor', 'rh'].includes(user?.tipo || '');

  useEffect(() => {
    if (user?.loja_id) {
      fetchLojaInfo();
    }
  }, [user?.loja_id]);

  const fetchLojaInfo = async () => {
    if (!user?.loja_id) return;
    
    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('numero, nome')
        .eq('id', user.loja_id)
        .single();

      if (error) throw error;
      setLojaInfo(data);
    } catch (error) {
      console.error('Erro ao buscar informações da loja:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
            <span className="text-lg font-medium text-foreground">Carregando...</span>
          </div>
          <p className="text-muted-foreground">Aguarde enquanto carregamos seus dados</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="page-container-full space-y-4 sm:space-y-6 bg-background min-h-screen">
      {/* Clean Hero Section */}
      <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-card border border-border p-3 sm:p-4 md:p-6 shadow-sm">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1">
              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex-shrink-0">
                {avatarUrl ? (
                  <AvatarImage 
                    src={avatarUrl} 
                    alt={`Avatar de ${user.nome}`}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="text-sm sm:text-lg md:text-xl font-bold bg-gray-900 text-white">
                  {user.nome.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Olá, {user.nome}!</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {lojaInfo ? `${lojaInfo.numero} - ${lojaInfo.nome}` : `Loja ${user.loja_id}`} • {getDescricaoTipoUsuario(user.tipo || '')}
                </p>
                {/* Mostrar descrição completa apenas no desktop */}
                <div className="hidden lg:block">
                  <p className="text-base text-muted-foreground">
                    Acompanhe suas metas, vendas e performance em tempo real
                  </p>
                </div>
                {selectedPeriod && (
                  <span className="block text-xs text-muted-foreground/70">
                    Período: {selectedPeriod.label}
                  </span>
                )}
              </div>
            </div>
            
            {/* Controles no lado direito em desktop, embaixo em mobile */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
              <PeriodSelector />
              <div className="flex gap-2">
                <Button variant="outline" className="border-border hover:bg-muted flex-1 sm:flex-none text-xs sm:text-sm">
                  <i className="fas fa-chart-line mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">Relatórios</span>
                  <span className="sm:hidden">Charts</span>
                </Button>
                <Button variant="default" className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none text-xs sm:text-sm">
                  <i className="fas fa-trophy mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">Premiações</span>
                  <span className="sm:hidden">Prêmios</span>
                </Button>
                <ShareButton 
                  metrics={metrics} 
                  lojaInfo={lojaInfo} 
                  selectedPeriod={selectedPeriod}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progresso Individual - Mostrar primeiro para alguns tipos de usuário */}
      {shouldShowIndividualData && <ProgressoIndividual />}

      {/* Metrics Grid - Métricas da Loja */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-store text-sm sm:text-lg text-green-600"></i>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">Métricas da Loja</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Performance geral da {lojaInfo?.nome || 'loja'}</p>
            </div>
          </div>
          {shouldShowStoreSelector && (
            <StoreSelector
              selectedLojaId={selectedLojaId}
              onLojaChange={setSelectedLojaId}
              userLojaId={user?.loja_id}
            />
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12 sm:py-20">
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="relative">
                  <i className="fas fa-spinner fa-spin text-3xl sm:text-4xl text-primary"></i>
                  <div className="absolute inset-0 animate-ping">
                    <i className="fas fa-circle text-primary/20 text-3xl sm:text-4xl"></i>
                  </div>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">Carregando dados...</h3>
                  <p className="text-sm text-muted-foreground">Aguarde enquanto buscamos suas métricas</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:gap-4">
              {metrics.map((metric, index) => (
                <div key={index} className="group">
                <MetricCard
                  title={metric.title}
                  todaySales={metric.todaySales}
                  periodSales={metric.periodSales}
                  target={metric.target}
                  dailyTarget={metric.dailyTarget}
                  missingToday={metric.missingToday}
                  remainingDays={metric.remainingDays}
                  category={metric.category}
                  status={metric.status}
                  className="h-full transition-all duration-300 hover:scale-[1.02]"
                />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Colaboradores Progress Section */}
      <ColaboradoresProgress />
    </div>
  );
}

export function Dashboard() {
  return <DashboardContent />;
}