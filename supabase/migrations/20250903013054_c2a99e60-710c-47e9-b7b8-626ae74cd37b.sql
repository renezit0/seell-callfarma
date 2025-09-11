-- Enable RLS on usuarios table
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Create function to get current user data to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_data()
RETURNS TABLE(id bigint, tipo text, loja_id bigint) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT u.id, u.tipo, u.loja_id 
  FROM usuarios u 
  WHERE u.login = (auth.jwt() ->> 'login');
$$;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Permitir leitura de usuários" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_read_all" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_read_managers" ON public.usuarios;

-- Policy for SELECT (read access)
CREATE POLICY "usuarios_select_policy" ON public.usuarios
FOR SELECT 
USING (
  -- Admin, supervisor, rh can see all users
  (SELECT tipo FROM public.get_current_user_data()) IN ('admin', 'supervisor', 'rh')
  OR
  -- Managers can see users from their own store
  (
    (SELECT tipo FROM public.get_current_user_data()) IN ('gerente', 'lider', 'sublider', 'subgerente')
    AND loja_id = (SELECT loja_id FROM public.get_current_user_data())
  )
);

-- Policy for UPDATE (edit access)
CREATE POLICY "usuarios_update_policy" ON public.usuarios
FOR UPDATE 
USING (
  -- Admin can edit anyone including themselves
  (SELECT tipo FROM public.get_current_user_data()) = 'admin'
  OR
  -- Supervisor and RH can edit anyone EXCEPT themselves
  (
    (SELECT tipo FROM public.get_current_user_data()) IN ('supervisor', 'rh')
    AND id != (SELECT id FROM public.get_current_user_data())
  )
  OR
  -- Store managers can edit users from their store but NOT themselves
  -- and cannot assign same or higher roles
  (
    (SELECT tipo FROM public.get_current_user_data()) IN ('gerente', 'lider', 'sublider', 'subgerente')
    AND loja_id = (SELECT loja_id FROM public.get_current_user_data())
    AND id != (SELECT id FROM public.get_current_user_data())
  )
)
WITH CHECK (
  -- Admin can update anyone to any role
  (SELECT tipo FROM public.get_current_user_data()) = 'admin'
  OR
  -- Supervisor and RH can update anyone to any role (except themselves)
  (
    (SELECT tipo FROM public.get_current_user_data()) IN ('supervisor', 'rh')
    AND id != (SELECT id FROM public.get_current_user_data())
  )
  OR
  -- Store managers can update users but cannot assign equal or higher roles
  (
    (SELECT tipo FROM public.get_current_user_data()) IN ('gerente', 'lider', 'sublider', 'subgerente')
    AND loja_id = (SELECT loja_id FROM public.get_current_user_data())
    AND id != (SELECT id FROM public.get_current_user_data())
    AND (
      -- Define hierarchy: admin > supervisor > rh > gerente > subgerente > lider > sublider > others
      CASE 
        WHEN (SELECT tipo FROM public.get_current_user_data()) = 'gerente' THEN 
          tipo NOT IN ('admin', 'supervisor', 'rh', 'gerente')
        WHEN (SELECT tipo FROM public.get_current_user_data()) = 'subgerente' THEN 
          tipo NOT IN ('admin', 'supervisor', 'rh', 'gerente', 'subgerente')
        WHEN (SELECT tipo FROM public.get_current_user_data()) = 'lider' THEN 
          tipo NOT IN ('admin', 'supervisor', 'rh', 'gerente', 'subgerente', 'lider')
        WHEN (SELECT tipo FROM public.get_current_user_data()) = 'sublider' THEN 
          tipo NOT IN ('admin', 'supervisor', 'rh', 'gerente', 'subgerente', 'lider', 'sublider')
        ELSE false
      END
    )
  )
);

-- Policy for DELETE (only admin can delete)
CREATE POLICY "usuarios_delete_policy" ON public.usuarios
FOR DELETE 
USING (
  (SELECT tipo FROM public.get_current_user_data()) = 'admin'
);

-- No INSERT policy - assuming users are created through a different process