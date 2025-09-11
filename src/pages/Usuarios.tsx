import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAvatar } from '@/hooks/useAvatar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getDescricaoTipoUsuario, getCorTipoUsuario, getTiposUsuario } from '@/utils/userTypes';
import { StoreSelector } from '@/components/StoreSelector';
import { AvatarUpload } from '@/components/AvatarUpload';

interface Usuario {
  id: number;
  nome: string;
  login: string;
  tipo: string;
  loja_id: number;
  permissao: number | null;
  status: string | null;
  CPF: string | null; // Corresponde ao nome da coluna no banco
  matricula: string | null;
  email: string | null;
  data_contratacao: string;
  avatar?: string; // URL do avatar do usuário
}

export default function Usuarios() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ativo'); // Por padrão mostrar apenas ativos
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [selectedLojaId, setSelectedLojaId] = useState<number | null>(null);
  const [lojaInfo, setLojaInfo] = useState<{ numero: string; nome: string } | null>(null);
  const { avatars, fetchAvatars } = useAvatar();

  // Verificar se o usuário pode ver todas as lojas
  const canViewAllStores = user?.tipo && ['admin', 'supervisor', 'compras'].includes(user.tipo);

  // useEffect must be called before any early returns
  useEffect(() => {
    if (user) {
      fetchUsuarios();
      fetchLojaInfo();
    }
  }, [user, selectedLojaId]);

  const fetchUsuarios = async () => {
    try {
      let query = supabase
        .from('usuarios')
        .select('*')
        .order('nome');

      // Se o usuário pode ver todas as lojas e tem uma loja específica selecionada
      if (canViewAllStores && selectedLojaId) {
        query = query.eq('loja_id', selectedLojaId);
      } 
      // Se o usuário não pode ver todas as lojas, filtrar pela sua loja
      else if (!canViewAllStores) {
        query = query.eq('loja_id', user?.loja_id);
      }
      // Se canViewAllStores é true e selectedLojaId é null, não adiciona filtro de loja (mostra todas)

      const { data, error } = await query;

      if (error) throw error;
      
      // Mapear os dados para o tipo correto
      const mappedUsuarios = (data || []).map(userRow => ({
        ...userRow,
        permissao: Number(userRow.permissao) || 0,
        CPF: userRow.CPF || null
      }));
      
      setUsuarios(mappedUsuarios);
      
      // Buscar avatares após carregar usuários
      const userIds = mappedUsuarios.map(user => user.id);
      if (userIds.length > 0) {
        await fetchAvatars(userIds);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const fetchLojaInfo = async () => {
    const currentLojaId = selectedLojaId || user?.loja_id;
    if (!currentLojaId) return;
    
    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('numero, nome')
        .eq('id', currentLojaId)
        .single();

      if (error) throw error;
      setLojaInfo(data);
    } catch (error) {
      console.error('Erro ao buscar informações da loja:', error);
    }
  };

  // Show loading while authentication is being checked
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

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (usuario.matricula && usuario.matricula.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (usuario.email && usuario.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || usuario.status === statusFilter;
    const matchesTipo = tipoFilter === 'all' || usuario.tipo === tipoFilter;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white border-0">Ativo</Badge>;
      case 'inativo':
        return <Badge className="bg-gray-500 hover:bg-gray-600 text-white border-0">Inativo</Badge>;
      case 'bloqueado':
        return <Badge className="bg-red-500 hover:bg-red-600 text-white border-0">Bloqueado</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">Pendente</Badge>;
      default:
        return <Badge className="bg-gray-400 hover:bg-gray-500 text-white border-0">Desconhecido</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    return (
      <Badge className={getCorTipoUsuario(tipo)}>
        {getDescricaoTipoUsuario(tipo)}
      </Badge>
    );
  };

  const handleEdit = (userId: number) => {
    navigate(`/usuarios/editar/${userId}`);
  };

  const handleAvatarChange = () => {
    // Não precisamos mais desta função já que estamos usando modo display
    const userIds = usuarios.map(user => user.id);
    if (userIds.length > 0) {
      fetchAvatars(userIds);
    }
  };

  return (
    <div className="page-container space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {canViewAllStores ? 
              (selectedLojaId ? 
                (lojaInfo ? `Usuários - ${lojaInfo.numero} - ${lojaInfo.nome.toUpperCase()}` : `Usuários da Loja ${selectedLojaId}`) 
                : 'Usuários de Todas as Lojas') 
              : (lojaInfo ? `Usuários - ${lojaInfo.numero} - ${lojaInfo.nome.toUpperCase()}` : `Usuários da Loja ${user?.loja_id}`)
            }
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os colaboradores da loja
          </p>
        </div>
        
        {canViewAllStores && (
          <StoreSelector
            selectedLojaId={selectedLojaId}
            onLojaChange={setSelectedLojaId}
            userLojaId={user?.loja_id || 0}
          />
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Filtros
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="relative md:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, matrícula ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
               <SelectContent className="bg-background border border-border shadow-lg z-50">
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                <SelectItem value="all">Todos os Tipos</SelectItem>
                {getTiposUsuario().map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center justify-center md:justify-start">
              <span className="bg-muted px-3 py-1 rounded-full">
                Total: {filteredUsuarios.length} usuário{filteredUsuarios.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando usuários...
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="block md:hidden">
                {filteredUsuarios.map((usuario) => (
                  <div key={usuario.id} className="border-b border-border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <AvatarUpload 
                          userId={usuario.id}
                          userName={usuario.nome}
                          currentAvatarUrl={avatars[usuario.id]}
                          size="sm"
                          mode="display"
                        />
                        <div>
                          <p className="font-medium text-foreground">{usuario.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            Mat: {usuario.matricula || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(usuario.id)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {usuario.status !== 'ativo' && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Função:</span>
                        <div className="mt-1">{getTipoBadge(usuario.tipo)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="mt-1">{getStatusBadge(usuario.status)}</div>
                      </div>
                      {usuario.email && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Email:</span>
                          <p className="text-foreground truncate">{usuario.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {filteredUsuarios.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </div>
                )}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <AvatarUpload 
                              userId={usuario.id}
                              userName={usuario.nome}
                              currentAvatarUrl={avatars[usuario.id]}
                              size="sm"
                              mode="display"
                            />
                            <span className="font-medium">{usuario.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {usuario.matricula || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>{getTipoBadge(usuario.tipo)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {usuario.email || 'Não informado'}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(usuario.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(usuario.id)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            {usuario.status !== 'ativo' && (
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredUsuarios.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}