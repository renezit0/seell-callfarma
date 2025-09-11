import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type MetaColaborador = {
  id: number;
  usuario_id: number;
  categoria: string;
  meta_mensal: number;
  periodo_meta_id: number;
  nome_usuario?: string;
  tipo_usuario?: string;
};

export type ColaboradorComMetas = {
  usuario_id: number;
  nome_usuario: string;
  tipo_usuario: string;
  metas: MetaColaborador[];
  pode_ter_metas: boolean;
};

export type MetaLoja = {
  id: number;
  loja_id: number;
  meta_valor_total: number;
  periodo_meta_id: number;
  observacoes?: string;
  nome_loja?: string;
  categorias?: MetaLojaCategoria[];
};

export type MetaLojaCategoria = {
  id: number;
  categoria: string;
  meta_valor: number;
  meta_loja_id: number;
};

export type PeriodoMeta = {
  id: number;
  data_inicio: string;
  data_fim: string;
  descricao: string;
  status: string;
};

export function useMetasData() {
  const { user } = useAuth();
  const [colaboradoresComMetas, setColaboradoresComMetas] = useState<ColaboradorComMetas[]>([]);
  const [metasLojas, setMetasLojas] = useState<MetaLoja[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoMeta[]>([]);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar permissões
  const canEditAll = user?.tipo && ['admin', 'supervisor', 'rh'].includes(user.tipo);
  const canViewStoreOnly = user?.tipo && ['gerente', 'lider', 'sublider', 'subgerente'].includes(user.tipo);
  const canEditColaboradores = canEditAll || canViewStoreOnly;
  const canEditOthersIndices = user?.tipo && ['lider', 'gerente', 'sublider', 'subgerente'].includes(user.tipo);
  const isRestrictedUser = user?.tipo && ['auxiliar', 'consultora', 'farmaceutico'].includes(user.tipo);

  // Categorias por tipo de usuário
  const getCategoriasPorTipo = (tipo: string): string[] => {
    switch (tipo) {
      case 'lider':
      case 'gerente':
      case 'sublider':
      case 'subgerente':
      case 'auxiliar':
      case 'farmaceutico':
        return ['geral', 'generico_similar', 'goodlife'];
      case 'consultora':
        return ['perfumaria_alta', 'dermocosmetico', 'goodlife'];
      default:
        return []; // Outros tipos não possuem metas
    }
  };

  // Buscar períodos
  const fetchPeriodos = async () => {
    try {
      const { data, error } = await supabase
        .from('periodos_meta')
        .select('*')
        .eq('status', 'ativo')
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      setPeriodos(data || []);
      
      // Selecionar o período mais recente por padrão
      if (data && data.length > 0 && !periodoSelecionado) {
        setPeriodoSelecionado(data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Buscar colaboradores com suas metas
  const fetchColaboradoresComMetas = async () => {
    if (!periodoSelecionado) return;

    try {
      // Buscar todos os colaboradores da loja (ou todos se admin)
      let usuariosQuery = supabase
        .from('usuarios')
        .select('id, nome, tipo, loja_id')
        .eq('status', 'ativo')
        .in('tipo', ['auxiliar', 'consultora', 'farmaceutico', 'lider', 'sublider', 'subgerente', 'gerente']);

      // Filtrar por loja se não for admin/supervisor/rh
      if (!canEditAll && user?.loja_id) {
        usuariosQuery = usuariosQuery.eq('loja_id', user.loja_id);
      }

      // Se usuário restrito, mostrar apenas ele mesmo
      if (isRestrictedUser && user?.id) {
        usuariosQuery = usuariosQuery.eq('id', user.id);
      }

      const { data: usuariosData, error: usuariosError } = await usuariosQuery.order('nome');
      
      if (usuariosError) throw usuariosError;

      // Buscar metas para todos os usuários
      const usuarioIds = usuariosData?.map(u => u.id) || [];
      let metasQuery = supabase
        .from('metas')
        .select('*')
        .eq('periodo_meta_id', periodoSelecionado);

      if (usuarioIds.length > 0) {
        metasQuery = metasQuery.in('usuario_id', usuarioIds);
      }

      const { data: metasData, error: metasError } = await metasQuery;
      
      if (metasError) throw metasError;

      // Agrupar metas por usuário
      const metasPorUsuario = (metasData || []).reduce((acc, meta) => {
        if (!acc[meta.usuario_id]) {
          acc[meta.usuario_id] = [];
        }
        acc[meta.usuario_id].push(meta);
        return acc;
      }, {} as Record<number, MetaColaborador[]>);

      // Criar estrutura final
      const colaboradoresFormatados: ColaboradorComMetas[] = (usuariosData || []).map(usuario => ({
        usuario_id: usuario.id,
        nome_usuario: usuario.nome,
        tipo_usuario: usuario.tipo,
        metas: metasPorUsuario[usuario.id] || [],
        pode_ter_metas: getCategoriasPorTipo(usuario.tipo).length > 0
      }));

      setColaboradoresComMetas(colaboradoresFormatados);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Buscar metas de lojas
  const fetchMetasLojas = async () => {
    if (!periodoSelecionado) return;

    try {
      let query = supabase
        .from('metas_loja')
        .select(`
          *,
          lojas:loja_id (
            nome,
            numero
          ),
          metas_loja_categorias (*)
        `)
        .eq('periodo_meta_id', periodoSelecionado);

      // Filtrar por loja se não for admin/supervisor/rh
      if (!canEditAll && user?.loja_id) {
        query = query.eq('loja_id', user.loja_id);
      }

      const { data, error } = await query.order('loja_id');

      if (error) throw error;

      const metasFormatadas = (data || []).map(meta => ({
        ...meta,
        nome_loja: `${meta.lojas?.numero} - ${meta.lojas?.nome}`,
        categorias: meta.metas_loja_categorias || []
      }));

      setMetasLojas(metasFormatadas);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Atualizar meta de colaborador
  const updateMetaColaborador = async (id: number, meta_mensal: number) => {
    try {
      const { error } = await supabase
        .from('metas')
        .update({ meta_mensal })
        .eq('id', id);

      if (error) throw error;
      await fetchColaboradoresComMetas();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Criar meta de colaborador
  const createMetaColaborador = async (usuario_id: number, categoria: string, meta_mensal: number) => {
    try {
      const { error } = await supabase
        .from('metas')
        .insert({
          usuario_id,
          categoria: categoria as any,
          meta_mensal,
          periodo_meta_id: periodoSelecionado
        });

      if (error) throw error;
      await fetchColaboradoresComMetas();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Atualizar meta de loja
  const updateMetaLoja = async (id: number, meta_valor_total: number) => {
    try {
      const { error } = await supabase
        .from('metas_loja')
        .update({ meta_valor_total })
        .eq('id', id);

      if (error) throw error;
      await fetchMetasLojas();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchPeriodos();
  }, []);

  useEffect(() => {
    if (periodoSelecionado) {
      setLoading(true);
      Promise.all([
        fetchColaboradoresComMetas(),
        fetchMetasLojas()
      ]).finally(() => setLoading(false));
    }
  }, [periodoSelecionado]);

  return {
    colaboradoresComMetas,
    metasLojas,
    periodos,
    periodoSelecionado,
    setPeriodoSelecionado,
    loading,
    error,
    canEditAll,
    canViewStoreOnly,
    canEditColaboradores,
    canEditOthersIndices,
    isRestrictedUser,
    getCategoriasPorTipo,
    updateMetaColaborador,
    createMetaColaborador,
    updateMetaLoja
  };
}