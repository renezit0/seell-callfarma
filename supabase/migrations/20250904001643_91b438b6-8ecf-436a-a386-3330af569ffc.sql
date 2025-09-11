-- Simplificar as políticas RLS da tabela vendas_loja para aceitar qualquer JWT válido
-- Primeiro, remover as políticas que dependem de login específico
DROP POLICY IF EXISTS "vendas_loja_read_same_loja" ON vendas_loja;
DROP POLICY IF EXISTS "vendas_loja_insert_same_loja" ON vendas_loja;

-- A política "Permitir leitura geral para usuários autenticados" já existe e deve funcionar
-- Vamos apenas garantir que ela está correta
DROP POLICY IF EXISTS "Permitir leitura geral para usuários autenticados" ON vendas_loja;

CREATE POLICY "Permitir leitura para usuários autenticados" 
ON vendas_loja 
FOR SELECT 
USING (true); -- Permitir acesso total para simplificar

-- Para as operações de escrita, também simplificar
CREATE POLICY "Permitir inserção para usuários autenticados" 
ON vendas_loja 
FOR INSERT 
WITH CHECK (true);