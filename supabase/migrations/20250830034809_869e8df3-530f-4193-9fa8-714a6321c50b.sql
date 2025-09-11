-- Inserir usuário admin com id 1
INSERT INTO public.usuarios (
  id, 
  nome, 
  login, 
  senha, 
  matricula, 
  tipo, 
  loja_id, 
  permissao, 
  status, 
  data_contratacao, 
  cpf
) VALUES (
  1,
  'Admin',
  '1',
  '1',
  '1',
  'gerente',
  1,
  999,
  'ativo',
  CURRENT_DATE,
  '11111111111'
) ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  login = EXCLUDED.login,
  senha = EXCLUDED.senha,
  matricula = EXCLUDED.matricula,
  tipo = EXCLUDED.tipo,
  loja_id = EXCLUDED.loja_id,
  permissao = EXCLUDED.permissao,
  status = EXCLUDED.status;

-- Resetar a sequência para começar do próximo ID disponível
SELECT setval('usuarios_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM usuarios), false);