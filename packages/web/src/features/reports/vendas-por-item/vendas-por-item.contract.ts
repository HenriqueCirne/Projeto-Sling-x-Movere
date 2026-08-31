import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';

/** Uma linha de "Vendas por Item" (Story 2.2, AC1). */
export type VendasPorItemRow = {
  familia: string;
  grupo: string;
  item: string;
  quantidade: number;
};

/** Mesma linha, com a dimensão Loja (Story 2.3, AC1). */
export type VendasPorItemPorLojaRow = VendasPorItemRow & { loja: string };

export interface VendasPorItemContract {
  /** Agrupado por Família/Grupo/Item, ordenado por quantidade decrescente (AC3 da 2.2). */
  getPorItem(filter?: ReportFilter): Promise<VendasPorItemRow[]>;
  /** Mesma visão com a dimensão Loja (Story 2.3). */
  getPorItemPorLoja(filter?: ReportFilter): Promise<VendasPorItemPorLojaRow[]>;
}
