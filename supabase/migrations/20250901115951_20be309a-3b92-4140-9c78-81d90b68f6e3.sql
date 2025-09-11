-- Função para calcular ticket médio baseado em selfcheckout_dados
CREATE OR REPLACE FUNCTION public.calcular_ticket_medio_selfcheckout(
    p_loja_id INTEGER,
    p_data_inicio DATE DEFAULT NULL,
    p_data_fim DATE DEFAULT NULL
)
RETURNS TABLE(
    data_lancamento DATE,
    total_vendas NUMERIC,
    clientes_atendidos INTEGER,
    ticket_medio NUMERIC
) AS $$
BEGIN
    -- Se não especificar datas, usar últimos 30 dias
    IF p_data_inicio IS NULL THEN
        p_data_inicio := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    
    IF p_data_fim IS NULL THEN
        p_data_fim := CURRENT_DATE;
    END IF;

    RETURN QUERY
    SELECT 
        s.data_lancamento,
        -- Somar todos os valores de pagamento para ter o total de vendas do dia
        (COALESCE(s.valor_dinheiro, 0) + 
         COALESCE(s.valor_debito, 0) + 
         COALESCE(s.valor_credito, 0) + 
         COALESCE(s.valor_pos, 0) + 
         COALESCE(s.valor_convenio, 0)) as total_vendas,
        -- Usar o maior valor de clientes_total por data (conforme solicitado)
        MAX(s.clientes_total) as clientes_atendidos,
        -- Calcular ticket médio
        CASE 
            WHEN MAX(s.clientes_total) > 0 THEN
                (COALESCE(s.valor_dinheiro, 0) + 
                 COALESCE(s.valor_debito, 0) + 
                 COALESCE(s.valor_credito, 0) + 
                 COALESCE(s.valor_pos, 0) + 
                 COALESCE(s.valor_convenio, 0)) / MAX(s.clientes_total)
            ELSE 0
        END as ticket_medio
    FROM selfcheckout_dados s
    WHERE s.loja_id = p_loja_id
      AND s.data_lancamento BETWEEN p_data_inicio AND p_data_fim
    GROUP BY s.data_lancamento, s.valor_dinheiro, s.valor_debito, s.valor_credito, s.valor_pos, s.valor_convenio
    ORDER BY s.data_lancamento DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View otimizada para ticket médio agregado
CREATE OR REPLACE VIEW public.ticket_medio_selfcheckout AS
SELECT 
    s.loja_id,
    s.data_lancamento,
    -- Total de vendas do dia (soma de todos os valores)
    SUM(COALESCE(s.valor_dinheiro, 0) + 
        COALESCE(s.valor_debito, 0) + 
        COALESCE(s.valor_credito, 0) + 
        COALESCE(s.valor_pos, 0) + 
        COALESCE(s.valor_convenio, 0)) as total_vendas_dia,
    -- Maior número de clientes atendidos do dia
    MAX(s.clientes_total) as max_clientes_total,
    -- Ticket médio do dia
    CASE 
        WHEN MAX(s.clientes_total) > 0 THEN
            SUM(COALESCE(s.valor_dinheiro, 0) + 
                COALESCE(s.valor_debito, 0) + 
                COALESCE(s.valor_credito, 0) + 
                COALESCE(s.valor_pos, 0) + 
                COALESCE(s.valor_convenio, 0)) / MAX(s.clientes_total)
        ELSE 0
    END as ticket_medio
FROM selfcheckout_dados s
GROUP BY s.loja_id, s.data_lancamento;