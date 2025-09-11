import { useColaboradoresProgress } from "@/hooks/useColaboradoresProgress";
import { useDailyProgress } from "@/hooks/useDailyProgress";
import { useAuth } from "@/hooks/useAuth";
import { usePeriodContext } from "@/contexts/PeriodContext";
import { MetricCard } from "./MetricCard";

export function ProgressoIndividual() {
  const { user } = useAuth();
  const { selectedPeriod } = usePeriodContext();
  const { colaboradores, loading } = useColaboradoresProgress(user, selectedPeriod);

  // Verificar se é um tipo de usuário que deve mostrar dados individuais
  const shouldShowIndividualData = ['auxiliar', 'sublider', 'subgerente', 'consultora'].includes(user?.tipo || '');
  
  if (!shouldShowIndividualData || loading || !colaboradores || colaboradores.length === 0) {
    return null;
  }

  // Pegar os dados do próprio usuário
  const meusDados = colaboradores.find(c => c.id === user?.id);
  if (!meusDados) return null;

  const getCategoriesForUser = (tipo: string) => {
    switch (tipo) {
      case 'consultora':
        return ['perfumaria_alta', 'dermocosmetico', 'goodlife'];
      default:
        return ['geral', 'generico_similar', 'goodlife'];
    }
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      geral: 'Minhas Vendas - Geral',
      generico_similar: 'Minhas Vendas - Genérico/Similar',
      goodlife: 'Minhas Vendas - GoodLife',
      perfumaria_alta: 'Minhas Vendas - Perfumaria Alta',
      dermocosmetico: 'Minhas Vendas - Dermocosméticos'
    };
    return names[category] || category;
  };

  const getCategoryMapping = (cat: string): 'geral' | 'rentavel' | 'perfumaria' | 'conveniencia' | 'goodlife' => {
    const mapping: Record<string, 'geral' | 'rentavel' | 'perfumaria' | 'conveniencia' | 'goodlife'> = {
      geral: 'geral',
      generico_similar: 'rentavel',
      goodlife: 'goodlife',
      perfumaria_alta: 'perfumaria',
      dermocosmetico: 'perfumaria'
    };
    return mapping[cat] || 'geral';
  };

  const categories = getCategoriesForUser(meusDados.tipo);
  const metricsIndividuais = categories.map(category => {
    const meta = meusDados.metas[category as keyof typeof meusDados.metas];
    const venda = meusDados.vendas[category as keyof typeof meusDados.vendas];
    const progresso = meusDados.progresso[category as keyof typeof meusDados.progresso];

    if (!meta) return null;

    return {
      category,
      meta,
      venda,
      progresso: progresso || 0,
      colaboradorId: meusDados.id
    };
  }).filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <i className="fas fa-user text-lg text-blue-600"></i>
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Meu Progresso Individual</h3>
          <p className="text-sm text-muted-foreground">Acompanhe suas vendas e metas pessoais</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricsIndividuais.map((metric) => {
          if (!metric) return null;
          
          return (
            <MetricCardIndividual
              key={metric.category}
              category={metric.category}
              meta={metric.meta}
              venda={metric.venda}
              progresso={metric.progresso}
              colaboradorId={metric.colaboradorId}
              selectedPeriod={selectedPeriod}
              getCategoryName={getCategoryName}
              getCategoryMapping={getCategoryMapping}
            />
          );
        })}
      </div>
    </div>
  );
}

interface MetricCardIndividualProps {
  category: string;
  meta: number;
  venda: number;
  progresso: number;
  colaboradorId: number;
  selectedPeriod: any;
  getCategoryName: (category: string) => string;
  getCategoryMapping: (category: string) => 'geral' | 'rentavel' | 'perfumaria' | 'conveniencia' | 'goodlife';
}

function MetricCardIndividual({ 
  category, 
  meta, 
  venda, 
  progresso, 
  colaboradorId, 
  selectedPeriod,
  getCategoryName,
  getCategoryMapping 
}: MetricCardIndividualProps) {
  const { user } = useAuth();
  const { dailyData, loading } = useDailyProgress(user, selectedPeriod, category, meta, colaboradorId);

  // Status baseado no progresso
  let status: 'pendente' | 'atingido' | 'acima' = 'pendente';
  if (progresso >= 110) status = 'acima';
  else if (progresso >= 100) status = 'atingido';

  return (
    <MetricCard
      title={getCategoryName(category)}
      todaySales={dailyData ? `R$ ${dailyData.vendaHoje.toFixed(2).replace('.', ',')}` : `R$ 0,00`}
      periodSales={`R$ ${venda.toFixed(2).replace('.', ',')}`}
      target={`R$ ${meta.toFixed(2).replace('.', ',')}`}
      dailyTarget={dailyData ? `R$ ${dailyData.metaDiaria.toFixed(2).replace('.', ',')}` : `R$ 0,00`}
      missingToday={dailyData && dailyData.faltaHoje > 0 ? `R$ ${dailyData.faltaHoje.toFixed(2).replace('.', ',')}` : `R$ 0,00`}
      remainingDays={dailyData ? dailyData.diasRestantes : 0}
      category={getCategoryMapping(category)}
      status={status}
      className="h-full transition-all duration-300 hover:scale-[1.02]"
    />
  );
}