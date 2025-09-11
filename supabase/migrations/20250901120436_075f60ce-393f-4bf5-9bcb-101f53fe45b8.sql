-- Corrigir função para calcular ticket médio baseado em vendas 'geral' por dia
CREATE OR REPLACE FUNCTION public.calcular_ticket_medio_selfcheckout(
    p_loja_id INTEGER,
    p_data_inicio DATE DEFAULT NULL,
    p_data_fim DATE DEFAULT NULL
)
RETURNS TABLE(
    data_lancamento DATE,
    vendas_geral_dia NUMERIC,
    clientes_atendidos INTEGER,
    ticket_medio NUMERIC
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    -- Se não especificar datas, usar últimos 30 dias
    IF p_data_inicio IS NULL THEN
        p_data_inicio := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    
    IF p_data_fim IS NULL THEN
        p_data_fim := CURRENT_DATE;
    END IF;

    RETURN QUERY
    WITH vendas_geral_por_dia AS (
        -- Somar vendas GERAL por dia para a loja
        SELECT 
            vl.data_venda,
            SUM(vl.valor_venda) as total_vendas_geral
        FROM vendas_loja vl
        WHERE vl.loja_id = p_loja_id
          AND vl.categoria = 'geral'
          AND vl.data_venda BETWEEN p_data_inicio AND p_data_fim
        GROUP BY vl.data_venda
    ),
    clientes_por_dia AS (
        -- Pegar maior número de clientes por dia do selfcheckout
        SELECT 
            s.data_lancamento,
            MAX(s.clientes_total) as max_clientes
        FROM selfcheckout_dados s
        WHERE s.loja_id = p_loja_id
          AND s.data_lancamento BETWEEN p_data_inicio AND p_data_fim
        GROUP BY s.data_lancamento
    )
    SELECT 
        COALESCE(v.data_venda, c.data_lancamento) as data_lancamento,
        COALESCE(v.total_vendas_geral, 0) as vendas_geral_dia,
        COALESCE(c.max_clientes, 0) as clientes_atendidos,
        CASE 
            WHEN COALESCE(c.max_clientes, 0) > 0 AND COALESCE(v.total_vendas_geral, 0) > 0 THEN
                COALESCE(v.total_vendas_geral, 0) / COALESCE(c.max_clientes, 0)
            ELSE 0
        END as ticket_medio
    FROM vendas_geral_por_dia v
    FULL OUTER JOIN clientes_por_dia c ON v.data_venda = c.data_lancamento
    WHERE (v.data_venda IS NOT NULL OR c.data_lancamento IS NOT NULL)
    ORDER BY COALESCE(v.data_venda, c.data_lancamento) DESC;
END;
$$;

-- Atualizar view para refletir nova lógica
CREATE OR REPLACE VIEW public.ticket_medio_selfcheckout AS
WITH vendas_geral_por_dia AS (
    SELECT 
        vl.loja_id,
        vl.data_venda,
        SUM(vl.valor_venda) as total_vendas_geral
    FROM vendas_loja vl
    WHERE vl.categoria = 'geral'
    GROUP BY vl.loja_id, vl.data_venda
),
clientes_por_dia AS (
    SELECT 
        s.loja_id,
        s.data_lancamento,
        MAX(s.clientes_total) as max_clientes
    FROM selfcheckout_dados s
    GROUP BY s.loja_id, s.data_lancamento
)
SELECT 
    COALESCE(v.loja_id, c.loja_id) as loja_id,
    COALESCE(v.data_venda, c.data_lancamento) as data_lancamento,
    COALESCE(v.total_vendas_geral, 0) as vendas_geral_dia,
    COALESCE(c.max_clientes, 0) as max_clientes_total,
    CASE 
        WHEN COALESCE(c.max_clientes, 0) > 0 AND COALESCE(v.total_vendas_geral, 0) > 0 THEN
            COALESCE(v.total_vendas_geral, 0) / COALESCE(c.max_clientes, 0)
        ELSE 0
    END as ticket_medio
FROM vendas_geral_por_dia v
FULL OUTER JOIN clientes_por_dia c ON v.loja_id = c.loja_id AND v.data_venda = c.data_lancamento;