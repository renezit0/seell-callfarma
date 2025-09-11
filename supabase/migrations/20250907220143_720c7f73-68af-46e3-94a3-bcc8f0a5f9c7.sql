-- Habilitar RLS na tabela vendas e criar política de leitura
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura de vendas para usuários autenticados
CREATE POLICY "Permitir leitura de vendas para usuários autenticados" 
ON public.vendas 
FOR SELECT 
USING (auth.jwt() IS NOT NULL);

-- Habilitar RLS na tabela usuarios e criar política de leitura
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura de usuários para usuários autenticados
CREATE POLICY "Permitir leitura de usuários para usuários autenticados" 
ON public.usuarios 
FOR SELECT 
USING (auth.jwt() IS NOT NULL);