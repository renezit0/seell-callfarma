import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePeriodoAtual } from "@/hooks/usePeriodoAtual";
import { useCallfarmaAPI } from "@/hooks/useCallfarmaAPI";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { PeriodSelector } from "@/components/PeriodSelector";
import { Loader2 } from "lucide-react";

interface LojaParticipacao {
  id: number;
  nome: string;
  regional: string;
  vendas_geral: number;
  vendas_categorias: {
    r_mais: number;
    perfumaria_r_mais: number;
    conveniencia_r_mais: number;
    saude: number;
  };
  participacao: {
    r_mais: number;
    perfumaria_r_mais: number;
    conveniencia_r_mais: number;
    saude: number;
  };
}

interface TotaisGerais {
  vendas_geral: number;
  vendas_categorias: {
    r_mais: number;
    perfumaria_r_mais: number;
    conveniencia_r_mais: number;
    saude: number;
  };
  participacao_media: {
    r_mais: number;
    perfumaria_r_mais: number;
    conveniencia_r_mais: number;
    saude: number;
  };
}

const categorias = [
  { key: 'r_mais', nome: 'Rentáveis', icone: 'fa-chart-pie', cor: '#e74a3b' },
  { key: 'perfumaria_r_mais', nome: 'Perfumaria R+', icone: 'fa-spray-can', cor: '#8e44ad' },
  { key: 'conveniencia_r_mais', nome: 'Conveniência R+', icone: 'fa-shopping-basket', cor: '#fd7e14' },
  { key: 'saude', nome: 'GoodLife', icone: 'fa-heartbeat', cor: '#28a745' }
];

const regionais = [
  { key: 'todos', nome: 'Todas' },
  { key: 'CWB', nome: 'Curitiba' },
  { key: 'PG', nome: 'Ponta Grossa' },
  { key: 'TELEVENDAS', nome: 'Televendas' }
];

