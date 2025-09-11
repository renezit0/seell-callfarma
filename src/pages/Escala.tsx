import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { usePeriodoAtual } from '@/hooks/usePeriodoAtual';
import { supabase } from '@/integrations/supabase/client';
import { getDescricaoTipoUsuario } from '@/utils/userTypes';
import { useToast } from '@/hooks/use-toast';
import { Users, Eye, Calendar as CalendarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CalendarioEscala } from '@/components/escala/CalendarioEscala';
import { PainelRegistroAusencia } from '@/components/escala/PainelRegistroAusencia';

interface Folga {
  folga_id: number;
  usuario_id: number;
  data_folga: string;
  tipo?: string;
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

export default function Escala() {
  const { user } = useAuth();
  const { toast } = useToast();
  const periodo = usePeriodoAtual();
  
  const [folgas, setFolgas] = useState<Folga[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<number | null>(null);
  const [modoSelecaoMultipla, setModoSelecaoMultipla] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Verificar permissões do usuário
  const podeGerenciar = user?.tipo && ['lider', 'gerente', 'sublider', 'subgerente'].includes(user.tipo);
  const podeEditar = podeGerenciar || (user?.permissao === 2);
  
  useEffect(() => {
    if (user) {
      carregarDados();
    }
  }, [user, usuarioSelecionado, periodo]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar usuários da loja
      if (podeGerenciar) {
        const { data: usuariosData, error: usuariosError } = await supabase
          .from('usuarios')
          .select('id, nome, tipo, loja_id')
          .eq('loja_id', user!.loja_id)
          .eq('status', 'ativo')
          .order('nome');

        if (usuariosError) throw usuariosError;
        setUsuarios(usuariosData || []);
      }

      // Carregar folgas do período
      let query = supabase
        .from('folgas')
        .select(`
          folga_id,
          usuario_id,
          data_folga,
          observacao,
          registrado_por
        `)
        .gte('data_folga', periodo.dataInicio.toISOString().split('T')[0])
        .lte('data_folga', periodo.dataFim.toISOString().split('T')[0]);

      // Filtrar por usuário específico quando selecionado
      if (podeGerenciar && usuarioSelecionado) {
        query = query.eq('usuario_id', usuarioSelecionado);
      } else if (!podeGerenciar) {
        // Para usuários sem permissão de gerenciamento, mostrar apenas suas próprias folgas
        query = query.eq('usuario_id', user!.id);
      } else if (podeGerenciar && usuarios.length > 0) {
        // Para visão geral, filtrar por loja
        query = query.in('usuario_id', usuarios.map(u => u.id));
      }

      const { data: folgasData, error: folgasError } = await query;
      
      if (folgasError) throw folgasError;
      setFolgas(folgasData || []);
      
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

  const adicionarFolga = async (novaFolgaData: { data_folga: string; tipo: string; observacao: string }) => {
    if (!novaFolgaData.data_folga || !novaFolgaData.tipo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      const targetUserId = podeGerenciar && usuarioSelecionado ? usuarioSelecionado : user!.id;
      
      const { error } = await supabase
        .from('folgas')
        .insert({
          usuario_id: targetUserId,
          data_folga: novaFolgaData.data_folga,
          observacao: `${novaFolgaData.observacao || ''} [Tipo: ${novaFolgaData.tipo}]`.trim(),
          registrado_por: user!.id,
          periodo_id: 1 // Assumindo período ativo
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ausência registrada com sucesso!"
      });
      
      carregarDados();
      
    } catch (error) {
      console.error('Erro ao adicionar folga:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a ausência.",
        variant: "destructive"
      });
    }
  };

  const removerFolga = async (folgaId: number) => {
    try {
      const { error } = await supabase
        .from('folgas')
        .delete()
        .eq('folga_id', folgaId);

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

  // Função para extrair tipo da observação
  const extrairTipoDaObservacao = (observacao?: string) => {
    if (!observacao) return 'folga';
    const match = observacao.match(/\[Tipo:\s*(\w+)\]/);
    return match ? match[1] : 'folga';
  };

  const estatisticas = {
    totalAusencias: folgas.length,
    porTipo: Object.entries(tiposAusencia).map(([tipo, info]) => ({
      tipo,
      label: info.label,
      count: folgas.filter(f => extrairTipoDaObservacao(f.observacao) === tipo).length,
      color: info.color
    }))
  };

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
    <div className="page-container-full space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Escala de Folgas</h1>
          <p className="text-muted-foreground">
            Período: {periodo.label}
          </p>
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Modo Seleção Múltipla */}
          <div className="flex items-center space-x-2">
            <Switch 
              id="selecao-multipla"
              checked={modoSelecaoMultipla}
              onCheckedChange={setModoSelecaoMultipla}
            />
            <Label htmlFor="selecao-multipla" className="text-sm">
              Modo Seleção Múltipla
            </Label>
          </div>

          {podeGerenciar && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link to="/escala-consolidada">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Users className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Visão Consolidada de Ausências</span>
                  <span className="sm:hidden">Visão Consolidada</span>
                </Button>
              </Link>
              
              <Select value={usuarioSelecionado?.toString()} onValueChange={(value) => setUsuarioSelecionado(Number(value))}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Selecionar funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map(usuario => (
                    <SelectItem key={usuario.id} value={usuario.id.toString()}>
                      {usuario.nome} - {getDescricaoTipoUsuario(usuario.tipo)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Calendário Principal */}
        <CalendarioEscala
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          periodo={periodo}
          folgas={folgas}
          tiposAusencia={tiposAusencia}
        />

        {/* Painel lateral */}
        <PainelRegistroAusencia
          folgas={folgas}
          periodo={periodo}
          podeEditar={podeEditar}
          visaoConsolidada={false}
          tiposAusencia={tiposAusencia}
          onAdicionarFolga={adicionarFolga}
          onRemoverFolga={removerFolga}
        />
      </div>

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estatísticas do Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 md:gap-4">
            <div className="text-center p-4 border rounded-lg bg-muted/20">
              <div className="text-2xl font-bold text-primary">{estatisticas.totalAusencias}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            {estatisticas.porTipo.map(tipo => (
              <div key={tipo.tipo} className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${tipo.color}`}></div>
                  <span className="text-xs font-medium">{tipo.label}</span>
                </div>
                <div className="text-xl font-bold">{tipo.count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!podeEditar && (
        <Alert>
          <Eye className="h-4 w-4" />
          <AlertDescription>
            Você tem acesso apenas para visualização. Para editar ausências, solicite permissão ao seu gestor.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}