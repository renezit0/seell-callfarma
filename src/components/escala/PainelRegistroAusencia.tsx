import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, CalendarIcon, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PainelRegistroAusenciaProps {
  folgas: Array<{
    folga_id: number;
    data_folga: string;
    tipo?: string;
    observacao?: string;
    usuario?: {
      nome: string;
    };
  }>;
  periodo: {
    dataInicio: Date;
    dataFim: Date;
  };
  podeEditar: boolean;
  visaoConsolidada: boolean;
  tiposAusencia: Record<string, { label: string; color: string }>;
  onAdicionarFolga: (folga: { data_folga: string; tipo: string; observacao: string }) => void;
  onRemoverFolga: (folgaId: number) => void;
}

export function PainelRegistroAusencia({
  folgas,
  periodo,
  podeEditar,
  visaoConsolidada,
  tiposAusencia,
  onAdicionarFolga,
  onRemoverFolga
}: PainelRegistroAusenciaProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novaFolga, setNovaFolga] = useState({
    data_folga: '',
    tipo: '',
    observacao: ''
  });

  // Função para extrair tipo da observação
  const extrairTipoDaObservacao = (observacao?: string) => {
    if (!observacao) return 'folga';
    const match = observacao.match(/\[Tipo:\s*(\w+)\]/);
    return match ? match[1] : 'folga';
  };

  const handleAdicionarFolga = () => {
    if (!novaFolga.data_folga || !novaFolga.tipo) return;
    
    onAdicionarFolga(novaFolga);
    setDialogOpen(false);
    setNovaFolga({ data_folga: '', tipo: '', observacao: '' });
  };

  return (
    <div className="w-80 space-y-4">
      {/* Botão de Registrar Ausência */}
      {podeEditar && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Ausência
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nova Ausência</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="data">Data da Ausência</Label>
                <Input
                  id="data"
                  type="date"
                  value={novaFolga.data_folga}
                  onChange={(e) => setNovaFolga({...novaFolga, data_folga: e.target.value})}
                  min={format(periodo.dataInicio, 'yyyy-MM-dd')}
                  max={format(periodo.dataFim, 'yyyy-MM-dd')}
                />
              </div>
              
              <div>
                <Label htmlFor="tipo">Tipo de Ausência</Label>
                <Select value={novaFolga.tipo} onValueChange={(value) => setNovaFolga({...novaFolga, tipo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tiposAusencia).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="observacao">Observação (opcional)</Label>
                <Textarea
                  id="observacao"
                  value={novaFolga.observacao}
                  onChange={(e) => setNovaFolga({...novaFolga, observacao: e.target.value})}
                  placeholder="Detalhes adicionais..."
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAdicionarFolga}>
                  Registrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Lista de Ausências Registradas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {visaoConsolidada ? "Todas as Ausências" : "Ausências Registradas"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {folgas.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma ausência registrada neste período.</p>
              </div>
            ) : (
              folgas.map(folga => {
                const tipoExtraido = extrairTipoDaObservacao(folga.observacao);
                const tipoInfo = tiposAusencia[tipoExtraido as keyof typeof tiposAusencia] || tiposAusencia.folga;
                return (
                  <div key={folga.folga_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${tipoInfo.color}`}></div>
                        <span className="font-medium text-sm">
                          {format(parseISO(folga.data_folga), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      {visaoConsolidada && folga.usuario && (
                        <div className="text-xs text-muted-foreground mb-1">
                          {folga.usuario.nome}
                        </div>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {tipoInfo.label}
                      </Badge>
                      {folga.observacao && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {folga.observacao.replace(/\[Tipo:\s*\w+\]/, '').trim()}
                        </div>
                      )}
                    </div>
                    
                    {podeEditar && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoverFolga(folga.folga_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}