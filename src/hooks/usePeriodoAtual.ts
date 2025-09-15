import { useMemo } from 'react';

export function usePeriodoAtual() {
  const periodo = useMemo(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const dia = hoje.getDate();

    // Período sempre do dia 21 ao dia 20 do mês seguinte
    let mesInicio, anoInicio, mesFim, anoFim;

    if (dia >= 21) {
      // Se estamos após o dia 21, o período atual começou neste mês
      mesInicio = mes;
      anoInicio = ano;
      mesFim = mes + 1;
      anoFim = ano;
    } else {
      // Se estamos antes do dia 21, o período atual começou no mês anterior
      mesInicio = mes - 1;
      anoInicio = ano;
      mesFim = mes;
      anoFim = ano;
    }

    // Ajustar ano se necessário
    if (mesInicio < 0) {
      mesInicio = 11;
      anoInicio--;
    }
    if (mesFim > 11) {
      mesFim = 0;
      anoFim++;
    }

    const dataInicio = new Date(anoInicio, mesInicio, 21);
    const dataFim = new Date(anoFim, mesFim, 20);

    return {
      dataInicio,
      dataFim,
      data_inicio: dataInicio.toISOString().split('T')[0],
      data_fim: dataFim.toISOString().split('T')[0],
      label: `${String(mesInicio + 1).padStart(2, '0')}/${anoInicio} - ${String(mesFim + 1).padStart(2, '0')}/${anoFim}`
    };
  }, []);

  return periodo;
}