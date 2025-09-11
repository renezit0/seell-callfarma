-- Habilitar RLS nas tabelas de campanhas de vendas por loja
ALTER TABLE campanhas_vendas_lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas_vendas_lojas_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_lojas_api_dados ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir leitura geral para usuários autenticados
CREATE POLICY "Permitir leitura geral para usuários autenticados" 
ON campanhas_vendas_lojas 
FOR SELECT 
USING (auth.jwt() IS NOT NULL);

CREATE POLICY "Permitir leitura geral para usuários autenticados" 
ON campanhas_vendas_lojas_participantes 
FOR SELECT 
USING (auth.jwt() IS NOT NULL);

CREATE POLICY "Permitir leitura geral para usuários autenticados" 
ON vendas_lojas_api_dados 
FOR SELECT 
USING (auth.jwt() IS NOT NULL);