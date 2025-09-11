-- Primeiro, remover as políticas RLS existentes que usam auth.uid()
DROP POLICY IF EXISTS "Users can view their own avatar records" ON user_avatars;
DROP POLICY IF EXISTS "Users can insert their own avatar records" ON user_avatars;
DROP POLICY IF EXISTS "Users can update their own avatar records" ON user_avatars;
DROP POLICY IF EXISTS "Users can delete their own avatar records" ON user_avatars;

DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Criar função para obter o user_id do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_authenticated_user_id()
RETURNS INTEGER AS $$
BEGIN
  -- Como o sistema usa autenticação customizada, vamos assumir que qualquer usuário autenticado pode acessar
  -- Para agora, vamos permitir acesso para usuários autenticados
  RETURN COALESCE((auth.jwt() ->> 'user_id')::integer, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar políticas RLS mais permissivas para a tabela user_avatars
CREATE POLICY "Allow authenticated users to manage avatars" 
ON user_avatars 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Criar políticas RLS mais permissivas para o storage
CREATE POLICY "Allow authenticated users to view avatar files" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'user-avatars');

CREATE POLICY "Allow authenticated users to upload avatar files" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'user-avatars');

CREATE POLICY "Allow authenticated users to update avatar files" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'user-avatars');

CREATE POLICY "Allow authenticated users to delete avatar files" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'user-avatars');