export default function Participacao() {
  const [tipoFiltro, setTipoFiltro] = useState<'periodo' | 'data_especifica'>('periodo');
  const [dataEspecifica, setDataEspecifica] = useState(new Date().toISOString().split('T')[0]);
  const [regionalSelecionada, setRegionalSelecionada] = useState('todos');
  const [dadosLojas, setDadosLojas] = useState<LojaParticipacao[]>([]);
  const [totaisGerais, setTotaisGerais] = useState<TotaisGerais>({
    vendas_geral: 0,
    vendas_categorias: { r_mais: 0, perfumaria_r_mais: 0, conveniencia_r_mais: 0, saude: 0 },
    participacao_media: { r_mais: 0, perfumaria_r_mais: 0, conveniencia_r_mais: 0, saude: 0 }
  });
  const [loading, setLoading] = useState(true);

  const periodo = usePeriodoAtual();
  const { buscarTodasVendasConsolidadas } = useCallfarmaAPI();

  const calcularParticipacao = (vendas_loja: any) => {
    const geral = vendas_loja.geral || 0;
    const participacao: any = {};
    
    categorias.forEach(categoria => {
      const valor_categoria = vendas_loja[categoria.key] || 0;
      participacao[categoria.key] = geral > 0 ? (valor_categoria / geral) * 100 : 0;
    });
    
    return participacao;
  };

  const buscarDadosParticipacao = async () => {
    if (!periodo) return;
    
    setLoading(true);
    try {
      const dataInicio = tipoFiltro === 'data_especifica' ? dataEspecifica : periodo.data_inicio;
      const dataFim = tipoFiltro === 'data_especifica' ? dataEspecifica : periodo.data_fim;
      
      // Buscar dados consolidados via API
      const dadosAPI = await buscarTodasVendasConsolidadas(dataInicio, dataFim);
      
      if (dadosAPI) {
        const lojas: LojaParticipacao[] = [];
        const totais = {
          vendas_geral: 0,
          vendas_categorias: { r_mais: 0, perfumaria_r_mais: 0, conveniencia_r_mais: 0, saude: 0 },
          participacao_media: { r_mais: 0, perfumaria_r_mais: 0, conveniencia_r_mais: 0, saude: 0 }
        };

        // Agregar dados gerais por loja
        const lojasMap = new Map<number, any>();
        
        // Processar dados gerais
        dadosAPI.geral.forEach((item: any) => {
          const lojaId = item.CDFIL;
          if (!lojasMap.has(lojaId)) {
            lojasMap.set(lojaId, {
              id: lojaId,
              nome: item.NOMEFIL || `Loja ${lojaId}`,
              regional: 'CWB', // Definir lógica de regional baseado na loja
              vendas_geral: 0,
              vendas_categorias: { r_mais: 0, perfumaria_r_mais: 0, conveniencia_r_mais: 0, saude: 0 }
            });
          }
          
          const loja = lojasMap.get(lojaId)!;
          loja.vendas_geral += item.VALOR_LIQUIDO || 0;
        });

        // Processar categorias específicas
        const mapearCategoria = {
          rentaveis: 'r_mais',
          perfumaria_alta: 'perfumaria_r_mais', 
          conveniencia_alta: 'conveniencia_r_mais',
          goodlife: 'saude'
        };

        Object.entries(mapearCategoria).forEach(([apiKey, localKey]) => {
          const dadosCategoria = dadosAPI[apiKey as keyof typeof dadosAPI];
          if (Array.isArray(dadosCategoria)) {
            dadosCategoria.forEach((item: any) => {
              const lojaId = item.CDFIL;
              if (lojasMap.has(lojaId)) {
                const loja = lojasMap.get(lojaId)!;
                loja.vendas_categorias[localKey as keyof typeof loja.vendas_categorias] += item.VALOR_LIQUIDO || 0;
              }
            });
          }
        });

        // Converter para array e calcular participação
        Array.from(lojasMap.values()).forEach(lojaData => {
          const participacao = calcularParticipacao({
            geral: lojaData.vendas_geral,
            ...lojaData.vendas_categorias
          });

          const loja: LojaParticipacao = {
            ...lojaData,
            participacao
          };

          lojas.push(loja);

          // Acumular totais
          totais.vendas_geral += lojaData.vendas_geral;
          categorias.forEach(cat => {
            totais.vendas_categorias[cat.key as keyof typeof totais.vendas_categorias] += 
              lojaData.vendas_categorias[cat.key as keyof typeof lojaData.vendas_categorias];
          });
        });

        // Calcular participação média geral
        if (totais.vendas_geral > 0) {
          categorias.forEach(cat => {
            totais.participacao_media[cat.key as keyof typeof totais.participacao_media] = 
              (totais.vendas_categorias[cat.key as keyof typeof totais.vendas_categorias] / totais.vendas_geral) * 100;
          });
        }

        // Ordenar lojas por valor geral
        lojas.sort((a, b) => b.vendas_geral - a.vendas_geral);

        setDadosLojas(lojas);
        setTotaisGerais(totais);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de participação:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarDadosParticipacao();
  }, [periodo, tipoFiltro, dataEspecifica]);

  const getClasseParticipacao = (percentual: number) => {
    if (percentual >= 25) return 'success';
    if (percentual >= 15) return 'warning';
    if (percentual >= 5) return 'info';
    return 'secondary';
  };

  const dadosFiltrados = dadosLojas.filter(loja => 
    regionalSelecionada === 'todos' || loja.regional === regionalSelecionada
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center gap-4">
          <i className="fas fa-chart-pie text-3xl"></i>
          <div>
            <h1 className="text-2xl font-bold">Dashboard de Participação por Categoria</h1>
            <p className="opacity-90">
              Análise da participação percentual de cada categoria em relação ao valor geral
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-6 items-center">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Tipo de Filtro
              </label>
              <div className="flex gap-2">
                <Button
                  variant={tipoFiltro === 'periodo' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipoFiltro('periodo')}
                >
                  Por Período
                </Button>
                <Button
                  variant={tipoFiltro === 'data_especifica' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipoFiltro('data_especifica')}
                >
                  Data Específica
                </Button>
              </div>
            </div>

            {tipoFiltro === 'periodo' ? (
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Período
                </label>
                <PeriodSelector />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Data Específica
                </label>
                <input
                  type="date"
                  value={dataEspecifica}
                  onChange={(e) => setDataEspecifica(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Regional
              </label>
              <Select value={regionalSelecionada} onValueChange={setRegionalSelecionada}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regionais.map(regional => (
                    <SelectItem key={regional.key} value={regional.key}>
                      {regional.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="geral">Visão Geral</TabsTrigger>
          {categorias.map(categoria => (
            <TabsTrigger key={categoria.key} value={categoria.key}>
              {categoria.nome}
            </TabsTrigger>
          ))}
          <TabsTrigger value="completo">Tabela Completa</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="geral" className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-dollar-sign text-emerald-600 text-xl"></i>
                  </div>
                  <div className="text-sm text-muted-foreground">Total Geral</div>
                </div>
                <div className="text-2xl font-bold">{formatCurrency(totaisGerais.vendas_geral)}</div>
                <div className="text-xs text-muted-foreground">Valor total vendido no período</div>
              </CardContent>
            </Card>

            {categorias.map(categoria => (
              <Card key={categoria.key}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: categoria.cor + '20', color: categoria.cor }}
                    >
                      <i className={`fas ${categoria.icone} text-xl`}></i>
                    </div>
                    <div className="text-sm text-muted-foreground">{categoria.nome}</div>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatPercentage(totaisGerais.participacao_media[categoria.key as keyof typeof totaisGerais.participacao_media])}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(totaisGerais.vendas_categorias[categoria.key as keyof typeof totaisGerais.vendas_categorias])} vendidos
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Grid de Lojas */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <i className="fas fa-store-alt"></i>
              Participação por Loja
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dadosFiltrados.map(loja => (
                <Card key={loja.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{loja.nome}</CardTitle>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <i className="fas fa-map-marker-alt"></i>
                      {loja.regional}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4 p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Total Geral
                      </div>
                      <div className="text-xl font-bold text-emerald-600">
                        {formatCurrency(loja.vendas_geral)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {categorias.map(categoria => (
                        <div key={categoria.key} className="text-center p-2 bg-muted/50 rounded">
                          <div className="text-xs text-muted-foreground mb-1">
                            {categoria.nome}
                          </div>
                          <div className="text-xs mb-1">
                            {formatCurrency(loja.vendas_categorias[categoria.key as keyof typeof loja.vendas_categorias])}
                          </div>
                          <div 
                            className="text-sm font-bold"
                            style={{ color: categoria.cor }}
                          >
                            {formatPercentage(loja.participacao[categoria.key as keyof typeof loja.participacao])}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Abas das Categorias */}
        {categorias.map(categoria => (
          <TabsContent key={categoria.key} value={categoria.key} className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <i className={`fas ${categoria.icone}`} style={{ color: categoria.cor }}></i>
                Participação - {categoria.nome}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dadosFiltrados
                  .sort((a, b) => b.participacao[categoria.key as keyof typeof a.participacao] - a.participacao[categoria.key as keyof typeof a.participacao])
                  .map(loja => (
                    <Card key={loja.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{loja.nome}</CardTitle>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <i className="fas fa-map-marker-alt"></i>
                          {loja.regional}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center mb-4 p-3 bg-muted rounded-lg">
                          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            Total Geral
                          </div>
                          <div className="text-xl font-bold text-emerald-600">
                            {formatCurrency(loja.vendas_geral)}
                          </div>
                        </div>
                        <div 
                          className="text-center p-4 rounded-lg border-2"
                          style={{ 
                            backgroundColor: categoria.cor + '10', 
                            borderColor: categoria.cor + '20' 
                          }}
                        >
                          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            {categoria.nome}
                          </div>
                          <div className="text-sm mb-2">
                            {formatCurrency(loja.vendas_categorias[categoria.key as keyof typeof loja.vendas_categorias])}
                          </div>
                          <div 
                            className="text-2xl font-bold"
                            style={{ color: categoria.cor }}
                          >
                            {formatPercentage(loja.participacao[categoria.key as keyof typeof loja.participacao])}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            de participação
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </TabsContent>
        ))}

        {/* Tabela Completa */}
        <TabsContent value="completo">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-4 text-left font-medium">Loja</th>
                      <th className="p-4 text-left font-medium">Regional</th>
                      <th className="p-4 text-right font-medium">Total Geral</th>
                      {categorias.map(categoria => (
                        <React.Fragment key={categoria.key}>
                          <th className="p-4 text-right font-medium">{categoria.nome}</th>
                          <th className="p-4 text-center font-medium">%</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dadosFiltrados.map(loja => (
                      <tr key={loja.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{loja.nome}</td>
                        <td className="p-4">
                          <Badge variant="secondary">{loja.regional}</Badge>
                        </td>
                        <td className="p-4 text-right">{formatCurrency(loja.vendas_geral)}</td>
                        {categorias.map(categoria => (
                          <React.Fragment key={categoria.key}>
                            <td className="p-4 text-right">
                              {formatCurrency(loja.vendas_categorias[categoria.key as keyof typeof loja.vendas_categorias])}
                            </td>
                            <td className="p-4 text-center">
                              <Badge 
                                variant={
                                  loja.participacao[categoria.key as keyof typeof loja.participacao] >= 25 ? 'default' :
                                  loja.participacao[categoria.key as keyof typeof loja.participacao] >= 15 ? 'secondary' :
                                  'outline'
                                }
                              >
                                {formatPercentage(loja.participacao[categoria.key as keyof typeof loja.participacao])}
                              </Badge>
                            </td>
                          </React.Fragment>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}