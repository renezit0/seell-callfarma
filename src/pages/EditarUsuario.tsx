import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAvatar } from '@/hooks/useAvatar';
import { supabase } from '@/integrations/supabase/client';
import { getAuthenticatedSupabaseClient } from '@/integrations/supabase/authenticated-client';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Save, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { getDescricaoTipoUsuario, getTiposUsuario } from '@/utils/userTypes';
import { AvatarUpload } from '@/components/AvatarUpload';

interface Usuario {
  id: number;
  nome: string;
  login: string;
  tipo: string;
  loja_id: number;
  permissao: number | null;
  status: string | null;
  CPF: string | null;
  matricula: string | null;
  email: string | null;
  data_contratacao: string | null;
  data_nascimento: string | null;
}

interface Loja {
  id: number;
  numero: string;
  nome: string;
}

export default function EditarUsuario() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { avatars, fetchAvatars } = useAvatar();
  
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Verificar permissões
  const canEditAllUsers = currentUser?.tipo && ['admin', 'supervisor', 'rh'].includes(currentUser.tipo);
  const canEditOwnStoreUsers = currentUser?.tipo && ['gerente', 'lider', 'sublider', 'subgerente'].includes(currentUser.tipo);

  useEffect(() => {
    if (currentUser && id) {
      fetchUsuario();
      if (canEditAllUsers) {
        fetchLojas();
      }
    }
  }, [currentUser, id, canEditAllUsers]);

  const fetchUsuario = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', parseInt(id!))
        .single();

      if (error) throw error;

      // Verificar se o usuário atual pode editar este usuário
      if (!canEditAllUsers && (!canEditOwnStoreUsers || data.loja_id !== currentUser?.loja_id)) {
        toast.error('Você não tem permissão para editar este usuário');
        navigate('/usuarios');
        return;
      }

      setUsuario({
        ...data,
        permissao: Number(data.permissao) || 0,
        CPF: data.CPF || null
      });

      // Buscar avatar usando o novo sistema
      await fetchAvatars([parseInt(id!)]);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      toast.error('Erro ao carregar dados do usuário');
      navigate('/usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchLojas = async () => {
    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('id, numero, nome')
        .order('numero');

      if (error) throw error;
      setLojas(data || []);
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !currentUser) return;

    setSaving(true);
    try {
      console.log('🔄 Tentando salvar usuário:', usuario.nome, 'como usuário:', currentUser.login);
      
      // Use authenticated client with current user login
      const authClient = getAuthenticatedSupabaseClient(currentUser.login);
      
      const { error } = await authClient
        .from('usuarios')
        .update({
          nome: usuario.nome,
          login: usuario.login,
          tipo: usuario.tipo,
          loja_id: usuario.loja_id,
          email: usuario.email,
          CPF: usuario.CPF,
          matricula: usuario.matricula,
          data_nascimento: usuario.data_nascimento,
          data_contratacao: usuario.data_contratacao,
          status: usuario.status,
          permissao: usuario.permissao?.toString()
        })
        .eq('id', usuario.id);

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ Usuário salvo com sucesso!');
      toast.success('Usuário atualizado com sucesso!');
      navigate('/usuarios');
    } catch (error: any) {
      console.error('❌ Erro ao salvar:', error);
      toast.error('Erro ao salvar usuário: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof Usuario, value: any) => {
    if (!usuario) return;
    setUsuario({ ...usuario, [field]: value });
  };

  const handleAvatarChange = () => {
    if (id) {
      fetchAvatars([parseInt(id)]);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!canEditAllUsers && !canEditOwnStoreUsers) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <p className="text-muted-foreground">Usuário não encontrado</p>
            <Button onClick={() => navigate('/usuarios')} className="mt-4">
              Voltar para Lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 md:p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="pb-4 md:pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <UserCog className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              <CardTitle className="text-xl md:text-2xl">Editar Usuário</CardTitle>
            </div>
            <Button variant="outline" onClick={() => navigate('/usuarios')} size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Voltar para Lista</span>
              <span className="sm:hidden">Voltar</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3 md:p-6">
          {/* User Info Card */}
          <Card className="mb-4 md:mb-6 bg-muted/50">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
                {usuario?.id && (
                  <AvatarUpload
                    userId={usuario.id}
                    userName={usuario.nome}
                    currentAvatarUrl={avatars[usuario.id]}
                    size="lg"
                    mode="edit"
                    onAvatarChange={handleAvatarChange}
                  />
                )}
                
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h3 className="text-lg md:text-xl font-semibold mb-2">{usuario.nome}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span>ID: {usuario.id}</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span>Função: {getDescricaoTipoUsuario(usuario.tipo)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={usuario.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login">Login *</Label>
                <Input
                  id="login"
                  value={usuario.login}
                  onChange={(e) => handleInputChange('login', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  value={usuario.matricula || ''}
                  onChange={(e) => handleInputChange('matricula', e.target.value || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={usuario.CPF || ''}
                  onChange={(e) => handleInputChange('CPF', e.target.value || null)}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={usuario.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Função *</Label>
                <Select value={usuario.tipo} onValueChange={(value) => handleInputChange('tipo', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getTiposUsuario().map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {canEditAllUsers && (
                <div className="space-y-2">
                  <Label htmlFor="loja_id">Loja *</Label>
                  <Select 
                    value={usuario.loja_id.toString()} 
                    onValueChange={(value) => handleInputChange('loja_id', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lojas.map((loja) => (
                        <SelectItem key={loja.id} value={loja.id.toString()}>
                          {loja.numero} - {loja.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select 
                  value={usuario.status || 'ativo'} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={usuario.data_nascimento || ''}
                  onChange={(e) => handleInputChange('data_nascimento', e.target.value || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_contratacao">Data de Contratação</Label>
                <Input
                  id="data_contratacao"
                  type="date"
                  value={usuario.data_contratacao || ''}
                  onChange={(e) => handleInputChange('data_contratacao', e.target.value || null)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="permissao">Nível de Permissão</Label>
                <Input
                  id="permissao"
                  type="number"
                  min="0"
                  max="10"
                  value={usuario.permissao || 0}
                  onChange={(e) => handleInputChange('permissao', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Nível de permissão no sistema (0-10)
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/usuarios')}
                className="order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="order-1 sm:order-2"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}