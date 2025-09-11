import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePeriodContext } from "@/contexts/PeriodContext";
import { PeriodSelector } from "@/components/PeriodSelector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { getNomeCategoria, getIconeCategoria, getClasseCorCategoria } from "@/utils/categories";
import { eachDayOfInterval, getDay } from "date-fns";
import { StoreSelector } from "@/components/StoreSelector";

interface MetaCategoria {
  categoria: string;
  nome: string;
  meta: number;
  realizado: number;
  progresso: number;
  restante: number;
  metaDiaria: number;
  mediaRealizada: number;
  icon: string;
  color: string;
}

export default function MetasLojaPage() {
  const { user, loading: authLoading } = useAuth();
  const { selectedPeriod } = usePeriodContext();
  const [metas, setMetas] = useState<MetaCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodoInfo, setPeriodoInfo] = useState<any>(null);
  const [lojaInfo, setLojaInfo] = useState<{ regiao: string; numero: string; nome: string } | null>(null);
  const [selectedLojaId, setSelectedLojaId] = useState<number | null>(null);

  // Check if user can view all stores
  const canViewAllStores = user?.tipo && ['admin', 'supervisor', 'compras'].includes(user.tipo);
  const currentLojaId = selectedLojaId || user?.loja_id || null;

  useEffect(() => {
    if (user && selectedPeriod && currentLojaId) {
      fetchMetas();
    }
  }, [user, selectedPeriod, currentLojaId]);

  const fetchMetas = async () => {
    if (!user || !selectedPeriod) return;
    
    setLoading(true);
    try {
      // Buscar informações da loja (incluindo região)
      const { data: loja, error: lojaError } = await supabase
        .from('lojas')
        .select('regiao, numero, nome')
        .eq('id', currentLojaId!)
        .single();

      if (lojaError) {
        console.error('Erro ao buscar informações da loja:', lojaError);
        setLoading(false);
        return;
      }

      setLojaInfo(loja);

      // Buscar período atual usando o período selecionado do contexto
      const { data: periodos, error: periodosError } = await supabase
        .from('periodos_meta')
        .select('*')
        .eq('id', selectedPeriod.id)
        .eq('status', 'ativo')
        .limit(1);

      if (periodosError) {
        console.error('Erro ao buscar períodos:', periodosError);
        setLoading(false);
        return;
      }

      if (!periodos || periodos.length === 0) {
        console.log('Período selecionado não encontrado');
        setLoading(false);
        return;
      }

      const periodoAtual = periodos[0];
      setPeriodoInfo(periodoAtual);

      // Buscar metas da loja atual
      const { data: metasLoja } = await supabase
        .from('metas_loja')
        .select('*, metas_loja_categorias(*)')
        .eq('loja_id', currentLojaId!)
        .eq('periodo_meta_id', periodoAtual.id);

      // Buscar vendas da loja atual no período correto
      const { data: vendasLoja } = await supabase
        .from('vendas_loja')
        .select('*')
        .eq('loja_id', currentLojaId!)
        .gte('data_venda', periodoAtual.data_inicio)
        .lte('data_venda', periodoAtual.data_fim);

      // Categorias de metas usando sistema padronizado
      const categorias = [
        { id: 'geral', name: getNomeCategoria('geral') },
        { id: 'r_mais', name: getNomeCategoria('r_mais') },
        { id: 'perfumaria_r_mais', name: getNomeCategoria('perfumaria_r_mais') },
        { id: 'conveniencia_r_mais', name: getNomeCategoria('conveniencia_r_mais') },
        { id: 'saude', name: getNomeCategoria('saude') }
      ];

      // Função para contar domingos no período
      const contarDomingos = (dataInicio: Date, dataFim: Date): number => {
        let count = 0;
        const current = new Date(dataInicio);
        
        while (current <= dataFim) {
          if (current.getDay() === 0) { // Domingo = 0
            count++;
          }
          current.setDate(current.getDate() + 1);
        }
        
        return count;
      };

      // Calcular dias úteis no período
      const dataInicioPeriodo = new Date(periodoAtual.data_inicio);
      const dataFimPeriodo = new Date(periodoAtual.data_fim);
      const hoje = new Date();
      
      let diasTotaisPeriodo = Math.ceil((dataFimPeriodo.getTime() - dataInicioPeriodo.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      let diasDecorridos = Math.min(
        Math.ceil((hoje.getTime() - dataInicioPeriodo.getTime()) / (1000 * 60 * 60 * 24)) + 1,
        diasTotaisPeriodo
      );

      // Se for região centro, descontar domingos
      if (loja?.regiao === 'centro') {
        const domingosTotal = contarDomingos(dataInicioPeriodo, dataFimPeriodo);
        const domingosDecorridos = contarDomingos(dataInicioPeriodo, hoje);
        
        diasTotaisPeriodo = Math.max(1, diasTotaisPeriodo - domingosTotal);
        diasDecorridos = Math.max(1, diasDecorridos - domingosDecorridos);
      }

      const processedMetas: MetaCategoria[] = [];

      for (const categoria of categorias) {
        // Buscar meta da categoria
        let metaValor = 0;
        
        if (categoria.id === 'geral') {
          // Para categoria geral, usar meta_valor_total da metas_loja
          metaValor = metasLoja?.[0]?.meta_valor_total || 0;
        } else {
          // Para outras categorias, buscar na metas_loja_categorias
          const metaCategoria = metasLoja?.[0]?.metas_loja_categorias?.find(
            (m: any) => m.categoria === categoria.id
          );
          metaValor = metaCategoria?.meta_valor || 0;
        }

        // Somar vendas da categoria
        const vendasCategoria = vendasLoja?.filter(
          (v: any) => v.categoria === categoria.id
        ) || [];
        
        const totalVendido = vendasCategoria.reduce((sum: number, v: any) => sum + Number(v.valor_venda), 0);
        const progresso = metaValor > 0 ? (totalVendido / metaValor) * 100 : 0;
        const restante = Math.max(0, metaValor - totalVendido);
        
        // Calcular meta diária e média realizada usando dias úteis
        const metaDiaria = metaValor / diasTotaisPeriodo;
        const mediaRealizada = diasDecorridos > 0 ? totalVendido / diasDecorridos : 0;

        processedMetas.push({
          categoria: categoria.id,
          nome: categoria.name,
          meta: metaValor,
          realizado: totalVendido,
          progresso: Math.min(progresso, 100),
          restante,
          metaDiaria,
          mediaRealizada,
          icon: getIconeCategoria(categoria.id),
          color: getClasseCorCategoria(categoria.id)
        });
      }

      setMetas(processedMetas);
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <i className="fas fa-bullseye text-primary"></i>
            {canViewAllStores && !selectedLojaId 
              ? 'Metas de Todas as Lojas' 
              : lojaInfo 
                ? `Metas - ${lojaInfo.numero} - ${lojaInfo.nome.toUpperCase()}`
                : `Metas da Loja ${currentLojaId}`
            }
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o desempenho das metas por categoria
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {canViewAllStores && (
            <StoreSelector 
              selectedLojaId={selectedLojaId} 
              onLojaChange={setSelectedLojaId} 
              userLojaId={user.loja_id} 
            />
          )}
          <PeriodSelector />
          <Button variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <i className="fas fa-download mr-2"></i>
            Exportar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="flex items-center justify-center gap-3 mb-4">
            <i className="fas fa-spinner fa-spin text-xl text-primary"></i>
            <span className="text-lg font-medium text-foreground">Carregando metas...</span>
          </div>
          <p className="text-muted-foreground">Buscando dados das metas por categoria</p>
        </div>
      ) : (
        <>
          {/* Status do Período */}
          <div className="mb-8">
            <Card className="card-modern">
              <CardHeader className="card-header-modern">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                      <i className="fas fa-chart-line text-lg text-warning"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Status do Período</h3>
                      <p className="text-sm text-muted-foreground">Progresso geral das metas</p>
                    </div>
                  </div>
                  <Badge className="badge-modern badge-warning">
                    <i className="fas fa-clock text-xs mr-1"></i>
                    Em Andamento
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Detalhes por Categoria */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-layer-group text-lg text-primary"></i>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Detalhes por Categoria
                </h2>
                <p className="text-sm text-muted-foreground">
                  Acompanhe o desempenho de cada categoria individualmente
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {metas.map((meta, index) => (
                <Card 
                  key={index} 
                  className={`
                    relative overflow-hidden border-2 shadow-lg bg-gradient-to-br from-background to-muted/20
                    hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-out
                    ${meta.progresso >= 100 ? 'border-success/40 bg-gradient-to-br from-success/5 to-success/10' : 
                      meta.progresso >= 80 ? 'border-warning/40 bg-gradient-to-br from-warning/5 to-warning/10' : 
                      'border-border/60'}
                  `}
                >
                  {/* Gradiente de fundo decorativo */}
                  <div className={`
                    absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10
                    ${meta.progresso >= 100 ? 'bg-success' : 
                      meta.progresso >= 80 ? 'bg-warning' : 
                      'bg-primary'}
                  `}></div>

                  <CardHeader className="pb-3 relative z-10">
                    <CardTitle className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-12 h-12 rounded-xl flex items-center justify-center shadow-sm
                          ${meta.progresso >= 100 ? 'bg-success/10 ring-2 ring-success/20' : 
                            meta.progresso >= 80 ? 'bg-warning/10 ring-2 ring-warning/20' : 
                            'bg-primary/10 ring-2 ring-primary/20'}
                        `}>
                          <i className={`${meta.icon} text-lg ${
                            meta.progresso >= 100 ? 'text-success' : 
                            meta.progresso >= 80 ? 'text-warning' : 
                            meta.color
                          }`}></i>
                        </div>
                        <div>
                          <span className="font-bold text-foreground">{meta.nome}</span>
                          {lojaInfo?.regiao === 'centro' && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <i className="fas fa-info-circle text-xs mr-1"></i>
                              Domingos não incluídos
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {meta.categoria === 'geral' && (
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                            <i className="fas fa-star text-xs mr-1"></i>
                            Principal
                          </Badge>
                        )}
                        {meta.progresso >= 100 && (
                          <Badge className="bg-success/10 text-success border-success/20 text-xs">
                            <i className="fas fa-check text-xs mr-1"></i>
                            Atingida
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 relative z-10">
                    {meta.meta === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-muted/30 to-muted/50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                          <i className="fas fa-exclamation-triangle text-2xl text-muted-foreground/70"></i>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2 font-medium">
                          {meta.categoria === 'geral' 
                            ? "Meta não configurada para este período" 
                            : "Meta não definida para esta categoria"
                          }
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          Configure as metas no sistema
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Valores Principais com gradiente */}
                        <div className="space-y-3">
                          <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-primary flex items-center gap-2">
                                <i className="fas fa-bullseye text-xs"></i>
                                Meta do Período
                              </span>
                            </div>
                            <span className="text-xl font-bold text-foreground">{formatCurrency(meta.meta)}</span>
                          </div>
                          
                          <div className={`
                            p-4 rounded-xl border
                            ${meta.progresso >= 100 ? 'bg-gradient-to-r from-success/5 to-success/10 border-success/20' : 
                              'bg-gradient-to-r from-muted/5 to-muted/10 border-muted/30'}
                          `}>
                            <div className="flex justify-between items-center mb-2">
                              <span className={`text-sm font-medium flex items-center gap-2 ${
                                meta.progresso >= 100 ? 'text-success' : 'text-muted-foreground'
                              }`}>
                                <i className="fas fa-chart-line text-xs"></i>
                                Realizado
                              </span>
                            </div>
                            <span className={`text-xl font-bold ${
                              meta.progresso >= 100 ? 'text-success' : 'text-foreground'
                            }`}>
                              {formatCurrency(meta.realizado)}
                            </span>
                          </div>
                        </div>

                        {/* Barra de progresso melhorada */}
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium flex items-center gap-2">
                              <i className="fas fa-percentage text-xs"></i>
                              Progresso Atual
                            </span>
                            <span className={`font-bold text-lg ${
                              meta.progresso >= 100 ? 'text-success' : 
                              meta.progresso >= 80 ? 'text-warning' : 'text-primary'
                            }`}>
                              {meta.progresso.toFixed(1)}%
                            </span>
                          </div>
                          <div className="relative">
                            <Progress 
                              value={Math.min(meta.progresso, 100)} 
                              className="h-4 shadow-inner border border-muted/30 bg-muted/50"
                            />
                            {meta.progresso >= 100 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center shadow-lg">
                                <i className="fas fa-check text-white text-xs"></i>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Métricas em grid com design melhorado */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="text-center p-4 bg-gradient-to-br from-muted/10 to-muted/20 rounded-xl shadow-sm border border-muted/20">
                            <div className="text-xs text-muted-foreground mb-2 font-medium flex items-center justify-center gap-1">
                              <i className="fas fa-arrow-up text-xs"></i>
                              Restante
                            </div>
                            <div className="font-bold text-sm text-foreground">{formatCurrency(meta.restante)}</div>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200">
                            <div className="text-xs text-blue-700 mb-2 font-medium flex items-center justify-center gap-1">
                              <i className="fas fa-calendar-day text-xs"></i>
                              Meta Diária
                            </div>
                            <div className="font-bold text-sm text-blue-800">{formatCurrency(meta.metaDiaria)}</div>
                          </div>
                        </div>

                        {/* Média realizada com indicador visual */}
                        <div className={`
                          flex items-center justify-between p-4 rounded-xl shadow-sm border
                          ${meta.mediaRealizada >= meta.metaDiaria ? 
                            'bg-gradient-to-r from-success/5 to-success/10 border-success/20' : 
                            'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200'}
                        `}>
                          <span className={`text-sm font-medium flex items-center gap-2 ${
                            meta.mediaRealizada >= meta.metaDiaria ? 'text-success' : 'text-amber-700'
                          }`}>
                            <i className="fas fa-calculator text-xs"></i>
                            Média Diária
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${
                              meta.mediaRealizada >= meta.metaDiaria ? 'text-success' : 'text-amber-800'
                            }`}>
                              {formatCurrency(meta.mediaRealizada)}
                            </span>
                            {meta.mediaRealizada < meta.metaDiaria && (
                              <div className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center">
                                <i className="fas fa-exclamation text-amber-700 text-xs"></i>
                              </div>
                            )}
                            {meta.mediaRealizada >= meta.metaDiaria && (
                              <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center">
                                <i className="fas fa-check text-success text-xs"></i>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Alerta quando meta não atingida */}
                        {meta.realizado < meta.meta && meta.restante > 0 && (
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <i className="fas fa-exclamation-triangle text-amber-600 text-sm"></i>
                              </div>
                              <div>
                                <p className="font-semibold text-amber-800 text-sm mb-1">
                                  Meta em andamento
                                </p>
                                <p className="text-amber-700 text-xs">
                                  Faltam <strong>{formatCurrency(meta.restante)}</strong> para atingir a meta
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sucesso quando meta atingida */}
                        {meta.progresso >= 100 && (
                          <div className="bg-gradient-to-r from-success/10 to-success/20 border border-success/30 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                                <i className="fas fa-trophy text-success text-sm"></i>
                              </div>
                              <div>
                                <p className="font-bold text-success text-sm">
                                  🎉 Meta atingida com sucesso!
                                </p>
                                <p className="text-success/80 text-xs">
                                  Parabéns pelo excelente desempenho
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}