import type { TipoPrecoLojaItemRow } from './tipo-preco-loja-item.contract';

export type DimensaoFoco = 'tipoPreco' | 'loja' | 'item';

/**
 * Reordena as linhas do cruzamento colocando a dimensão de foco como chave
 * primária de agrupamento visual (Story 3.2, AC2 — "seletor permite escolher
 * a dimensão de foco"). Pura, sem dependências, para rodar no toggle
 * client-side sem novo request — mesmo padrão da 2.1.
 */
export function sortByFoco(rows: TipoPrecoLojaItemRow[], foco: DimensaoFoco): TipoPrecoLojaItemRow[] {
  return [...rows].sort((a, b) => {
    const chave = a[foco].localeCompare(b[foco]);
    if (chave !== 0) return chave;
    return b.faturamento - a.faturamento;
  });
}
