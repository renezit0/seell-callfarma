import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, TrendingUp, PieChart, Activity, Calendar } from 'lucide-react';
import { getNomeCategoria, getCorCategoria } from '@/utils/categories';
import { Navigate } from 'react-router-dom';
import { format, startOfMonth, subMonths, eachDayOfInterval, getDay } from 'date-fns';
import { PeriodSelector } from '@/components/PeriodSelector';
import { StoreSelector } from '@/components/StoreSelector';
import { usePeriodContext } from '@/contexts/PeriodContext';
import { useCallfarmaAPI } from '@/hooks/useCallfarmaAPI';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  Area,
  AreaChart as RechartsAreaChart
} from 'recharts';

interface ChartData {
  date: string;
  value: number;
  clientes: number;
  geral: number;
  goodlife: number;
  perfumaria_r_mais: number;
  conveniencia_r_mais: number;
  r_mais: number;
}

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface MetasData {
  categoria: string;
  meta: number;
  realizado: number;
  percentual: number;
}

export default function Graficos() {
  const { user, loading: authLoading } = useAuth();
  const { selectedPeriod } = usePeriodContext();
  const { buscarTodasVendasConsolidadas } = useCallfarmaAPI();
  const [loading, setLoading] = useState(true);
  const [selectedLojaId, setSelectedLojaId] = useState<number | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartData[]>([]);
  const [metasData, setMetasData] = useState<MetasData[]>([]);
  const [lojaInfo, setLojaInfo] = useState<{ regiao: string; numero: string; nome: string } | null>(null);
  const [periodRange, setPeriodRange] = useState<'periodo_atual' | '1_mes' | '3_meses' | '6_meses' | '12_meses'>('3_meses');

  const canViewAllStores = user?.tipo && ['admin', 'supervisor', 'compras'].includes(user.tipo);
  const currentLojaId = selectedLojaId || user?.loja_id || null;

  // Mapeamento dos grupos de categorias (igual ao script Node.js)
  const CATEGORIAS_GRUPOS = {
    'similar': [2, 21, 20, 25, 22],
    'generico': [47, 5, 6],
    'perfumaria_alta': [46],
    'goodlife': [22],
    'rentaveis20': [20],
    'rentaveis25': [25],
    'dermocosmetico': [31, 16],
    'conveniencia': [36],
    'brinquedo': [13]
  };

  const MAPEAMENTO_LOJA_CATEGORIAS = {
    'r_mais': [20, 25],
    'perfumaria_r_mais': [46],
    'saude': [22],
    'conveniencia_r_mais': [36, 13]
  };

  // Função para determinar categorias baseado no grupo
  const determinarCategorias = (cdgrupo: number) => {
    const categorias = [];
    for (const [categoria, grupos] of Object.entries(CATEGORIAS_GRUPOS)) {
      if (grupos.includes(cdgrupo)) {
        categorias.push(categoria);
      }
    }
    return categorias;
  };

  const determinarCategoriasLoja = (cdgrupo: number) => {
    const categorias = [];
    for (const [categoria, grupos] of Object.entries(MAPEAMENTO_LOJA_CATEGORIAS)) {
      if (grupos.includes(cdgrupo)) {
        categorias.push(categoria);
      }
    }
    return categorias;
  };

  useEffect(() => {
    if (user && selectedPeriod && currentLojaId) {
      fetchLojaInfo();
    }
  }, [user, selectedPeriod, currentLojaId]);

  useEffect(() => {
    // Só buscar dados do gráfico depois que a informação da loja estiver carregada
    if (user && selectedPeriod && currentLojaId && lojaInfo) {
      fetchChartData();
      fetchMetasComparison();
    }
  }, [user, selectedPeriod, currentLojaId, periodRange, lojaInfo]);

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
      return data;
    } catch (error) {
      console.error('Erro ao buscar informações da loja:', error);
      return null;
    }
  };

  const fetchChartData = async () => {
    try {
      setLoading(true);
      
      let startDate: Date;
      let endDate: Date;

      if (periodRange === 'periodo_atual' && selectedPeriod) {
        startDate = selectedPeriod.startDate;
        endDate = selectedPeriod.endDate;
      } else {
        const hoje = new Date();
        const mesesAtras = periodRange === '1_mes' ? 1 : periodRange === '3_meses' ? 3 : periodRange === '6_meses' ? 6 : 12;
        startDate = startOfMonth(subMonths(hoje, mesesAtras - 1));
        endDate = hoje;
      }

      console.log('🔍 Buscando dados da API externa para período:', {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        loja: currentLojaId
      });

      const dataInicio = format(startDate, 'yyyy-MM-dd');
      const dataFim = format(endDate, 'yyyy-MM-dd');

      // 🚀 SUPER OTIMIZAÇÃO: Buscar TODOS os dados em apenas 2 requisições!
      console.log('🚀 Buscando TODOS os dados em apenas 2 requisições - SUPER RÁPIDO!');
      const todosDados = await buscarTodasVendasConsolidadas(dataInicio, dataFim, currentLojaId!);
      
      const {
        geral: dadosGeral,
        rentaveis: dadosRentaveis,
        perfumaria_alta: dadosPerfumariaAlta,
        conveniencia_alta: dadosConvenienciaAlta,
        goodlife: dadosGoodlife
      } = todosDados;

      console.log('📊 Dados recebidos da API:', {
        geral: dadosGeral.length,
        rentaveis: dadosRentaveis.length,
        perfumariaAlta: dadosPerfumariaAlta.length,
        convenienciaAlta: dadosConvenienciaAlta.length,
        goodlife: dadosGoodlife.length
      });

      // Verificar se deve excluir domingos
      const shouldExcludeSundays = lojaInfo?.regiao === 'centro';
      console.log('🔍 Informação da loja:', lojaInfo);
      console.log('🔍 Deve excluir domingos?', shouldExcludeSundays);

      // Buscar informações da loja para filtrar por CDFIL
      const { data: lojaData } = await supabase
        .from('lojas')
        .select('numero')
        .eq('id', currentLojaId!)
        .single();

      const numeroLoja = parseInt(lojaData?.numero || '0');
      console.log('🏪 Número da loja:', numeroLoja);

      // Inicializar com todos os dias do período
      const chartMap = new Map<string, ChartData>();
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });

      allDays.forEach(day => {
        const dayOfWeek = getDay(day);
        const dateStr = format(day, 'yyyy-MM-dd');
        
        // Excluir domingo (0) se for loja da região centro
        if (shouldExcludeSundays && dayOfWeek === 0) {
          console.log('🚫 Excluindo domingo:', dateStr, 'para loja da região centro');
          return;
        }

        chartMap.set(dateStr, {
          date: format(day, 'dd/MM'),
          value: 0,
          clientes: 0,
          geral: 0,
          goodlife: 0,
          perfumaria_r_mais: 0,
          conveniencia_r_mais: 0,
          r_mais: 0
        });
      });

      console.log('📊 Total de dias no gráfico:', chartMap.size);

      // Função para processar dados de uma categoria
      const processarDadosCategoria = (dados: any[], nomeCategoria: string) => {
        const vendasPorData = new Map<string, number>();
        
        dados.forEach((item: any) => {
          try {
            const cdfil = parseInt(item.CDFIL) || 0;
            const valorLiquido = parseFloat(item.VALOR_LIQUIDO) || 0; // Usar VALOR_LIQUIDO já calculado
            const dataVendaRaw = item.DATA;

            // Filtrar apenas pela loja atual
            if (numeroLoja && cdfil !== numeroLoja) {
              return;
            }

            // Processar data
            let dataVenda = null;
            if (dataVendaRaw) {
              if (dataVendaRaw.includes('T')) {
                dataVenda = dataVendaRaw.split('T')[0];
              } else {
                dataVenda = dataVendaRaw;
              }
            }

            if (!dataVenda) {
              return;
            }

            // Usar valor líquido já calculado pela API
            if (valorLiquido <= 0) {
              return;
            }

            // Somar ao total da data
            const totalAnterior = vendasPorData.get(dataVenda) || 0;
            vendasPorData.set(dataVenda, totalAnterior + valorLiquido);

          } catch (error) {
            console.warn('Erro ao processar registro da API:', error);
          }
        });
        
        return vendasPorData;
      };

      // Processar dados de cada categoria
      const vendasGeral = processarDadosCategoria(dadosGeral, 'geral');
      const vendasRentaveis = processarDadosCategoria(dadosRentaveis, 'rentaveis');
      const vendasPerfumariaAlta = processarDadosCategoria(dadosPerfumariaAlta, 'perfumaria_alta');
      const vendasConvenienciaAlta = processarDadosCategoria(dadosConvenienciaAlta, 'conveniencia_alta');
      const vendasGoodlife = processarDadosCategoria(dadosGoodlife, 'goodlife');

      // Aplicar vendas aos dias do gráfico
      for (const [dataVenda] of chartMap.entries()) {
        const existing = chartMap.get(dataVenda);
        if (existing) {
          existing.value = vendasGeral.get(dataVenda) || 0;
          existing.geral = vendasGeral.get(dataVenda) || 0;
          existing.goodlife = vendasGoodlife.get(dataVenda) || 0;
          existing.perfumaria_r_mais = vendasPerfumariaAlta.get(dataVenda) || 0;
          existing.conveniencia_r_mais = vendasConvenienciaAlta.get(dataVenda) || 0;
          existing.r_mais = vendasRentaveis.get(dataVenda) || 0;
          existing.clientes = 1; // Placeholder para clientes
        }
      }

      const finalData = Array.from(chartMap.values());
      setChartData(finalData);

      // Preparar dados para o gráfico de pizza
      const categoryTotals = finalData.reduce((acc, day) => {
        acc.geral += day.geral;
        acc.goodlife += day.goodlife;
        acc.perfumaria_r_mais += day.perfumaria_r_mais;
        acc.conveniencia_r_mais += day.conveniencia_r_mais;
        acc.r_mais += day.r_mais;
        return acc;
      }, {
        geral: 0,
        goodlife: 0,
        perfumaria_r_mais: 0,
        conveniencia_r_mais: 0,
        r_mais: 0
      });

      const pieData: PieChartData[] = Object.entries(categoryTotals)
        .filter(([_, value]) => value > 0)
        .map(([categoria, value]) => ({
          name: getNomeCategoria(categoria),
          value: value as number,
          color: getCorCategoria(categoria)
        }));

      setPieChartData(pieData);
      
      console.log('✅ Dados processados com sucesso:', {
        registrosGeral: dadosGeral.length,
        diasComVendas: vendasGeral.size,
        totalGeral: categoryTotals.geral
      });
      
    } catch (error) {
      console.error('Erro ao gerar dados dos gráficos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetasComparison = async () => {
    if (!selectedPeriod) return;

    try {
      const { data: metasLoja } = await supabase
        .from('metas_loja')
        .select('*, metas_loja_categorias(*)')
        .eq('loja_id', currentLojaId)
        .eq('periodo_meta_id', selectedPeriod.id);

      // Buscar dados da API externa para o período da meta usando as categorias
      const dataInicio = selectedPeriod.startDate.toISOString().split('T')[0];
      const dataFim = selectedPeriod.endDate.toISOString().split('T')[0];
      
      // 🚀 SUPER OTIMIZAÇÃO: Buscar dados das metas em apenas 2 requisições!
      const todosDadosMetas = await buscarTodasVendasConsolidadas(dataInicio, dataFim, currentLojaId!);
      
      const {
        geral: dadosGeralMeta,
        rentaveis: dadosRentaveisMeta,
        perfumaria_alta: dadosPerfumariaAltaMeta,
        conveniencia_alta: dadosConvenienciaAltaMeta,
        goodlife: dadosGoodlifeMeta
      } = todosDadosMetas;

      // Buscar informações da loja para filtrar por CDFIL
      const { data: lojaData } = await supabase
        .from('lojas')
        .select('numero')
        .eq('id', currentLojaId!)
        .single();

      const numeroLoja = parseInt(lojaData?.numero || '0');

      // Função para calcular total de uma categoria
      const calcularTotalCategoria = (dados: any[]): number => {
        let total = 0;
        dados.forEach((item: any) => {
          try {
            const cdfil = parseInt(item.CDFIL) || 0;
            const valorLiquido = parseFloat(item.VALOR_LIQUIDO) || 0; // Usar VALOR_LIQUIDO já calculado

            // Filtrar apenas pela loja atual
            if (numeroLoja && cdfil !== numeroLoja) {
              return;
            }

            // Usar valor líquido já calculado pela API
            if (valorLiquido > 0) {
              total += valorLiquido;
            }
          } catch (error) {
            console.warn('Erro ao processar registro da API para metas:', error);
          }
        });
        return total;
      };

      // Calcular totais por categoria
      const vendasPorCategoria = {
        geral: calcularTotalCategoria(dadosGeralMeta),
        r_mais: calcularTotalCategoria(dadosRentaveisMeta),
        perfumaria_r_mais: calcularTotalCategoria(dadosPerfumariaAltaMeta),
        conveniencia_r_mais: calcularTotalCategoria(dadosConvenienciaAltaMeta),
        goodlife: calcularTotalCategoria(dadosGoodlifeMeta)
      };

      const categorias = ['geral', 'r_mais', 'perfumaria_r_mais', 'conveniencia_r_mais', 'goodlife'];
      const metasComparison: MetasData[] = [];

      categorias.forEach(categoria => {
        let metaValor = 0;
        
        if (categoria === 'geral') {
          metaValor = metasLoja?.[0]?.meta_valor_total || 0;
        } else {
          const metaCategoria = metasLoja?.[0]?.metas_loja_categorias?.find(
            (m: any) => m.categoria === categoria
          );
          metaValor = metaCategoria?.meta_valor || 0;
        }

        // Usar dados da API externa
        const realizado = vendasPorCategoria[categoria as keyof typeof vendasPorCategoria] || 0;

        if (metaValor > 0) {
          metasComparison.push({
            categoria: getNomeCategoria(categoria),
            meta: metaValor,
            realizado: realizado,
            percentual: (realizado / metaValor) * 100
          });
        }
      });

      setMetasData(metasComparison);
      
      console.log('✅ Metas processadas com dados da API:', {
        registrosGeral: dadosGeralMeta.length,
        totalGeral: vendasPorCategoria.geral,
        metasEncontradas: metasComparison.length
      });
      
    } catch (error) {
      console.error('Erro ao buscar comparação de metas:', error);
    }
  };

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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="page-container space-y-4 sm:space-y-6 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart className="w-6 h-6" />
            {canViewAllStores && !selectedLojaId 
              ? 'Gráficos - Todas as Lojas' 
              : lojaInfo 
                ? `Gráficos - ${lojaInfo.numero} - ${lojaInfo.nome.toUpperCase()}`
                : `Gráficos - Loja ${currentLojaId || user.loja_id}`
            }
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Visualize dados de vendas em diferentes formatos
            {selectedPeriod && (
              <span className="block text-xs text-muted-foreground/70 mt-1">
                Período: {selectedPeriod.label}
              </span>
            )}
            {lojaInfo?.regiao === 'centro' && (
              <span className="block text-xs text-amber-600 mt-1 font-medium">
                ⚠️ Lojas da região Centro não abrem aos domingos
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
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

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Período dos Gráficos:</span>
            </div>
            <Select value={periodRange} onValueChange={(value: 'periodo_atual' | '1_mes' | '3_meses' | '6_meses' | '12_meses') => setPeriodRange(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="periodo_atual">Período Atual</SelectItem>
                <SelectItem value="1_mes">Último Mês</SelectItem>
                <SelectItem value="3_meses">Últimos 3 Meses</SelectItem>
                <SelectItem value="6_meses">Últimos 6 Meses</SelectItem>
                <SelectItem value="12_meses">Último Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Carregando gráficos...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Evolução das Vendas por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} tick={{ fontSize: 10 }} />
                    <YAxis fontSize={12} tick={{ fontSize: 10 }} tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, getNomeCategoria(name)]}
                      labelFormatter={(label) => `Data: ${label}`}
                    />
                    <Legend formatter={(value) => getNomeCategoria(value)} />
                    <Line type="monotone" dataKey="geral" stroke="hsl(221, 83%, 53%)" strokeWidth={3} dot={{ r: 3 }} name="geral" />
                    <Line type="monotone" dataKey="goodlife" stroke="hsl(142, 76%, 36%)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="goodlife" />
                    <Line type="monotone" dataKey="perfumaria_r_mais" stroke="hsl(262, 83%, 58%)" strokeWidth={2} strokeDasharray="10 5" dot={{ r: 3 }} name="perfumaria_r_mais" />
                    <Line type="monotone" dataKey="conveniencia_r_mais" stroke="hsl(32, 95%, 44%)" strokeWidth={2} strokeDasharray="15 5" dot={{ r: 3 }} name="conveniencia_r_mais" />
                    <Line type="monotone" dataKey="r_mais" stroke="hsl(0, 84%, 60%)" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3 }} name="r_mais" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5" />
                Vendas Diárias (Geral)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} tick={{ fontSize: 10 }} />
                    <YAxis fontSize={12} tick={{ fontSize: 10 }} tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                    <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Vendas']} labelFormatter={(label) => `Data: ${label}`} />
                    <Bar dataKey="value" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Distribuição por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Total']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Número de Transações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsAreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} tick={{ fontSize: 10 }} />
                    <YAxis fontSize={12} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: number) => [value, 'Transações']} labelFormatter={(label) => `Data: ${label}`} />
                    <Area type="monotone" dataKey="clientes" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%)" fillOpacity={0.3} />
                  </RechartsAreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="w-5 h-5" />
                Metas vs Realizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={metasData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="categoria" fontSize={12} tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis fontSize={12} tick={{ fontSize: 10 }} tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                    <Tooltip formatter={(value: number, name: string) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, name === 'meta' ? 'Meta' : 'Realizado']} />
                    <Legend />
                    <Bar dataKey="meta" fill="hsl(0, 0%, 60%)" radius={[4, 4, 0, 0]} name="Meta" />
                    <Bar dataKey="realizado" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="Realizado" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}