-- Habilitar RLS nas tabelas principais para permitir acesso aos dados
-- Isso corrigirá o problema das páginas em branco

-- Habilitar RLS para tabela usuarios
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam todos os usuários (para página de usuários)
CREATE POLICY "Permitir leitura de usuários" ON public.usuarios
FOR SELECT USING (true);

-- Habilitar RLS para tabela periodos_meta
ALTER TABLE public.periodos_meta ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura de períodos ativos
CREATE POLICY "Permitir leitura de períodos" ON public.periodos_meta
FOR SELECT USING (true);

-- Habilitar RLS para tabela metas_loja
ALTER TABLE public.metas_loja ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura de metas da loja
CREATE POLICY "Permitir leitura de metas da loja" ON public.metas_loja
FOR SELECT USING (true);

-- Habilitar RLS para tabela metas_loja_categorias
ALTER TABLE public.metas_loja_categorias ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura de categorias de metas
CREATE POLICY "Permitir leitura de categorias de metas" ON public.metas_loja_categorias
FOR SELECT USING (true);

-- Habilitar RLS para tabela vendas_loja
ALTER TABLE public.vendas_loja ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura de vendas da loja
CREATE POLICY "Permitir leitura de vendas da loja" ON public.vendas_loja
FOR SELECT USING (true);

-- Habilitar RLS para tabela lojas
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura de informações das lojas
CREATE POLICY "Permitir leitura de lojas" ON public.lojas
FOR SELECT USING (true);