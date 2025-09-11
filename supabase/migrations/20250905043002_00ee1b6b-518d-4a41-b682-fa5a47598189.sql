-- Verificar políticas existentes para o bucket user-avatars
SELECT * FROM storage.policies WHERE bucket_id = 'user-avatars';

-- Criar políticas RLS para o bucket user-avatars
CREATE POLICY "Users can view their own avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatars" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatars" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Habilitar RLS na tabela user_avatars se não estiver habilitado
ALTER TABLE user_avatars ENABLE ROW LEVEL SECURITY;

-- Criar políticas para a tabela user_avatars
CREATE POLICY "Users can view their own avatar records" 
ON user_avatars 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own avatar records" 
ON user_avatars 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own avatar records" 
ON user_avatars 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own avatar records" 
ON user_avatars 
FOR DELETE 
USING (auth.uid()::text = user_id::text);