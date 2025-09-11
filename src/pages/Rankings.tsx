import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Medal, Award, TrendingUp, Search, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { useCallfarmaAPI } from "@/hooks/useCallfarmaAPI";
import { useToast } from "@/hooks/use-toast";
import { usePeriodoAtual } from "@/hooks/usePeriodoAtual";

interface RankingData {
  CDFUN: number;
  NOME: string;
  CDFIL: number;
  NOMEFIL: string;
  total_rentaveis: number;
  total_goodlife: number;
  posicao_rentaveis: number;
  posicao_goodlife: number;
}

interface Filtros {
  dataInicio: string;
  dataFim: string;
  categoria: 'rentaveis' | 'goodlife' | 'ambas';
}

interface Loja {
  id: number;
  nome: string;
  numero: string;
}

export default function Rankings() {
  // Todos os hooks declarados primeiro  
  const periodoAtual = usePeriodoAtual();
  const { user, loading: userLoading } = useAuth();
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [selectedLojaId, setSelectedLojaId] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({
    dataInicio: periodoAtual.dataInicio.toISOString().split('T')[0],
    dataFim: periodoAtual.dataFim.toISOString().split('T')[0],
    categoria: 'ambas'
  });
  
  const { buscarVendasFuncionarios } = useCallfarmaAPI();
  const { toast } = useToast();

  // Funções declaradas antes do useEffect
  const loadLojas = async () => {
    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('id, nome, numero')
        .order('nome');

      if (error) throw error;
      setLojas(data || []);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    }
  };

  const buscarRankings = async () => {
    try {
      setLoading(true);
      console.log('🔍 Buscando rankings de funcionários da API externa...');
      
      const promises = [];
      
      // Buscar vendas por categoria conforme selecionado usando a função correta para funcionários
      if (filtros.categoria === 'rentaveis' || filtros.categoria === 'ambas') {
        promises.push(buscarVendasFuncionarios({
          dataInicio: filtros.dataInicio,
          dataFim: filtros.dataFim,
          filtroGrupos: '20,25' // Grupos rentáveis
        }));
      }
      
      if (filtros.categoria === 'goodlife' || filtros.categoria === 'ambas') {
        promises.push(buscarVendasFuncionarios({
          dataInicio: filtros.dataInicio,
          dataFim: filtros.dataFim,
          filtroGrupos: '22' // Grupo goodlife
        }));
      }
      
      const resultados = await Promise.all(promises);
      
      let vendasRentaveis: any[] = [];
      let vendasGoodlife: any[] = [];
      
      if (filtros.categoria === 'rentaveis') {
        vendasRentaveis = resultados[0] || [];
      } else if (filtros.categoria === 'goodlife') {
        vendasGoodlife = resultados[0] || [];
      } else if (filtros.categoria === 'ambas') {
        vendasRentaveis = resultados[0] || [];
        vendasGoodlife = resultados[1] || [];
      }
      
      console.log('Vendas rentáveis encontradas:', vendasRentaveis.length);
      console.log('Vendas goodlife encontradas:', vendasGoodlife.length);
      
      // Filtrar por loja se necessário
      const filtrarPorLoja = (vendas: any[]) => {
        if (!canSelectLojas && user?.loja_id) {
          // Buscar código da loja do usuário
          const lojaUsuario = lojas.find(l => l.id === user.loja_id);
          if (lojaUsuario) {
            return vendas.filter(v => v.CDFIL === parseInt(lojaUsuario.numero));
          }
        } else if (canSelectLojas && selectedLojaId !== "all") {
          const lojaSelecionada = lojas.find(l => l.id === parseInt(selectedLojaId));
          if (lojaSelecionada) {
            return vendas.filter(v => v.CDFIL === parseInt(lojaSelecionada.numero));
          }
        }
        return vendas;
      };
      
      vendasRentaveis = filtrarPorLoja(vendasRentaveis);
      vendasGoodlife = filtrarPorLoja(vendasGoodlife);
      
      console.log('Vendas rentáveis filtradas:', vendasRentaveis.length);
      console.log('Vendas goodlife filtradas:', vendasGoodlife.length);
      
      // Agregar dados por funcionário
      const funcionariosMap = new Map<string, RankingData>();
      
      // Processar vendas rentáveis (dados por funcionário)
      vendasRentaveis.forEach((funcionario: any) => {
        const key = `${funcionario.CDFUN}-${funcionario.CDFIL}`;
        
        funcionariosMap.set(key, {
          CDFUN: funcionario.CDFUN,
          NOME: funcionario.NOME,
          CDFIL: funcionario.CDFIL,
          NOMEFIL: funcionario.NOMEFIL,
          total_rentaveis: funcionario.TOTAL_VALOR || 0,
          total_goodlife: 0,
          posicao_rentaveis: 0,
          posicao_goodlife: 0
        });
      });
      
      // Processar vendas goodlife (dados por funcionário)
      vendasGoodlife.forEach((funcionario: any) => {
        const key = `${funcionario.CDFUN}-${funcionario.CDFIL}`;
        
        if (funcionariosMap.has(key)) {
          const func = funcionariosMap.get(key)!;
          func.total_goodlife += funcionario.TOTAL_VALOR || 0;
        } else {
          funcionariosMap.set(key, {
            CDFUN: funcionario.CDFUN,
            NOME: funcionario.NOME,
            CDFIL: funcionario.CDFIL,
            NOMEFIL: funcionario.NOMEFIL,
            total_rentaveis: 0,
            total_goodlife: funcionario.TOTAL_VALOR || 0,
            posicao_rentaveis: 0,
            posicao_goodlife: 0
          });
        }
      });
      
      const arrayFuncionarios = Array.from(funcionariosMap.values());
      
      // Calcular posições para rentáveis
      const rankingRentaveis = [...arrayFuncionarios].sort((a, b) => b.total_rentaveis - a.total_rentaveis);
      rankingRentaveis.forEach((item, index) => {
        const funcionario = funcionariosMap.get(`${item.CDFUN}-${item.CDFIL}`)!;
        funcionario.posicao_rentaveis = index + 1;
      });
      
      // Calcular posições para goodlife
      const rankingGoodlife = [...arrayFuncionarios].sort((a, b) => b.total_goodlife - a.total_goodlife);
      rankingGoodlife.forEach((item, index) => {
        const funcionario = funcionariosMap.get(`${item.CDFUN}-${item.CDFIL}`)!;
        funcionario.posicao_goodlife = index + 1;
      });
      
      setRankings(arrayFuncionarios);
      
      toast({
        title: "Sucesso",
        description: `${arrayFuncionarios.length} funcionários encontrados`,
      });
      
    } catch (error) {
      console.error('Erro ao buscar rankings:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar dados da API externa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // useEffect depois de todas as funções
  useEffect(() => {
    if (user && !userLoading) {
      loadLojas();
    }
  }, [user, userLoading]);

  // Carregar dados automaticamente ao entrar na página
  useEffect(() => {
    if (user && !userLoading && lojas.length > 0) {
      buscarRankings();
    }
  }, [user, userLoading, lojas]);

  // Verificações condicionais DEPOIS de todos os hooks
  const allowedRoles = ['gerente', 'lider', 'sublider', 'subgerente', 'admin', 'supervisor', 'rh'];
  const canSelectLojas = user?.tipo && ['admin', 'supervisor', 'rh'].includes(user.tipo);

  // Se ainda está carregando o usuário, mostrar loading
  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Se usuário carregou mas não tem permissão, redirecionar
  if (!user?.tipo || !allowedRoles.includes(user.tipo)) {
    return <Navigate to="/" replace />;
  }

  // Funções auxiliares
  const getRankIcon = (posicao: number) => {
    switch (posicao) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">{posicao}</span>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rankings de Funcionários</h1>
          <p className="text-muted-foreground">
            Ranking de vendas por funcionário via API Externa - Rentáveis e GoodLife (Período: 21 do mês atual até 20 do mês seguinte)
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={filtros.categoria} onValueChange={(value: any) => setFiltros(prev => ({ ...prev, categoria: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambas">Ambas (Rentáveis + GoodLife)</SelectItem>
                    <SelectItem value="rentaveis">Apenas Rentáveis (Grupos 20, 25)</SelectItem>
                    <SelectItem value="goodlife">Apenas GoodLife (Grupo 22)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {canSelectLojas && (
                <div>
                  <Label htmlFor="loja">Loja</Label>
                  <Select value={selectedLojaId} onValueChange={setSelectedLojaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar loja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as lojas</SelectItem>
                      {lojas.map((loja) => (
                        <SelectItem key={loja.id} value={loja.id.toString()}>
                          {loja.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <Button onClick={buscarRankings} disabled={loading} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Search className="h-4 w-4" />
              {loading ? 'Buscando...' : 'Buscar Rankings'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ranking Rentáveis */}
          {(filtros.categoria === 'rentaveis' || filtros.categoria === 'ambas') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Ranking Rentáveis (Grupos 20, 25)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rankings
                    .filter(item => item.total_rentaveis > 0)
                    .sort((a, b) => a.posicao_rentaveis - b.posicao_rentaveis)
                    .map((item) => (
                      <div
                        key={`rentaveis-${item.CDFUN}-${item.CDFIL}`}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                         <div className="flex items-center justify-center min-w-12">
                           {getRankIcon(item.posicao_rentaveis)}
                         </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">
                            {item.NOME}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.NOMEFIL} (ID: {item.CDFUN})
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(item.total_rentaveis)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ranking GoodLife */}
          {(filtros.categoria === 'goodlife' || filtros.categoria === 'ambas') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  Ranking GoodLife (Grupo 22)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rankings
                    .filter(item => item.total_goodlife > 0)
                    .sort((a, b) => a.posicao_goodlife - b.posicao_goodlife)
                    .map((item) => (
                      <div
                        key={`goodlife-${item.CDFUN}-${item.CDFIL}`}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                         <div className="flex items-center justify-center min-w-12">
                           {getRankIcon(item.posicao_goodlife)}
                         </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">
                            {item.NOME}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.NOMEFIL} (ID: {item.CDFUN})
                          </div>
                          <div className="text-sm font-medium text-purple-600">
                            {formatCurrency(item.total_goodlife)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!loading && rankings.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum dado encontrado
            </h3>
            <p className="text-muted-foreground">
              Não há dados de vendas para o período selecionado.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}