import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Save, X } from 'lucide-react';
import { MetaLoja } from '@/hooks/useMetasData';
import { toast } from 'sonner';

interface MetasLojasProps {
  metas: MetaLoja[];
  canEdit: boolean;
  onUpdateMeta: (id: number, valor: number) => Promise<void>;
}

export function MetasLojas({ metas, canEdit, onUpdateMeta }: MetasLojasProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleEdit = (meta: MetaLoja) => {
    setEditingId(meta.id);
    setEditValue(meta.meta_valor_total.toString());
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
      toast.success('Meta da loja atualizada com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar meta da loja');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
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
      'r_mais': 'Rentáveis',
      'perfumaria_r_mais': 'Perfumaria R+',
      'conveniencia_r_mais': 'Conveniência R+',
      'saude': 'Saúde',
      'goodlife': 'GoodLife',
      'generico_similar': 'Genérico/Similar',
      'perfumaria_alta': 'Perfumaria Alta',
      'dermocosmetico': 'Dermocosmético'
    };
    return labels[categoria] || categoria;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metas das Lojas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma meta de loja encontrada para este período.
          </div>
        ) : (
          <div className="space-y-6">
            {metas.map((meta) => (
              <Card key={meta.id} className="border-l-4 border-l-secondary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{meta.nome_loja}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Meta Total:</span>
                          {editingId === meta.id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-8 w-40"
                                placeholder="0,00"
                              />
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
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold text-secondary">
                                {formatCurrency(meta.meta_valor_total)}
                              </span>
                              {canEdit && (
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
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                {meta.categorias && meta.categorias.length > 0 && (
                  <CardContent>
                    <h4 className="font-medium mb-3 text-muted-foreground">Metas por Categoria:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {meta.categorias.map((categoria) => (
                        <div
                          key={categoria.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {getCategoriaLabel(categoria.categoria)}
                            </div>
                            <div className="text-lg font-bold text-primary">
                              {formatCurrency(categoria.meta_valor)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}

                {meta.observacoes && (
                  <CardContent className="pt-0">
                    <div className="text-sm text-muted-foreground">
                      <strong>Observações:</strong> {meta.observacoes}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}