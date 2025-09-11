import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from './useAuth';
import { type PeriodOption } from '@/contexts/PeriodContext';

export interface ColaboradorProgress {
  id: number;
  nome: string;
  tipo: string;
  metas: {
    geral?: number;
    generico_similar?: number;
    goodlife?: number;
    perfumaria_alta?: number;
    dermocosmetico?: number;
  };
  vendas: {
    geral: number;
    generico_similar: number;
    goodlife: number;
    perfumaria_alta: number;
    dermocosmetico: number;
  };
  progresso: {
    geral?: number;
    generico_similar?: number;
    goodlife?: number;
    perfumaria_alta?: number;
    dermocosmetico?: number;
  };
}

export function useColaboradoresProgress(user: User | null, selectedPeriod?: PeriodOption | null) {
  const [colaboradores, setColaboradores] = useState<ColaboradorProgress[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar se deve mostrar dados da equipe ou apenas próprios
  const shouldShowTeamData = user?.tipo && ['gerente', 'lider', 'sublider', 'subgerente'].includes(user.tipo);
  const showOnlyOwnData = user?.tipo && ['auxiliar', 'farmaceutico', 'consultora'].includes(user.tipo);

  useEffect(() => {
    if (!user || !selectedPeriod) {
      setLoading(false);
      return;
    }

    const fetchColaboradoresProgress = async () => {
      try {
        setLoading(true);

        // Definir quais usuários buscar
        let usuariosQuery = supabase
          .from('usuarios')
          .select('id, nome, tipo')
          .eq('loja_id', user.loja_id)
          .eq('status', 'ativo');

        // Se deve mostrar apenas dados próprios
        if (showOnlyOwnData) {
          usuariosQuery = usuariosQuery.eq('id', user.id);
        }

        const { data: usuarios, error: usuariosError } = await usuariosQuery;

        if (usuariosError) throw usuariosError;

        if (!usuarios || usuarios.length === 0) {
          setColaboradores([]);
          return;
        }

        const usuarioIds = usuarios.map(u => u.id);

        // Buscar metas dos usuários para o período
        const { data: metas, error: metasError } = await supabase
          .from('metas')
          .select('*')
          .in('usuario_id', usuarioIds)
          .eq('periodo_meta_id', selectedPeriod.id);

        if (metasError) throw metasError;

        // Buscar vendas dos usuários para o período  
        const { data: vendas, error: vendasError } = await supabase
          .from('vendas')
          .select('*')
          .in('usuario_id', usuarioIds)
          .gte('data_venda', selectedPeriod.startDate.toISOString().split('T')[0])
          .lte('data_venda', selectedPeriod.endDate.toISOString().split('T')[0]);

        if (vendasError) throw vendasError;

        // Processar dados - filtrar apenas colaboradores com metas
        const colaboradoresData: ColaboradorProgress[] = usuarios
          .map(usuario => {
            const metasUsuario = metas?.filter(m => m.usuario_id === usuario.id) || [];
            const vendasUsuario = vendas?.filter(v => v.usuario_id === usuario.id) || [];

            // Se não tem metas, não incluir na lista
            if (metasUsuario.length === 0) {
              return null;
            }

            // Mapeamento de metas por categoria
            const metasMap = metasUsuario.reduce((acc, meta) => {
              acc[meta.categoria] = meta.meta_mensal;
              return acc;
            }, {} as Record<string, number>);

            // Somar vendas por categoria
            const vendasMap = vendasUsuario.reduce((acc, venda) => {
              const valor = Number(venda.valor_venda) || 0;
              
              switch (venda.categoria) {
                case 'geral':
                  acc.geral += valor;
                  break;
                case 'similar':
                case 'generico':
                  acc.generico_similar += valor;
                  break;
                case 'goodlife':
                  acc.goodlife += valor;
                  break;
                case 'perfumaria_alta':
                  acc.perfumaria_alta += valor;
                  break;
                case 'dermocosmetico':
                  acc.dermocosmetico += valor;
                  break;
              }
              return acc;
            }, {
              geral: 0,
              generico_similar: 0,
              goodlife: 0,
              perfumaria_alta: 0,
              dermocosmetico: 0
            });

            // Calcular progresso (percentual)
            const calcularProgresso = (venda: number, meta?: number) => {
              if (!meta || meta === 0) return 0;
              return Math.min((venda / meta) * 100, 100);
            };

            const progresso = {
              geral: metasMap.geral ? calcularProgresso(vendasMap.geral, metasMap.geral) : undefined,
              generico_similar: metasMap.generico_similar ? calcularProgresso(vendasMap.generico_similar, metasMap.generico_similar) : undefined,
              goodlife: metasMap.goodlife ? calcularProgresso(vendasMap.goodlife, metasMap.goodlife) : undefined,
              perfumaria_alta: metasMap.perfumaria_alta ? calcularProgresso(vendasMap.perfumaria_alta, metasMap.perfumaria_alta) : undefined,
              dermocosmetico: metasMap.dermocosmetico ? calcularProgresso(vendasMap.dermocosmetico, metasMap.dermocosmetico) : undefined,
            };

            return {
              id: usuario.id,
              nome: usuario.nome,
              tipo: usuario.tipo,
              metas: metasMap,
              vendas: vendasMap,
              progresso
            };
          })
          .filter(colaborador => colaborador !== null) as ColaboradorProgress[];

        setColaboradores(colaboradoresData);
      } catch (error) {
        console.error('Erro ao buscar progresso dos colaboradores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchColaboradoresProgress();
  }, [user, selectedPeriod, shouldShowTeamData, showOnlyOwnData]);

  return { colaboradores, loading, shouldShowTeamData, showOnlyOwnData };
}