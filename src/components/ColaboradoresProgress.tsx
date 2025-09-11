import { useColaboradoresProgress, ColaboradorProgress } from "@/hooks/useColaboradoresProgress";
import { useDailyProgress } from "@/hooks/useDailyProgress";
import { useAuth } from "@/hooks/useAuth";
import { usePeriodContext, PeriodOption } from "@/contexts/PeriodContext";
import { getDescricaoTipoUsuario } from "@/utils/userTypes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

interface MetaCategoryCardProps {
  category: string;
  meta: number;
  venda: number;
  progresso: number;
  status: { color: string; bg: string; border: string };
  colaborador: ColaboradorProgress;
  selectedPeriod: PeriodOption | null;
  getCategoryIcon: (category: string) => string;
  getCategoryIconColor: (category: string) => string;
  getCategoryName: (category: string) => string;
}

function MetaCategoryCard({ 
  category, 
  meta, 
  venda, 
  progresso, 
  status, 
  colaborador, 
  selectedPeriod,
  getCategoryIcon,
  getCategoryIconColor,
  getCategoryName 
}: MetaCategoryCardProps) {
  const { user } = useAuth();
  const { dailyData, loading } = useDailyProgress(user, selectedPeriod, category, meta, colaborador.id);
  const isMobile = useIsMobile();

  // Função para determinar a cor baseada na comparação de valores
  const getValueComparisonColor = (firstValue: number, secondValue: number) => {
    const difference = firstValue - secondValue;
    if (difference > 10) return 'text-green-600'; // Verde se muito acima
    if (difference >= -5) return 'text-yellow-600'; // Amarelo se próximo
    return 'text-red-600'; // Vermelho se abaixo
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className={`${getCategoryIcon(category)} text-sm ${getCategoryIconColor(category)}`}></i>
          <span className="text-xs font-medium text-gray-700 truncate">
            {getCategoryName(category)}
          </span>
        </div>
        <div className={`px-2 md:px-3 py-1 md:py-2 rounded-full ${status.bg} ${status.border} border`}>
          <span className={`text-xs md:text-sm font-bold ${
            !loading && dailyData 
              ? getValueComparisonColor(progresso, dailyData.porcentagemTempoDecorrido)
              : status.color
          }`}>
            {progresso.toFixed(0)}
            {!loading && dailyData && (
              <>
                /<span className="text-xs opacity-75">{dailyData.porcentagemTempoDecorrido.toFixed(0)}</span>
              </>
            )}%
          </span>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>
          R$ {venda.toFixed(2).replace('.', ',')} / R$ {meta.toFixed(2).replace('.', ',')}
        </div>
        <div className="relative">
          <Progress 
            value={progresso} 
            className={`${isMobile ? 'h-3' : 'h-4'} ${
              !loading && dailyData 
                ? (() => {
                    const difference = progresso - dailyData.porcentagemTempoDecorrido;
                    if (difference > 10) return 'bg-gray-200 [&>div]:bg-green-500'; // Verde se muito acima
                    if (difference >= -5) return 'bg-gray-200 [&>div]:bg-yellow-500'; // Amarelo se próximo
                    return 'bg-gray-200 [&>div]:bg-red-500'; // Vermelho se abaixo
                  })()
                : 'bg-gray-200 [&>div]:bg-blue-500' // Azul padrão quando não há dados de comparação
            }`}
          />
          {/* Linha indicadora do tempo decorrido */}
          {!loading && dailyData && (
            <div 
              className={`absolute top-0 ${isMobile ? 'h-3' : 'h-4'} w-0.5 bg-gray-600 opacity-75 z-10`}
              style={{ left: `${Math.min(dailyData.porcentagemTempoDecorrido, 100)}%` }}
              title={`Tempo decorrido: ${dailyData.porcentagemTempoDecorrido.toFixed(0)}%`}
            />
          )}
        </div>
      </div>

      {/* Dados diários */}
      {!loading && dailyData && (
        <div className={`mt-2 ${isMobile ? 'p-2' : 'p-3'} bg-gray-100 rounded-lg space-y-${isMobile ? '1' : '2'}`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-${isMobile ? '1' : '2'} ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <i className="fas fa-calendar-day text-blue-500"></i>
              <span className="font-medium text-gray-700">Meta Diária:</span>
              <span className={`text-gray-900 font-bold ${isMobile ? 'text-sm' : 'text-base'}`}>R$ {dailyData.metaDiaria.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-${isMobile ? '1' : '2'} ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <i className="fas fa-chart-line text-green-500"></i>
              <span className="font-medium text-gray-700">Hoje:</span>
              <span className={`text-gray-900 font-bold ${isMobile ? 'text-sm' : 'text-base'}`}>R$ {dailyData.vendaHoje.toFixed(2)}</span>
            </div>
            {dailyData.vendaHoje >= dailyData.metaDiaria && (
              <div className={`flex items-center gap-1 ${isMobile ? 'px-1 py-0.5' : 'px-2 py-1'} bg-green-100 rounded-full`}>
                <i className="fas fa-check text-green-600 text-xs"></i>
                <span className="text-green-700 text-xs font-semibold">Meta atingida!</span>
              </div>
            )}
          </div>
          
          {dailyData.faltaHoje > 0 && (
            <div className={`flex items-center gap-${isMobile ? '1' : '2'} ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <i className="fas fa-exclamation-triangle text-orange-500"></i>
              <span className="font-medium text-gray-700">Falta:</span>
              <span className={`text-gray-900 font-bold ${isMobile ? 'text-sm' : 'text-base'}`}>R$ {dailyData.faltaHoje.toFixed(2)}</span>
            </div>
          )}
          
          <div className={`flex items-center gap-${isMobile ? '1' : '2'} ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <i className="fas fa-clock text-purple-500"></i>
            <span className="font-medium text-gray-700">Dias restantes:</span>
            <span className={`text-gray-900 font-bold ${isMobile ? 'text-sm' : 'text-base'}`}>{dailyData.diasRestantes}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ColaboradoresProgress() {
  const { user } = useAuth();
  const { selectedPeriod } = usePeriodContext();
  const { colaboradores, loading, shouldShowTeamData, showOnlyOwnData } = useColaboradoresProgress(user, selectedPeriod);
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-border p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
            <i className="fas fa-users text-xl text-gray-400 animate-pulse"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Progresso da Equipe</h3>
            <p className="text-sm text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-50 rounded-lg h-32 border border-gray-100"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!colaboradores || colaboradores.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-border p-6 shadow-sm text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <i className="fas fa-users-slash text-xl text-gray-400"></i>
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          {showOnlyOwnData ? 'Sem Metas Definidas' : 'Nenhum Colaborador com Metas'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {showOnlyOwnData 
            ? 'Você ainda não possui metas definidas para este período'
            : 'Nenhum colaborador da equipe possui metas definidas'
          }
        </p>
      </div>
    );
  }

  const getCategoriesForUser = (tipo: string) => {
    switch (tipo) {
      case 'consultora':
        return ['perfumaria_alta', 'dermocosmetico', 'goodlife'];
      case 'lider':
      case 'gerente':
      case 'sublider':
      case 'subgerente':
      case 'auxiliar':
      case 'farmaceutico':
      default:
        return ['geral', 'generico_similar', 'goodlife'];
    }
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      geral: 'Geral',
      generico_similar: 'Genérico/Similar',
      goodlife: 'GoodLife',
      perfumaria_alta: 'Perfumaria Alta',
      dermocosmetico: 'Dermocosméticos'
    };
    return names[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      geral: 'fas fa-store',
      generico_similar: 'fas fa-pills',
      goodlife: 'fas fa-heartbeat',
      perfumaria_alta: 'fas fa-spray-can',
      dermocosmetico: 'fas fa-spa'
    };
    return icons[category] || 'fas fa-tag';
  };

  const getCategoryIconColor = (category: string) => {
    const colors: Record<string, string> = {
      geral: 'text-blue-500',
      generico_similar: 'text-green-500',
      goodlife: 'text-red-500',
      perfumaria_alta: 'text-purple-500',
      dermocosmetico: 'text-pink-500'
    };
    return colors[category] || 'text-gray-500';
  };

  const getProgressStatus = (progress: number) => {
    if (progress >= 100) return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (progress >= 75) return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (progress >= 50) return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  };

  return (
    <div className="rounded-2xl bg-white border border-border shadow-sm">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-users text-xl text-gray-600"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {showOnlyOwnData ? 'Meu Progresso' : 'Progresso da Equipe'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {colaboradores.length} colaborador{colaboradores.length > 1 ? 'es' : ''} com metas
              </p>
            </div>
          </div>
          <Badge variant="outline" className="hidden md:flex">
            <i className="fas fa-calendar-alt mr-1 text-xs"></i>
            {selectedPeriod?.label}
          </Badge>
        </div>
      </div>

      <div className="p-3 md:p-6">
        <div className="space-y-4 md:space-y-6">
          {colaboradores.map((colaborador) => {
            const categories = getCategoriesForUser(colaborador.tipo);
            
            return (
              <div 
                key={colaborador.id} 
                className="bg-white rounded-lg md:rounded-xl border border-gray-200 p-3 md:p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200"
              >
                {/* Header do colaborador - Título */}
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-100">
                  <Avatar className="w-10 h-10 md:w-12 md:h-12 border border-gray-200">
                    <AvatarFallback className="text-sm md:text-base font-semibold bg-gray-900 text-white">
                      {colaborador.nome.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-bold text-foreground truncate">
                      {colaborador.nome}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      {getDescricaoTipoUsuario(colaborador.tipo)}
                    </p>
                  </div>
                </div>

                {/* Cards das Metas */}
                <div className={`${
                  isMobile 
                    ? 'space-y-3' 
                    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                }`}>
                  {categories.map(category => {
                    const meta = colaborador.metas[category as keyof typeof colaborador.metas];
                    const venda = colaborador.vendas[category as keyof typeof colaborador.vendas];
                    const progresso = colaborador.progresso[category as keyof typeof colaborador.progresso];

                    if (!meta) return null;

                    const status = getProgressStatus(progresso || 0);

                    return (
                      <div key={category} className={`${isMobile ? 'p-3 bg-gray-50 rounded-lg border border-gray-100' : 'p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors'}`}>
                        <MetaCategoryCard
                          category={category}
                          meta={meta}
                          venda={venda}
                          progresso={progresso || 0}
                          status={status}
                          colaborador={colaborador}
                          selectedPeriod={selectedPeriod}
                          getCategoryIcon={getCategoryIcon}
                          getCategoryIconColor={getCategoryIconColor}
                          getCategoryName={getCategoryName}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}