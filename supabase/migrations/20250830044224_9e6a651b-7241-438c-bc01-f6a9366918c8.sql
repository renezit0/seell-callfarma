-- Criar período de teste para o dropdown funcionar
INSERT INTO public.periodos_meta (data_inicio, data_fim, status, descricao) VALUES 
('2025-08-21', '2025-09-20', 'ativo', 'Período Agosto/Setembro 2025'),
('2025-09-21', '2025-10-20', 'ativo', 'Período Setembro/Outubro 2025'),
('2025-07-21', '2025-08-20', 'inativo', 'Período Julho/Agosto 2025')
ON CONFLICT DO NOTHING;