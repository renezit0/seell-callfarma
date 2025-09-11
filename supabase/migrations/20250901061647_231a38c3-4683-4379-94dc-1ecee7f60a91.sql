-- Enable RLS and allow public read access to vendas for the app to fetch collaborator sales
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- Policy to permit read access for all clients (adjust later if needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'vendas' AND policyname = 'Permitir leitura de vendas'
  ) THEN
    CREATE POLICY "Permitir leitura de vendas"
    ON public.vendas
    FOR SELECT
    USING (true);
  END IF;
END$$;