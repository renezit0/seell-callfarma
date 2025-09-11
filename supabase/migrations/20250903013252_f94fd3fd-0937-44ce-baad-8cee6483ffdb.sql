-- Add policy to allow authentication (reading users for login)
CREATE POLICY "usuarios_auth_policy" ON public.usuarios
FOR SELECT 
USING (
  -- Allow reading users for authentication purposes when no user is logged in
  auth.uid() IS NULL
  OR
  -- Admin, supervisor, rh can see all users
  (SELECT tipo FROM public.get_current_user_data()) IN ('admin', 'supervisor', 'rh')
  OR
  -- Managers can see users from their own store
  (
    (SELECT tipo FROM public.get_current_user_data()) IN ('gerente', 'lider', 'sublider', 'subgerente')
    AND loja_id = (SELECT loja_id FROM public.get_current_user_data())
  )
);

-- Drop the old select policy
DROP POLICY "usuarios_select_policy" ON public.usuarios;