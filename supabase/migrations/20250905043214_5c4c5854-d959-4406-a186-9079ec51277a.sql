-- Primeiro, vamos criar políticas para o bucket 'avatars' também
CREATE POLICY "Allow all operations on avatars bucket" 
ON storage.objects 
FOR ALL 
TO public
USING (bucket_id = 'avatars');

-- Recriar políticas mais permissivas para user-avatars
DROP POLICY IF EXISTS "Allow authenticated users to view avatar files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload avatar files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update avatar files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete avatar files" ON storage.objects;

CREATE POLICY "Allow all operations on user-avatars bucket" 
ON storage.objects 
FOR ALL 
TO public
USING (bucket_id = 'user-avatars');

-- Também tornar a política da tabela user_avatars mais permissiva
DROP POLICY IF EXISTS "Allow authenticated users to manage avatars" ON user_avatars;

CREATE POLICY "Allow all operations on user_avatars table" 
ON user_avatars 
FOR ALL 
TO public
USING (true)
WITH CHECK (true);