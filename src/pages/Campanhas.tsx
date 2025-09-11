import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChartLine, Plus, Eye, Edit, Trophy, Store, Calendar, Target, Users, TrendingUp, ArrowLeft, Info, CheckCircle, Clock, Award, Medal, Crown, AlertCircle, X } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { VendasFuncionarios } from '@/components/VendasFuncionarios';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCallfarmaAPI } from '@/hooks/useCallfarmaAPI';
import { usePeriodoAtual } from '@/hooks/usePeriodoAtual';
interface Campanha {
  id: number;
  nome: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  tipo_meta: 'quantidade' | 'valor';
  status: 'ativa' | 'inativa' | 'encerrada';
  sem_metas: boolean;
  criado_por: number;
  total_lojas_participantes?: number;
  total_realizado_quantidade?: number;
  total_realizado_valor?: number;
  meta_total?: number;
  criador_nome?: string;
}
interface LojaParticipante {
  id: number;
  loja_id: number;
  codigo_loja: number;
  loja_nome?: string;
  loja_numero?: string;
  loja_regiao?: string;
  grupo_nome?: string;
  grupo_cor?: string;
  meta_quantidade: number;
  meta_valor: number;
  realizado_quantidade: number;
  realizado_valor: number;
  percentual_meta: number;
}
interface CampanhaDetalhada extends Campanha {
  lojas: LojaParticipante[];
  estatisticas?: {
    total_lojas_com_vendas: number;
    total_dias_com_dados: number;
    primeira_venda?: string;
    ultima_venda?: string;
  };
  historico?: Array<{
    data_venda: string;
    lojas_processadas: number;
    total_quantidade_dia: number;
    total_valor_dia: number;
    status: string;
  }>;
}
interface LojaRanking {
  id: number;
  numero: string;
  nome: string;
  grupo_id: string;
  totalVendas: number;
  meta: number;
  percentualAtingimento: number;
  totalColaboradores: number;
  mediaVendasPorColaborador: number;
  posicao: number;
}
interface ColaboradorRanking {
  id: number;
  nome: string;
  loja_id: number;
  loja_nome: string;
  grupo_id: string;
  totalVendas: number;
  posicao: number;
}
interface GrupoRanking {
  grupo_id: string;
  nome_grupo: string;
  lojas: LojaRanking[];
  colaboradores: ColaboradorRanking[];
  totalVendas: number;
  totalMeta: number;
  percentualAtingimentoGrupo: number;
  totalLojas: number;
  totalColaboradores: number;
}
export default function Campanhas() {
  const periodoAtual = usePeriodoAtual();
  const [view, setView] = useState<'lista' | 'detalhes' | 'criar' | 'vendas-funcionarios' | 'status' | 'editar'>('lista');
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [campanhaSelecionada, setCampanhaSelecionada] = useState<CampanhaDetalhada | null>(null);
  const [incluirInativas, setIncluirInativas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingApiExterna, setLoadingApiExterna] = useState(false);
  const [filtroData, setFiltroData] = useState({
    dataInicio: periodoAtual.dataInicio.toISOString().split('T')[0],
    dataFim: periodoAtual.dataFim.toISOString().split('T')[0]
  });

  // Estados para status/ranking
  const [campanhaStatusSelecionada, setCampanhaStatusSelecionada] = useState<number | null>(null);
  const [campanhasStatus, setCampanhasStatus] = useState<Campanha[]>([]);
  const [gruposRanking, setGruposRanking] = useState<GrupoRanking[]>([]);
  const [viewMode, setViewMode] = useState<'lojas' | 'colaboradores'>('lojas');

  // Estados para criação de campanhas
  const [novaCampanha, setNovaCampanha] = useState({
    nome: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    tipo_meta: 'quantidade',
    fornecedores: '',
    marcas: '',
    familias: '',
    grupos_produtos: '',
    produtos: '' // Campo para produtos específicos
  });
  const [lojasDisponiveis, setLojasDisponiveis] = useState<any[]>([]);
  const [lojasParticipantes, setLojasParticipantes] = useState<{
    loja_id: number;
    codigo_loja: number;
    meta_quantidade: number;
    meta_valor: number;
    grupo_id: string;
  }[]>([]);
  const [loadingLojas, setLoadingLojas] = useState(false);
  const [criandoCampanha, setCriandoCampanha] = useState(false);

  // Estados para o formulário rápido de adição de lojas
  const [formRapido, setFormRapido] = useState({
    numeroLoja: '',
    grupo: '1',
    metaQuantidade: '',
    metaValor: ''
  });

  // Estados para edição de campanhas
  const [campanhaEditando, setCampanhaEditando] = useState<any>(null);
  const [editandoCampanha, setEditandoCampanha] = useState(false);
  const {
    toast
  } = useToast();
  const {
    buscarVendasCampanha,
    buscarVendasCampanhaDetalhada
  } = useCallfarmaAPI();
  useEffect(() => {
    if (view === 'lista') {
      buscarCampanhas();
    }
  }, [view, incluirInativas]);

  // Carregar dados automaticamente quando entrar na página
  useEffect(() => {
    buscarCampanhas();
  }, []);
  useEffect(() => {
    if (view === 'criar') {
      carregarLojasDisponiveis();
    }
  }, [view]);
  const buscarCampanhas = async () => {
    setLoading(true);
    try {
      let query = supabase.from('campanhas_vendas_lojas').select('*');
      if (!incluirInativas) {
        query = query.eq('status', 'ativa');
      }
      const {
        data,
        error
      } = await query.order('data_fim', {
        ascending: true
      });
      if (error) throw error;

      // Buscar estatísticas para cada campanha
      const campanhasComEstatisticas = await Promise.all((data || []).map(async campanha => {
        // Buscar total de lojas participantes
        const {
          count: totalLojas
        } = await supabase.from('campanhas_vendas_lojas_participantes').select('*', {
          count: 'exact',
          head: true
        }).eq('campanha_id', campanha.id);

        // Buscar totais de vendas da API externa
        const filtros = {
          dataInicio: campanha.data_inicio,
          dataFim: campanha.data_fim,
          filtroFornecedores: campanha.fornecedores?.toString(),
          filtroMarcas: campanha.marcas?.toString(),
          filtroFamilias: campanha.familias?.toString(),
          filtroGrupos: campanha.grupos_produtos?.join(','),
          filtroProduto: campanha.produtos?.toString() // Adicionar filtro por produto
        };
        const vendasApiExterna = await buscarVendasCampanha(filtros);
        const totalRealizadoQuantidade = vendasApiExterna.reduce((sum, v) => sum + (v.TOTAL_QUANTIDADE || 0) - (v.TOTAL_QTD_DV || 0), 0);
        const totalRealizadoValor = vendasApiExterna.reduce((sum, v) => sum + (v.TOTAL_VALOR || 0) - (v.TOTAL_VLR_DV || 0), 0);

        // Buscar total das metas
        const {
          data: metas
        } = await supabase.from('campanhas_vendas_lojas_participantes').select('meta_quantidade, meta_valor').eq('campanha_id', campanha.id);
        const metaTotal = campanha.tipo_meta === 'quantidade' ? (metas || []).reduce((sum, m) => sum + (m.meta_quantidade || 0), 0) : (metas || []).reduce((sum, m) => sum + (m.meta_valor || 0), 0);
        return {
          id: campanha.id,
          nome: campanha.nome || '',
          descricao: campanha.descricao || '',
          data_inicio: campanha.data_inicio || '',
          data_fim: campanha.data_fim || '',
          tipo_meta: campanha.tipo_meta as 'quantidade' | 'valor' || 'quantidade',
          status: campanha.status as 'ativa' | 'inativa' | 'encerrada' || 'ativa',
          sem_metas: campanha.sem_metas === '1',
          criado_por: campanha.criado_por || 0,
          total_lojas_participantes: totalLojas || 0,
          total_realizado_quantidade: totalRealizadoQuantidade,
          total_realizado_valor: totalRealizadoValor,
          meta_total: metaTotal
        };
      }));
      setCampanhas(campanhasComEstatisticas);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar campanhas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const carregarLojasDisponiveis = async (preselecionar: boolean = true) => {
    setLoadingLojas(true);
    try {
      const {
        data,
        error
      } = await supabase.from('lojas').select('*').order('numero');
      if (error) throw error;

      // Filtrar a loja "outras"
      const lojasFiltered = (data || []).filter(loja => loja.nome.toLowerCase() !== 'outras' && loja.nome.toLowerCase() !== 'outro' && loja.numero !== '999');
      setLojasDisponiveis(lojasFiltered);

      // Pré-selecionar todas as lojas automaticamente (exceto "outras") somente quando indicado
      if (preselecionar) {
        const lojasPreSelecionadas = lojasFiltered.map(loja => ({
          loja_id: loja.id,
          codigo_loja: parseInt(loja.numero),
          meta_quantidade: 0,
          meta_valor: 0,
          grupo_id: '1' // Grupo padrão das lojas participantes
        }));
        setLojasParticipantes(lojasPreSelecionadas);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar lojas",
        variant: "destructive"
      });
    } finally {
      setLoadingLojas(false);
    }
  };
  const adicionarLoja = (loja: any) => {
    if (lojasParticipantes.find(l => l.loja_id === loja.id)) {
      toast({
        title: "Aviso",
        description: "Esta loja já foi adicionada",
        variant: "destructive"
      });
      return;
    }
    setLojasParticipantes(prev => [...prev, {
      loja_id: loja.id,
      codigo_loja: parseInt(loja.numero),
      meta_quantidade: 0,
      meta_valor: 0,
      grupo_id: '1'
    }]);
  };
  const removerLoja = (lojaId: number) => {
    setLojasParticipantes(prev => prev.filter(l => l.loja_id !== lojaId));
  };
  const atualizarMetaLoja = (lojaId: number, campo: 'meta_quantidade' | 'meta_valor', valor: number) => {
    setLojasParticipantes(prev => prev.map(l => l.loja_id === lojaId ? {
      ...l,
      [campo]: valor
    } : l));
  };
  const buscarLojaPorNumero = (numero: string) => {
    return lojasDisponiveis.find(loja => loja.numero === numero);
  };
  const adicionarLojaRapido = () => {
    if (!formRapido.numeroLoja) {
      toast({
        title: "Erro",
        description: "Digite o número da loja",
        variant: "destructive"
      });
      return;
    }
    const loja = buscarLojaPorNumero(formRapido.numeroLoja);
    if (!loja) {
      toast({
        title: "Erro",
        description: `Loja ${formRapido.numeroLoja} não encontrada`,
        variant: "destructive"
      });
      return;
    }
    if (lojasParticipantes.find(l => l.loja_id === loja.id)) {
      toast({
        title: "Aviso",
        description: "Esta loja já foi adicionada",
        variant: "destructive"
      });
      return;
    }
    const novaLoja = {
      loja_id: loja.id,
      codigo_loja: parseInt(loja.numero),
      meta_quantidade: parseInt(formRapido.metaQuantidade) || 0,
      meta_valor: parseFloat((formRapido.metaValor || '0').replace(',', '.')) || 0,
      grupo_id: formRapido.grupo
    };
    setLojasParticipantes(prev => [...prev, novaLoja]);

    // Limpar formulário
    setFormRapido({
      numeroLoja: '',
      grupo: '1',
      metaQuantidade: '',
      metaValor: ''
    });
    toast({
      title: "Sucesso",
      description: `Loja ${loja.numero} - ${loja.nome} adicionada`
    });
  };
  const resetarFormRapido = () => {
    setFormRapido({
      numeroLoja: '',
      grupo: '1',
      metaQuantidade: '',
      metaValor: ''
    });
  };
  const excluirCampanha = async (campanhaId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.')) {
      return;
    }
    setEditandoCampanha(true);
    try {
      // Primeiro, excluir todos os participantes da campanha
      const {
        error: erroParticipantes
      } = await supabase.from('campanhas_vendas_lojas_participantes').delete().eq('campanha_id', campanhaId);
      if (erroParticipantes) throw erroParticipantes;

      // Depois, excluir a campanha
      const {
        error: erroCampanha
      } = await supabase.from('campanhas_vendas_lojas').delete().eq('id', campanhaId);
      if (erroCampanha) throw erroCampanha;
      toast({
        title: "Sucesso",
        description: "Campanha excluída com sucesso"
      });

      // Resetar estados e voltar para lista
      setCampanhaEditando(null);
      setLojasParticipantes([]);
      setView('lista');
      buscarCampanhas();
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir campanha",
        variant: "destructive"
      });
    } finally {
      setEditandoCampanha(false);
    }
  };
  const criarCampanha = async () => {
    if (!novaCampanha.nome || !novaCampanha.data_inicio || !novaCampanha.data_fim) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }
    if (lojasParticipantes.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma loja participante",
        variant: "destructive"
      });
      return;
    }
    setCriandoCampanha(true);
    try {
      const campanhaId = Date.now();
      // Criar campanha
      const {
        data: campanhaCriada,
        error: erroCampanha
      } = await supabase.from('campanhas_vendas_lojas').insert([{
        id: campanhaId,
        nome: novaCampanha.nome,
        descricao: novaCampanha.descricao,
        data_inicio: novaCampanha.data_inicio,
        data_fim: novaCampanha.data_fim,
        tipo_meta: novaCampanha.tipo_meta,
        status: 'ativa',
        sem_metas: '0',
        criado_por: 1
      }] as any).select().single();
      if (erroCampanha) throw erroCampanha;
      const baseId = Date.now();
      // Adicionar lojas participantes  
      const participantesData = lojasParticipantes.map((loja, idx) => ({
        id: baseId + idx + 1,
        campanha_id: campanhaCriada.id,
        loja_id: loja.loja_id,
        codigo_loja: loja.codigo_loja,
        meta_quantidade: loja.meta_quantidade,
        meta_valor: loja.meta_valor,
        realizado_quantidade: 0,
        realizado_valor: 0,
        grupo_id: Number(loja.grupo_id),
        status: 'ativa'
      }));
      const {
        error: erroParticipantes
      } = await supabase.from('campanhas_vendas_lojas_participantes').insert(participantesData as any);
      if (erroParticipantes) throw erroParticipantes;
      toast({
        title: "Sucesso",
        description: "Campanha criada com sucesso"
      });

      // Resetar formulário
      setNovaCampanha({
        nome: '',
        descricao: '',
        data_inicio: '',
        data_fim: '',
        tipo_meta: 'quantidade',
        fornecedores: '',
        marcas: '',
        familias: '',
        grupos_produtos: '',
        produtos: ''
      });
      setLojasParticipantes([]);
      resetarFormRapido();
      setView('lista');
      buscarCampanhas();
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar campanha",
        variant: "destructive"
      });
    } finally {
      setCriandoCampanha(false);
    }
  };
  const iniciarEdicaoCampanha = async (campanha: any) => {
    try {
      // Buscar dados completos da campanha
      const {
        data: campanhaCompleta,
        error: erroCampanha
      } = await supabase.from('campanhas_vendas_lojas').select('*').eq('id', campanha.id).single();
      if (erroCampanha) throw erroCampanha;

      // Buscar participantes da campanha
      const { data: participantes, error: erroParticipantes } = await supabase
        .from('campanhas_vendas_lojas_participantes')
        .select('*')
        .eq('campanha_id', campanha.id);
      if (erroParticipantes) throw erroParticipantes;
      // Não buscar grupo em lojas; usar apenas grupo_id do participante
      const lojasMap = new Map<number, { grupo_id?: number }>();
      // Mapear participantes para o formato esperado (grupo_id vindo do participante ou da loja)
      const lojasParticipantesFormatadas = (participantes || []).map(p => {
        const rawGrupo = (p.grupo_id as any) ?? 1;
        const normalizedGrupo = String(rawGrupo).replace(/\D/g, '') || '1';
        return {
          loja_id: p.loja_id,
          codigo_loja: p.codigo_loja,
          meta_quantidade: p.meta_quantidade || 0,
          meta_valor: p.meta_valor || 0,
          grupo_id: normalizedGrupo
        };
      });

      // Definir campanha para edição
      setCampanhaEditando({
        id: campanhaCompleta.id,
        nome: campanhaCompleta.nome || '',
        descricao: campanhaCompleta.descricao || '',
        data_inicio: campanhaCompleta.data_inicio || '',
        data_fim: campanhaCompleta.data_fim || '',
        tipo_meta: campanhaCompleta.tipo_meta || 'quantidade',
        fornecedores: campanhaCompleta.fornecedores?.toString() || '',
        marcas: campanhaCompleta.marcas?.toString() || '',
        familias: campanhaCompleta.familias?.toString() || '',
        grupos_produtos: campanhaCompleta.grupos_produtos?.toString() || '',
        produtos: campanhaCompleta.produtos || ''
      });
      setLojasParticipantes(lojasParticipantesFormatadas);
      await carregarLojasDisponiveis(false);
      setView('editar');
    } catch (error) {
      console.error('Erro ao carregar campanha para edição:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da campanha",
        variant: "destructive"
      });
    }
  };
  const salvarEdicaoCampanha = async () => {
    if (!campanhaEditando) return;

    // Validar campos obrigatórios
    if (!campanhaEditando.nome || !campanhaEditando.data_inicio || !campanhaEditando.data_fim) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }
    if (lojasParticipantes.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma loja participante",
        variant: "destructive"
      });
      return;
    }
    setEditandoCampanha(true);
    try {
      // Atualizar campanha
      const {
        error: erroCampanha
      } = await supabase.from('campanhas_vendas_lojas').update({
        nome: campanhaEditando.nome,
        descricao: campanhaEditando.descricao,
        data_inicio: campanhaEditando.data_inicio,
        data_fim: campanhaEditando.data_fim,
        tipo_meta: campanhaEditando.tipo_meta,
        fornecedores: campanhaEditando.fornecedores || null,
        marcas: campanhaEditando.marcas || null,
        familias: campanhaEditando.familias || null,
        grupos_produtos: campanhaEditando.grupos_produtos || null,
        produtos: campanhaEditando.produtos || null
      }).eq('id', campanhaEditando.id);
      if (erroCampanha) throw erroCampanha;

      // Remover participantes existentes
      const {
        error: erroRemocao
      } = await supabase.from('campanhas_vendas_lojas_participantes').delete().eq('campanha_id', campanhaEditando.id);
      if (erroRemocao) throw erroRemocao;

      // Adicionar novos participantes
      const baseId = Date.now();
      const participantesData = lojasParticipantes.map((loja, idx) => ({
        id: baseId + idx + 1,
        campanha_id: campanhaEditando.id,
        loja_id: loja.loja_id,
        codigo_loja: loja.codigo_loja,
        meta_quantidade: loja.meta_quantidade,
        meta_valor: loja.meta_valor,
        realizado_quantidade: 0,
        realizado_valor: 0,
        grupo_id: Number(loja.grupo_id),
        status: 'ativa'
      }));
      const {
        error: erroParticipantes
      } = await supabase.from('campanhas_vendas_lojas_participantes').insert(participantesData as any);
      if (erroParticipantes) throw erroParticipantes;
      toast({
        title: "Sucesso",
        description: "Campanha atualizada com sucesso"
      });

      // Resetar estados
      setCampanhaEditando(null);
      setLojasParticipantes([]);
      setView('lista');
      buscarCampanhas();
    } catch (error) {
      console.error('Erro ao atualizar campanha:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar campanha",
        variant: "destructive"
      });
    } finally {
      setEditandoCampanha(false);
    }
  };
  const buscarVendasApiExterna = async (campanha: any) => {
    setLoadingApiExterna(true);
    try {
      const filtros = {
        dataInicio: campanha.data_inicio,
        dataFim: campanha.data_fim,
        filtroFornecedores: campanha.fornecedores?.toString(),
        filtroMarcas: campanha.marcas?.toString(),
        filtroFamilias: campanha.familias?.toString(),
        filtroGrupos: campanha.grupos_produtos?.join(','),
        filtroProduto: campanha.produtos?.toString() // Adicionar filtro por produto
      };
      const vendasApiExterna = await buscarVendasCampanha(filtros);

      // Atualizar lojas da campanha com dados da API externa
      if (campanhaSelecionada && vendasApiExterna.length > 0) {
        const lojasAtualizadas = campanhaSelecionada.lojas.map(loja => {
          const vendaApiExterna = vendasApiExterna.find(v => v.CDFIL === loja.codigo_loja);
          if (vendaApiExterna) {
            const realizado = campanhaSelecionada.tipo_meta === 'quantidade' ? vendaApiExterna.TOTAL_QUANTIDADE : vendaApiExterna.TOTAL_VALOR;
            const meta = campanhaSelecionada.tipo_meta === 'quantidade' ? loja.meta_quantidade : loja.meta_valor;
            return {
              ...loja,
              realizado_quantidade: (vendaApiExterna.TOTAL_QUANTIDADE || 0) - (vendaApiExterna.TOTAL_QTD_DV || 0),
              realizado_valor: (vendaApiExterna.TOTAL_VALOR || 0) - (vendaApiExterna.TOTAL_VLR_DV || 0),
              percentual_meta: meta > 0 ? realizado / meta * 100 : 0
            };
          }
          return loja;
        });

        // Ordenar por performance
        const tipoMeta = campanhaSelecionada.tipo_meta;
        lojasAtualizadas.sort((a, b) => {
          const realizadoA = tipoMeta === 'quantidade' ? a.realizado_quantidade : a.realizado_valor;
          const realizadoB = tipoMeta === 'quantidade' ? b.realizado_quantidade : b.realizado_valor;
          return realizadoB - realizadoA;
        });
        setCampanhaSelecionada({
          ...campanhaSelecionada,
          lojas: lojasAtualizadas
        });
        toast({
          title: "Sucesso",
          description: "Dados atualizados com a API externa"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados da API externa:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar dados da API externa",
        variant: "destructive"
      });
    } finally {
      setLoadingApiExterna(false);
    }
  };
  const buscarDetalheCampanha = async (campanhaId: number) => {
    setLoading(true);
    try {
      // Buscar dados básicos da campanha de campanhas_vendas_lojas
      const {
        data: campanha,
        error: erroCampanha
      } = await supabase.from('campanhas_vendas_lojas').select('*').eq('id', campanhaId).single();
      if (erroCampanha) throw erroCampanha;

      // Buscar lojas participantes de campanhas_vendas_lojas_participantes
      const {
        data: participantes,
        error: erroParticipantes
      } = await supabase.from('campanhas_vendas_lojas_participantes').select('*').eq('campanha_id', campanhaId);
      if (erroParticipantes) throw erroParticipantes;

      // Buscar dados das lojas para obter nomes e regiões
      const lojasIds = participantes?.map(p => p.loja_id).filter(Boolean) || [];
      const {
        data: lojas
      } = await supabase.from('lojas').select('id, nome, numero, regiao').in('id', lojasIds);

      // BUSCAR DADOS DIRETAMENTE DA API EXTERNA
      const filtros = {
        dataInicio: campanha.data_inicio,
        dataFim: campanha.data_fim,
        filtroFornecedores: campanha.fornecedores?.toString(),
        filtroMarcas: campanha.marcas?.toString(),
        filtroFamilias: campanha.familias?.toString(),
        filtroGrupos: campanha.grupos_produtos?.join(','),
        filtroProduto: campanha.produtos?.toString() // Adicionar filtro por produto
      };
      console.log('Buscando dados da API externa com filtros:', filtros);
      const vendasApiExterna = await buscarVendasCampanha(filtros);

      // Processar dados das lojas participantes com dados da API externa
      const lojasDetalhadas: LojaParticipante[] = (participantes || []).map(participante => {
        // Encontrar dados da loja
        const dadosLoja = lojas?.find(l => l.id === participante.loja_id);

        // Buscar vendas da API externa pelo código da loja (cdfil)
        const vendaApiExterna = vendasApiExterna.find(v => v.CDFIL === participante.codigo_loja);
        const totalQuantidade = (vendaApiExterna?.TOTAL_QUANTIDADE || 0) - (vendaApiExterna?.TOTAL_QTD_DV || 0);
        const totalValor = (vendaApiExterna?.TOTAL_VALOR || 0) - (vendaApiExterna?.TOTAL_VLR_DV || 0);

        // Usar as metas da tabela participantes
        const meta = campanha.tipo_meta === 'quantidade' ? participante.meta_quantidade || 0 : participante.meta_valor || 0;
        const realizado = campanha.tipo_meta === 'quantidade' ? totalQuantidade : totalValor;
        return {
          id: participante.id,
          loja_id: participante.loja_id || 0,
          codigo_loja: participante.codigo_loja || 0,
          loja_nome: dadosLoja?.nome,
          loja_numero: dadosLoja?.numero,
          loja_regiao: dadosLoja?.regiao,
          meta_quantidade: participante.meta_quantidade || 0,
          meta_valor: participante.meta_valor || 0,
          realizado_quantidade: (vendaApiExterna?.TOTAL_QUANTIDADE || 0) - (vendaApiExterna?.TOTAL_QTD_DV || 0),
          realizado_valor: (vendaApiExterna?.TOTAL_VALOR || 0) - (vendaApiExterna?.TOTAL_VLR_DV || 0),
          percentual_meta: meta > 0 ? realizado / meta * 100 : 0,
          grupo_nome: String(participante.grupo_id ?? '1'),
          grupo_cor: undefined
        };
      });

      // Ordenar por performance
      const tipoMeta = campanha.tipo_meta as 'quantidade' | 'valor';
      lojasDetalhadas.sort((a, b) => {
        const realizadoA = tipoMeta === 'quantidade' ? a.realizado_quantidade : a.realizado_valor;
        const realizadoB = tipoMeta === 'quantidade' ? b.realizado_quantidade : b.realizado_valor;
        return realizadoB - realizadoA;
      });

      // Calcular estatísticas baseadas nos dados da API externa
      const lojasComVendas = lojasDetalhadas.filter(l => tipoMeta === 'quantidade' ? l.realizado_quantidade > 0 : l.realizado_valor > 0).length;
      const campanhaDetalhada: CampanhaDetalhada = {
        id: campanha.id,
        nome: campanha.nome || '',
        descricao: campanha.descricao || '',
        data_inicio: campanha.data_inicio || '',
        data_fim: campanha.data_fim || '',
        tipo_meta: tipoMeta,
        status: campanha.status as 'ativa' | 'inativa' | 'encerrada',
        sem_metas: campanha.sem_metas === '1',
        criado_por: campanha.criado_por || 0,
        lojas: lojasDetalhadas,
        estatisticas: {
          total_lojas_com_vendas: lojasComVendas,
          total_dias_com_dados: 0,
          // Não temos essa informação da API externa
          primeira_venda: undefined,
          ultima_venda: undefined
        }
      };
      setCampanhaSelecionada(campanhaDetalhada);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar detalhes da campanha",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const calcularProgresso = (realizado: number, meta: number, dataInicio: string, dataFim: string) => {
    const hoje = new Date();
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const totalDias = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const diasDecorridos = Math.max(0, Math.min(Math.ceil((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1, totalDias));
    const percentualTempo = totalDias > 0 ? diasDecorridos / totalDias * 100 : 0;
    const percentualRealizado = meta > 0 ? realizado / meta * 100 : 0;
    let classeProgresso = 'bg-blue-500';
    if (percentualRealizado >= 100) {
      classeProgresso = 'bg-green-500';
    } else if (percentualRealizado >= percentualTempo) {
      classeProgresso = 'bg-emerald-500';
    } else if (percentualRealizado >= percentualTempo * 0.8) {
      classeProgresso = 'bg-yellow-500';
    } else {
      classeProgresso = 'bg-red-500';
    }
    return {
      realizado,
      meta,
      percentualRealizado,
      percentualTempo,
      diasDecorridos,
      totalDias,
      classeProgresso
    };
  };
  const formatarValor = (valor: number, tipo: 'quantidade' | 'valor') => {
    if (tipo === 'valor') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor);
    }
    return `${valor.toLocaleString('pt-BR')} un`;
  };
  const formatarData = (data: string) => {
    // Corrigir problema de timezone que mostrava 1 dia antes
    // Split da string de data e criar nova data com valores locais
    const [ano, mes, dia] = data.split('-').map(Number);
    const dataLocal = new Date(ano, mes - 1, dia); // mes-1 porque Date usa 0-11 para meses
    return dataLocal.toLocaleDateString('pt-BR');
  };
  const renderLista = () => <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ChartLine className="h-8 w-8 text-primary" />
            Gestão de Campanhas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e acompanhe o desempenho das campanhas de vendas por loja
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setView('criar')} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus size={16} />
            Nova Campanha
          </Button>
          <Button onClick={() => setView('vendas-funcionarios')} variant="outline" className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            <Users size={16} />
            Vendas API Externa
          </Button>
          <Button onClick={() => setView('status')} variant="outline" className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            <Trophy size={16} />
            Status & Rankings
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dataInicio" className="text-sm font-medium">Data Início</Label>
              <Input id="dataInicio" type="date" value={filtroData.dataInicio} onChange={e => setFiltroData(prev => ({
              ...prev,
              dataInicio: e.target.value
            }))} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="dataFim" className="text-sm font-medium">Data Fim</Label>
              <Input id="dataFim" type="date" value={filtroData.dataFim} onChange={e => setFiltroData(prev => ({
              ...prev,
              dataFim: e.target.value
            }))} className="mt-1" />
            </div>
            <div className="flex items-end">
              <Button onClick={buscarCampanhas} className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90" size="default">
                <Target size={16} />
                Buscar Campanhas
              </Button>
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t">
            <Button variant={!incluirInativas ? "default" : "outline"} onClick={() => setIncluirInativas(false)} className={`gap-2 ${!incluirInativas ? 'bg-primary text-primary-foreground' : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'}`} size="sm">
              <CheckCircle size={14} />
              Apenas Ativas
            </Button>
            <Button variant={incluirInativas ? "default" : "outline"} onClick={() => setIncluirInativas(true)} className={`gap-2 ${incluirInativas ? 'bg-primary text-primary-foreground' : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'}`} size="sm">
              <Clock size={14} />
              Todas as Campanhas
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Carregando campanhas...</p>
        </div> : campanhas.length === 0 ? <Card className="shadow-sm">
          <CardContent className="text-center py-12">
            <ChartLine className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma campanha encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Não encontramos campanhas com os filtros aplicados.
            </p>
            <Button onClick={() => setView('criar')} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus size={16} />
              Criar Primeira Campanha
            </Button>
          </CardContent>
        </Card> : <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {campanhas.length} {campanhas.length === 1 ? 'campanha encontrada' : 'campanhas encontradas'}
            </h2>
            <Badge variant="outline" className="gap-1">
              <Target size={12} />
              {campanhas.filter(c => c.status === 'ativa').length} ativas
            </Badge>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campanhas.map(campanha => {
          const realizadoTotal = campanha.tipo_meta === 'quantidade' ? campanha.total_realizado_quantidade || 0 : campanha.total_realizado_valor || 0;
          const progresso = calcularProgresso(realizadoTotal, campanha.meta_total || 0, campanha.data_inicio, campanha.data_fim);
          return <Card key={campanha.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg leading-tight">{campanha.nome}</CardTitle>
                        {campanha.descricao && <p className="text-sm text-muted-foreground line-clamp-2">
                            {campanha.descricao}
                          </p>}
                      </div>
                      <StatusBadge status={campanha.status === 'ativa' ? 'atingido' : 'pendente'} />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-muted-foreground">Período:</span>
                        <div className="font-medium">
                          {formatarData(campanha.data_inicio)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          até {formatarData(campanha.data_fim)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground">Tipo:</span>
                        <div className="font-medium capitalize flex items-center gap-1">
                          {campanha.tipo_meta === 'quantidade' ? <><Target size={12} /> Quantidade</> : <><TrendingUp size={12} /> Valor</>}
                        </div>
                      </div>
                    </div>

                    {!campanha.sem_metas && <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{progresso.percentualRealizado.toFixed(1)}%</span>
                        </div>
                        <Progress value={progresso.percentualRealizado} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatarValor(progresso.realizado, campanha.tipo_meta)} realizado</span>
                          <span>Meta: {formatarValor(progresso.meta, campanha.tipo_meta)}</span>
                        </div>
                      </div>}

                    <div className="flex gap-2 pt-2 border-t">
                      <Button variant="secondary" size="sm" onClick={async () => {
                  await buscarDetalheCampanha(campanha.id);
                  setView('detalhes');
                }} className="flex-1 gap-1">
                        <Eye size={14} />
                        Detalhes
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => iniciarEdicaoCampanha(campanha)}>
                        <Edit size={14} />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>;
        })}
          </div>
        </div>}
    </div>;
  const renderDetalhes = () => {
    if (!campanhaSelecionada) {
      return (
        <div className="space-y-4">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="h-32 w-full bg-muted rounded animate-pulse" />
        </div>
      );
    }
    return <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setView('lista')} className="gap-2">
              <ArrowLeft size={16} />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">{campanhaSelecionada.nome}</h1>
            <StatusBadge status={campanhaSelecionada.status === 'ativa' ? 'atingido' : 'pendente'} />
          </div>
          <Button onClick={() => buscarVendasApiExterna(campanhaSelecionada)} disabled={loadingApiExterna} className="gap-2">
            <TrendingUp size={16} />
            {loadingApiExterna ? 'Atualizando...' : 'Atualizar API Externa'}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{campanhaSelecionada.lojas.length}</p>
                  <p className="text-sm text-muted-foreground">Lojas Participantes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{campanhaSelecionada.estatisticas?.total_dias_com_dados || 0}</p>
                  <p className="text-sm text-muted-foreground">Dias com Dados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-lg font-bold capitalize">{campanhaSelecionada.tipo_meta}</p>
                  <p className="text-sm text-muted-foreground">Tipo de Meta</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Renderizar cada grupo separadamente */}
          {[1, 2, 3].map(grupoNumero => {
          const lojasDoGrupo = campanhaSelecionada.lojas.filter(loja => loja.grupo_nome === grupoNumero.toString()).sort((a, b) => {
            // Ordenar por percentual de meta (maior para menor)
            return b.percentual_meta - a.percentual_meta;
          });
          if (lojasDoGrupo.length === 0) return null;
          return <Card key={grupoNumero}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="h-5 w-5" />
                    Grupo {grupoNumero}
                    <Badge variant="secondary">{lojasDoGrupo.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {lojasDoGrupo.map((loja, index) => {
                const valorRealizado = campanhaSelecionada.tipo_meta === 'quantidade' ? loja.realizado_quantidade : loja.realizado_valor;
                const valorMeta = campanhaSelecionada.tipo_meta === 'quantidade' ? loja.meta_quantidade : loja.meta_valor;

                // Emoji de medalha baseado na posição
                let medalha = '';
                if (index === 0) medalha = '🥇';else if (index === 1) medalha = '🥈';else if (index === 2) medalha = '🥉';else medalha = `${index + 1}º`;
                return <div key={loja.id} className="flex items-center justify-between py-1 px-2 bg-muted/30 rounded text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="flex items-center justify-center min-w-[24px] h-6 rounded-full text-secondary-foreground font-bold text-xs border border-secondary-foreground/20 bg-gray-200">
                            {index < 3 ? <span className="text-xs">{medalha}</span> : <span className="text-[10px]">{medalha}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate text-sm leading-tight">
                              {loja.codigo_loja} - {loja.loja_nome || 'Sem nome'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-primary leading-tight">
                            {loja.percentual_meta.toFixed(1)}%
                          </div>
                          <div className="text-[10px] text-muted-foreground leading-tight">
                            ({formatarValor(valorRealizado, campanhaSelecionada.tipo_meta)}/{formatarValor(valorMeta, campanhaSelecionada.tipo_meta)})
                          </div>
                        </div>
                      </div>;
              })}
                </CardContent>
              </Card>;
        })}
        </div>
      </div>;
  };
  const renderCriar = () => <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => setView('lista')} className="gap-2">
          <ArrowLeft size={16} />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Nova Campanha de Vendas por Loja</h1>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Os dados de vendas serão coletados periodicamente do sistema.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Campanha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Campanha *</Label>
              <Input id="nome" placeholder="Digite o nome da campanha" value={novaCampanha.nome} onChange={e => setNovaCampanha(prev => ({
              ...prev,
              nome: e.target.value
            }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_meta">Tipo de Meta</Label>
              <Select value={novaCampanha.tipo_meta} onValueChange={value => setNovaCampanha(prev => ({
              ...prev,
              tipo_meta: value
            }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantidade">Quantidade</SelectItem>
                  <SelectItem value="valor">Valor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início *</Label>
              <Input id="data_inicio" type="date" value={novaCampanha.data_inicio} onChange={e => setNovaCampanha(prev => ({
              ...prev,
              data_inicio: e.target.value
            }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_fim">Data de Término *</Label>
              <Input id="data_fim" type="date" value={novaCampanha.data_fim} onChange={e => setNovaCampanha(prev => ({
              ...prev,
              data_fim: e.target.value
            }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" placeholder="Descreva os objetivos da campanha" value={novaCampanha.descricao} onChange={e => setNovaCampanha(prev => ({
            ...prev,
            descricao: e.target.value
          }))} />
          </div>

          {/* Seção de Filtros de Produtos */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Filtros de Produtos</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fornecedores">Fornecedores (texto livre)</Label>
                <Input id="fornecedores" placeholder="Ex: Farmácia Popular, Droga Raia, Drogasil..." value={novaCampanha.fornecedores} onChange={e => setNovaCampanha(prev => ({
                ...prev,
                fornecedores: e.target.value
              }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marcas">Marcas (texto livre)</Label>
                <Input id="marcas" placeholder="Ex: Aspirina, Tylenol, Dipirona..." value={novaCampanha.marcas} onChange={e => setNovaCampanha(prev => ({
                ...prev,
                marcas: e.target.value
              }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grupos">Grupos de Produtos (texto livre)</Label>
                <Input id="grupos" placeholder="Ex: Analgésicos, Antibióticos, Vitaminas..." value={novaCampanha.grupos_produtos} onChange={e => setNovaCampanha(prev => ({
                ...prev,
                grupos_produtos: e.target.value
              }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="familias">Famílias (texto livre)</Label>
                <Input id="familias" placeholder="Ex: Medicamentos, Cosméticos, Higiene..." value={novaCampanha.familias} onChange={e => setNovaCampanha(prev => ({
                ...prev,
                familias: e.target.value
              }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="produtos">Produtos Específicos (texto livre)</Label>
              <Textarea id="produtos" placeholder="Ex: Aspirina 500mg, Dipirona Gotas, Vitamina C..." value={novaCampanha.produtos} onChange={e => setNovaCampanha(prev => ({
              ...prev,
              produtos: e.target.value
            }))} rows={3} />
              <p className="text-sm text-muted-foreground">
                Deixe em branco para usar apenas os filtros acima (fornecedores, marcas, grupos, famílias)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Lojas Participantes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Lojas Participantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulário Rápido para Adicionar Lojas */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Adição Rápida de Lojas</CardTitle>
              <CardDescription>Digite apenas o número da loja para adicionar rapidamente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div className="space-y-2">
                  <Label htmlFor="numeroLoja">Número da Loja *</Label>
                  <Input id="numeroLoja" type="text" value={formRapido.numeroLoja} onChange={e => setFormRapido(prev => ({
                  ...prev,
                  numeroLoja: e.target.value
                }))} placeholder="Ex: 22" className="text-center font-medium" onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const loja = buscarLojaPorNumero(formRapido.numeroLoja);
                    if (loja) {
                      document.getElementById('grupoLoja')?.focus();
                    }
                  }
                }} />
                  {formRapido.numeroLoja && buscarLojaPorNumero(formRapido.numeroLoja) && <div className="text-sm text-primary font-medium">
                      {buscarLojaPorNumero(formRapido.numeroLoja)?.numero} - {buscarLojaPorNumero(formRapido.numeroLoja)?.nome}
                    </div>}
                  {formRapido.numeroLoja && !buscarLojaPorNumero(formRapido.numeroLoja) && <div className="text-sm text-destructive">
                      Loja não encontrada
                    </div>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grupoLoja">Grupo *</Label>
                  <Select value={formRapido.grupo} onValueChange={value => setFormRapido(prev => ({
                  ...prev,
                  grupo: value
                }))}>
                    <SelectTrigger id="grupoLoja" className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      <SelectItem value="1">Grupo 1</SelectItem>
                      <SelectItem value="2">Grupo 2</SelectItem>
                      <SelectItem value="3">Grupo 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaQtd">Meta Quantidade</Label>
                  <Input id="metaQtd" type="number" value={formRapido.metaQuantidade} onChange={e => setFormRapido(prev => ({
                  ...prev,
                  metaQuantidade: e.target.value
                }))} placeholder="0" min="0" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaValor">Meta Valor (R$)</Label>
                  <Input id="metaValor" type="text" inputMode="decimal" value={formRapido.metaValor} onChange={e => setFormRapido(prev => ({
                  ...prev,
                  metaValor: e.target.value
                }))} placeholder="0,00" />
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={adicionarLojaRapido} disabled={!formRapido.numeroLoja || !buscarLojaPorNumero(formRapido.numeroLoja)} className="gap-2">
                    <Plus size={16} />
                    Adicionar
                  </Button>
                  <Button type="button" variant="outline" onClick={resetarFormRapido} size="sm">
                    Limpar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão para adicionar lojas restantes (caso o usuário tenha removido alguma) */}
          {lojasDisponiveis.filter(loja => !lojasParticipantes.find(l => l.loja_id === loja.id)).length > 0 && <div className="space-y-2">
              <Label>Ou escolha da lista completa</Label>
              <Select onValueChange={lojaId => {
            const loja = lojasDisponiveis.find(l => l.id === parseInt(lojaId));
            if (loja) adicionarLoja(loja);
          }}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Escolha uma loja para adicionar" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {lojasDisponiveis.filter(loja => !lojasParticipantes.find(l => l.loja_id === loja.id)).map(loja => <SelectItem key={loja.id} value={loja.id.toString()}>
                        {loja.numero} - {loja.nome} ({loja.regiao})
                      </SelectItem>)}
                </SelectContent>
              </Select>
            </div>}

          {/* Lista de lojas participantes */}
          {lojasParticipantes.length > 0 && <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Lojas Participantes e Metas ({lojasParticipantes.length})</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                // Selecionar todas as lojas (exceto "outras")
                const todasLojas = lojasDisponiveis.filter(loja => loja.nome.toLowerCase() !== 'outras' && loja.nome.toLowerCase() !== 'outro' && loja.numero !== '999').map(loja => ({
                  loja_id: loja.id,
                  codigo_loja: parseInt(loja.numero),
                  meta_quantidade: 0,
                  meta_valor: 0,
                  grupo_id: '1'
                }));
                setLojasParticipantes(todasLojas);
              }}>
                    Selecionar Todas
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setLojasParticipantes([])}>
                    Limpar Todas
                  </Button>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Renderizar cada grupo separadamente */}
                {[1, 2, 3].map(grupoNumero => {
                  const lojasDoGrupo = lojasParticipantes.filter(lojaParticipante => Number(lojaParticipante.grupo_id) === grupoNumero);
                  
                  return (
                    <Card key={grupoNumero} className="h-fit">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Trophy className="h-4 w-4" />
                          Grupo {grupoNumero}
                          <Badge variant="secondary">{lojasDoGrupo.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {lojasDoGrupo.length === 0 ? (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            Nenhuma loja neste grupo
                          </div>
                        ) : (
                          lojasDoGrupo.map(lojaParticipante => {
                            const loja = lojasDisponiveis.find(l => l.id === lojaParticipante.loja_id);
                            return (
                              <div key={lojaParticipante.loja_id} className="p-3 border rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium text-sm">
                                    {loja?.numero} - {loja?.nome}
                                  </div>
                                  <Button variant="destructive" size="sm" onClick={() => removerLoja(lojaParticipante.loja_id)}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <Label className="text-xs">Grupo</Label>
                                    <Select value={lojaParticipante.grupo_id} onValueChange={value => {
                                      setLojasParticipantes(prev => prev.map(l => l.loja_id === lojaParticipante.loja_id ? { ...l, grupo_id: value } : l));
                                    }}>
                                      <SelectTrigger className="h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="1">1</SelectItem>
                                        <SelectItem value="2">2</SelectItem>
                                        <SelectItem value="3">3</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  {novaCampanha.tipo_meta === 'quantidade' ? (
                                    <div>
                                      <Label className="text-xs">Meta Quantidade</Label>
                                      <Input 
                                        type="number" 
                                        placeholder="0" 
                                        className="h-8" 
                                        value={lojaParticipante.meta_quantidade} 
                                        onChange={e => atualizarMetaLoja(lojaParticipante.loja_id, 'meta_quantidade', parseInt(e.target.value) || 0)} 
                                      />
                                    </div>
                                  ) : (
                                    <div>
                                      <Label className="text-xs">Meta Valor (R$)</Label>
                                      <Input 
                                        type="text" 
                                        inputMode="decimal" 
                                        placeholder="0,00" 
                                        className="h-8" 
                                        value={lojaParticipante.meta_valor} 
                                        onChange={e => atualizarMetaLoja(lojaParticipante.loja_id, 'meta_valor', parseFloat(e.target.value.replace(',', '.')) || 0)} 
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button className="gap-2" onClick={criarCampanha} disabled={criandoCampanha}>
          <CheckCircle size={16} />
          {criandoCampanha ? 'Criando...' : 'Criar Campanha'}
        </Button>
        <Button variant="outline" onClick={() => setView('lista')}>
          Cancelar
        </Button>
      </div>
    </div>;
  const renderEditar = () => {
    if (!campanhaEditando) return null;
    return <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setView('lista')} className="gap-2">
            <ArrowLeft size={16} />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Editar Campanha de Vendas por Loja</h1>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Edição de Campanha</AlertTitle>
          <AlertDescription>
            Você está editando uma campanha existente. As mudanças afetarão todas as lojas participantes.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Campanha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editNome">Nome da Campanha *</Label>
                <Input id="editNome" value={campanhaEditando.nome} onChange={e => setCampanhaEditando(prev => ({
                ...prev,
                nome: e.target.value
              }))} placeholder="Digite o nome da campanha" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTipoMeta">Tipo de Meta *</Label>
                <Select value={campanhaEditando.tipo_meta} onValueChange={value => setCampanhaEditando(prev => ({
                ...prev,
                tipo_meta: value
              }))}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="quantidade">Quantidade</SelectItem>
                    <SelectItem value="valor">Valor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDescricao">Descrição</Label>
              <Textarea id="editDescricao" value={campanhaEditando.descricao} onChange={e => setCampanhaEditando(prev => ({
              ...prev,
              descricao: e.target.value
            }))} placeholder="Descreva os objetivos e critérios da campanha" rows={3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editDataInicio">Data de Início *</Label>
                <Input id="editDataInicio" type="date" value={campanhaEditando.data_inicio} onChange={e => setCampanhaEditando(prev => ({
                ...prev,
                data_inicio: e.target.value
              }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDataFim">Data de Fim *</Label>
                <Input id="editDataFim" type="date" value={campanhaEditando.data_fim} onChange={e => setCampanhaEditando(prev => ({
                ...prev,
                data_fim: e.target.value
              }))} />
              </div>
            </div>

            {/* Seção de Filtros de Produtos */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">Filtros de Produtos</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editFornecedores">Fornecedores (texto livre)</Label>
                  <Input id="editFornecedores" placeholder="Ex: Farmácia Popular, Droga Raia, Drogasil..." value={campanhaEditando.fornecedores} onChange={e => setCampanhaEditando(prev => ({
                  ...prev,
                  fornecedores: e.target.value
                }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editMarcas">Marcas (texto livre)</Label>
                  <Input id="editMarcas" placeholder="Ex: Aspirina, Tylenol, Dipirona..." value={campanhaEditando.marcas} onChange={e => setCampanhaEditando(prev => ({
                  ...prev,
                  marcas: e.target.value
                }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editGrupos">Grupos de Produtos (texto livre)</Label>
                  <Input id="editGrupos" placeholder="Ex: Analgésicos, Antibióticos, Vitaminas..." value={campanhaEditando.grupos_produtos} onChange={e => setCampanhaEditando(prev => ({
                  ...prev,
                  grupos_produtos: e.target.value
                }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editFamilias">Famílias (texto livre)</Label>
                  <Input id="editFamilias" placeholder="Ex: Medicamentos, Cosméticos, Higiene..." value={campanhaEditando.familias} onChange={e => setCampanhaEditando(prev => ({
                  ...prev,
                  familias: e.target.value
                }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editProdutos">Produtos Específicos (texto livre)</Label>
                <Textarea id="editProdutos" placeholder="Ex: Aspirina 500mg, Dipirona Gotas, Vitamina C..." value={campanhaEditando.produtos} onChange={e => setCampanhaEditando(prev => ({
                ...prev,
                produtos: e.target.value
              }))} rows={3} />
                <p className="text-sm text-muted-foreground">
                  Deixe em branco para usar apenas os filtros acima (fornecedores, marcas, grupos, famílias)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lojas Participantes</CardTitle>
            <CardDescription>
              Gerencie quais lojas participam da campanha e suas respectivas metas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
              // Selecionar todas as lojas (exceto "outras")
              const todasLojas = lojasDisponiveis.filter(loja => loja.nome.toLowerCase() !== 'outras' && loja.nome.toLowerCase() !== 'outro' && loja.numero !== '999').map(loja => ({
                loja_id: loja.id,
                codigo_loja: parseInt(loja.numero),
                meta_quantidade: 0,
                meta_valor: 0,
                grupo_id: '1'
              }));
              setLojasParticipantes(todasLojas);
            }}>
                Selecionar Todas
              </Button>
              <Button variant="outline" size="sm" onClick={() => setLojasParticipantes([])}>
                Limpar Todas
              </Button>
            </div>

            {/* Lista de lojas participantes organizada por grupos */}
            {lojasParticipantes.length > 0 && (
              <div className="grid gap-6 md:grid-cols-3">
                {/* Renderizar cada grupo separadamente */}
                {[1, 2, 3].map(grupoNumero => {
                  const lojasDoGrupo = lojasParticipantes.filter(loja => Number(loja.grupo_id) === grupoNumero);
                  
                  return (
                    <Card key={grupoNumero} className="h-fit">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Trophy className="h-4 w-4" />
                          Grupo {grupoNumero}
                          <Badge variant="secondary">{lojasDoGrupo.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {lojasDoGrupo.length === 0 ? (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            Nenhuma loja neste grupo
                          </div>
                        ) : (
                          lojasDoGrupo.map((loja, index) => {
                            const lojaInfo = lojasDisponiveis.find(l => l.id === loja.loja_id);
                            const globalIndex = lojasParticipantes.findIndex(l => l.loja_id === loja.loja_id);
                            
                            return (
                              <div key={globalIndex} className="p-3 border rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-medium text-sm">{lojaInfo?.numero}</span>
                                    <p className="text-xs text-muted-foreground">{lojaInfo?.nome}</p>
                                  </div>
                                  <Button variant="destructive" size="sm" onClick={() => {
                                    const novasLojas = lojasParticipantes.filter((_, i) => i !== globalIndex);
                                    setLojasParticipantes(novasLojas);
                                  }}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <Label className="text-xs">Grupo</Label>
                                    <Select value={loja.grupo_id} onValueChange={value => {
                                      const novasLojas = [...lojasParticipantes];
                                      novasLojas[globalIndex].grupo_id = value;
                                      setLojasParticipantes(novasLojas);
                                    }}>
                                      <SelectTrigger className="h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="1">1</SelectItem>
                                        <SelectItem value="2">2</SelectItem>
                                        <SelectItem value="3">3</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  {campanhaEditando?.tipo_meta === 'quantidade' ? (
                                    <div>
                                      <Label className="text-xs">Meta Quantidade</Label>
                                      <Input 
                                        type="number" 
                                        value={loja.meta_quantidade} 
                                        onChange={e => {
                                          const novasLojas = [...lojasParticipantes];
                                          novasLojas[globalIndex].meta_quantidade = parseInt(e.target.value) || 0;
                                          setLojasParticipantes(novasLojas);
                                        }} 
                                        className="h-8" 
                                      />
                                    </div>
                                  ) : (
                                    <div>
                                      <Label className="text-xs">Meta Valor (R$)</Label>
                                      <Input 
                                        type="text" 
                                        inputMode="decimal" 
                                        value={loja.meta_valor} 
                                        onChange={e => {
                                          const novasLojas = [...lojasParticipantes];
                                          const valor = parseFloat(e.target.value.replace(',', '.')) || 0;
                                          novasLojas[globalIndex].meta_valor = valor;
                                          setLojasParticipantes(novasLojas);
                                        }} 
                                        className="h-8" 
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Dropdown para adicionar lojas */}
            <div className="space-y-2">
              <Label>Adicionar Loja</Label>
              <Select onValueChange={value => {
              const lojaId = parseInt(value);
              const loja = lojasDisponiveis.find(l => l.id === lojaId);
              if (loja && !lojasParticipantes.some(p => p.loja_id === lojaId)) {
                setLojasParticipantes(prev => [...prev, {
                  loja_id: lojaId,
                  codigo_loja: parseInt(loja.numero),
                  meta_quantidade: 0,
                  meta_valor: 0,
                  grupo_id: '1'
                }]);
              }
            }}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione uma loja para adicionar" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {lojasDisponiveis.filter(loja => !lojasParticipantes.some(p => p.loja_id === loja.id) && loja.nome.toLowerCase() !== 'outras' && loja.nome.toLowerCase() !== 'outro' && loja.numero !== '999').map(loja => <SelectItem key={loja.id} value={loja.id.toString()}>
                        {loja.numero} - {loja.nome}
                      </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Button onClick={salvarEdicaoCampanha} disabled={editandoCampanha} className="gap-2">
              <CheckCircle size={16} />
              {editandoCampanha ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Button variant="outline" onClick={() => setView('lista')}>
              Cancelar
            </Button>
          </div>
          
          {/* Botão de exclusão - só aparece para admins */}
          <Button variant="destructive" onClick={() => excluirCampanha(campanhaEditando.id)} disabled={editandoCampanha} className="gap-2">
            <X size={16} />
            Excluir Campanha
          </Button>
        </div>
      </div>;
  };
  const renderVendasFuncionarios = () => <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setView('lista')} className="gap-2">
            <ArrowLeft size={16} />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Vendas por Funcionário - API Externa</h1>
        </div>
      </div>
      <VendasFuncionarios />
    </div>;

  // Carregar dados do status quando a view mudar
  useEffect(() => {
    if (view === 'status') {
      carregarCampanhasStatus();
    }
  }, [view]);
  useEffect(() => {
    if (view === 'status' && campanhaStatusSelecionada) {
      carregarDadosStatus();
    }
  }, [campanhaStatusSelecionada, viewMode]);
  const carregarDadosStatus = async () => {
    setLoading(true);
    try {
      if (viewMode === 'lojas') {
        await carregarRankingLojas();
      } else {
        await carregarRankingColaboradores();
      }
    } catch (error) {
      console.error('Erro ao carregar dados do status:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const carregarCampanhasStatus = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('campanhas_vendas_lojas').select('*').eq('status', 'ativa').order('data_fim', {
        ascending: true
      });
      if (error) throw error;
      const campanhasFormatadas = (data || []).map(campanha => ({
        id: campanha.id,
        nome: campanha.nome || '',
        descricao: campanha.descricao || '',
        data_inicio: campanha.data_inicio || '',
        data_fim: campanha.data_fim || '',
        tipo_meta: campanha.tipo_meta as 'quantidade' | 'valor' || 'quantidade',
        status: campanha.status as 'ativa' | 'inativa' | 'encerrada' || 'ativa',
        sem_metas: campanha.sem_metas === '1',
        criado_por: campanha.criado_por || 0
      }));
      setCampanhasStatus(campanhasFormatadas);

      // Selecionar a primeira campanha automaticamente
      if (campanhasFormatadas.length > 0 && !campanhaStatusSelecionada) {
        setCampanhaStatusSelecionada(campanhasFormatadas[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar campanhas",
        variant: "destructive"
      });
    }
  };
  const carregarRankingLojas = async () => {
    if (!campanhaStatusSelecionada) return;
    try {
      // Buscar dados da campanha selecionada
      const {
        data: campanha,
        error: erroCampanha
      } = await supabase.from('campanhas_vendas_lojas').select('*').eq('id', campanhaStatusSelecionada).single();
      if (erroCampanha) throw erroCampanha;

      // Buscar lojas participantes da campanha
      const {
        data: participantes,
        error: participantesError
      } = await supabase.from('campanhas_vendas_lojas_participantes').select('*').eq('campanha_id', campanhaStatusSelecionada);
      if (participantesError) throw participantesError;
      if (!participantes || participantes.length === 0) {
        setGruposRanking([]);
        return;
      }

      // Buscar dados das lojas
      const lojasIds = participantes.map(p => p.loja_id);
      const {
        data: lojas,
        error: lojasError
      } = await supabase.from('lojas').select('*').in('id', lojasIds);
      if (lojasError) throw lojasError;

      // Buscar vendas da API externa para a campanha usando o período completo
      const filtros = {
        dataInicio: campanha.data_inicio,
        dataFim: campanha.data_fim,
        filtroFornecedores: campanha.fornecedores?.toString(),
        filtroMarcas: campanha.marcas?.toString(),
        filtroFamilias: campanha.familias?.toString(),
        filtroGrupos: campanha.grupos_produtos?.join(','),
        filtroProduto: campanha.produtos?.toString()
      };
      const vendasApiExterna = await buscarVendasCampanha(filtros);
      const lojasComVendas: LojaRanking[] = [];
      for (const participante of participantes) {
        const loja = lojas?.find(l => l.id === participante.loja_id);
        if (!loja) continue;

        // Buscar vendas da API externa pelo código da loja
        const vendaApiExterna = vendasApiExterna.find(v => v.CDFIL === participante.codigo_loja);
        const totalVendas = campanha.tipo_meta === 'quantidade' ? (vendaApiExterna?.TOTAL_QUANTIDADE || 0) - (vendaApiExterna?.TOTAL_QTD_DV || 0) : (vendaApiExterna?.TOTAL_VALOR || 0) - (vendaApiExterna?.TOTAL_VLR_DV || 0);

        // Buscar total de colaboradores da loja
        const {
          count: totalColaboradores
        } = await supabase.from('usuarios').select('*', {
          count: 'exact',
          head: true
        }).eq('loja_id', loja.id).neq('tipo', 'admin');
        const mediaVendasPorColaborador = totalColaboradores && totalColaboradores > 0 ? totalVendas / totalColaboradores : 0;

        // Buscar meta da loja baseada no tipo da campanha
        const meta = campanha.tipo_meta === 'quantidade' ? participante.meta_quantidade || 0 : participante.meta_valor || 0;
        const percentualAtingimento = meta > 0 ? totalVendas / meta * 100 : 0;
        lojasComVendas.push({
          id: loja.id,
          numero: loja.numero,
          nome: loja.nome,
          grupo_id: participante.grupo_id || '1',
          totalVendas,
          meta,
          percentualAtingimento,
          totalColaboradores: totalColaboradores || 0,
          mediaVendasPorColaborador,
          posicao: 0
        });
      }

      // Agrupar lojas por grupo
      const gruposMap = new Map<string, LojaRanking[]>();
      lojasComVendas.forEach(loja => {
        if (!gruposMap.has(loja.grupo_id)) {
          gruposMap.set(loja.grupo_id, []);
        }
        gruposMap.get(loja.grupo_id)!.push(loja);
      });
      const grupos: GrupoRanking[] = [];
      gruposMap.forEach((lojasGrupo, grupoId) => {
        // Ordenar lojas do grupo por percentual de atingimento
        lojasGrupo.sort((a, b) => b.percentualAtingimento - a.percentualAtingimento);

        // Adicionar posições dentro do grupo
        const lojasComPosicoes = lojasGrupo.map((loja, index) => ({
          ...loja,
          posicao: index + 1
        }));
        const totalVendasGrupo = lojasGrupo.reduce((sum, loja) => sum + loja.totalVendas, 0);
        const totalMetaGrupo = lojasGrupo.reduce((sum, loja) => sum + loja.meta, 0);
        const percentualAtingimentoGrupo = totalMetaGrupo > 0 ? totalVendasGrupo / totalMetaGrupo * 100 : 0;
        const totalColaboradoresGrupo = lojasGrupo.reduce((sum, loja) => sum + loja.totalColaboradores, 0);
        grupos.push({
          grupo_id: grupoId,
          nome_grupo: `Grupo ${grupoId}`,
          lojas: lojasComPosicoes,
          colaboradores: [],
          totalVendas: totalVendasGrupo,
          totalMeta: totalMetaGrupo,
          percentualAtingimentoGrupo,
          totalLojas: lojasGrupo.length,
          totalColaboradores: totalColaboradoresGrupo
        });
      });

      // Ordenar grupos por percentual de atingimento
      grupos.sort((a, b) => b.percentualAtingimentoGrupo - a.percentualAtingimentoGrupo);
      setGruposRanking(grupos);
    } catch (error) {
      console.error('Erro ao carregar ranking de lojas:', error);
    }
  };
  const carregarRankingColaboradores = async () => {
    if (!campanhaStatusSelecionada) return;
    try {
      // 1) Dados da campanha e participantes
      const {
        data: campanha,
        error: erroCampanha
      } = await supabase.from('campanhas_vendas_lojas').select('*').eq('id', campanhaStatusSelecionada).single();
      if (erroCampanha) throw erroCampanha;
      const {
        data: participantes,
        error: participantesError
      } = await supabase.from('campanhas_vendas_lojas_participantes').select('*').eq('campanha_id', campanhaStatusSelecionada);
      if (participantesError) throw participantesError;
      if (!participantes || participantes.length === 0) {
        setGruposRanking([]);
        return;
      }

      // 2) Buscar lojas para nomes e números
      const lojasIds = participantes.map(p => p.loja_id);
      const {
        data: lojas,
        error: lojasError
      } = await supabase.from('lojas').select('*').in('id', lojasIds);
      if (lojasError) throw lojasError;

      // 3) Buscar vendas por COLABORADOR na API externa, filtrando por produtos
      const filtros = {
        dataInicio: campanha.data_inicio,
        dataFim: campanha.data_fim,
        filtroFornecedores: campanha.fornecedores?.toString(),
        filtroMarcas: campanha.marcas?.toString(),
        filtroFamilias: campanha.familias?.toString(),
        filtroGrupos: campanha.grupos_produtos?.join(','),
        filtroProduto: campanha.produtos?.toString()
      };
      const vendasColaboradores = await buscarVendasCampanhaDetalhada(filtros);

      // 4) Montar ranking por colaborador dentro do grupo da loja
      const colaboradoresComVendas: ColaboradorRanking[] = [];
      for (const item of vendasColaboradores) {
        const participante = participantes.find(p => p.codigo_loja === item.CDFIL);
        if (!participante) continue; // ignorar lojas fora da campanha

        const loja = lojas?.find(l => l.id === participante.loja_id);
        const vendas = campanha.tipo_meta === 'quantidade' ? Number(item.TOTAL_QTD_VE || 0) - Number(item.TOTAL_QTD_DV || 0) : Number(item.TOTAL_VLR_VE || 0) - Number(item.TOTAL_VLR_DV || 0);
        if (vendas <= 0) continue;
        colaboradoresComVendas.push({
          id: Number(item.CDFUN) || 0,
          nome: item.NOMEFUN || 'Colaborador',
          loja_id: participante.loja_id || 0,
          loja_nome: loja?.nome || item.NOMEFIL || 'Loja',
          grupo_id: String(participante.grupo_id || '1'),
          totalVendas: vendas,
          posicao: 0
        });
      }

      // 5) Agrupar por grupo e ordenar por vendas
      const gruposMap = new Map<string, ColaboradorRanking[]>();
      colaboradoresComVendas.forEach(c => {
        if (!gruposMap.has(c.grupo_id)) gruposMap.set(c.grupo_id, []);
        gruposMap.get(c.grupo_id)!.push(c);
      });
      const grupos: GrupoRanking[] = [];
      gruposMap.forEach((cols, grupoId) => {
        cols.sort((a, b) => b.totalVendas - a.totalVendas);
        const colsComPosicao = cols.map((c, i) => ({
          ...c,
          posicao: i + 1
        }));
        const totalVendasGrupo = cols.reduce((sum, c) => sum + c.totalVendas, 0);
        grupos.push({
          grupo_id: grupoId,
          nome_grupo: `Grupo ${grupoId}`,
          lojas: [],
          colaboradores: colsComPosicao,
          totalVendas: totalVendasGrupo,
          totalMeta: 0,
          percentualAtingimentoGrupo: 0,
          totalLojas: 0,
          totalColaboradores: cols.length
        });
      });
      grupos.sort((a, b) => b.totalVendas - a.totalVendas);
      setGruposRanking(grupos);
    } catch (error) {
      console.error('Erro ao carregar ranking de colaboradores:', error);
    }
  };
  const formatarValorCampanha = (valor: number, tipoCampanha: 'quantidade' | 'valor') => {
    if (tipoCampanha === 'quantidade') {
      return `${valor.toLocaleString('pt-BR')} un`;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };
  const obterIconePosicao = (posicao: number) => {
    if (posicao === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (posicao === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (posicao === 3) return <Award className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">{posicao}º</span>;
  };
  const obterCorCard = (posicao: number) => {
    if (posicao === 1) return 'border-yellow-500 bg-yellow-50';
    if (posicao === 2) return 'border-gray-400 bg-gray-50';
    if (posicao === 3) return 'border-amber-600 bg-amber-50';
    return '';
  };
  const renderStatus = () => <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setView('lista')} className="gap-2">
            <ArrowLeft size={16} />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Status e Rankings
          </h1>
        </div>
        {campanhaStatusSelecionada && <Badge variant="outline" className="text-sm">
            {campanhasStatus.find(c => c.id === campanhaStatusSelecionada)?.nome}
          </Badge>}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Campanha</label>
              <Select value={campanhaStatusSelecionada?.toString() || ''} onValueChange={value => setCampanhaStatusSelecionada(parseInt(value))}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione uma campanha" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {campanhasStatus.map(campanha => <SelectItem key={campanha.id} value={campanha.id.toString()}>
                      {campanha.nome}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Visualização</label>
              <div className="flex gap-2">
                <Button variant={viewMode === 'lojas' ? "default" : "outline"} onClick={() => setViewMode('lojas')} className="flex-1">
                  <Store className="h-4 w-4 mr-2" />
                  Lojas
                </Button>
                <Button variant={viewMode === 'colaboradores' ? "default" : "outline"} onClick={() => setViewMode('colaboradores')} className="flex-1">
                  <Users className="h-4 w-4 mr-2" />
                  Colaboradores
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? <div className="text-center py-8">Carregando rankings...</div> : <Tabs value={viewMode} onValueChange={value => setViewMode(value as 'lojas' | 'colaboradores')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lojas" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Ranking de Lojas
            </TabsTrigger>
            <TabsTrigger value="colaboradores" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Ranking de Colaboradores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lojas" className="space-y-4">
            <div className="grid gap-4">
            {campanhaStatusSelecionada && <div className="text-right">
                <h2 className="text-xl font-semibold">
                  {campanhasStatus.find(c => c.id === campanhaStatusSelecionada)?.nome} - Ranking de Lojas por Grupo
                </h2>
                <Badge variant="secondary">
                  {gruposRanking.reduce((sum, grupo) => sum + grupo.totalLojas, 0)} lojas em {gruposRanking.length} grupos
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">
                  Campanha por: {campanhasStatus.find(c => c.id === campanhaStatusSelecionada)?.tipo_meta === 'quantidade' ? 'Quantidade' : 'Valor'}
                </div>
              </div>}
              {gruposRanking.length === 0 ? <Card>
                  <CardContent className="text-center py-12">
                    <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma loja com vendas encontrada no período.</p>
                  </CardContent>
                </Card> : <div className="space-y-6">
                  {gruposRanking.map((grupo, grupoIndex) => <Card key={grupo.grupo_id} className="border-2">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <span className="text-2xl font-bold">#{grupoIndex + 1}</span>
                            <span>{grupo.nome_grupo}</span>
                          </CardTitle>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {grupo.percentualAtingimentoGrupo.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {grupo.totalLojas} lojas • {grupo.totalColaboradores} colaboradores
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatarValorCampanha(grupo.totalVendas, campanhasStatus.find(c => c.id === campanhaStatusSelecionada)?.tipo_meta || 'valor')} de {formatarValorCampanha(grupo.totalMeta, campanhasStatus.find(c => c.id === campanhaStatusSelecionada)?.tipo_meta || 'valor')}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3">
                          {grupo.lojas.map(loja => <Card key={loja.id} className={`transition-all hover:shadow-md ${obterCorCard(loja.posicao)}`}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {obterIconePosicao(loja.posicao)}
                                    <div>
                                      <h4 className="font-semibold">{loja.numero} - {loja.nome}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {loja.totalColaboradores} colaboradores
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xl font-bold text-primary">
                                      {loja.percentualAtingimento.toFixed(1)}%
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {formatarValorCampanha(loja.totalVendas, campanhasStatus.find(c => c.id === campanhaStatusSelecionada)?.tipo_meta || 'valor')} de {formatarValorCampanha(loja.meta, campanhasStatus.find(c => c.id === campanhaStatusSelecionada)?.tipo_meta || 'valor')}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Média: {formatarValorCampanha(loja.mediaVendasPorColaborador, campanhasStatus.find(c => c.id === campanhaStatusSelecionada)?.tipo_meta || 'valor')}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>)}
                        </div>
                      </CardContent>
                    </Card>)}
                </div>}
            </div>
          </TabsContent>

          <TabsContent value="colaboradores" className="space-y-4">
            <div className="grid gap-4">
            {campanhaStatusSelecionada && <div className="text-center">
                <h2 className="text-xl font-semibold">
                  {campanhasStatus.find(c => c.id === campanhaStatusSelecionada)?.nome} - Ranking de Colaboradores
                </h2>
                <Badge variant="secondary">
                  {gruposRanking.reduce((sum, grupo) => sum + grupo.totalColaboradores, 0)} colaboradores em {gruposRanking.length} grupos
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">
                  Campanha por: {campanhasStatus.find(c => c.id === campanhaStatusSelecionada)?.tipo_meta === 'quantidade' ? 'Quantidade' : 'Valor'}
                </div>
              </div>}
              {gruposRanking.length === 0 ? <Card>
                  <CardContent className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum colaborador com vendas encontrado no período.</p>
                  </CardContent>
                </Card> : <div className="grid lg:grid-cols-3 gap-4">
                  {gruposRanking.map((grupo, grupoIndex) => <Card key={grupo.grupo_id} className="border-2 h-fit">
                      <CardHeader className="pb-3">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-lg font-bold">#{grupoIndex + 1}</span>
                            <span className="text-lg font-semibold">{grupo.nome_grupo}</span>
                          </div>
                          <div className="text-xl font-bold text-primary">
                            {formatarValorCampanha(grupo.totalVendas, campanhasStatus.find(c => c.id === campanhaStatusSelecionada)?.tipo_meta || 'valor')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {grupo.totalColaboradores} colaboradores
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {grupo.colaboradores.map(colaborador => <div key={colaborador.id} className={`flex items-center justify-between p-2 rounded-lg border transition-colors hover:bg-muted/50 ${obterCorCard(colaborador.posicao)}`}>
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="flex-shrink-0">
                                  {colaborador.posicao <= 3 ? obterIconePosicao(colaborador.posicao) : <span className="text-sm font-semibold text-muted-foreground w-6 text-center">{colaborador.posicao}º</span>}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-sm truncate">{colaborador.nome}</div>
                                  <div className="text-xs text-muted-foreground truncate">{colaborador.loja_nome}</div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <div className="text-sm font-bold text-primary">
                                  {formatarValorCampanha(colaborador.totalVendas, campanhasStatus.find(c => c.id === campanhaStatusSelecionada)?.tipo_meta || 'valor')}
                                </div>
                              </div>
                            </div>)}
                        </div>
                      </CardContent>
                    </Card>)}
                </div>}
            </div>
          </TabsContent>
        </Tabs>}
    </div>;
  return <div className="page-container min-h-screen bg-background p-6">
      {view === 'lista' && renderLista()}
      {view === 'detalhes' && renderDetalhes()}
      {view === 'criar' && renderCriar()}
      {view === 'editar' && renderEditar()}
      {view === 'vendas-funcionarios' && renderVendasFuncionarios()}
      {view === 'status' && renderStatus()}
    </div>;
}