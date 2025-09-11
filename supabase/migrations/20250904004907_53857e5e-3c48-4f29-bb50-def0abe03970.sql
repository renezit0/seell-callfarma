-- Políticas RLS para tabela metas (metas de colaboradores)
-- Permitir que usuários vejam/editem metas conforme suas permissões

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Permitir leitura geral para usuários autenticados" ON metas;

-- Política para visualização de metas
CREATE POLICY "Visualizar metas conforme permissões"
ON metas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM get_current_user_data() AS u
    WHERE 
      -- Admin, supervisor, rh podem ver todas as metas
      u.tipo IN ('admin', 'supervisor', 'rh')
      OR
      -- Gerentes e líderes podem ver metas da sua loja
      (u.tipo IN ('gerente', 'lider', 'sublider', 'subgerente', 'auxiliar', 'farmaceutico', 'consultora') 
       AND EXISTS (
         SELECT 1 FROM usuarios usr 
         WHERE usr.id = metas.usuario_id 
         AND usr.loja_id = u.loja_id
       ))
      OR
      -- Usuários podem ver suas próprias metas
      metas.usuario_id = u.id
  )
);

-- Política para inserção de metas
CREATE POLICY "Inserir metas conforme permissões"
ON metas 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM get_current_user_data() AS u
    WHERE 
      -- Admin, supervisor, rh podem inserir qualquer meta
      u.tipo IN ('admin', 'supervisor', 'rh')
      OR
      -- Gerentes e líderes podem inserir metas de colaboradores da sua loja
      (u.tipo IN ('gerente', 'lider', 'sublider', 'subgerente') 
       AND EXISTS (
         SELECT 1 FROM usuarios usr 
         WHERE usr.id = metas.usuario_id 
         AND usr.loja_id = u.loja_id
       ))
  )
);

-- Política para atualização de metas
CREATE POLICY "Atualizar metas conforme permissões"
ON metas 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM get_current_user_data() AS u
    WHERE 
      -- Admin, supervisor, rh podem atualizar qualquer meta
      u.tipo IN ('admin', 'supervisor', 'rh')
      OR
      -- Gerentes e líderes podem atualizar metas de colaboradores da sua loja
      (u.tipo IN ('gerente', 'lider', 'sublider', 'subgerente') 
       AND EXISTS (
         SELECT 1 FROM usuarios usr 
         WHERE usr.id = metas.usuario_id 
         AND usr.loja_id = u.loja_id
       ))
  )
);

-- Políticas RLS para tabela metas_loja (metas de lojas)
-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Permitir leitura de metas da loja" ON metas_loja;

-- Política para visualização de metas de loja
CREATE POLICY "Visualizar metas de loja conforme permissões"
ON metas_loja 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM get_current_user_data() AS u
    WHERE 
      -- Admin, supervisor, rh podem ver todas as metas de loja
      u.tipo IN ('admin', 'supervisor', 'rh')
      OR
      -- Gerentes e líderes podem ver metas da sua loja
      (u.tipo IN ('gerente', 'lider', 'sublider', 'subgerente') 
       AND metas_loja.loja_id = u.loja_id)
  )
);

-- Política para inserção de metas de loja (apenas admin/supervisor/rh)
CREATE POLICY "Inserir metas de loja - admin apenas"
ON metas_loja 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM get_current_user_data() AS u
    WHERE u.tipo IN ('admin', 'supervisor', 'rh')
  )
);

-- Política para atualização de metas de loja (apenas admin/supervisor/rh)
CREATE POLICY "Atualizar metas de loja - admin apenas"
ON metas_loja 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM get_current_user_data() AS u
    WHERE u.tipo IN ('admin', 'supervisor', 'rh')
  )
);

-- Políticas RLS para tabela metas_loja_categorias
-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Permitir leitura de categorias de metas" ON metas_loja_categorias;

-- Política para visualização de categorias de metas de loja
CREATE POLICY "Visualizar categorias de metas conforme permissões"
ON metas_loja_categorias 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM get_current_user_data() AS u
    JOIN metas_loja ml ON ml.id = metas_loja_categorias.meta_loja_id
    WHERE 
      -- Admin, supervisor, rh podem ver todas as categorias
      u.tipo IN ('admin', 'supervisor', 'rh')
      OR
      -- Gerentes e líderes podem ver categorias da sua loja
      (u.tipo IN ('gerente', 'lider', 'sublider', 'subgerente') 
       AND ml.loja_id = u.loja_id)
  )
);