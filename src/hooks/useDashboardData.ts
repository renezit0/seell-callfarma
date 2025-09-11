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

export function useDashboardData(user: User | null, selectedPeriod?: PeriodOption | null, selectedLojaId?: number | null) {
  const { buscarVendasHojePorCategoria } = useCallfarmaAPI();
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 DASHBOARD DATA - Iniciando...');
    console.log('🔍 useDashboardData - user:', user?.nome, 'user.loja_id:', user?.loja_id, 'selectedPeriod:', selectedPeriod?.label, 'selectedLojaId:', selectedLojaId);
    
    if (!user || !selectedPeriod) {
      console.log('❌ Dados insuficientes - user:', !!user, 'selectedPeriod:', !!selectedPeriod);
      setLoading(false);
      return;
    }

    // Usar selectedLojaId se fornecido, senão usar loja do usuário
    const currentLojaId = selectedLojaId || user.loja_id;
    console.log('🏪 LOJA SENDO USADA PARA FILTRAR:', currentLojaId, 'selectedLojaId:', selectedLojaId, 'user.loja_id:', user.loja_id);

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('🚀 Iniciando busca de dados do dashboard...');
        
        // Buscar metas da loja atual para o período selecionado
        console.log('📊 Buscando metas para loja_id:', currentLojaId, 'periodo_meta_id:', selectedPeriod.id);
        const { data: metasLoja, error: errorMetas } = await supabase
          .from('metas_loja')
          .select('*, metas_loja_categorias(*)')
          .eq('loja_id', currentLojaId)
          .eq('periodo_meta_id', selectedPeriod.id);

        console.log('📊 Metas encontradas:', metasLoja?.length, 'para loja_id:', currentLojaId, errorMetas ? 'ERRO:' + errorMetas.message : '', metasLoja);

        // Buscar vendas da loja atual no período selecionado
        console.log('💰 Buscando vendas_loja para loja_id:', currentLojaId, 'período:', selectedPeriod.startDate.toISOString().split('T')[0], 'até', selectedPeriod.endDate.toISOString().split('T')[0]);
        const { data: vendasLoja, error: errorVendas } = await supabase
          .from('vendas_loja')
          .select('*')
          .eq('loja_id', currentLojaId)
          .gte('data_venda', selectedPeriod.startDate.toISOString().split('T')[0])
          .lte('data_venda', selectedPeriod.endDate.toISOString().split('T')[0]);

        console.log('💰 Vendas período encontradas:', vendasLoja?.length, 'para loja_id:', currentLojaId, errorVendas ? 'ERRO:' + errorVendas.message : '', 'primeiros 3:', vendasLoja?.slice(0, 3));

        // Buscar vendas até ontem (para cálculo da meta diária) - considerando fuso horário de Brasília
        const agora = new Date();
        // Ajustar para horário de Brasília (UTC-3)
        const brasiliaOffset = -3 * 60; // -3 horas em minutos
        const hojeNoBrasil = new Date(agora.getTime() + (brasiliaOffset * 60 * 1000));
        
        const ontemNoBrasil = new Date(hojeNoBrasil);
        ontemNoBrasil.setDate(hojeNoBrasil.getDate() - 1);
        
        const ontemStr = ontemNoBrasil.toISOString().split('T')[0];
        console.log('📅 Data ontem (Brasília):', ontemStr);
        
        const { data: vendasAteOntem, error: errorVendasOntem } = await supabase
          .from('vendas_loja')
          .select('*')
          .eq('loja_id', currentLojaId)
          .gte('data_venda', selectedPeriod.startDate.toISOString().split('T')[0])
          .lte('data_venda', ontemStr);

        console.log('📈 Vendas até ontem:', vendasAteOntem?.length, errorVendasOntem ? 'ERRO:' + errorVendasOntem.message : '');

         // Buscar informações da loja para obter o CDFIL (numero) para filtrar na API externa
         const { data: lojaInfo } = await supabase
           .from('lojas')
           .select('regiao, numero')
           .eq('id', currentLojaId)
           .single();

         if (!lojaInfo?.numero) {
           console.error('❌ CDFIL (numero) da loja não encontrado para loja_id:', currentLojaId);
           return;
         }

         const cdfil = lojaInfo.numero;
         console.log('🏪 CDFIL da loja obtido:', cdfil);

         // Buscar vendas do dia atual via API externa
         const hojeStr = hojeNoBrasil.toISOString().split('T')[0];
         console.log('📅 Data hoje (Brasília):', hojeStr);
         
         // 🚀 OTIMIZADO: Buscar vendas de hoje consolidadas em APENAS 2 requisições!
         console.log('🔍 Buscando vendas de hoje CONSOLIDADAS via API externa para CDFIL:', cdfil);
         const vendasHojeApiExterna = await buscarVendasHojePorCategoria(Number(cdfil), hojeStr);
         console.log('🎯 Vendas de HOJE da API externa para CDFIL', cdfil, ':', vendasHojeApiExterna);

        // Calcular dias restantes no período (incluindo hoje) - considerando fuso horário de Brasília
        let diasRestantes = Math.max(1, Math.ceil((selectedPeriod.endDate.getTime() - hojeNoBrasil.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        
        // Se a loja é da região 'centro', descontar domingos dos dias restantes
        if (lojaInfo?.regiao === 'centro') {
          const domingosRestantes = contarDomingos(hojeNoBrasil, selectedPeriod.endDate);
          diasRestantes = Math.max(1, diasRestantes - domingosRestantes);
        }

        // Processar dados para métricas
        const processedMetrics: MetricData[] = [];

        // Categorias de metas para loja (conforme esclarecimento)
        const categorias = [
          { id: 'geral', name: 'Geral' },
          { id: 'r_mais', name: 'Rentáveis' },
          { id: 'perfumaria_r_mais', name: 'Perfumaria R+' },
          { id: 'conveniencia_r_mais', name: 'Conveniência R+' },
          { id: 'saude', name: 'GoodLife' }
        ];

        for (const categoria of categorias) {
          let metaValor = 0;
          
          if (categoria.id === 'geral') {
            // Para categoria geral, usar meta_valor_total da metas_loja
            metaValor = metasLoja?.[0]?.meta_valor_total || 0;
          } else {
            // Para outras categorias, buscar na metas_loja_categorias
            const metaCategoria = metasLoja?.[0]?.metas_loja_categorias?.find(
              (m: any) => m.categoria === categoria.id
            );
            metaValor = metaCategoria?.meta_valor || 0;
          }

          // Filtrar vendas da categoria para o período
          let vendasCategoria;
          if (categoria.id === 'r_mais') {
            vendasCategoria = vendasLoja?.filter(
              (v: any) => v.categoria === 'r_mais' || v.categoria === 'rentaveis20' || v.categoria === 'rentaveis25'
            ) || [];
          } else if (categoria.id === 'conveniencia_r_mais') {
            vendasCategoria = vendasLoja?.filter(
              (v: any) => v.categoria === 'conveniencia_r_mais' || v.categoria === 'conveniencia' || v.categoria === 'brinquedo'
            ) || [];
          } else if (categoria.id === 'saude') {
            vendasCategoria = vendasLoja?.filter(
              (v: any) => v.categoria === 'saude' || v.categoria === 'goodlife'
            ) || [];
          } else {
            vendasCategoria = vendasLoja?.filter(
              (v: any) => v.categoria === categoria.id
            ) || [];
          }

          // Filtrar vendas da categoria até ontem (para cálculo da meta diária)
          let vendasCategoriaAteOntem;
          if (categoria.id === 'r_mais') {
            vendasCategoriaAteOntem = vendasAteOntem?.filter(
              (v: any) => v.categoria === 'r_mais' || v.categoria === 'rentaveis20' || v.categoria === 'rentaveis25'
            ) || [];
          } else if (categoria.id === 'conveniencia_r_mais') {
            vendasCategoriaAteOntem = vendasAteOntem?.filter(
              (v: any) => v.categoria === 'conveniencia_r_mais' || v.categoria === 'conveniencia' || v.categoria === 'brinquedo'
            ) || [];
          } else if (categoria.id === 'saude') {
            vendasCategoriaAteOntem = vendasAteOntem?.filter(
              (v: any) => v.categoria === 'saude' || v.categoria === 'goodlife'
            ) || [];
          } else {
            vendasCategoriaAteOntem = vendasAteOntem?.filter(
              (v: any) => v.categoria === categoria.id
            ) || [];
          }

           // Obter vendas da categoria para hoje usando dados da API externa
           let totalVendidoHoje = 0;
           
           if (categoria.id === 'r_mais') {
             totalVendidoHoje = vendasHojeApiExterna.rentaveis;
           } else if (categoria.id === 'conveniencia_r_mais') {
             totalVendidoHoje = vendasHojeApiExterna.conveniencia;
           } else if (categoria.id === 'perfumaria_r_mais') {
             totalVendidoHoje = vendasHojeApiExterna.perfumaria;
           } else if (categoria.id === 'saude') {
             totalVendidoHoje = vendasHojeApiExterna.goodlife;
           } else if (categoria.id === 'geral') {
             totalVendidoHoje = vendasHojeApiExterna.geral;
           }
           
           console.log(`💼 ${categoria.name}: Hoje via API Externa = R$ ${totalVendidoHoje.toFixed(2)}`);
           
            const totalVendidoPeriodo = vendasCategoria.reduce((sum: number, v: any) => sum + Number(v.valor_venda), 0);
            const totalVendidoAteOntem = vendasCategoriaAteOntem.reduce((sum: number, v: any) => sum + Number(v.valor_venda), 0);
           
           console.log(`💼 ${categoria.name}: Hoje=${totalVendidoHoje.toFixed(2)} (API Externa), Período=${totalVendidoPeriodo.toFixed(2)} (${vendasCategoria.length} vendas), Meta=${metaValor.toFixed(2)}`);
          
          // Calcular meta diária baseada no que faltava até ontem (não incluindo vendas de hoje)
          const faltanteAteOntem = Math.max(0, metaValor - totalVendidoAteOntem);
          const metaDiaria = faltanteAteOntem > 0 ? faltanteAteOntem / diasRestantes : 0;
          
          // Calcular quanto falta hoje (meta diária - vendido hoje)
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
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, selectedPeriod, selectedLojaId]);

  return { metrics, loading };
}