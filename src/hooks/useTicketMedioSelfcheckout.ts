import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface TicketMedioData {
  data_lancamento: string;
  vendas_geral_dia: number;
  clientes_atendidos: number;
  ticket_medio: number;
}

export interface TicketMedioResumo {
  ticket_medio_geral: number;
  total_vendas_geral_periodo: number;
  total_clientes_periodo: number;
  dados_por_dia: TicketMedioData[];
}

export function useTicketMedioSelfcheckout(
  loja_id: number | null,
  periodoFilter: string = 'mes'
) {
  const [dados, setDados] = useState<TicketMedioResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loja_id) {
      setLoading(false);
      return;
    }

    const fetchTicketMedio = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calcular datas baseado no filtro
        const hoje = new Date();
        let dataInicio: Date;
        let dataFim = hoje;

        switch (periodoFilter) {
          case 'hoje':
            dataInicio = hoje;
            break;
          case 'semana':
            dataInicio = new Date(hoje);
            dataInicio.setDate(hoje.getDate() - 7);
            break;
          case 'mes':
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            break;
          default:
            // Período completo - últimos 30 dias
            dataInicio = new Date(hoje);
            dataInicio.setDate(hoje.getDate() - 30);
        }

        // Chamar a função do banco
        const { data, error } = await supabase.rpc('calcular_ticket_medio_selfcheckout', {
          p_loja_id: loja_id,
          p_data_inicio: format(dataInicio, 'yyyy-MM-dd'),
          p_data_fim: format(dataFim, 'yyyy-MM-dd')
        });

        if (error) throw error;

        // Processar dados para calcular resumo
        const dadosPorDia = (data || []) as TicketMedioData[];
        
        const totalVendasGeraPeriodo = dadosPorDia.reduce((sum, item) => sum + Number(item.vendas_geral_dia), 0);
        const totalClientesPeriodo = dadosPorDia.reduce((sum, item) => sum + Number(item.clientes_atendidos), 0);
        const ticketMedioGeral = totalClientesPeriodo > 0 ? totalVendasGeraPeriodo / totalClientesPeriodo : 0;

        const resumo: TicketMedioResumo = {
          ticket_medio_geral: ticketMedioGeral,
          total_vendas_geral_periodo: totalVendasGeraPeriodo,
          total_clientes_periodo: totalClientesPeriodo,
          dados_por_dia: dadosPorDia
        };

        setDados(resumo);
      } catch (err) {
        console.error('Erro ao buscar dados de ticket médio do selfcheckout:', err);
        setError('Erro ao carregar dados do selfcheckout');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketMedio();
  }, [loja_id, periodoFilter]);

  return { dados, loading, error };
}