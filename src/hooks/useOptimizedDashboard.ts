import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from './useAuth';
import { type PeriodOption } from '@/contexts/PeriodContext';
import { useCallfarmaAPI } from './useCallfarmaAPI';

// Função auxiliar para contar domingos entre duas datas (incluindo ambas)
function contarDomingos(dataInicio: Date, dataFim: Date): number {
  let count = 0;
  const current = new Date(dataInicio);
  
  while (current <= dataFim) {
    if (current.getDay() === 0) { // Domingo = 0
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

export interface MetricData {
  title: string;
  todaySales: string;
  periodSales: string;
  target: string;
  dailyTarget: string;
  missingToday: string;
  remainingDays: number;
  category: 'geral' | 'rentavel' | 'perfumaria' | 'conveniencia' | 'goodlife';
  status: 'pendente' | 'atingido' | 'acima';
}

export function useOptimizedDashboard(user: User | null, selectedPeriod?: PeriodOption | null, selectedLojaId?: number | null) {
  const { buscarTodasVendasConsolidadas, buscarVendasHojePorCategoria } = useCallfarmaAPI();
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 HOOK SUPER OTIMIZADO - Iniciando busca consolidada...');
    
    if (!user || !selectedPeriod) {
      console.log('❌ Dados insuficientes - user:', !!user, 'selectedPeriod:', !!selectedPeriod);
      setLoading(false);
      return;
    }

    // Usar selectedLojaId se fornecido, senão usar loja do usuário
    const currentLojaId = selectedLojaId || user.loja_id;
    console.log('🏪 Loja atual:', currentLojaId);

    const fetchOptimizedDashboardData = async () => {
      try {
        setLoading(true);
        console.log('🚀 SUPER OTIMIZAÇÃO: Apenas 4 requisições para TODOS os dados!');
        
        // Buscar informações da loja para obter o CDFIL
        const { data: lojaInfo } = await supabase
          .from('lojas')
          .select('regiao, numero')
          .eq('id', currentLojaId)
          .single();

        if (!lojaInfo?.numero) {
          console.error('❌ CDFIL (numero) da loja não encontrado para loja_id:', currentLojaId);
          return;
        }

        const cdfil = Number(lojaInfo.numero);
        console.log('🏪 CDFIL da loja obtido:', cdfil);

        // Ajustar para horário de Brasília (UTC-3)
        const agora = new Date();
        const brasiliaOffset = -3 * 60; // -3 horas em minutos
        const hojeNoBrasil = new Date(agora.getTime() + (brasiliaOffset * 60 * 1000));
        const ontemNoBrasil = new Date(hojeNoBrasil);
        ontemNoBrasil.setDate(hojeNoBrasil.getDate() - 1);
        
        const hojeStr = hojeNoBrasil.toISOString().split('T')[0];
        const ontemStr = ontemNoBrasil.toISOString().split('T')[0];
        const dataInicioStr = selectedPeriod.startDate.toISOString().split('T')[0];
        const dataFimStr = selectedPeriod.endDate.toISOString().split('T')[0];

        console.log('📅 Datas:', { hojeStr, ontemStr, dataInicioStr, dataFimStr });

        // 🚀 APENAS 4 REQUISIÇÕES EM PARALELO para TODOS os dados necessários!
        const [metasLoja, vendasPeriodo, vendasAteOntem, vendasHoje] = await Promise.all([
          // 1. Metas da loja
          supabase
            .from('metas_loja')
            .select('*, metas_loja_categorias(*)')
            .eq('loja_id', currentLojaId)
            .eq('periodo_meta_id', selectedPeriod.id),
          
          // 2. Vendas do período consolidadas
          buscarTodasVendasConsolidadas(dataInicioStr, dataFimStr, currentLojaId),
          
          // 3. Vendas até ontem consolidadas
          buscarTodasVendasConsolidadas(dataInicioStr, ontemStr, currentLojaId),
          
          // 4. Vendas de hoje
          buscarVendasHojePorCategoria(cdfil, hojeStr)
        ]);

        console.log('📊 Dados recebidos:', {
          metas: metasLoja.data?.length || 0,
          vendasPeriodo: Object.values(vendasPeriodo).flat().length,
          vendasAteOntem: Object.values(vendasAteOntem).flat().length,
          vendasHoje
        });

        // Calcular dias restantes no período (incluindo hoje)
        let diasRestantes = Math.max(1, Math.ceil((selectedPeriod.endDate.getTime() - hojeNoBrasil.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        
        // Se a loja é da região 'centro', descontar domingos dos dias restantes
        if (lojaInfo?.regiao === 'centro') {
          const domingosRestantes = contarDomingos(hojeNoBrasil, selectedPeriod.endDate);
          diasRestantes = Math.max(1, diasRestantes - domingosRestantes);
        }

        // Função para somar vendas de um array de dados consolidados
        const somarVendas = (dados: any[]) => {
          return dados.reduce((sum, item) => sum + (item.VALOR_LIQUIDO || 0), 0);
        };

        // Processar dados para métricas
        const processedMetrics: MetricData[] = [];

        // Categorias de metas para loja
        const categorias = [
          { id: 'geral', name: 'Geral', apiKey: 'geral' },
          { id: 'r_mais', name: 'Rentáveis', apiKey: 'rentaveis' },
          { id: 'perfumaria_r_mais', name: 'Perfumaria R+', apiKey: 'perfumaria' },
          { id: 'conveniencia_r_mais', name: 'Conveniência R+', apiKey: 'conveniencia' },
          { id: 'saude', name: 'GoodLife', apiKey: 'goodlife' }
        ];

        for (const categoria of categorias) {
          let metaValor = 0;
          
          if (categoria.id === 'geral') {
            // Para categoria geral, usar meta_valor_total da metas_loja
            metaValor = metasLoja.data?.[0]?.meta_valor_total || 0;
          } else {
            // Para outras categorias, buscar na metas_loja_categorias
            const metaCategoria = metasLoja.data?.[0]?.metas_loja_categorias?.find(
              (m: any) => m.categoria === categoria.id
            );
            metaValor = metaCategoria?.meta_valor || 0;
          }

          // Obter vendas consolidadas usando os dados já buscados
          const totalVendidoPeriodo = somarVendas(vendasPeriodo[categoria.apiKey as keyof typeof vendasPeriodo] || []);
          const totalVendidoAteOntem = somarVendas(vendasAteOntem[categoria.apiKey as keyof typeof vendasAteOntem] || []);
          const totalVendidoHoje = vendasHoje[categoria.apiKey as keyof typeof vendasHoje] || 0;
          
          console.log(`💼 ${categoria.name}: Hoje=${totalVendidoHoje.toFixed(2)}, Período=${totalVendidoPeriodo.toFixed(2)}, Meta=${metaValor.toFixed(2)}`);
          
          // Calcular meta diária baseada no que faltava até ontem
          const faltanteAteOntem = Math.max(0, metaValor - totalVendidoAteOntem);
          const metaDiaria = faltanteAteOntem > 0 ? faltanteAteOntem / diasRestantes : 0;
          
          // Calcular quanto falta hoje
          const faltanteHoje = Math.max(0, metaDiaria - totalVendidoHoje);
          
          let status: 'pendente' | 'atingido' | 'acima' = 'pendente';
          if (totalVendidoHoje >= metaDiaria && metaDiaria > 0) {
            status = totalVendidoHoje > metaDiaria ? 'acima' : 'atingido';
          }

          processedMetrics.push({
            title: categoria.name,
            todaySales: `R$ ${totalVendidoHoje.toFixed(2).replace('.', ',')}`,
            periodSales: `R$ ${totalVendidoPeriodo.toFixed(2).replace('.', ',')}`,
            target: `R$ ${metaValor.toFixed(2).replace('.', ',')}`,
            dailyTarget: `R$ ${metaDiaria.toFixed(2).replace('.', ',')}`,
            missingToday: `R$ ${faltanteHoje.toFixed(2).replace('.', ',')}`,
            remainingDays: diasRestantes,
            category: categoria.id === 'r_mais' ? 'rentavel' : 
                     categoria.id === 'perfumaria_r_mais' ? 'perfumaria' :
                     categoria.id === 'conveniencia_r_mais' ? 'conveniencia' :
                     categoria.id === 'saude' ? 'goodlife' : 'geral',
            status
          });
        }

        setMetrics(processedMetrics);
        console.log('✅ Dashboard SUPER OTIMIZADO carregado com sucesso!');
        
      } catch (error) {
        console.error('❌ Erro ao buscar dados otimizados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOptimizedDashboardData();
  }, [user, selectedPeriod, selectedLojaId]);

  return { metrics, loading };
}