import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Store, 
  Users, 
  Medal,
  Award,
  Crown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePeriodoAtual } from '@/hooks/usePeriodoAtual';

interface LojaRanking {
  id: number;
  numero: string;
  nome: string;
  grupo_id: string;
  totalVendas: number;
  totalColaboradores: number;
  mediaVendasPorColaborador: number;
  posicao: number;
}

interface ColaboradorRanking {
  id: number;
  nome: string;
  loja_id: number;
  loja_nome: string;
  totalVendas: number;
  posicao: number;
}

export default function Status() {
  const periodoAtual = usePeriodoAtual();
  const { toast } = useToast();
  
  const [grupoSelecionado, setGrupoSelecionado] = useState<string>('1');  
  const [loading, setLoading] = useState(false);
  const [lojasRanking, setLojasRanking] = useState<LojaRanking[]>([]);
  const [colaboradoresRanking, setColaboradoresRanking] = useState<ColaboradorRanking[]>([]);
  const [viewMode, setViewMode] = useState<'lojas' | 'colaboradores'>('lojas');

  useEffect(() => {
    carregarDados();
  }, [grupoSelecionado, periodoAtual]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      await Promise.all([
        carregarRankingLojas(),
        carregarRankingColaboradores()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarRankingLojas = async () => {
    try {
      // Buscar lojas participantes de campanhas ativas do grupo selecionado
      const { data: participantes, error: participantesError } = await supabase
        .from('campanhas_vendas_lojas_participantes')
        .select(`
          loja_id,
          codigo_loja,
          grupo_id,
          campanhas_vendas_lojas!inner(
            status
          )
        `)
        .eq('grupo_id', grupoSelecionado)
        .eq('campanhas_vendas_lojas.status', 'ativa');

      if (participantesError) throw participantesError;

      if (!participantes || participantes.length === 0) {
        setLojasRanking([]);
        return;
      }

      // Buscar dados das lojas
      const lojasIds = participantes.map(p => p.loja_id);
      const { data: lojas, error: lojasError } = await supabase
        .from('lojas')
        .select('*')
        .in('id', lojasIds);

      if (lojasError) throw lojasError;

      // Buscar vendas do período
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select(`
          valor_venda,
          usuario_id,
          usuarios!inner(
            loja_id
          )
        `)
        .gte('data_venda', periodoAtual.dataInicio.toISOString().split('T')[0])
        .lte('data_venda', periodoAtual.dataFim.toISOString().split('T')[0])
        .in('usuarios.loja_id', lojasIds);

      if (vendasError) throw vendasError;

      const lojasComVendas: LojaRanking[] = [];

      for (const loja of lojas || []) {
        // Filtrar vendas da loja
        const vendasLoja = vendas?.filter((v: any) => v.usuarios.loja_id === loja.id) || [];
        const totalVendas = vendasLoja.reduce((sum: number, v: any) => sum + (v.valor_venda || 0), 0);

        // Buscar total de colaboradores da loja
        const { count: totalColaboradores } = await supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true })
          .eq('loja_id', loja.id)
          .neq('tipo', 'admin');

        const mediaVendasPorColaborador = totalColaboradores && totalColaboradores > 0 
          ? totalVendas / totalColaboradores 
          : 0;

        lojasComVendas.push({
          id: loja.id,
          numero: loja.numero,
          nome: loja.nome,
          grupo_id: grupoSelecionado,
          totalVendas,
          totalColaboradores: totalColaboradores || 0,
          mediaVendasPorColaborador,
          posicao: 0
        });
      }

      // Ordenar por total de vendas
      lojasComVendas.sort((a, b) => b.totalVendas - a.totalVendas);

      // Adicionar posições
      const lojasComPosicoes = lojasComVendas.map((loja, index) => ({
        ...loja,
        posicao: index + 1
      }));

      setLojasRanking(lojasComPosicoes);
    } catch (error) {
      console.error('Erro ao carregar ranking de lojas:', error);
    }
  };

  const carregarRankingColaboradores = async () => {
    try {
      // Buscar lojas participantes de campanhas ativas do grupo selecionado
      const { data: participantes, error: participantesError } = await supabase
        .from('campanhas_vendas_lojas_participantes')
        .select(`
          loja_id,
          codigo_loja,
          grupo_id,
          campanhas_vendas_lojas!inner(
            status
          )
        `)
        .eq('grupo_id', grupoSelecionado)
        .eq('campanhas_vendas_lojas.status', 'ativa');

      if (participantesError) throw participantesError;

      if (!participantes || participantes.length === 0) {
        setColaboradoresRanking([]);
        return;
      }

      // Buscar dados das lojas
      const lojasIds = participantes.map(p => p.loja_id);
      const { data: lojas, error: lojasError } = await supabase
        .from('lojas')
        .select('*')
        .in('id', lojasIds);

      if (lojasError) throw lojasError;

      const colaboradoresComVendas: ColaboradorRanking[] = [];

      for (const loja of lojas || []) {
        // Buscar colaboradores da loja
        const { data: colaboradores, error: colaboradoresError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('loja_id', loja.id)
          .neq('tipo', 'admin');

        if (colaboradoresError) continue;

        for (const colaborador of colaboradores || []) {
          // Buscar vendas do colaborador no período
          const { data: vendas, error: vendasError } = await supabase
            .from('vendas')
            .select('valor_venda')
            .eq('usuario_id', colaborador.id)
            .gte('data_venda', periodoAtual.dataInicio.toISOString().split('T')[0])
            .lte('data_venda', periodoAtual.dataFim.toISOString().split('T')[0]);

          if (vendasError) continue;

          const totalVendas = vendas?.reduce((sum, v) => sum + (v.valor_venda || 0), 0) || 0;

          if (totalVendas > 0) {
            colaboradoresComVendas.push({
              id: colaborador.id,
              nome: colaborador.nome,
              loja_id: loja.id,
              loja_nome: loja.nome,
              totalVendas,
              posicao: 0
            });
          }
        }
      }

      // Ordenar por total de vendas
      colaboradoresComVendas.sort((a, b) => b.totalVendas - a.totalVendas);

      // Adicionar posições
      const colaboradoresComPosicoes = colaboradoresComVendas.map((colaborador, index) => ({
        ...colaborador,
        posicao: index + 1
      }));

      setColaboradoresRanking(colaboradoresComPosicoes);
    } catch (error) {
      console.error('Erro ao carregar ranking de colaboradores:', error);
    }
  };

  const formatarValor = (valor: number) => {
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

  return (
    <div className="page-container min-h-screen bg-background p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Status e Rankings
          </h1>
          <Badge variant="outline" className="text-sm">
            {periodoAtual.dataInicio.toLocaleDateString('pt-BR')} - {periodoAtual.dataFim.toLocaleDateString('pt-BR')}
          </Badge>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Grupo</label>
                <Select 
                  value={grupoSelecionado} 
                  onValueChange={(value) => setGrupoSelecionado(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Grupo 1</SelectItem>
                    <SelectItem value="2">Grupo 2</SelectItem>
                    <SelectItem value="3">Grupo 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Visualização</label>
                <div className="flex gap-2">
                  <Button 
                    variant={viewMode === 'lojas' ? "default" : "outline"}
                    onClick={() => setViewMode('lojas')}
                    className="flex-1"
                  >
                    <Store className="h-4 w-4 mr-2" />
                    Lojas
                  </Button>
                  <Button 
                    variant={viewMode === 'colaboradores' ? "default" : "outline"}
                    onClick={() => setViewMode('colaboradores')}
                    className="flex-1"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Colaboradores
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8">Carregando rankings...</div>
        ) : (
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'lojas' | 'colaboradores')}>
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
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Grupo {grupoSelecionado} - Ranking de Lojas</h2>
                  <Badge variant="secondary">{lojasRanking.length} lojas</Badge>
                </div>
                {lojasRanking.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Store className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhuma loja com vendas encontrada no período.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {lojasRanking.map((loja) => (
                      <Card key={loja.id} className={`transition-all hover:shadow-lg ${obterCorCard(loja.posicao)}`}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {obterIconePosicao(loja.posicao)}
                              <div>
                                <h3 className="text-lg font-semibold">{loja.numero} - {loja.nome}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {loja.totalColaboradores} colaboradores
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">
                                {formatarValor(loja.totalVendas)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Média por colaborador: {formatarValor(loja.mediaVendasPorColaborador)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="colaboradores" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Grupo {grupoSelecionado} - Ranking de Colaboradores</h2>
                  <Badge variant="secondary">{colaboradoresRanking.length} colaboradores</Badge>
                </div>
                {colaboradoresRanking.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhum colaborador com vendas encontrado no período.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {colaboradoresRanking.map((colaborador) => (
                      <Card key={colaborador.id} className={`transition-all hover:shadow-md ${obterCorCard(colaborador.posicao)}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {obterIconePosicao(colaborador.posicao)}
                              <div>
                                <h4 className="font-semibold">{colaborador.nome}</h4>
                                <p className="text-sm text-muted-foreground">{colaborador.loja_nome}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-primary">
                                {formatarValor(colaborador.totalVendas)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}