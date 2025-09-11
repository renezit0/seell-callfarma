-- Políticas RLS para a tabela correta de campanhas (campanhas_vendas_loja)
CREATE POLICY "Permitir inserção de campanhas (loja)"
ON public.campanhas_vendas_loja
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir atualização de campanhas (loja)"
ON public.campanhas_vendas_loja
FOR UPDATE
USING (true);

CREATE POLICY "Permitir exclusão de campanhas (loja)"
ON public.campanhas_vendas_loja
FOR DELETE
USING (true);
