-- Inserir usuário admin com todas as informações necessárias
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
  cpf,
  senha_provisoria
) VALUES (
  1,
  'Administrador',
  '1',
  '1',
  '1',
  'gerente',
  1,
  999,
  'ativo',
  CURRENT_DATE,
  '11111111111',
  false
) ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  login = EXCLUDED.login,
  senha = EXCLUDED.senha,
  matricula = EXCLUDED.matricula,
  tipo = EXCLUDED.tipo,
  loja_id = EXCLUDED.loja_id,
  permissao = EXCLUDED.permissao,
  status = EXCLUDED.status,
  data_contratacao = EXCLUDED.data_contratacao,
  cpf = EXCLUDED.cpf,
  senha_provisoria = EXCLUDED.senha_provisoria;

-- Garantir que a sequência seja atualizada
SELECT setval('usuarios_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM usuarios), 1), true);