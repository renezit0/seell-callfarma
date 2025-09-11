-- Alterar campanha Biolab para usar produtos específicos ao invés de fornecedores/grupos
UPDATE campanhas_vendas_lojas 
SET 
  fornecedores = NULL,
  grupos_produtos = NULL,
  produtos = '23319,52682,58033,60423,60424,60425,60426,60427,60428,61855,61856,62335,64489,75790,75791,77826',
  descricao = 'Campanha de vendas para produtos Biolab específicos'
WHERE id = 2 AND nome ILIKE '%biolab%';