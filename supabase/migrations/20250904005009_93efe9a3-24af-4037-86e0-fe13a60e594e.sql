-- Remover todas as políticas existentes para recriar com as novas permissões

-- Políticas da tabela metas
DROP POLICY IF EXISTS "Visualizar metas conforme permissões" ON metas;
DROP POLICY IF EXISTS "Inserir metas conforme permissões" ON metas;
DROP POLICY IF EXISTS "Atualizar metas conforme permissões" ON metas;

-- Políticas da tabela metas_loja
DROP POLICY IF EXISTS "Visualizar metas de loja conforme permissões" ON metas_loja;
DROP POLICY IF EXISTS "Inserir metas de loja - admin apenas" ON metas_loja;
DROP POLICY IF EXISTS "Atualizar metas de loja - admin apenas" ON metas_loja;

-- Políticas da tabela metas_loja_categorias
DROP POLICY IF EXISTS "Visualizar categorias de metas conforme permissões" ON metas_loja_categorias;
DROP POLICY IF EXISTS "Inserir categorias de metas - admin apenas" ON metas_loja_categorias;
DROP POLICY IF EXISTS "Atualizar categorias de metas - admin apenas" ON metas_loja_categorias;

-- Agora criar as novas políticas

-- TABELA METAS (colaboradores)
CREATE POLICY "Ver metas por permissão"
ON metas FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM get_current_user_data() AS u
    WHERE 
      u.tipo IN ('admin', 'supervisor', 'rh')
      OR (u.tipo IN ('gerente', 'lider', 'sublider', 'subgerente', 'auxiliar', 'farmaceutico', 'consultora') 
          AND EXISTS (
            SELECT 1 FROM usuarios usr 
            WHERE usr.id = metas.usuario_id AND usr.loja_id = u.loja_id
          ))
      OR metas.usuario_id = u.id
  )
);

CREATE POLICY "Inserir metas por permissão"
ON metas FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_current_user_data() AS u
    WHERE 
      u.tipo IN ('admin', 'supervisor', 'rh')
      OR (u.tipo IN ('gerente', 'lider', 'sublider', 'subgerente') 
          AND EXISTS (
            SELECT 1 FROM usuarios usr 
            WHERE usr.id = metas.usuario_id AND usr.loja_id = u.loja_id
          ))
  )
);

CREATE POLICY "Atualizar metas por permissão"
ON metas FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM get_current_user_data() AS u
    WHERE 
      u.tipo IN ('admin', 'supervisor', 'rh')
      OR (u.tipo IN ('gerente', 'lider', 'sublider', 'subgerente') 
          AND EXISTS (
            SELECT 1 FROM usuarios usr 
            WHERE usr.id = metas.usuario_id AND usr.loja_id = u.loja_id
          ))
  )
);

-- TABELA METAS_LOJA
CREATE POLICY "Ver metas loja por permissão"
ON metas_loja FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM get_current_user_data() AS u
    WHERE 
      u.tipo IN ('admin', 'supervisor', 'rh')
      OR (u.tipo IN ('gerente', 'lider', 'sublider', 'subgerente') 
          AND metas_loja.loja_id = u.loja_id)
  )
);

CREATE POLICY "Inserir metas loja admin"
ON metas_loja FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_current_user_data() AS u
    WHERE u.tipo IN ('admin', 'supervisor', 'rh')
  )
);

CREATE POLICY "Atualizar metas loja admin"
ON metas_loja FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM get_current_user_data() AS u
    WHERE u.tipo IN ('admin', 'supervisor', 'rh')
  )
);

-- TABELA METAS_LOJA_CATEGORIAS  
CREATE POLICY "Ver categorias metas por permissão"
ON metas_loja_categorias FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM get_current_user_data() AS u
    JOIN metas_loja ml ON ml.id = metas_loja_categorias.meta_loja_id
    WHERE 
      u.tipo IN ('admin', 'supervisor', 'rh')
      OR (u.tipo IN ('gerente', 'lider', 'sublider', 'subgerente') 
          AND ml.loja_id = u.loja_id)
  )
);