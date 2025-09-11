-- Adicionar políticas RLS para permitir inserção nas tabelas de campanhas

-- Política para inserir campanhas
CREATE POLICY "Permitir inserção de campanhas"
ON public.campanhas_vendas_lojas
FOR INSERT
WITH CHECK (true);

-- Política para atualizar campanhas  
CREATE POLICY "Permitir atualização de campanhas"
ON public.campanhas_vendas_lojas
FOR UPDATE
USING (true);

-- Política para deletar campanhas
CREATE POLICY "Permitir exclusão de campanhas"
ON public.campanhas_vendas_lojas
FOR DELETE
USING (true);

-- Política para inserir participantes
CREATE POLICY "Permitir inserção de participantes"
ON public.campanhas_vendas_lojas_participantes
FOR INSERT
WITH CHECK (true);

-- Política para atualizar participantes
CREATE POLICY "Permitir atualização de participantes"
ON public.campanhas_vendas_lojas_participantes
FOR UPDATE
USING (true);

-- Política para deletar participantes
CREATE POLICY "Permitir exclusão de participantes"
ON public.campanhas_vendas_lojas_participantes
FOR DELETE
USING (true);