import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';

/** Uma linha de "Faturamento por Condição de Pagamento" (Story 2.5, AC1). */
export type FaturamentoPorCondicaoPagamentoRow = {
  condicaoPagamento: string;
  faturamento: number;
};

export interface FaturamentoPorCondicaoPagamentoContract {
  getFaturamentoPorCondicao(
    filter?: ReportFilter,
  ): Promise<FaturamentoPorCondicaoPagamentoRow[]>;
}
