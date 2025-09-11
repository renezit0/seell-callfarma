import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, FileDown, Printer } from 'lucide-react';
import { format, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePeriodoAtual } from '@/hooks/usePeriodoAtual';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Folga {
  folga_id: number;
  usuario_id: number;
  data_folga: string;
  observacao?: string;
  registrado_por: number;
  usuario?: {
    nome: string;
    tipo: string;
  };
}

interface Usuario {
  id: number;
  nome: string;
  tipo: string;
  loja_id: number;
}

const tiposAusencia = {
  folga: { label: 'Folga', color: 'bg-emerald-500' },
  atestado: { label: 'Atestado', color: 'bg-orange-500' },
  feriado: { label: 'Feriado', color: 'bg-purple-500' },
  falta: { label: 'Falta', color: 'bg-red-500' },
  banco: { label: 'Banco de Horas', color: 'bg-yellow-600' },
  ferias: { label: 'Férias', color: 'bg-blue-500' }
};

export default function EscalaConsolidada() {
  const { user } = useAuth();
  const { toast } = useToast();
  const periodo = usePeriodoAtual();
  
  const [folgas, setFolgas] = useState<Folga[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroNome, setFiltroNome] = useState('');
  // Configurar para o mês atual (dia 1 ao último dia)
  const hoje = new Date();
  const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  
  const [dataInicio, setDataInicio] = useState(format(primeiroDiaDoMes, 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(ultimoDiaDoMes, 'yyyy-MM-dd'));
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [editandoCelula, setEditandoCelula] = useState<{usuarioId: number, data: string} | null>(null);

  const podeGerenciar = user?.tipo && ['lider', 'gerente', 'sublider', 'subgerente', 'vendedor', 'operador'].includes(user.tipo);

  useEffect(() => {
    if (user && podeGerenciar) {
      carregarDados();
    }
  }, [user, dataInicio, dataFim]);

  useEffect(() => {
    // Manter as datas do mês atual mesmo quando o período mudar
    const hoje = new Date();
    const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    
    console.log('🔍 ESCALA useEffect [] - hoje:', hoje);
    console.log('🔍 ESCALA useEffect [] - primeiroDiaDoMes:', primeiroDiaDoMes);
    console.log('🔍 ESCALA useEffect [] - ultimoDiaDoMes:', ultimoDiaDoMes);
    console.log('🔍 ESCALA useEffect [] - dataInicio formatada:', format(primeiroDiaDoMes, 'yyyy-MM-dd'));
    console.log('🔍 ESCALA useEffect [] - dataFim formatada:', format(ultimoDiaDoMes, 'yyyy-MM-dd'));
    
    setDataInicio(format(primeiroDiaDoMes, 'yyyy-MM-dd'));
    setDataFim(format(ultimoDiaDoMes, 'yyyy-MM-dd'));
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 ESCALA DEBUG - dataInicio:', dataInicio, 'dataFim:', dataFim);
      console.log('🔍 ESCALA DEBUG - Date objects:', new Date(dataInicio), new Date(dataFim));
      
      // Carregar usuários da loja
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, nome, tipo, loja_id')
        .eq('loja_id', user!.loja_id)
        .eq('status', 'ativo')
        .order('nome');

      if (usuariosError) throw usuariosError;
      setUsuarios(usuariosData || []);

      if (usuariosData && usuariosData.length > 0) {
        // Carregar folgas do período separadamente e depois buscar dados dos usuários
        const { data: folgasData, error: folgasError } = await supabase
          .from('folgas')
          .select('folga_id, usuario_id, data_folga, observacao, registrado_por')
          .gte('data_folga', dataInicio)
          .lte('data_folga', dataFim)
          .in('usuario_id', usuariosData.map(u => u.id));

        if (folgasError) throw folgasError;
        
        // Adicionar informações do usuário às folgas
        const folgasFormatadas = (folgasData || []).map(folga => {
          const usuario = usuariosData.find(u => u.id === folga.usuario_id);
          return {
            ...folga,
            usuario: usuario ? { nome: usuario.nome, tipo: usuario.tipo } : null
          };
        });
        
        setFolgas(folgasFormatadas);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para obter abreviação dos dias da semana
  const getDiaSemanaAbrev = (data: Date) => {
    const dias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    return dias[data.getDay()];
  };

  // Função para extrair tipo da observação
  const extrairTipoDaObservacao = (observacao?: string) => {
    if (!observacao) return 'folga';
    const match = observacao.match(/\[Tipo:\s*(\w+)\]/);
    return match ? match[1] : 'folga';
  };

  // Criar array de dias usando strings para evitar problemas de timezone
  const diasPeriodo = eachDayOfInterval({
    start: new Date(dataInicio + 'T12:00:00'), // Meio-dia para evitar problemas de timezone
    end: new Date(dataFim + 'T12:00:00')
  });

  const usuariosFiltrados = usuarios.filter(usuario => 
    usuario.nome.toLowerCase().includes(filtroNome.toLowerCase())
  );

  const folgasFiltradas = folgas.filter(folga => {
    // Usar comparação de strings para evitar problemas de timezone
    const dentroIntervalo = folga.data_folga >= dataInicio && folga.data_folga <= dataFim;
    const tipoExtraido = extrairTipoDaObservacao(folga.observacao);
    const tipoMatch = !filtroTipo || filtroTipo === 'todos' || tipoExtraido === filtroTipo;
    return dentroIntervalo && tipoMatch;
  });

  const getFolgaParaDia = (usuarioId: number, data: Date) => {
    return folgasFiltradas.find(folga => 
      folga.usuario_id === usuarioId && 
      isSameDay(parseISO(folga.data_folga), data)
    );
  };

  const adicionarOuEditarFolga = async (usuarioId: number, data: Date, tipo: string) => {
    try {
      const dataStr = format(data, 'yyyy-MM-dd');
      const folgaExistente = getFolgaParaDia(usuarioId, data);

      if (folgaExistente) {
        // Atualizar folga existente
        const { error } = await supabase
          .from('folgas')
          .update({ 
            observacao: `[Tipo: ${tipo}]` 
          })
          .eq('folga_id', folgaExistente.folga_id);

        if (error) throw error;
      } else {
        // Criar nova folga
        const { error } = await supabase
          .from('folgas')
          .insert({
            usuario_id: usuarioId,
            data_folga: dataStr,
            observacao: `[Tipo: ${tipo}]`,
            registrado_por: user!.id,
            periodo_id: 1 // Assumindo período ativo
          });

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Ausência atualizada com sucesso!"
      });

      carregarDados();
    } catch (error) {
      console.error('Erro ao salvar folga:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a ausência.",
        variant: "destructive"
      });
    }
  };

  const removerFolga = async (usuarioId: number, data: Date) => {
    try {
      const folga = getFolgaParaDia(usuarioId, data);
      if (!folga) return;

      const { error } = await supabase
        .from('folgas')
        .delete()
        .eq('folga_id', folga.folga_id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ausência removida com sucesso!"
      });

      carregarDados();
    } catch (error) {
      console.error('Erro ao remover folga:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a ausência.",
        variant: "destructive"
      });
    }
  };

  const CelulaEdicao = ({ usuarioId, data }: { usuarioId: number, data: Date }) => {
    const folga = getFolgaParaDia(usuarioId, data);
    const isEditando = editandoCelula?.usuarioId === usuarioId && 
                       editandoCelula?.data === format(data, 'yyyy-MM-dd');

    if (isEditando) {
      return (
        <td className="border p-0.5 min-w-[32px] sm:min-w-[35px] max-w-[32px] sm:max-w-[35px] text-center relative">
          <Select
            defaultValue="folga"
            onValueChange={(tipo) => {
              if (tipo === 'remover') {
                removerFolga(usuarioId, data);
              } else {
                adicionarOuEditarFolga(usuarioId, data, tipo);
              }
              setEditandoCelula(null);
            }}
          >
            <SelectTrigger className="h-4 sm:h-5 text-[9px] sm:text-[10px] border-0 bg-primary/10 px-0.5 sm:px-1">
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="remover" className="text-destructive text-xs">
                Remover
              </SelectItem>
              {Object.entries(tiposAusencia).map(([key, value]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {value.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
      );
    }

    return (
      <td 
        className="border p-0.5 min-w-[32px] sm:min-w-[40px] max-w-[32px] sm:max-w-[40px] text-center cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => {
          if (folga) {
            setEditandoCelula({ usuarioId, data: format(data, 'yyyy-MM-dd') });
          } else {
            // Se não há folga, adicionar automaticamente como "folga"
            adicionarOuEditarFolga(usuarioId, data, 'folga');
          }
        }}
      >
        {folga ? (
          <Badge 
            variant="secondary" 
            className={`text-[8px] sm:text-[9px] px-0.5 py-0 h-3 sm:h-4 leading-tight ${tiposAusencia[extrairTipoDaObservacao(folga.observacao) as keyof typeof tiposAusencia]?.color || 'bg-gray-500'} text-white border-0`}
          >
            {extrairTipoDaObservacao(folga.observacao).toUpperCase().slice(0, 2)}
          </Badge>
        ) : (
          <div className="w-full h-3 sm:h-4 flex items-center justify-center text-muted-foreground text-[9px] sm:text-[10px] hover:text-primary">
            +
          </div>
        )}
      </td>
    );
  };

  if (!podeGerenciar) {
    return (
      <div className="container mx-auto max-w-7xl p-4 md:p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para acessar a visão consolidada.
          </p>
          <Link to="/escala">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Escala
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container-full space-y-4">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          <Link to="/escala">
            <Button variant="outline" size="sm" className="w-fit">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold sm:text-2xl lg:text-3xl">
              Visão Consolidada de Ausências
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm break-words">
              Período: {format(new Date(dataInicio + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(dataFim + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mobile: Stack vertically, Desktop: Grid layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <Label className="text-sm">Buscar Funcionário:</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    placeholder="Digite o nome..."
                    value={filtroNome}
                    onChange={(e) => setFiltroNome(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-sm">De:</Label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-sm">Até:</Label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-sm">Filtrar por Tipo:</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os Tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Tipos</SelectItem>
                    {Object.entries(tiposAusencia).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Mobile: Full width buttons, Desktop: Inline */}
              <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1 flex lg:items-end">
                <Button variant="outline" size="sm" className="w-full lg:w-auto">
                  <Printer className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Imprimir</span>
                  <span className="sm:hidden">Print</span>
                </Button>
              </div>
              
              <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1 flex lg:items-end">
                <Button variant="outline" size="sm" className="w-full lg:w-auto">
                  <FileDown className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Exportar PDF</span>
                  <span className="sm:hidden">PDF</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legenda de tipos */}
      <div className="flex flex-wrap gap-4 text-sm">
        {Object.entries(tiposAusencia).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${value.color}`}></div>
            <span>{value.label}</span>
          </div>
        ))}
      </div>

      {/* Tabela Responsiva */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto border rounded-lg h-[75vh] sm:max-h-[80vh] sm:min-h-[65vh]">
            <div>
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-muted z-10">
                  <tr>
                    <th className="border p-1 sm:p-2 text-left bg-muted font-medium sticky left-0 z-20 min-w-[120px] sm:min-w-[140px] max-w-[120px] sm:max-w-[140px]">
                      <div className="text-xs font-semibold">Funcionário</div>
                    </th>
                    {diasPeriodo.map(dia => (
                      <th key={dia.toISOString()} className="border p-0.5 sm:p-1 text-center bg-muted min-w-[32px] sm:min-w-[40px] max-w-[32px] sm:max-w-[40px]">
                        <div className="flex flex-col items-center justify-center h-10 sm:h-12">
                          <span className="font-bold text-sm sm:text-base leading-none mb-0.5">
                            {format(dia, 'dd')}
                          </span>
                          <span className="text-[8px] sm:text-[9px] text-muted-foreground leading-none">
                            {getDiaSemanaAbrev(dia)}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map(usuario => (
                    <tr key={usuario.id} className="hover:bg-muted/30">
                      <td className="border p-1 sm:p-2 font-medium bg-muted/20 sticky left-0 z-10 min-w-[120px] sm:min-w-[140px] max-w-[120px] sm:max-w-[140px]">
                        <div className="truncate">
                          <div 
                            className="font-medium text-[10px] sm:text-xs leading-tight truncate cursor-help" 
                            title={usuario.nome}
                          >
                            <span className="sm:hidden">
                              {usuario.nome.length > 12 ? `${usuario.nome.substring(0, 12)}...` : usuario.nome}
                            </span>
                            <span className="hidden sm:inline">
                              {usuario.nome.length > 18 ? `${usuario.nome.substring(0, 18)}...` : usuario.nome}
                            </span>
                          </div>
                          <div 
                            className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight truncate"
                            title={usuario.tipo}
                          >
                            {usuario.tipo.toUpperCase()}
                          </div>
                        </div>
                      </td>
                      {diasPeriodo.map(dia => (
                        <CelulaEdicao 
                          key={`${usuario.id}-${dia.toISOString()}`}
                          usuarioId={usuario.id}
                          data={dia}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground text-center">
        Para editar uma ausência, clique na célula. Para registrar nova ausência, clique em uma célula vazia.
        <br />
        Exibindo {usuariosFiltrados.length} de {usuarios.length} funcionários
      </div>
    </div>
  );
}