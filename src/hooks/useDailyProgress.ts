import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from './useAuth';
import { type PeriodOption } from '@/contexts/PeriodContext';
import { format, eachDayOfInterval, startOfDay } from 'date-fns';
import { usePeriodoAtual } from './usePeriodoAtual';

export interface DailyProgressData {
  metaDiaria: number;
  vendaHoje: number;
  faltaHoje: number;
  diasUteis: number;
  diasRestantes: number;
  progressoPorcentagemDiaria: number;
  porcentagemTempoDecorrido: number;
}

export function useDailyProgress(user: User | null, selectedPeriod?: PeriodOption | null, categoria?: string, meta?: number, targetUserId?: number) {
  const [dailyData, setDailyData] = useState<DailyProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const periodoAtual = usePeriodoAtual();

  useEffect(() => {
    if ((!user && !targetUserId) || !selectedPeriod || !categoria || !meta) {
      setDailyData(null);
      setLoading(false);
      return;
    }

    const calculateDailyProgress = async () => {
      try {
        setLoading(true);

        // Buscar vendas de hoje
        const hoje = new Date();
        const hojeStr = format(hoje, 'yyyy-MM-dd');

        // Definir usuário alvo (colaborador) para os cálculos
        const targetId = (targetUserId ?? user!.id) as number;

        // Calcular venda de hoje baseada na categoria
        let vendaHoje = 0;
        
        if (categoria === 'generico_similar') {
          // Para generico_similar, buscar tanto 'generico' quanto 'similar'
          const { data: vendasGenerico, error: errorGenerico } = await supabase
            .from('vendas')
            .select('valor_venda')
            .eq('usuario_id', targetId)
            .eq('data_venda', hojeStr)
            .eq('categoria', 'generico');

          const { data: vendasSimilar, error: errorSimilar } = await supabase
            .from('vendas')
            .select('valor_venda')
            .eq('usuario_id', targetId)
            .eq('data_venda', hojeStr)
            .eq('categoria', 'similar');

          if (errorGenerico || errorSimilar) throw errorGenerico || errorSimilar;

          vendaHoje = (vendasGenerico?.reduce((sum, venda) => sum + Number(venda.valor_venda), 0) || 0) +
                     (vendasSimilar?.reduce((sum, venda) => sum + Number(venda.valor_venda), 0) || 0);
        } else {
          // Para outras categorias, buscar diretamente
          let categoriaVenda: any = categoria;
          
          const { data: vendasHoje, error: vendasError } = await supabase
            .from('vendas')
            .select('valor_venda')
            .eq('usuario_id', targetId)
            .eq('data_venda', hojeStr)
            .eq('categoria', categoriaVenda);

          if (vendasError) throw vendasError;

          vendaHoje = vendasHoje?.reduce((sum, venda) => sum + Number(venda.valor_venda), 0) || 0;
        }

        // Normalizar hoje para início do dia para evitar problemas de horário
        const hojeInicio = startOfDay(hoje);

        // Usar sempre o período correto (21 ao 20) em vez do período da tabela
        const periodStart = periodoAtual.dataInicio;
        const periodEnd = periodoAtual.dataFim;
        const periodStartStr = format(periodStart, 'yyyy-MM-dd');
        const periodEndStr = format(periodEnd, 'yyyy-MM-dd');
        const hojeStrForCompare = format(hojeInicio, 'yyyy-MM-dd');

        // Calcular todos os dias corridos do período
        const todosDias = eachDayOfInterval({ start: periodStart, end: periodEnd });
        const diasUteis = todosDias;

        // Buscar folgas do usuário no período selecionado
        const { data: folgas, error: folgasError } = await supabase
          .from('folgas')
          .select('data_folga, observacao')
          .eq('usuario_id', targetId)
          .gte('data_folga', periodStartStr)
          .lte('data_folga', periodEndStr);

        if (folgasError) throw folgasError;

        console.log('🔍 DEBUG useDailyProgress - Período:', {
          inicio: periodStartStr,
          fim: periodEndStr,
          hoje: hojeStrForCompare,
          totalDias: todosDias.length,
          diasNoCiclo: diasUteis.length,
          folgasEncontradas: folgas?.length || 0,
          folgas: folgas?.map(f => ({ data: f.data_folga, obs: f.observacao }))
        });

        // Remover folgas dos dias úteis
        const diasComFolga = folgas?.map(f => f.data_folga) || [];
        const diasUteisTrabalho = diasUteis.filter(dia => 
          !diasComFolga.includes(format(dia, 'yyyy-MM-dd'))
        );

        const totalDiasUteis = diasUteisTrabalho.length;
        
        // Calcular dias restantes (a partir de hoje até fim do período, incluindo hoje)
        const diasRestantesArray = diasUteisTrabalho.filter(dia => 
          format(dia, 'yyyy-MM-dd') >= hojeStrForCompare
        );
        const diasRestantes = diasRestantesArray.length;

        console.log('🔍 DEBUG useDailyProgress - Dias restantes:', {
          hojeStr: hojeStrForCompare,
          periodEndStr,
          diasUteisTrabalho: diasUteisTrabalho.map(d => format(d, 'yyyy-MM-dd')),
          diasRestantesArray: diasRestantesArray.map(d => format(d, 'yyyy-MM-dd')),
          diasRestantes: diasRestantes,
          incluiHoje: diasRestantesArray.some(dia => format(dia, 'yyyy-MM-dd') === hojeStrForCompare)
        });

        // Buscar vendas acumuladas no período para calcular o que falta
        let vendasAcumuladas = 0;
        
        if (categoria === 'generico_similar') {
          // Para generico_similar, buscar tanto 'generico' quanto 'similar'
          const { data: vendasGenericoAcum, error: errorGenericoAcum } = await supabase
            .from('vendas')
            .select('valor_venda')
            .eq('usuario_id', targetId)
            .gte('data_venda', periodStartStr)
            .lte('data_venda', periodEndStr)
            .eq('categoria', 'generico');

          const { data: vendasSimilarAcum, error: errorSimilarAcum } = await supabase
            .from('vendas')
            .select('valor_venda')
            .eq('usuario_id', targetId)
            .gte('data_venda', periodStartStr)
            .lte('data_venda', periodEndStr)
            .eq('categoria', 'similar');

          if (errorGenericoAcum || errorSimilarAcum) throw errorGenericoAcum || errorSimilarAcum;

          vendasAcumuladas = (vendasGenericoAcum?.reduce((sum, venda) => sum + Number(venda.valor_venda), 0) || 0) +
                            (vendasSimilarAcum?.reduce((sum, venda) => sum + Number(venda.valor_venda), 0) || 0);
        } else {
          // Para outras categorias, buscar diretamente
          let categoriaVenda: any = categoria;
          
          const { data: vendasAcum, error: vendasAcumError } = await supabase
            .from('vendas')
            .select('valor_venda')
            .eq('usuario_id', targetId)
            .gte('data_venda', periodStartStr)
            .lte('data_venda', periodEndStr)
            .eq('categoria', categoriaVenda);

          if (vendasAcumError) throw vendasAcumError;

          vendasAcumuladas = vendasAcum?.reduce((sum, venda) => sum + Number(venda.valor_venda), 0) || 0;
        }

        console.log('🔍 DEBUG useDailyProgress - Cálculo final:', {
          totalDiasUteis,
          diasRestantes,
          hojeStr: hojeStrForCompare,
          meta,
          vendasAcumuladas,
          vendaHoje,
          diasUteisTrabalho: diasUteisTrabalho.map(d => format(d, 'yyyy-MM-dd')),
          diasRestantesDetalhado: diasUteisTrabalho
            .filter(dia => format(dia, 'yyyy-MM-dd') >= hojeStrForCompare)
            .map(d => format(d, 'yyyy-MM-dd'))
        });

        // Calcular o que ainda falta para atingir a meta total
        const metaRestante = Math.max(0, meta - vendasAcumuladas);
        
        // Calcular meta diária baseada no que falta dividido pelos dias restantes
        const metaDiaria = diasRestantes > 0 ? metaRestante / diasRestantes : 0;
        
        // Calcular quanto falta para atingir a meta do dia
        const faltaHoje = Math.max(0, metaDiaria - vendaHoje);

        // Calcular progresso percentual do dia
        const progressoPorcentagemDiaria = metaDiaria > 0 ? (vendaHoje / metaDiaria) * 100 : 0;

        // Calcular porcentagem de tempo decorrido (dias que já passaram, não incluindo hoje)
        const diasDecorridos = diasUteisTrabalho.filter(dia => 
          format(dia, 'yyyy-MM-dd') < hojeStrForCompare
        ).length;
        const porcentagemTempoDecorrido = totalDiasUteis > 0 ? (diasDecorridos / totalDiasUteis) * 100 : 0;

        setDailyData({
          metaDiaria,
          vendaHoje,
          faltaHoje,
          diasUteis: totalDiasUteis,
          diasRestantes,
          progressoPorcentagemDiaria,
          porcentagemTempoDecorrido
        });

      } catch (error) {
        console.error('Erro ao calcular progresso diário:', error);
        setDailyData(null);
      } finally {
        setLoading(false);
      }
    };

    calculateDailyProgress();
  }, [user, selectedPeriod, categoria, meta]);

  return { dailyData, loading };
}