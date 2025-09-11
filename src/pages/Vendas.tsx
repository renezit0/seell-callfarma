import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTicketMedioSelfcheckout } from '@/hooks/useTicketMedioSelfcheckout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Calendar, DollarSign, TrendingUp, BarChart3, LineChart, Trophy, TrendingDown, Users } from 'lucide-react';
import { getNomeCategoria, getIconeCategoria, getClasseCorCategoria, getClasseBgCategoria, getCorCategoria } from '@/utils/categories';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format, startOfMonth, subMonths, eachDayOfInterval, getDay } from 'date-fns';
import { PeriodSelector } from '@/components/PeriodSelector';
import { StoreSelector } from '@/components/StoreSelector';
import { usePeriodContext } from '@/contexts/PeriodContext';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Venda {
  id: number;
  usuario_id: number;
  data_venda: string;
  categoria: string;
  valor_venda: number;
  // Campos opcionais para vendas_loja
  loja_id?: number;
  registrado_por_usuario_id?: number | null;
}

interface ChartData {
  date: string;
  value: number;
  transactions: number;
  // Dados por indicador
  geral: number;
  goodlife: number;
  perfumaria_r_mais: number;
  conveniencia_r_mais: number;
  r_mais: number;
}

interface Vendedor {
  id: number;
  nome: string;
}

