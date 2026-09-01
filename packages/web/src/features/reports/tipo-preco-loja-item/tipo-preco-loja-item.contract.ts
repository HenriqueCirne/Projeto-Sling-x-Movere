import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';

/** Uma linha do cruzamento Tipo de Preço × Loja × Item (Story 3.2, AC1). */
export type TipoPrecoLojaItemRow = {
  tipoPreco: string;
  loja: string;
  item: string;
  faturamento: number;
  quantidade: number;
};

export interface TipoPrecoLojaItemContract {
  getCruzamento(filter?: ReportFilter): Promise<TipoPrecoLojaItemRow[]>;
}
