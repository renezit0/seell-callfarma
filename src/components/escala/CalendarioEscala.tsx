import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarioEscalaProps {
  selectedDate?: Date;
  onDateSelect: (date: Date | undefined) => void;
  periodo: {
    dataInicio: Date;
    dataFim: Date;
    label: string;
  };
  folgas: Array<{
    data_folga: string;
    tipo?: string;
    usuario?: {
      nome: string;
    };
  }>;
  tiposAusencia: Record<string, { label: string; color: string }>;
}

export function CalendarioEscala({
  selectedDate,
  onDateSelect,
  periodo,
  folgas,
  tiposAusencia
}: CalendarioEscalaProps) {
  // Função para extrair tipo da observação
  const extrairTipoDaObservacao = (observacao?: string) => {
    if (!observacao) return 'folga';
    const match = observacao.match(/\[Tipo:\s*(\w+)\]/);
    return match ? match[1] : 'folga';
  };

  const getFolgasDoMes = () => {
    const folgasMap = new Map<string, Array<{ tipo?: string; usuario?: { nome: string }; observacao?: string }>>();
    
    folgas.forEach(folga => {
      const dataKey = folga.data_folga;
      if (!folgasMap.has(dataKey)) {
        folgasMap.set(dataKey, []);
      }
      folgasMap.get(dataKey)!.push(folga);
    });
    
    return folgasMap;
  };

  const renderCalendarDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const folgasMap = getFolgasDoMes();
    const folgasData = folgasMap.get(dateStr) || [];
    
    if (folgasData.length === 0) return null;

    return (
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-0.5">
        {folgasData.slice(0, 3).map((folga, index) => {
          const tipoExtraido = extrairTipoDaObservacao(folga.observacao);
          const tipoInfo = tiposAusencia[tipoExtraido as keyof typeof tiposAusencia] || tiposAusencia.folga;
          return (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full ${tipoInfo.color}`}
              title={`${folga.usuario?.nome || 'Usuário'} - ${tipoInfo.label}`}
            />
          );
        })}
        {folgasData.length > 3 && (
          <div className="text-[8px] text-muted-foreground font-medium">+{folgasData.length - 3}</div>
        )}
      </div>
    );
  };

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Calendário do Período
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="calendar-container">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            fromDate={periodo.dataInicio}
            toDate={periodo.dataFim}
            locale={ptBR}
            className="rounded-md border pointer-events-auto w-full"
            components={{
              DayContent: ({ date }) => (
                <div className="relative w-full h-full flex items-center justify-center">
                  <span className="relative z-10">{format(date, 'd')}</span>
                  {renderCalendarDay(date)}
                </div>
              )
            }}
          />
        </div>
        
        {/* Legenda */}
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-sm font-medium mb-2">Legenda:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {Object.entries(tiposAusencia).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${value.color}`}></div>
                <span>{value.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}