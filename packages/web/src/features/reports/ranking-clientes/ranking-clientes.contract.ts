import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';

/** Uma linha do ranking de clientes (Story 3.1, AC1/AC3). */
export type RankingClientesRow = {
  /** Posição 1-based no ranking, já ordenado por faturamento decrescente. */
  posicao: number;
  cliente: string;
  faturamento: number;
};

export interface RankingClientesContract {
  /**
   * Ranking de clientes por faturamento, decrescente (AC1). Clientes nulos
   * são excluídos (ver Dev Notes da story — não é dimensão a agrupar, é
   * ausência de dado que invalidaria a posição).
   */
  getRanking(filter?: ReportFilter): Promise<RankingClientesRow[]>;
}
