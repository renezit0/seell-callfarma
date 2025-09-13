/**
 * Sistema padronizado de tipos de usuário para toda a aplicação
 */

export type UserType = 
  | 'lider'
  | 'sublider'
  | 'subgerente'
  | 'gerente'
  | 'admin'
  | 'auxiliar'
  | 'aux1'
  | 'aux_conveniencia'
  | 'consultora'
  | 'farmaceutico'
  | 'compras'
  | 'supervisor';

/**
 * Função para obter descrição amigável do tipo de usuário
 */
export function getDescricaoTipoUsuario(tipo: string): string {
  const descricoes: Record<string, string> = {
    'lider': 'Gerente Loja',
    'sublider': 'Auxiliar de Farmácia II - SUB',
    'subgerente': 'Farmacêutico - SUB',
    'gerente': 'Gerente',
    'admin': 'Administrador',
    'auxiliar': 'Auxiliar de Farmácia II',
    'aux1': 'Auxiliar de Farmácia I',
    'aux_conveniencia': 'Auxiliar de Farmácia - Conveniência',
    'consultora': 'Consultora de Beleza',
    'farmaceutico': 'Farmacêutico',
    'compras': 'Compras',
    'supervisor': 'Supervisor'
  };
  
  return descricoes[tipo] ?? tipo.charAt(0).toUpperCase() + tipo.slice(1);
}

/**
 * Função para obter cor do badge baseado no tipo de usuário
 */
export function getCorTipoUsuario(tipo: string): string {
  const cores: Record<string, string> = {
    'admin': 'bg-red-500 hover:bg-red-600 text-white border-0',
    'gerente': 'bg-gray-900 hover:bg-gray-800 text-white border-0',
    'lider': 'bg-gray-900 hover:bg-gray-800 text-white border-0',
    'subgerente': 'bg-cyan-600 hover:bg-cyan-700 text-white border-0',
    'farmaceutico': 'bg-cyan-500 hover:bg-cyan-600 text-white border-0',
    'sublider': 'bg-blue-600 hover:bg-blue-700 text-white border-0',
    'auxiliar': 'bg-blue-500 hover:bg-blue-600 text-white border-0',
    'aux1': 'bg-blue-400 hover:bg-blue-500 text-white border-0',
    'aux_conveniencia': 'bg-orange-500 hover:bg-orange-600 text-white border-0',
    'consultora': 'bg-pink-500 hover:bg-pink-600 text-white border-0',
    'compras': 'bg-purple-600 hover:bg-purple-700 text-white border-0',
    'supervisor': 'bg-indigo-600 hover:bg-indigo-700 text-white border-0'
  };
  
  return cores[tipo] || 'bg-gray-500 hover:bg-gray-600 text-white border-0';
}

/**
 * Função para obter todos os tipos de usuário disponíveis
 */
export function getTiposUsuario() {
  return [
    { value: 'admin', label: 'Administrador' },
    { value: 'gerente', label: 'Gerente' },
    { value: 'lider', label: 'Gerente Loja' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'compras', label: 'Compras' },
    { value: 'subgerente', label: 'Farmacêutico - SUB' },
    { value: 'farmaceutico', label: 'Farmacêutico' },
    { value: 'sublider', label: 'Auxiliar de Farmácia II - SUB' },
    { value: 'auxiliar', label: 'Auxiliar de Farmácia II' },
    { value: 'aux1', label: 'Auxiliar de Farmácia I' },
    { value: 'aux_conveniencia', label: 'Auxiliar de Farmácia - Conveniência' },
    { value: 'consultora', label: 'Consultora de Beleza' }
  ];
}

/**
 * Função para verificar se é um tipo de usuário com permissões administrativas
 */
export function isUserTypeAdmin(tipo: string): boolean {
  return ['admin', 'gerente', 'lider', 'compras', 'supervisor'].includes(tipo);
}

/**
 * Função para verificar se é um tipo de usuário farmacêutico
 */
export function isUserTypeFarmaceutico(tipo: string): boolean {
  return ['farmaceutico', 'subgerente'].includes(tipo);
}