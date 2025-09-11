-- Atualizar grupo_id para as lojas participantes baseado no mapeamento fornecido

-- Grupo 1
UPDATE campanhas_vendas_lojas_participantes 
SET grupo_id = '1' 
WHERE codigo_loja IN (13, 19, 27, 35, 21, 26, 24, 15);

-- Grupo 2  
UPDATE campanhas_vendas_lojas_participantes 
SET grupo_id = '2' 
WHERE codigo_loja IN (28, 23, 18, 16, 2, 29, 30, 8, 9, 34, 36, 4, 5, 7, 10, 3);

-- Grupo 3
UPDATE campanhas_vendas_lojas_participantes 
SET grupo_id = '3' 
WHERE codigo_loja IN (14, 20, 22, 17, 6, 101, 32, 33, 31, 25, 100);