import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Store, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Loja {
  id: number;
  nome: string;
  numero: string;
  regiao: string;
}

interface StoreSelectorProps {
  selectedLojaId: number | null;
  onLojaChange: (lojaId: number | null) => void;
  userLojaId: number;
}

export function StoreSelector({ selectedLojaId, onLojaChange, userLojaId }: StoreSelectorProps) {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLojas();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  

  const fetchLojas = async () => {
    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('id, nome, numero, regiao')
        .neq('numero', '00')
        .neq('id', 99)
        .order('numero');

      if (error) throw error;
      
      // Sort by numero (converted to number for proper sorting)
      const sortedLojas = (data || []).sort((a, b) => {
        const numA = parseInt(a.numero) || 0;
        const numB = parseInt(b.numero) || 0;
        return numA - numB;
      });
      
      setLojas(sortedLojas);
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedLoja = selectedLojaId 
    ? lojas.find(loja => loja.id === selectedLojaId)
    : lojas.find(loja => loja.id === userLojaId);

  const filteredLojas = lojas.filter(loja => {
    const searchLower = searchTerm.toLowerCase();
    return (
      loja.nome.toLowerCase().includes(searchLower) ||
      loja.numero.toLowerCase().includes(searchLower)
    );
  });

  const handleToggle = () => {
    const opening = !isOpen
    setIsOpen(opening)
    if (opening) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  };

  const handleLojaSelect = (loja: Loja | null) => {
    if (loja === null) {
      // Selecionar "Todas as Lojas"
      onLojaChange(null);
    } else {
      onLojaChange(loja.id === userLojaId ? null : loja.id);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span className="text-sm text-muted-foreground">Carregando lojas...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={handleToggle}
        variant="outline"
        className={cn(
          "relative overflow-hidden transition-all duration-200 ease-out flex items-center gap-2",
          "bg-success text-white border-0 px-4 py-2.5 rounded-lg cursor-pointer text-sm font-medium",
          "hover:bg-[#45a049] hover:text-white hover:shadow-[0_4px_10px_rgba(0,0,0,0.15)]",
          "shadow-[0_2px_5px_rgba(0,0,0,0.1)]"
        )}
      >
        <Store className="w-4 h-4 mr-2" />
        <span className="font-medium text-sm sm:text-base truncate">
          {selectedLoja ? `${selectedLoja.numero} - ${selectedLoja.nome.toUpperCase()}` : 'Todas as Lojas'}
        </span>
        <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[999]" onClick={() => setIsOpen(false)} />
      )}
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-2xl z-[1000] animate-in slide-in-from-top-2">
          <div className="p-2 sm:p-3 border-b border-border bg-popover">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por nome ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm bg-background"
              />
            </div>
          </div>

          <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto bg-popover">
            {/* Opção "Todas as Lojas" */}
            <div className="p-2 bg-popover">
              <button
                onClick={() => handleLojaSelect(null)}
                className={cn(
                  "w-full text-left px-2 sm:px-3 py-2 rounded-md transition-colors hover:bg-accent mb-2",
                  selectedLojaId === null && !selectedLoja && "bg-primary/10 text-primary font-medium"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm sm:text-base">Todas as Lojas</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Ver dados de todas as lojas</div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                    Global
                  </Badge>
                </div>
              </button>
            </div>

            {/* Opção "Minha Loja" */}
            <div className="p-2 bg-popover">
              <button
                onClick={() => handleLojaSelect(lojas.find(l => l.id === userLojaId)!)}
                className={cn(
                  "w-full text-left px-2 sm:px-3 py-2 rounded-md transition-colors hover:bg-accent",
                  selectedLojaId === null && selectedLoja && "bg-primary/10 text-primary font-medium"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base truncate">
                      {selectedLoja?.numero} - {selectedLoja?.nome.toUpperCase()}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Minha Loja</div>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs ml-2">
                    Principal
                  </Badge>
                </div>
              </button>
            </div>

            {/* Separador */}
            <div className="px-2 sm:px-3 py-2 text-xs text-muted-foreground font-medium border-b border-border bg-popover">
              OUTRAS LOJAS
            </div>

            {/* Lojas */}
            <div className="p-2 bg-popover">
              {filteredLojas.map((loja) => (
                <button
                  key={loja.id}
                  onClick={() => handleLojaSelect(loja)}
                  className={cn(
                    "w-full text-left px-2 sm:px-3 py-2 rounded-md transition-colors hover:bg-accent mb-1",
                    selectedLojaId === loja.id && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base truncate">
                        {loja.numero} - {loja.nome.toUpperCase()}
                      </div>
                    </div>
                    {loja.id === userLojaId && (
                      <Badge variant="outline" className="text-xs ml-2">
                        Sua loja
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {filteredLojas.length === 0 && (
              <div className="p-4 sm:p-6 text-center text-muted-foreground bg-popover">
                <Store className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma loja encontrada</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}