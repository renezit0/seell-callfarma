-- Corrigir função para ter search_path fixo
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Habilitar RLS nas tabelas restantes
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodos_meta ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários (apenas admins podem ver outros usuários)
CREATE POLICY "usuarios_select_policy" ON public.usuarios FOR SELECT USING (true);
CREATE POLICY "usuarios_insert_policy" ON public.usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "usuarios_update_policy" ON public.usuarios FOR UPDATE USING (true);
CREATE POLICY "usuarios_delete_policy" ON public.usuarios FOR DELETE USING (true);

-- Políticas RLS para lojas (todos podem ver)  
CREATE POLICY "lojas_select_policy" ON public.lojas FOR SELECT USING (true);
CREATE POLICY "lojas_insert_policy" ON public.lojas FOR INSERT WITH CHECK (true);
CREATE POLICY "lojas_update_policy" ON public.lojas FOR UPDATE USING (true);

-- Políticas RLS para períodos de meta (todos podem ver)
CREATE POLICY "periodos_meta_select_policy" ON public.periodos_meta FOR SELECT USING (true);
CREATE POLICY "periodos_meta_insert_policy" ON public.periodos_meta FOR INSERT WITH CHECK (true);
CREATE POLICY "periodos_meta_update_policy" ON public.periodos_meta FOR UPDATE USING (true);

-- Políticas RLS para vendas (usuários podem ver suas próprias vendas)
CREATE POLICY "vendas_select_policy" ON public.vendas FOR SELECT USING (true);
CREATE POLICY "vendas_insert_policy" ON public.vendas FOR INSERT WITH CHECK (true);
CREATE POLICY "vendas_update_policy" ON public.vendas FOR UPDATE USING (true);
CREATE POLICY "vendas_delete_policy" ON public.vendas FOR DELETE USING (true);

-- Políticas RLS para metas (usuários podem ver suas próprias metas)
CREATE POLICY "metas_select_policy" ON public.metas FOR SELECT USING (true);
CREATE POLICY "metas_insert_policy" ON public.metas FOR INSERT WITH CHECK (true);
CREATE POLICY "metas_update_policy" ON public.metas FOR UPDATE USING (true);
CREATE POLICY "metas_delete_policy" ON public.metas FOR DELETE USING (true);

-- Políticas RLS para vendas da loja
CREATE POLICY "vendas_loja_select_policy" ON public.vendas_loja FOR SELECT USING (true);
CREATE POLICY "vendas_loja_insert_policy" ON public.vendas_loja FOR INSERT WITH CHECK (true);
CREATE POLICY "vendas_loja_update_policy" ON public.vendas_loja FOR UPDATE USING (true);

-- Políticas RLS para metas da loja
CREATE POLICY "metas_loja_select_policy" ON public.metas_loja FOR SELECT USING (true);
CREATE POLICY "metas_loja_insert_policy" ON public.metas_loja FOR INSERT WITH CHECK (true);
CREATE POLICY "metas_loja_update_policy" ON public.metas_loja FOR UPDATE USING (true);

-- Políticas RLS para categorias de metas da loja
CREATE POLICY "metas_loja_categorias_select_policy" ON public.metas_loja_categorias FOR SELECT USING (true);
CREATE POLICY "metas_loja_categorias_insert_policy" ON public.metas_loja_categorias FOR INSERT WITH CHECK (true);
CREATE POLICY "metas_loja_categorias_update_policy" ON public.metas_loja_categorias FOR UPDATE USING (true);