-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de lojas
CREATE TABLE public.lojas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    endereco TEXT,
    telefone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ativa',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de usuários (baseada no sistema PHP)
CREATE TABLE public.usuarios (
    id INTEGER PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    login VARCHAR(100) UNIQUE NOT NULL,
    cpf VARCHAR(14),
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('admin', 'gerente', 'farmaceutico', 'auxiliar', 'consultora', 'lider', 'aux_conveniencia', 'supervisor')),
    matricula VARCHAR(20) UNIQUE,
    loja_id INTEGER REFERENCES public.lojas(id),
    senha_provisoria INTEGER DEFAULT 0,
    permissao INTEGER DEFAULT 0,
    ativo INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de períodos de meta
CREATE TABLE public.periodos_meta (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'concluido')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de metas individuais
CREATE TABLE public.metas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('geral', 'generico_similar', 'goodlife', 'perfumaria_alta', 'dermocosmetico', 'conveniencia_r_mais')),
    meta_mensal DECIMAL(10,2) NOT NULL DEFAULT 0,
    periodo_meta_id INTEGER NOT NULL REFERENCES public.periodos_meta(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(usuario_id, categoria, periodo_meta_id)
);

-- Tabela de vendas individuais
CREATE TABLE public.vendas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    data_venda DATE NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('geral', 'generico', 'similar', 'goodlife', 'perfumaria_alta', 'dermocosmetico', 'conveniencia', 'brinquedo_r_mais')),
    valor_venda DECIMAL(10,2) NOT NULL DEFAULT 0,
    valor_comissao DECIMAL(10,2) NOT NULL DEFAULT 0,
    registrado_por_usuario_id INTEGER REFERENCES public.usuarios(id),
    data_registro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    data_atualizacao TIMESTAMP WITH TIME ZONE,
    atualizado_por_usuario_id INTEGER REFERENCES public.usuarios(id)
);

-- Tabela de metas por loja
CREATE TABLE public.metas_loja (
    id SERIAL PRIMARY KEY,
    loja_id INTEGER NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    periodo_meta_id INTEGER NOT NULL REFERENCES public.periodos_meta(id) ON DELETE CASCADE,
    meta_valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(loja_id, periodo_meta_id)
);

-- Tabela de categorias de metas por loja
CREATE TABLE public.metas_loja_categorias (
    id SERIAL PRIMARY KEY,
    meta_loja_id INTEGER NOT NULL REFERENCES public.metas_loja(id) ON DELETE CASCADE,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('geral', 'r_mais', 'perfumaria_r_mais', 'conveniencia_r_mais', 'saude')),
    meta_valor DECIMAL(10,2) NOT NULL DEFAULT 0,
    UNIQUE(meta_loja_id, categoria)
);

-- Tabela de vendas por loja
CREATE TABLE public.vendas_loja (
    id SERIAL PRIMARY KEY,
    loja_id INTEGER NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    data_venda DATE NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    valor_venda DECIMAL(10,2) NOT NULL DEFAULT 0,
    registrado_por_usuario_id INTEGER REFERENCES public.usuarios(id),
    data_registro TIMESTAMP WITH TIME ZONE DEFAULT now(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
    atualizado_por_usuario_id INTEGER REFERENCES public.usuarios(id)
);

-- Criar índices para performance
CREATE INDEX idx_vendas_usuario_data ON public.vendas(usuario_id, data_venda);
CREATE INDEX idx_vendas_categoria ON public.vendas(categoria);
CREATE INDEX idx_metas_usuario_periodo ON public.metas(usuario_id, periodo_meta_id);
CREATE INDEX idx_vendas_loja_data ON public.vendas_loja(loja_id, data_venda);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers nas tabelas
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lojas_updated_at BEFORE UPDATE ON public.lojas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_periodos_meta_updated_at BEFORE UPDATE ON public.periodos_meta FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_metas_updated_at BEFORE UPDATE ON public.metas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_metas_loja_updated_at BEFORE UPDATE ON public.metas_loja FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_loja_categorias ENABLE ROW LEVEL SECURITY;

-- Inserir dados iniciais
INSERT INTO public.lojas (nome, endereco, status) VALUES 
('Loja Principal', 'Endereço da Loja Principal', 'ativa'),
('Loja Filial', 'Endereço da Loja Filial', 'ativa');

INSERT INTO public.periodos_meta (nome, data_inicio, data_fim, status) VALUES 
('Janeiro 2025', '2025-01-01', '2025-01-31', 'ativo');

-- Inserir usuário admin padrão (senha: admin123)
INSERT INTO public.usuarios (id, nome, login, senha, tipo, matricula, loja_id, permissao) VALUES 
(1, 'Administrador', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '001', 1, 1);