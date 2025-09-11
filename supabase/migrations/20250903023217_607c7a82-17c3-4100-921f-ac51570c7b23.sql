-- Criar tabela para avatares dos usuários
CREATE TABLE public.user_avatars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS na tabela
ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para avatares
CREATE POLICY "Usuários podem ver todos os avatares"
ON public.user_avatars
FOR SELECT
USING (true);

CREATE POLICY "Usuários podem inserir seu próprio avatar"
ON public.user_avatars
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios u 
    WHERE u.id = user_avatars.user_id 
    AND u.login = (auth.jwt() ->> 'login')
  )
);

CREATE POLICY "Usuários podem atualizar seu próprio avatar"
ON public.user_avatars
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u 
    WHERE u.id = user_avatars.user_id 
    AND u.login = (auth.jwt() ->> 'login')
  )
);

CREATE POLICY "Usuários podem deletar seu próprio avatar"
ON public.user_avatars
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u 
    WHERE u.id = user_avatars.user_id 
    AND u.login = (auth.jwt() ->> 'login')
  )
);

-- Criar função para atualizar updated_at automaticamente
CREATE TRIGGER update_user_avatars_updated_at
  BEFORE UPDATE ON public.user_avatars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para avatares se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas de storage para avatares
CREATE POLICY "Avatares são publicamente visíveis"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-avatars');

CREATE POLICY "Usuários podem fazer upload de avatares"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Usuários podem atualizar seus avatares"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'user-avatars' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Usuários podem deletar seus avatares"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user-avatars' AND
  auth.uid() IS NOT NULL
);