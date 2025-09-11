import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Save, X, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ColaboradorComMetas, MetaColaborador } from '@/hooks/useMetasData';
import { getDescricaoTipoUsuario, getCorTipoUsuario } from '@/utils/userTypes';
import { toast } from 'sonner';

interface MetasColaboradoresProps {
  colaboradores: ColaboradorComMetas[];
  canEdit: boolean;
  canEditOthersIndices: boolean;
  isRestrictedUser: boolean;
  getCategoriasPorTipo: (tipo: string) => string[];
  onUpdateMeta: (id: number, valor: number) => Promise<void>;
  onCreateMeta: (usuario_id: number, categoria: string, valor: number) => Promise<void>;
}

export function MetasColaboradores({ 
  colaboradores,
  canEdit, 
  canEditOthersIndices,
  isRestrictedUser,
  getCategoriasPorTipo, 
  onUpdateMeta, 
  onCreateMeta 
}: MetasColaboradoresProps) {
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMetaForm, setNewMetaForm] = useState({
    usuario_id: '',
    categoria: '',
    valor: ''
  });

  // Verificar se pode editar uma meta específica
  const canEditMeta = (colaborador: ColaboradorComMetas, categoria: string) => {
    // Admin/supervisor/rh podem editar tudo
    if (canEdit && !isRestrictedUser) return true;
    
    // Usuários restritos só podem editar suas próprias metas
    if (isRestrictedUser && user?.id !== colaborador.usuario_id) return false;
    
    // Líderes e gerentes podem editar outros índices específicos
    if (canEditOthersIndices && ['R+', 'PERF R+', 'SAUDE'].includes(categoria)) return true;
    
    // Pode editar se for sua própria meta
    return user?.id === colaborador.usuario_id;
  };

  const handleEdit = (meta: MetaColaborador) => {
    setEditingId(meta.id);
    setEditValue(meta.meta_mensal.toString());
  };

  const handleSave = async (id: number) => {
    try {
      const valor = parseFloat(editValue.replace(',', '.'));
      if (isNaN(valor) || valor < 0) {
        toast.error('Valor inválido');
        return;
      }

      await onUpdateMeta(id, valor);
      setEditingId(null);
      setEditValue('');
      toast.success('Meta atualizada com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar meta');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleAddMeta = async () => {
    try {
      const valor = parseFloat(newMetaForm.valor.replace(',', '.'));
      if (isNaN(valor) || valor < 0) {
        toast.error('Valor inválido');
        return;
      }

      if (!newMetaForm.usuario_id || !newMetaForm.categoria) {
        toast.error('Preencha todos os campos');
        return;
      }

      await onCreateMeta(parseInt(newMetaForm.usuario_id), newMetaForm.categoria, valor);
      setShowAddForm(false);
      setNewMetaForm({ usuario_id: '', categoria: '', valor: '' });
      toast.success('Meta criada com sucesso');
    } catch (error) {
      toast.error('Erro ao criar meta');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      'geral': 'Geral',
      'generico_similar': 'Genérico/Similar',
      'goodlife': 'GoodLife',
      'perfumaria_alta': 'Perfumaria Alta',
      'dermocosmetico': 'Dermocosmético'
    };
    return labels[categoria] || categoria;
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle className="text-lg sm:text-xl">Metas dos Colaboradores</CardTitle>
        {canEdit && (
          <Button onClick={() => setShowAddForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nova Meta</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && canEdit && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Colaborador</label>
                  <Select
                    value={newMetaForm.usuario_id}
                    onValueChange={(value) => setNewMetaForm({ ...newMetaForm, usuario_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {colaboradores.filter(c => c.pode_ter_metas).map((colaborador) => (
                        <SelectItem key={colaborador.usuario_id} value={colaborador.usuario_id.toString()}>
                          {colaborador.nome_usuario} ({colaborador.tipo_usuario})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <Select
                    value={newMetaForm.categoria}
                    onValueChange={(value) => setNewMetaForm({ ...newMetaForm, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Geral</SelectItem>
                      <SelectItem value="generico_similar">Genérico/Similar</SelectItem>
                      <SelectItem value="goodlife">GoodLife</SelectItem>
                      <SelectItem value="perfumaria_alta">Perfumaria Alta</SelectItem>
                      <SelectItem value="dermocosmetico">Dermocosmético</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor</label>
                  <Input
                    placeholder="0,00"
                    value={newMetaForm.valor}
                    onChange={(e) => setNewMetaForm({ ...newMetaForm, valor: e.target.value })}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleAddMeta} size="sm" className="flex-1 sm:flex-none">
                    <Save className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Salvar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {colaboradores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum colaborador encontrado para este período.
          </div>
        ) : (
          <div className="space-y-4">
            {colaboradores.map((colaborador) => (
              <Card key={colaborador.usuario_id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg">{colaborador.nome_usuario}</h3>
                      <Badge className={getCorTipoUsuario(colaborador.tipo_usuario)}>
                        {getDescricaoTipoUsuario(colaborador.tipo_usuario)}
                      </Badge>
                    </div>
                    {colaborador.pode_ter_metas && canEdit && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setShowAddForm(true)}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar Meta
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {colaborador.metas.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      {colaborador.pode_ter_metas 
                        ? 'Nenhuma meta cadastrada para este colaborador.'
                        : 'Este tipo de usuário não possui metas.'
                      }
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {colaborador.metas.map((meta) => (
                        <div
                          key={meta.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {getCategoriaLabel(meta.categoria)}
                            </div>
                            {editingId === meta.id ? (
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="mt-1 h-8"
                                placeholder="0,00"
                              />
                            ) : (
                              <div className="text-base sm:text-lg font-bold text-primary">
                                {formatCurrency(meta.meta_mensal)}
                              </div>
                            )}
                          </div>
                          
                          {canEditMeta(colaborador, meta.categoria) && (
                            <div className="flex gap-1 ml-2">
                              {editingId === meta.id ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSave(meta.id)}
                                  >
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCancel}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(meta)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}