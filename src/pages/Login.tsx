import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import miniIconWhite from '@/assets/mini-icon-white.png';

export default function Login() {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, login: authLogin, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Add login-page class to body when component mounts
  useEffect(() => {
    document.body.classList.add('login-page');
    return () => {
      document.body.classList.remove('login-page');
    };
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="loading-container text-center">
          <div className="loading-spinner animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="loading-text text-foreground">
            Carregando<span className="dot-animation">...</span>
          </div>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await authLogin(login, senha);
    
    if (result.success) {
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o dashboard...",
      });
      // Usar window.location para forçar redirecionamento
      setTimeout(() => {
        console.log('🚀 Forçando redirecionamento via window.location');
        window.location.href = '/';
      }, 500);
      setLoading(false);
    } else {
      toast({
        title: "Erro no login",
        description: result.error || "Verifique suas credenciais.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#111111' }}>
      {/* Animated Rings */}
      <div className="ring">
        <i></i>
        <i></i>
        <i></i>
      </div>

      {/* Login Form */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-6">
        <div className="w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src={miniIconWhite} 
              alt="seeLL" 
              className="logo-img mx-auto hover-scale transition-transform duration-300"
            />
            <h2 className="text-2xl font-bold mb-2">Acessar Sistema</h2>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6" id="loginForm">
            <div className="inputBx">
              <Input
                type="text"
                placeholder="Digite seu usuário ou CPF"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                className="h-12 transition-all duration-300"
                autoComplete="off"
              />
            </div>

            <div className="inputBx">
              <Input
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="h-12 transition-all duration-300"
                autoComplete="off"
              />
            </div>

            <div className="remember-forgot flex items-center justify-between">
              <div className="remember-me flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(checked) => setRemember(checked === true)}
                />
                <label htmlFor="remember" className="text-sm cursor-pointer">
                  Lembrar-me
                </label>
              </div>
            </div>

            <div className="inputBx">
              <Button 
                type="submit" 
                className="w-full h-12 font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
                style={{ 
                  background: 'linear-gradient(45deg, var(--ring-color-2), var(--ring-color-1))',
                  color: 'var(--text-on-secondary)',
                  border: 'none'
                }}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: 'var(--text-on-secondary)' }}></div>
                    <span>Entrando...</span>
                  </div>
                ) : 'Entrar'}
              </Button>
            </div>

            <div className="links text-center space-x-4">
              <a href="#" className="text-sm story-link transition-colors">
                Esqueceu a senha?
              </a>
              <a href="#" className="text-sm story-link transition-colors">
                Cadastre-se
              </a>
            </div>
          </form>

          {/* Credits */}
          <div className="credits text-center mt-8 pt-6" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="app-version text-xs mb-2 font-mono">
              Versão 10.4
            </div>
            <p className="text-xs leading-relaxed">
              seeLL Todos os direitos reservados
              <br />© 2025 - Em desenvolvimento, pode apresentar erros!
            </p>
            <div className="developer-info text-xs mt-2 opacity-75">
              Por Flávio Renê
              <br />
              <a href="https://seellbr.com" className="story-link transition-colors">
                seellbr.com
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}