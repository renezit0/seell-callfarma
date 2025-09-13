import { useState, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { usePeriodContext, type PeriodOption } from "@/contexts/PeriodContext";
import { usePeriodoAtual } from "@/hooks/usePeriodoAtual";
export function PeriodSelector() {
  const {
    selectedPeriod,
    setSelectedPeriod
  } = usePeriodContext();
  const [periods, setPeriods] = useState<PeriodOption[]>([]);
  const [loading, setLoading] = useState(true);
  const periodoAtual = usePeriodoAtual();
  useEffect(() => {
    fetchPeriods();
  }, []);
  const fetchPeriods = async () => {
    try {
      const {
        data: periodsData,
        error
      } = await supabase.from('periodos_meta').select('*').eq('status', 'ativo').order('data_inicio', {
        ascending: false
      });
      if (error) {
        console.error('Erro ao buscar períodos:', error);
        return;
      }
      const now = new Date();
      const processedPeriods: PeriodOption[] = periodsData.map(period => {
        // Usar as datas exatas do banco para os cálculos
        const startDate = new Date(period.data_inicio);
        const endDate = new Date(period.data_fim);
        let status: 'current' | 'past' | 'future' = 'current';
        if (endDate < now) status = 'past';
        if (startDate > now) status = 'future';

        // Se hoje está entre as datas, é o período atual
        const isCurrentPeriod = now >= startDate && now <= endDate;
        if (isCurrentPeriod) status = 'current';

        // Criar label baseado nas datas corretas (sempre do dia 21 ao 20)
        const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
        const startYear = startDate.getFullYear();
        const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
        const endYear = endDate.getFullYear();
        const label = `${startMonth}/${startYear} - ${endMonth}/${endYear}`;
        return {
          id: period.id,
          label,
          startDate,
          endDate,
          status,
          description: period.descricao
        };
      });
      setPeriods(processedPeriods);

      // Selecionar período atual por padrão se nenhum estiver selecionado
      if (!selectedPeriod) {
        const currentPeriod = processedPeriods.find(p => p.status === 'current') || processedPeriods[0];
        if (currentPeriod) {
          setSelectedPeriod(currentPeriod);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar períodos:', error);
    } finally {
      setLoading(false);
    }
  };
  const handlePeriodSelect = (period: PeriodOption) => {
    setSelectedPeriod(period);
  };
  if (loading) {
    return <Button variant="outline" size="default" className="h-10" disabled>
        <Calendar className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Carregando...</span>
        <span className="sm:hidden">...</span>
      </Button>;
  }
  return <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="default" className="h-10 bg-background border-border hover:bg-gray-100 hover:text-foreground">
          <Calendar className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">{selectedPeriod?.label || 'Selecionar período'}</span>
          <span className="sm:hidden">Período</span>
          <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64 bg-background border-border shadow-lg z-50 p-1">
        {periods.map((period, index) => (
          <>
            <DropdownMenuItem 
              key={period.id} 
              onClick={() => handlePeriodSelect(period)} 
              className={`flex items-center justify-between py-3 px-4 cursor-pointer rounded-none ${
                selectedPeriod?.id === period.id 
                  ? 'bg-primary/10 text-primary font-medium hover:bg-primary/15' 
                  : 'hover:bg-gray-100 hover:text-foreground'
              }`}
            >
              <span className="text-sm">
                {period.label}
              </span>
              <div className="flex items-center gap-2">
                {period.status === 'current' && (
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20 text-xs">
                    Atual
                  </Badge>
                )}
                {selectedPeriod?.id === period.id && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
            </DropdownMenuItem>
            {index < periods.length - 1 && <Separator className="my-1" />}
          </>
        ))}
        
        {periods.length === 0 && (
          <div className="px-4 py-3 text-center text-sm text-muted-foreground">
            Nenhum período ativo encontrado
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>;
}