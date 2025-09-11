/**
 * Sistema padronizado de categorias para toda a aplicação
 */

export type CategoryType = 
  | 'geral'
  | 'generico_similar' 
  | 'goodlife'
  | 'saude'
  | 'dermocosmetico'
  | 'perfumaria_alta'
  | 'perfumaria_r_mais'
  | 'conveniencia'
  | 'conveniencia_r_mais'
  | 'r_mais';

/**
 * Função para obter nome amigável da categoria
 */
export function getNomeCategoria(categoria: string): string {
  const nomes: Record<string, string> = {
    'geral': 'Venda Geral',
    'generico_similar': 'Genérico & Similar',
    'goodlife': 'GoodLife',
    'saude': 'GoodLife',
    'dermocosmetico': 'Dermocosméticos',
    'perfumaria_alta': 'Perfumaria Alta Rentabilidade',
    'perfumaria_r_mais': 'Perfumaria Alta Rentabilidade',
    'conveniencia': 'Conveniência',
    'conveniencia_r_mais': 'Conveniência Alta Rentabilidade',
    'r_mais': 'Rentáveis'
  };
  
  return nomes[categoria] ?? categoria.charAt(0).toUpperCase() + categoria.slice(1);
}

/**
 * Função para obter ícone da categoria
 */
export function getIconeCategoria(categoria: string): string {
  const icones: Record<string, string> = {
    'geral': 'fas fa-store',
    'generico_similar': 'fas fa-pills',
    'goodlife': 'fas fa-heartbeat',
    'saude': 'fas fa-heartbeat',
    'dermocosmetico': 'fas fa-spa',
    'perfumaria_alta': 'fas fa-spray-can',
    'perfumaria_r_mais': 'fas fa-spray-can',
    'conveniencia': 'fas fa-shopping-basket',
    'conveniencia_r_mais': 'fas fa-shopping-basket',
    'r_mais': 'fas fa-chart-pie'
  };
  
  return icones[categoria] ?? 'fas fa-tag';
}

/**
 * Função para obter cor da categoria (hex)
 */
export function getCorCategoria(categoria: string): string {
  const cores: Record<string, string> = {
    'geral': '#1565c0',
    'generico_similar': '#e74a3b',
    'goodlife': '#28a745',
    'saude': '#28a745',
    'dermocosmetico': '#f6c23e',
    'perfumaria_alta': '#8e44ad',
    'perfumaria_r_mais': '#8e44ad',
    'conveniencia': '#fd7e14',
    'conveniencia_r_mais': '#fd7e14',
    'r_mais': '#e74a3b'
  };
  
  return cores[categoria] ?? '#6b7280';
}

/**
 * Função para obter classe CSS da cor da categoria
 */
export function getClasseCorCategoria(categoria: string): string {
  const classes: Record<string, string> = {
    'geral': 'text-blue-700',
    'generico_similar': 'text-red-600',
    'goodlife': 'text-green-600',
    'saude': 'text-green-600',
    'dermocosmetico': 'text-yellow-600',
    'perfumaria_alta': 'text-purple-600',
    'perfumaria_r_mais': 'text-purple-600',
    'conveniencia': 'text-orange-600',
    'conveniencia_r_mais': 'text-orange-600',
    'r_mais': 'text-red-600'
  };
  
  return classes[categoria] ?? 'text-gray-600';
}

/**
 * Função para obter classe CSS do background da categoria
 */
export function getClasseBgCategoria(categoria: string): string {
  const classes: Record<string, string> = {
    'geral': 'bg-blue-100',
    'generico_similar': 'bg-red-100',
    'goodlife': 'bg-green-100',
    'saude': 'bg-green-100',
    'dermocosmetico': 'bg-yellow-100',
    'perfumaria_alta': 'bg-purple-100',
    'perfumaria_r_mais': 'bg-purple-100',
    'conveniencia': 'bg-orange-100',
    'conveniencia_r_mais': 'bg-orange-100',
    'r_mais': 'bg-red-100'
  };
  
  return classes[categoria] ?? 'bg-gray-100';
}

/**
 * Função para obter classe CSS da borda da categoria
 */
export function getClasseBordaCategoria(categoria: string): string {
  const classes: Record<string, string> = {
    'geral': 'border-blue-200',
    'generico_similar': 'border-red-200',
    'goodlife': 'border-green-200',
    'saude': 'border-green-200',
    'dermocosmetico': 'border-yellow-200',
    'perfumaria_alta': 'border-purple-200',
    'perfumaria_r_mais': 'border-purple-200',
    'conveniencia': 'border-orange-200',
    'conveniencia_r_mais': 'border-orange-200',
    'r_mais': 'border-red-200'
  };
  
  return classes[categoria] ?? 'border-gray-200';
}