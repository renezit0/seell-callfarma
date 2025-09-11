import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  nome: string;
  login: string;
  tipo: string;
  loja_id: number;
  permissao: number;
  status: string;
  cpf?: string;
  matricula?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const login = async (loginInput: string, senha: string) => {
    console.log('🚀 Iniciando login para:', loginInput);
    try {
      // Função para limpar CPF (remover pontos, traços, espaços)
      const cleanCpf = (cpf: string) => cpf.replace(/[.\-\s]/g, '');
      
      // Primeiro, buscar o usuário pelo login ou CPF
      let userRecord = null;
      let userError = null;

      // Busca por login
      const loginResult = await supabase
        .from('usuarios')
        .select('*')
        .eq('login', loginInput)
        .maybeSingle();

      if (loginResult.error) throw loginResult.error;
      userRecord = loginResult.data;

      // Se não encontrou por login, tenta por CPF
      if (!userRecord) {
        const cleanedInput = cleanCpf(loginInput);
        
        const cpfResult = await supabase
          .from('usuarios')
          .select('*')
          .eq('CPF', cleanedInput)
          .maybeSingle();

        if (cpfResult.error) throw cpfResult.error;
        userRecord = cpfResult.data;

        // Se ainda não encontrou, tenta por CPF formatado no banco
        if (!userRecord) {
          const formattedCpfResult = await supabase
            .from('usuarios')
            .select('*')
            .eq('CPF', loginInput)
            .maybeSingle();

          if (formattedCpfResult.error) throw formattedCpfResult.error;
          userRecord = formattedCpfResult.data;
        }
      }
      
      if (!userRecord) {
        console.log('❌ Usuário não encontrado');
        return { success: false, error: 'Usuário ou senha inválidos' };
      }

      // Verificar se a senha coincide (senha padrão ou bcrypt)
      // Se a senha no banco começar com $2b$, $2a$, etc., é bcrypt
      const isBcryptHash = userRecord.senha && userRecord.senha.startsWith('$2');
      
      let senhaValida = false;
      
      if (isBcryptHash) {
        // Usar bcrypt para validar senhas hash
        senhaValida = await bcrypt.compare(senha, userRecord.senha);
      } else {
        // Senha padrão em texto simples
        senhaValida = userRecord.senha === senha;
      }

      if (!senhaValida) {
        console.log('❌ Senha inválida');
        return { success: false, error: 'Usuário ou senha inválidos' };
      }
      
      // Se a senha foi validada e não estava em hash, atualizá-la para bcrypt
      if (senhaValida && !isBcryptHash) {
        console.log('🔄 Atualizando senha para hash bcrypt...');
        try {
          const hashedPassword = await bcrypt.hash(senha, 12);
          await supabase
            .from('usuarios')
            .update({ senha: hashedPassword })
            .eq('id', userRecord.id);
          console.log('✅ Senha atualizada para hash bcrypt');
        } catch (hashError) {
          console.error('⚠️ Erro ao atualizar senha para hash:', hashError);
          // Continue with login even if password update fails
        }
      }
      
      // Criar sessão no Supabase Auth usando signInAnonymously e depois atualizar metadados
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            login: userRecord.login,
            nome: userRecord.nome,
            tipo: userRecord.tipo,
            loja_id: userRecord.loja_id,
            permissao: userRecord.permissao,
            user_id: userRecord.id
          }
        }
      });

      if (authError) {
        console.error('❌ Erro ao criar sessão no Supabase:', authError);
        // Continue with local auth if Supabase auth fails
      }
      
      // Mapear os dados do banco para o tipo User
      const userData: User = {
        id: userRecord.id,
        nome: userRecord.nome,
        login: userRecord.login,
        tipo: userRecord.tipo,
        loja_id: userRecord.loja_id,
        permissao: Number(userRecord.permissao) || 0,
        status: 'ativo',
        cpf: userRecord.CPF || null, // Nota: banco usa 'CPF' maiúsculo
        matricula: userRecord.matricula
      };
      
      console.log('✅ Login bem-sucedido, definindo usuário:', userData.nome);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { success: true };
    } catch (error) {
      console.log('❌ Erro no login:', error);
      return { success: false, error: 'Usuário ou senha inválidos' };
    }
  };

  const logout = async () => {
    // Sair da sessão do Supabase Auth se existir
    await supabase.auth.signOut();
    
    setUser(null);
    localStorage.removeItem('user');
    // Usar window.location para garantir redirecionamento completo
    window.location.href = '/login';
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Erro ao carregar usuário do localStorage:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  return { user, login, logout, loading };
}