import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';

/**
 * Uma linha de "Vendas por Item" (Story 2.2, AC1).
 *
 * `faturamento` foi adicionado depois do AC1 original (que só pedia
 * quantidade) a pedido direto do usuário/gestor — ver Change Log da Story
 * 2.2: "quais itens em quantidade e valor são os mais vendidos".
 */
export type VendasPorItemRow = {
  familia: string;
  grupo: string;
  item: string;
  quantidade: number;
  faturamento: number;
};

/** Mesma linha, com a dimensão Loja (Story 2.3, AC1). */
export type VendasPorItemPorLojaRow = VendasPorItemRow & { loja: string };

export interface VendasPorItemContract {
  /** Agrupado por Família/Grupo/Item, ordenado por quantidade decrescente (AC3 da 2.2). */
  getPorItem(filter?: ReportFilter): Promise<VendasPorItemRow[]>;
  /** Mesma visão com a dimensão Loja (Story 2.3). */
  getPorItemPorLoja(filter?: ReportFilter): Promise<VendasPorItemPorLojaRow[]>;
}
