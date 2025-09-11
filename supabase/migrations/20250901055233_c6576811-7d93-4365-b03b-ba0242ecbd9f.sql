-- Habilitar RLS na tabela vendas
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- Política para vendedores verem apenas suas próprias vendas
CREATE POLICY "vendas_vendedor_read_own" ON public.vendas
  FOR SELECT 
  USING (auth.uid()::text IN (
    SELECT login FROM public.usuarios WHERE id = vendas.usuario_id
  ));

-- Política para gerentes/líderes verem vendas da sua loja
CREATE POLICY "vendas_managers_read_loja" ON public.vendas
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u1, public.usuarios u2
      WHERE u1.login = auth.jwt() ->> 'login'
        AND u1.tipo IN ('gerente', 'lider', 'admin')
        AND u2.id = vendas.usuario_id
        AND u1.loja_id = u2.loja_id
    )
  );

-- Política para inserção de vendas (apenas para usuários autenticados da mesma loja)
CREATE POLICY "vendas_insert_same_loja" ON public.vendas
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios u1, public.usuarios u2
      WHERE u1.login = auth.jwt() ->> 'login'
        AND u2.id = vendas.usuario_id
        AND u1.loja_id = u2.loja_id
    )
  );

-- Habilitar RLS na tabela vendas_loja 
ALTER TABLE public.vendas_loja ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas dados da sua loja
CREATE POLICY "vendas_loja_read_same_loja" ON public.vendas_loja
  FOR SELECT 
  USING (
    loja_id IN (
      SELECT loja_id FROM public.usuarios 
      WHERE login = auth.jwt() ->> 'login'
    )
  );

-- Política para inserção na mesma loja
CREATE POLICY "vendas_loja_insert_same_loja" ON public.vendas_loja
  FOR INSERT 
  WITH CHECK (
    loja_id IN (
      SELECT loja_id FROM public.usuarios 
      WHERE login = auth.jwt() ->> 'login'
    )
  );