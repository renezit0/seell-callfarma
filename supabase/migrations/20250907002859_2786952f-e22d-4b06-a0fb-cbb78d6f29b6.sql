-- Remover políticas existentes que requerem autenticação
DROP POLICY IF EXISTS "Permitir leitura geral para usuários autenticados" ON campanhas_vendas_lojas;
DROP POLICY IF EXISTS "Permitir leitura geral para usuários autenticados" ON campanhas_vendas_lojas_participantes;
DROP POLICY IF EXISTS "Permitir leitura geral para usuários autenticados" ON vendas_lojas_api_dados;

-- Criar políticas que permitem acesso público para leitura
CREATE POLICY "Permitir leitura pública" 
ON campanhas_vendas_lojas 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir leitura pública" 
ON campanhas_vendas_lojas_participantes 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir leitura pública" 
ON vendas_lojas_api_dados 
FOR SELECT 
USING (true);