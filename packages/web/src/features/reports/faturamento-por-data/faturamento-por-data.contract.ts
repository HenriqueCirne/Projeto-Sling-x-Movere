import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';

/** Um ponto da série temporal de faturamento diário (Story 2.1, AC1). */
export type DailyRevenuePoint = {
  /** Data no formato `YYYY-MM-DD`, já ordenada ascendentemente. */
  data: string;
  faturamento: number;
};

/** Mesmo dado, agregado por mês (Story 2.1, AC2 — visão alternável). */
export type MonthlyRevenuePoint = {
  /** Mês no formato `YYYY-MM`. */
  mes: string;
  faturamento: number;
};

export interface FaturamentoPorDataContract {
  /** Série diária para o período/loja filtrados. */
  getSerieDiaria(filter?: ReportFilter): Promise<DailyRevenuePoint[]>;
}