export default function Vendas() {
  // ✅ ALL HOOKS DECLARED FIRST - ALWAYS RUN IN SAME ORDER
  const { user, loading: authLoading } = useAuth();
  const { selectedPeriod } = usePeriodContext();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [lojaInfo, setLojaInfo] = useState<{ regiao: string; numero: string; nome: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('geral');
  const [vendedorFilter, setVendedorFilter] = useState<string>('all');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [chartCategoriaFilter, setChartCategoriaFilter] = useState<string>('geral');
  const [filtroAdicional, setFiltroAdicional] = useState<string>('periodo');
  const [selectedLojaId, setSelectedLojaId] = useState<number | null>(null);
  
  // Check if user can view all stores
  const canViewAllStores = user?.tipo && ['admin', 'supervisor', 'compras'].includes(user.tipo);
  const currentLojaId = selectedLojaId || user?.loja_id || null;
  
  // Hook para ticket médio baseado no selfcheckout_dados
  const { dados: ticketMedioData } = useTicketMedioSelfcheckout(currentLojaId, 'completo');

  // ✅ All processing happens after hooks - using useMemo for performance
  const filteredVendas = useMemo(() => {
    return vendas.filter(venda => {
      const matchesSearch = venda.categoria.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategoria = categoriaFilter === 'all' || venda.categoria === categoriaFilter;
      return matchesSearch && matchesCategoria;
    });
  }, [vendas, searchTerm, categoriaFilter]);

  const calculatedData = useMemo(() => {
    // ✅ REGRA IMPORTANTE: Categorias R+ NÃO SOMAM NO GERAL
    const vendasGeral = vendas.filter(v => v.categoria === 'geral');
    const totalGeralVendas = vendasGeral.reduce((sum, venda) => sum + venda.valor_venda, 0);
    
    // Para participação, usar APENAS vendas gerais (não incluir R+)
    const valorTotalTodas = vendas.reduce((sum, venda) => sum + venda.valor_venda, 0);
    const participacaoGeral = valorTotalTodas > 0 ? (totalGeralVendas / valorTotalTodas * 100) : 0;
    
    const totalVendas = filteredVendas.reduce((sum, venda) => sum + venda.valor_venda, 0);
    // Usar ticket médio do selfcheckout quando disponível, senão usar cálculo tradicional
    const ticketMedio = ticketMedioData?.ticket_medio_geral || 
      (filteredVendas.length > 0 ? totalVendas / filteredVendas.length : 0);

    return {
      totalGeralVendas,
      valorTotalTodas,
      participacaoGeral,
      totalVendas,
      ticketMedio
    };
  }, [vendas, filteredVendas, ticketMedioData]);

  // Vendas por categoria para indicadores (agrupando conforme especificado)
  const vendasPorCategoria = useMemo(() => {
    const grouped = vendas.reduce((acc, venda) => {
      let categoria = venda.categoria;
      
      // Agrupamento para indicadores conforme especificado
      if (venda.categoria === 'similar' || venda.categoria === 'generico') {
        categoria = 'generico_similar'; // Colaboradores têm meta de genérico+similar somados
      } else if (venda.categoria === 'conveniencia' || venda.categoria === 'brinquedo') {
        categoria = 'conveniencia_r_mais'; // ✅ PARA LOJA: conveniencia -> conveniencia_r_mais
      } else if (venda.categoria === 'rentaveis20' || venda.categoria === 'rentaveis25') {
        categoria = 'r_mais'; // Rentáveis
      } else if (venda.categoria === 'saude') {
        categoria = 'goodlife'; // GoodLife
      } else if (venda.categoria === 'perfumaria_r_mais') {
        categoria = 'perfumaria_r_mais'; // Perfumaria Alta Rentabilidade
      }
      
      if (!acc[categoria]) {
        acc[categoria] = { valor: 0, transacoes: 0 };
      }
      acc[categoria].valor += venda.valor_venda;
      acc[categoria].transacoes += 1;
      return acc;
    }, {} as Record<string, { valor: number; transacoes: number }>);
    
    return grouped;
  }, [vendas]);

  // Estado para armazenar metas
  const [metasData, setMetasData] = useState<Record<string, { meta: number; realizado: number }>>({});

  // Buscar metas da loja para calcular porcentagens
  useEffect(() => {
    if (!user || !selectedPeriod) return;
    
    const fetchMetas = async () => {
      try {
        // Buscar metas da loja atual para o período selecionado
        const { data: metasLoja } = await supabase
          .from('metas_loja')
          .select('*, metas_loja_categorias(*)')
          .eq('loja_id', currentLojaId)
          .eq('periodo_meta_id', selectedPeriod.id);

        const metasMap: Record<string, { meta: number; realizado: number }> = {};
        
        // Categorias conforme mapeamento
        const categorias = ['r_mais', 'perfumaria_r_mais', 'conveniencia_r_mais', 'goodlife'];
        
        categorias.forEach(categoria => {
          let metaValor = 0;
          
          // Para categoria geral usar meta_valor_total, para outras usar metas_loja_categorias  
          if (categoria === 'geral') {
            metaValor = metasLoja?.[0]?.meta_valor_total || 0;
          } else {
            const metaCategoria = metasLoja?.[0]?.metas_loja_categorias?.find(
              (m: any) => m.categoria === categoria
            );
            metaValor = metaCategoria?.meta_valor || 0;
          }
          
          // Calcular realizado da categoria
          const categoriaDados = vendasPorCategoria[categoria];
          const realizado = categoriaDados?.valor || 0;
          
          metasMap[categoria] = { meta: metaValor, realizado };
        });
        
        setMetasData(metasMap);
      } catch (error) {
        console.error('Erro ao buscar metas para ranking:', error);
      }
    };
    
    fetchMetas();
  }, [user, selectedPeriod, vendasPorCategoria, currentLojaId]);

  // Calcular melhor e pior indicador baseado na % de meta realizada
  const indicadoresRanking = useMemo(() => {
    const indicadores = Object.entries(vendasPorCategoria)
      .filter(([categoria]) => categoria !== 'geral' && categoria !== 'generico_similar') // ✅ Remover generico_similar dos indicadores de loja
      .map(([categoria, dados]) => {
        const metaInfo = metasData[categoria];
        const percentualMeta = metaInfo?.meta > 0 ? (dados.valor / metaInfo.meta) * 100 : 0;
        
        return {
          categoria,
          valor: dados.valor,
          transacoes: dados.transacoes,
          meta: metaInfo?.meta || 0,
          percentualMeta
        };
      })
      .filter(indicador => indicador.meta > 0) // Só incluir categorias com meta definida
      .sort((a, b) => b.percentualMeta - a.percentualMeta);
    
    return {
      melhor: indicadores[0] || null,
      pior: indicadores[indicadores.length - 1] || null
    };
  }, [vendasPorCategoria, metasData]);

  // ✅ useEffect ALWAYS RUNS - no early returns before this
  useEffect(() => {
    if (user && !initialized) {
      fetchLojaInfo();
      fetchVendedores();
      fetchVendas();
      generateChartData();
      setInitialized(true);
    }
  }, [user, initialized]);

  // ✅ Refetch when filters change (incluindo selectedLojaId para atualizar vendedores)
  useEffect(() => {
    if (user && initialized) {
      fetchVendedores(); // Atualizar lista de vendedores quando loja mudar
      fetchVendas();
    }
  }, [selectedPeriod, vendedorFilter, filtroAdicional, user, initialized, currentLojaId, selectedLojaId]);

  // Quando selecionar um colaborador, mostrar todas as categorias por padrão
  useEffect(() => {
    if (vendedorFilter !== 'all') {
      setCategoriaFilter('all');
      setChartCategoriaFilter('multi');
    }
  }, [vendedorFilter]);

  // Regerar dados do gráfico quando dados/filtros mudarem
  useEffect(() => {
    if (user && lojaInfo) {
      generateChartData();
    }
  }, [vendas, lojaInfo, user, chartCategoriaFilter, vendedorFilter]);

  const fetchVendedores = async () => {
    try {
      let query = supabase
        .from('usuarios')
        .select('id, nome')
        .eq('status', 'ativo')
        .order('nome');

      // Se há uma loja selecionada no StoreSelector, usar ela
      if (selectedLojaId) {
        query = query.eq('loja_id', selectedLojaId);
      }
      // Se o usuário pode ver todas as lojas mas não tem loja selecionada, mostrar de todas
      else if (canViewAllStores) {
        // Não adiciona filtro de loja - mostra vendedores de todas as lojas
      } 
      // Se o usuário não pode ver todas as lojas, filtrar pela sua loja
      else {
        query = query.eq('loja_id', user?.loja_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVendedores(data || []);
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
    }
  };

  const fetchLojaInfo = async () => {
    if (!currentLojaId) return;
    
    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('regiao, numero, nome')
        .eq('id', currentLojaId)
        .single();

      if (error) throw error;
      setLojaInfo(data);
    } catch (error) {
      console.error('Erro ao buscar informações da loja:', error);
    }
  };

  const fetchVendas = async () => {
    try {
      setLoading(true);
      
      // Se um vendedor específico for selecionado, buscar na tabela 'vendas'
      // Caso contrário, buscar na tabela 'vendas_loja' para dados consolidados
      const isVendedorSelected = vendedorFilter !== 'all';
      
      let query: any;
      
      if (isVendedorSelected) {
        // Buscar vendas individuais na tabela 'vendas' - SOMENTE: usuario_id, data_venda, categoria, valor_venda
        query = supabase
          .from('vendas')
          .select('id, usuario_id, data_venda, categoria, valor_venda')
          .eq('usuario_id', parseInt(vendedorFilter))
          .order('data_venda', { ascending: false });
      } else {
        // Buscar dados consolidados na tabela 'vendas_loja'
        // Se não há loja selecionada e o usuário pode ver todas, buscar de todas as lojas
        if (!selectedLojaId && canViewAllStores) {
          query = supabase
            .from('vendas_loja')
            .select('*')
            .order('data_venda', { ascending: false });
        } else {
          query = supabase
            .from('vendas_loja')
            .select('*')
            .eq('loja_id', currentLojaId!)
            .order('data_venda', { ascending: false });
        }
      }

      // Filtro por período selecionado ou filtros adicionais
      const hoje = new Date();
      
      if (filtroAdicional === 'hoje') {
        const hojeStr = format(hoje, 'yyyy-MM-dd');
        query = query.eq('data_venda', hojeStr);
      } else if (filtroAdicional === 'ontem') {
        const ontem = new Date(hoje);
        ontem.setDate(hoje.getDate() - 1);
        const ontemStr = format(ontem, 'yyyy-MM-dd');
        query = query.eq('data_venda', ontemStr);
      } else if (filtroAdicional === 'ultima_semana') {
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - 7);
        query = query.gte('data_venda', format(inicioSemana, 'yyyy-MM-dd'));
      } else if (filtroAdicional === 'ultimo_mes') {
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        query = query.gte('data_venda', format(inicioMes, 'yyyy-MM-dd'));
      } else if (filtroAdicional === 'periodo' && selectedPeriod) {
        // Iniciar no dia seguinte à data de início (dia 21 ao invés de 20)
        const dataInicioAjustada = new Date(selectedPeriod.startDate);
        dataInicioAjustada.setDate(dataInicioAjustada.getDate() + 1);
        
        const dataInicio = format(dataInicioAjustada, 'yyyy-MM-dd');
        const dataFim = format(selectedPeriod.endDate, 'yyyy-MM-dd');
        query = query.gte('data_venda', dataInicio).lte('data_venda', dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVendas((data || []) as Venda[]);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      toast.error('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = async () => {
    try {
      // Buscar dados dos últimos 3 meses para o gráfico
      const hoje = new Date();
      const inicioMes = startOfMonth(subMonths(hoje, 2));
      const isVendedorSelected = vendedorFilter !== 'all';

      let query: any;

      if (isVendedorSelected) {
        // Quando colaborador está selecionado, usar a tabela 'vendas'
        query = supabase
          .from('vendas')
          .select('data_venda, categoria, valor_venda')
          .eq('usuario_id', parseInt(vendedorFilter))
          .gte('data_venda', format(inicioMes, 'yyyy-MM-dd'))
          .lte('data_venda', format(hoje, 'yyyy-MM-dd'));

        // Filtro por categoria específico para colaborador
        if (chartCategoriaFilter && chartCategoriaFilter !== 'all' && chartCategoriaFilter !== 'multi') {
          if (chartCategoriaFilter === 'generico_similar') {
            query = query.in('categoria', ['similar', 'generico']);
          } else if (chartCategoriaFilter === 'conveniencia_r_mais') {
            query = query.in('categoria', ['conveniencia', 'brinquedo']);
          } else if (chartCategoriaFilter === 'r_mais') {
            query = query.in('categoria', ['rentaveis20', 'rentaveis25']);
          } else if (chartCategoriaFilter === 'goodlife') {
            query = query.eq('categoria', 'saude');
          } else if (chartCategoriaFilter === 'geral' || chartCategoriaFilter === 'perfumaria_r_mais') {
            query = query.eq('categoria', chartCategoriaFilter);
          } else {
            query = query.eq('categoria', chartCategoriaFilter);
          }
        }
      } else {
        // Visão geral da loja usa tabela consolidada 'vendas_loja'
        // Se não há loja selecionada e o usuário pode ver todas, buscar de todas as lojas
        if (!selectedLojaId && canViewAllStores) {
          query = supabase
            .from('vendas_loja')
            .select('*')
            .gte('data_venda', format(inicioMes, 'yyyy-MM-dd'))
            .lte('data_venda', format(hoje, 'yyyy-MM-dd'));
        } else {
          query = supabase
            .from('vendas_loja')
            .select('*')
            .eq('loja_id', currentLojaId!)
            .gte('data_venda', format(inicioMes, 'yyyy-MM-dd'))
            .lte('data_venda', format(hoje, 'yyyy-MM-dd'));
        }

        if (chartCategoriaFilter && chartCategoriaFilter !== 'all' && chartCategoriaFilter !== 'multi') {
          if (chartCategoriaFilter === 'generico_similar') {
            query = query.in('categoria', ['similar', 'generico']);
          } else if (chartCategoriaFilter === 'conveniencia_r_mais') {
            query = query.in('categoria', ['conveniencia_r_mais', 'conveniencia', 'brinquedo']);
          } else if (chartCategoriaFilter === 'r_mais') {
            query = query.in('categoria', ['r_mais', 'rentaveis20', 'rentaveis25']);
          } else if (chartCategoriaFilter === 'goodlife') {
            query = query.in('categoria', ['goodlife', 'saude']);
          } else {
            query = query.eq('categoria', chartCategoriaFilter);
          }
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Agrupar por data
      const chartMap = new Map<string, ChartData>();

      // Inicializar com todos os dias do período (excluindo domingos se região centro E loja específica)
      const allDays = eachDayOfInterval({ start: inicioMes, end: hoje });

      // Só excluir domingos se estivermos vendo uma loja específica da região centro
      // Se estamos vendo todas as lojas, não excluir domingos
      const shouldExcludeSundays = lojaInfo?.regiao === 'centro' && (selectedLojaId || !canViewAllStores);

      allDays.forEach(day => {
        const dayOfWeek = getDay(day);
        if (shouldExcludeSundays && dayOfWeek === 0) {
          return; // Pular domingos apenas para loja específica da região centro
        }

        const dateStr = format(day, 'yyyy-MM-dd');
        chartMap.set(dateStr, {
          date: format(day, 'dd/MM'),
          value: 0,
          transactions: 0,
          geral: 0,
          goodlife: 0,
          perfumaria_r_mais: 0,
          conveniencia_r_mais: 0,
          r_mais: 0
        });
      });

      // Processar vendas por categoria
      (data || []).forEach((venda: any) => {
        const existing = chartMap.get(venda.data_venda);
        if (existing) {
          existing.value += venda.valor_venda;
          existing.transactions += 1;

          if (venda.categoria === 'geral') {
            existing.geral += venda.valor_venda;
          } else if (venda.categoria === 'saude' || venda.categoria === 'goodlife') {
            existing.goodlife += venda.valor_venda;
          } else if (venda.categoria === 'perfumaria_r_mais') {
            existing.perfumaria_r_mais += venda.valor_venda;
          } else if (
            venda.categoria === 'conveniencia_r_mais' ||
            venda.categoria === 'conveniencia' ||
            venda.categoria === 'brinquedo'
          ) {
            existing.conveniencia_r_mais += venda.valor_venda;
          } else if (
            venda.categoria === 'r_mais' ||
            venda.categoria === 'rentaveis20' ||
            venda.categoria === 'rentaveis25'
          ) {
            existing.r_mais += venda.valor_venda;
          }
        }
      });

      const finalData = Array.from(chartMap.values());
      setChartData(finalData);
    } catch (error) {
      console.error('Erro ao gerar dados do gráfico:', error);
    }
  };

  // ✅ NOW we can do early returns AFTER all hooks
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }


  const getCategoriaColor = (categoria: string) => {
    // Usar cores do design system baseadas na categoria
    return `${getClasseBgCategoria(categoria)} ${getClasseCorCategoria(categoria)}`;
  };

  // Cor da linha do gráfico single-line baseada na categoria selecionada
  const singleStrokeColor = getCorCategoria(chartCategoriaFilter && chartCategoriaFilter !== 'multi' ? chartCategoriaFilter : 'geral');

  return (
    <div className="page-container space-y-4 sm:space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {canViewAllStores && !selectedLojaId 
              ? 'Vendas - Todas as Lojas' 
              : lojaInfo 
                ? `Vendas - ${lojaInfo.numero} - ${lojaInfo.nome.toUpperCase()}`
                : `Vendas - Loja ${currentLojaId || user.loja_id}`
            }
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Acompanhe as vendas e performance da loja
            {selectedPeriod && (
              <span className="block text-xs text-muted-foreground/70 mt-1">
                Período: {selectedPeriod.label}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {canViewAllStores && (
            <StoreSelector 
              selectedLojaId={selectedLojaId} 
              onLojaChange={setSelectedLojaId} 
              userLojaId={user.loja_id} 
            />
          )}
          <PeriodSelector />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Participação Geral</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground">
                  {calculatedData.participacaoGeral.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  R$ {calculatedData.totalGeralVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground">
                  R$ {calculatedData.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {ticketMedioData ? 
                    `Vendas Geral: R$ ${ticketMedioData.total_vendas_geral_periodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` :
                    'Baseado no período selecionado'
                  }
                </p>
              </div>
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        {ticketMedioData && (
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Clientes Atendidos</p>
                  <p className="text-lg sm:text-2xl font-bold text-foreground">
                    {ticketMedioData.total_clientes_periodo.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Total no período
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        )}

                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Melhor Indicador</p>
                        {indicadoresRanking.melhor ? (
                          <>
                            <p className="text-base sm:text-lg font-bold text-foreground">
                              {getNomeCategoria(indicadoresRanking.melhor.categoria)}
                            </p>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                              {indicadoresRanking.melhor.percentualMeta.toFixed(1)}% da meta
                            </p>
                          </>
                        ) : (
                          <p className="text-lg sm:text-2xl font-bold text-muted-foreground">-</p>
                        )}
                      </div>
                      <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-success" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Pior Indicador</p>
                        {indicadoresRanking.pior ? (
                          <>
                            <p className="text-base sm:text-lg font-bold text-foreground">
                              {getNomeCategoria(indicadoresRanking.pior.categoria)}
                            </p>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                              {indicadoresRanking.pior.percentualMeta.toFixed(1)}% da meta
                            </p>
                          </>
                        ) : (
                          <p className="text-lg sm:text-2xl font-bold text-muted-foreground">-</p>
                        )}
                      </div>
                      <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-destructive" />
                    </div>
                  </CardContent>
                </Card>
      </div>

      {/* Indicadores por Categoria */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            Indicadores por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Object.entries(vendasPorCategoria)
              .sort(([,a], [,b]) => b.valor - a.valor)
              .slice(0, 6)
              .map(([categoria, dados]) => {
                const participacao = calculatedData.valorTotalTodas > 0 ? (dados.valor / calculatedData.valorTotalTodas * 100) : 0;
                return (
                  <div key={categoria} className="p-3 sm:p-4 border rounded-lg bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getCategoriaColor(categoria)} variant="secondary">
                        <i className={`${getIconeCategoria(categoria)} mr-1`}></i>
                        <span className="text-xs">{getNomeCategoria(categoria)}</span>
                      </Badge>
                      <span className="text-xs sm:text-sm font-medium">{participacao.toFixed(1)}%</span>
                    </div>
                      <div className="space-y-1">
                        <p className="text-base sm:text-lg font-bold">
                          R$ {dados.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Filtros</span>
            <Button size="sm" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nova Venda
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filtroAdicional} onValueChange={setFiltroAdicional}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="periodo">Período Selecionado</SelectItem>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="ontem">Ontem</SelectItem>
                <SelectItem value="ultima_semana">Última Semana</SelectItem>
                <SelectItem value="ultimo_mes">Último Mês</SelectItem>
              </SelectContent>
            </Select>

            <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Vendedores</SelectItem>
                {vendedores.map((vendedor) => (
                  <SelectItem key={vendedor.id} value={vendedor.id.toString()}>
                    {vendedor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="geral">Geral</SelectItem>
                <SelectItem value="r_mais">Rentáveis R+</SelectItem>
                <SelectItem value="perfumaria_r_mais">Perfumaria R+</SelectItem>
                <SelectItem value="conveniencia_r_mais">Conveniência R+</SelectItem>
                <SelectItem value="saude">GoodLife</SelectItem>
                <SelectItem value="similar">Similar</SelectItem>
                <SelectItem value="generico">Genérico</SelectItem>
                <SelectItem value="dermocosmetico">Dermocosmético</SelectItem>
                <SelectItem value="perfumaria_alta">Perfumaria Alta</SelectItem>
                <SelectItem value="conveniencia">Conveniência</SelectItem>
                <SelectItem value="brinquedo">Brinquedo</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-xs sm:text-sm text-muted-foreground flex items-center">
              Total: {filteredVendas.length} vendas
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts and Table */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="charts" className="flex items-center gap-2 text-sm">
            <LineChart className="w-4 h-4" />
            <span className="hidden sm:inline">Gráficos</span>
            <span className="sm:hidden">Gráfico</span>
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Tabela</span>
            <span className="sm:hidden">Lista</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-4">
          {/* Filtro do Gráfico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LineChart className="w-4 h-4 sm:w-5 sm:h-5" />
                Filtro do Gráfico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={chartCategoriaFilter} onValueChange={setChartCategoriaFilter}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Categoria do Gráfico" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover border border-border shadow-md">
                  <SelectItem value="geral">Venda Geral</SelectItem>
                  <SelectItem value="goodlife">GoodLife</SelectItem>
                  <SelectItem value="perfumaria_r_mais">Perfumaria Alta Rentabilidade</SelectItem>
                  <SelectItem value="conveniencia_r_mais">Conveniência Alta Rentabilidade</SelectItem>
                  <SelectItem value="r_mais">Rentáveis</SelectItem>
                  <SelectItem value="multi">Gráfico Multi Linha - Indicadores</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {chartCategoriaFilter === 'multi' ? 'Gráfico Multi Linha - Indicadores' : `Evolução de Vendas - ${getNomeCategoria(chartCategoriaFilter)}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 will-change-transform [contain:layout_paint]">
                <ResponsiveContainer width="100%" height="100%">
                  {chartCategoriaFilter === 'multi' ? (
                    // Gráfico multi-linha para todos os indicadores
                    <RechartsLineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        fontSize={12}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        fontSize={12}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, getNomeCategoria(name)]}
                        labelFormatter={(label) => `Data: ${label}`}
                      />
                      <Legend formatter={(value) => getNomeCategoria(value)} />
                       {/* Remover linha geral do gráfico multi-linha conforme solicitado */}
                      <Line 
                        type="monotone" 
                        dataKey="goodlife" 
                        stroke="hsl(142, 76%, 36%)" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 3 }}
                        isAnimationActive={false}
                        name="goodlife"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="perfumaria_r_mais" 
                        stroke="hsl(262, 83%, 58%)" 
                        strokeWidth={2}
                        strokeDasharray="10 5"
                        dot={{ r: 3 }}
                        isAnimationActive={false}
                        name="perfumaria_r_mais"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="conveniencia_r_mais" 
                        stroke="hsl(32, 95%, 44%)" 
                        strokeWidth={2}
                        strokeDasharray="15 5"
                        dot={{ r: 3 }}
                        isAnimationActive={false}
                        name="conveniencia_r_mais"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="r_mais" 
                        stroke="hsl(0, 84%, 60%)" 
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={{ r: 3 }}
                        isAnimationActive={false}
                        name="r_mais"
                      />
                    </RechartsLineChart>
                  ) : (
                    // Gráfico single-line para categoria específica
                    <RechartsLineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        fontSize={12}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        fontSize={12}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Vendas']}
                        labelFormatter={(label) => `Data: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={singleStrokeColor} 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        isAnimationActive={false}
                        name="Vendas"
                      />
                    </RechartsLineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Carregando vendas...</span>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Vendedor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVendas.map((venda) => (
                          <TableRow key={venda.id}>
                            <TableCell>
                              {new Date(venda.data_venda).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Badge className={getCategoriaColor(venda.categoria)} variant="secondary">
                                <i className={`${getIconeCategoria(venda.categoria)} mr-1`}></i>
                                {getNomeCategoria(venda.categoria)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              R$ {venda.valor_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              {vendedores.find(v => v.id === (venda.registrado_por_usuario_id || venda.usuario_id))?.nome || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredVendas.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              Nenhuma venda encontrada
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {filteredVendas.map((venda) => (
                      <div key={venda.id} className="border rounded-lg p-4 bg-card">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm text-muted-foreground">
                            {new Date(venda.data_venda).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-lg font-semibold">
                            R$ {venda.valor_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={getCategoriaColor(venda.categoria)} variant="secondary">
                            <i className={`${getIconeCategoria(venda.categoria)} mr-1`}></i>
                            {getNomeCategoria(venda.categoria)}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            Vendedor: {vendedores.find(v => v.id === (venda.registrado_por_usuario_id || venda.usuario_id))?.nome || 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredVendas.length === 0 && (
                      <div className="text-center text-muted-foreground py-8 border rounded-lg">
                        Nenhuma venda encontrada
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}