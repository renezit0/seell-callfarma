import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Download, 
  Search,
  TrendingUp,
  Store,
  Package,
  Info
} from 'lucide-react';
import { useCallfarmaAPI, VendaFuncionario, FiltrosVendas } from '@/hooks/useCallfarmaAPI';
import { useToast } from '@/hooks/use-toast';

export const VendasFuncionarios = () => {
  const [vendas, setVendas] = useState<VendaFuncionario[]>([]);
  const [resultadosProdutos, setResultadosProdutos] = useState<any[]>([]);
  const [filtros, setFiltros] = useState<FiltrosVendas>({
    dataInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias atrás
    dataFim: new Date().toISOString().split('T')[0], // hoje
    filtroFornecedores: '1998',
    filtroGrupos: '21,20,25'
  });
  const [codigosProdutos, setCodigosProdutos] = useState('');
  
  const { loading, buscarVendasFuncionarios, buscarVendasPorProduto } = useCallfarmaAPI();
  const { toast } = useToast();

  const handleBuscar = async () => {
    // Se há códigos de produtos, usar busca por produtos
    if (codigosProdutos.trim()) {
      const codigosLimpos = codigosProdutos
        .split(',')
        .map(c => c.trim())
        .filter(c => c)
        .join(',');

      console.log('🔍 Buscando vendas para os produtos:', codigosLimpos);

      const resultadosBrutos = await buscarVendasPorProduto({
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
        codigosProdutos: codigosLimpos
      });

      // Agregar os dados por funcionário (igual à busca normal)
      const vendasAgregadas: { [key: string]: VendaFuncionario } = {};
      
      resultadosBrutos.forEach((item: any) => {
        const chave = `${item.CDFUN}-${item.CDFIL}`;
        
        if (!vendasAgregadas[chave]) {
          vendasAgregadas[chave] = {
            CDFUN: item.CDFUN,
            NOME: item.NOMEFUN,
            CDFIL: item.CDFIL,
            NOMEFIL: item.NOMEFIL,
            TOTAL_VALOR: 0,
            TOTAL_QUANTIDADE: 0
          };
        }
        
        vendasAgregadas[chave].TOTAL_VALOR += parseFloat(item.TOTAL_VLR_VE || 0) - parseFloat(item.TOTAL_VLR_DV || 0);
        vendasAgregadas[chave].TOTAL_QUANTIDADE += parseInt(item.TOTAL_QTD_VE || 0) - parseInt(item.TOTAL_QTD_DV || 0);
      });

      const vendasArray = Object.values(vendasAgregadas);
      console.log('Vendas agregadas:', vendasArray);
      
      setVendas(vendasArray);
      setResultadosProdutos([]); // Limpar resultados por produto

      toast({
        title: "Sucesso",
        description: `Encontrados ${vendasArray.length} funcionários com vendas dos produtos`,
      });
    } else {
      // Busca normal por funcionários
      const resultados = await buscarVendasFuncionarios(filtros);
      setVendas(resultados);
      setResultadosProdutos([]); // Limpar resultados por produto
      
      if (resultados.length > 0) {
        toast({
          title: "Sucesso",
          description: `${resultados.length} registros encontrados`,
        });
      } else {
        toast({
          title: "Sem resultados",
          description: "Nenhuma venda encontrada para os filtros selecionados. Verifique os parâmetros e tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(valor);
  };

  const formatarQuantidade = (quantidade: number) => {
    return quantidade.toLocaleString('pt-BR');
  };

  const vendasArray = Array.isArray(vendas) ? vendas : [];
  const totalVendas = vendasArray.reduce((sum, venda) => sum + venda.TOTAL_VALOR, 0);
  const totalQuantidade = vendasArray.reduce((sum, venda) => sum + venda.TOTAL_QUANTIDADE, 0);

  // Determinar qual tipo de resultado mostrar
  const mostrarVendasFuncionarios = vendasArray.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Vendas por Funcionário - API Externa
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
              <Label htmlFor="fornecedores">Fornecedores</Label>
              <Input
                id="fornecedores"
                placeholder="Ex: 1998"
                value={filtros.filtroFornecedores}
                onChange={(e) => setFiltros(prev => ({ ...prev, filtroFornecedores: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="grupos">Grupos</Label>
              <Input
                id="grupos"
                placeholder="Ex: 21,20,25"
                value={filtros.filtroGrupos}
                onChange={(e) => setFiltros(prev => ({ ...prev, filtroGrupos: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="produtos" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produtos Específicos (opcional)
            </Label>
            <Textarea
              id="produtos"
              placeholder="Ex: 23319, 52682, 58033, 60423... (deixe vazio para buscar por funcionário)"
              value={codigosProdutos}
              onChange={(e) => setCodigosProdutos(e.target.value)}
              rows={2}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {codigosProdutos.trim() 
                ? 'Buscará vendas destes produtos específicos' 
                : 'Buscará vendas por funcionário usando filtros acima'
              }
            </p>
          </div>
          
          <Button onClick={handleBuscar} disabled={loading} className="gap-2">
            <Search className="h-4 w-4" />
            {loading ? 'Buscando...' : codigosProdutos.trim() ? 'Buscar Produtos' : 'Buscar Vendas'}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados para Vendas por Funcionário */}
      {mostrarVendasFuncionarios && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{vendasArray.length}</p>
                    <p className="text-sm text-muted-foreground">Funcionários</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{formatarValor(totalVendas)}</p>
                    <p className="text-sm text-muted-foreground">Total Vendas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{formatarQuantidade(totalQuantidade)}</p>
                    <p className="text-sm text-muted-foreground">Total Quantidade</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Resultados ({vendasArray.length} funcionários)</CardTitle>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-2">Funcionário</th>
                      <th className="text-left p-2">Loja</th>
                      <th className="text-right p-2">Valor Total</th>
                      <th className="text-right p-2">Quantidade</th>
                      <th className="text-right p-2">Ticket Médio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendasArray.map((venda, index) => (
                      <tr key={`${venda.CDFUN}-${venda.CDFIL}`} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{venda.NOME}</p>
                            <Badge variant="secondary" className="text-xs">
                              ID: {venda.CDFUN}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{venda.NOMEFIL}</p>
                            <Badge variant="outline" className="text-xs">
                              Código: {venda.CDFIL}
                            </Badge>
                          </div>
                        </td>
                        <td className="text-right p-2 font-medium">
                          {formatarValor(venda.TOTAL_VALOR)}
                        </td>
                        <td className="text-right p-2">
                          {formatarQuantidade(venda.TOTAL_QUANTIDADE)}
                        </td>
                        <td className="text-right p-2">
                          {venda.TOTAL_QUANTIDADE > 0 
                            ? formatarValor(venda.TOTAL_VALOR / venda.TOTAL_QUANTIDADE)
                            : '-'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};