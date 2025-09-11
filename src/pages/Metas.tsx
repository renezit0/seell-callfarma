import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Users, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMetasData } from '@/hooks/useMetasData';
import { MetasColaboradores } from '@/components/MetasColaboradores';
import { MetasLojas } from '@/components/MetasLojas';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Metas() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    colaboradoresComMetas,
    metasLojas,
    periodos,
    periodoSelecionado,
    setPeriodoSelecionado,
    loading,
    error,
    canEditAll,
    canViewStoreOnly,
    canEditColaboradores,
    canEditOthersIndices,
    isRestrictedUser,
    updateMetaColaborador,
    createMetaColaborador,
    updateMetaLoja,
    getCategoriasPorTipo
  } = useMetasData();

  // Se ainda está carregando autenticação, mostrar loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não há usuário, redirecionar para login
  if (!user) {
    navigate('/login');
    return null;
  }

  // Verificar permissões de acesso
  const canAccessMetas = user?.tipo && [
    'admin', 'supervisor', 'rh', 'gerente', 'lider', 'sublider', 
    'subgerente', 'auxiliar', 'farmaceutico', 'consultora'
  ].includes(user.tipo);

  console.log('🔐 Verificando permissões - Usuário:', user?.nome, 'Tipo:', user?.tipo, 'Pode acessar:', canAccessMetas);

  if (!canAccessMetas) {
    return (
      <div className="page-container min-h-screen bg-background">
        <Card className="max-w-2xl mx-auto mt-20">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <CardTitle className="text-2xl text-foreground">
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground text-lg">
              Você não tem permissão para acessar a página de <strong>Metas</strong>.
            </p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Metas</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Gerencie as metas dos colaboradores e lojas
              </p>
            </div>
          </div>

          {/* Seletor de Período */}
          <div className="w-full sm:w-64">
            <Select
              value={periodoSelecionado?.toString()}
              onValueChange={(value) => setPeriodoSelecionado(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {periodos.map((periodo) => (
                  <SelectItem key={periodo.id} value={periodo.id.toString()}>
                    {periodo.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Informações de Permissão */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {canEditAll 
              ? 'Você tem permissão para visualizar e editar todas as metas.'
              : canViewStoreOnly 
                ? 'Você pode visualizar metas da sua loja e editar metas de colaboradores.'
                : 'Você tem acesso limitado às funcionalidades de metas.'
            }
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando metas...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="colaboradores" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="colaboradores" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Colaboradores
              </TabsTrigger>
              <TabsTrigger value="lojas" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Lojas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colaboradores">
              <MetasColaboradores
                colaboradores={colaboradoresComMetas}
                canEdit={canEditColaboradores}
                canEditOthersIndices={canEditOthersIndices}
                isRestrictedUser={isRestrictedUser}
                getCategoriasPorTipo={getCategoriasPorTipo}
                onUpdateMeta={updateMetaColaborador}
                onCreateMeta={createMetaColaborador}
              />
            </TabsContent>

            <TabsContent value="lojas">
              <MetasLojas
                metas={metasLojas}
                canEdit={canEditAll}
                onUpdateMeta={updateMetaLoja}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}