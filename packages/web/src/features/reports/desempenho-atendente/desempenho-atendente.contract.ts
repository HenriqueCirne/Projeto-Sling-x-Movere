import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';

/** Uma linha de desempenho por atendente (Story 3.3, AC1/AC2). */
export type DesempenhoAtendenteRow = {
  atendente: string;
  quantidade: number;
  faturamento: number;
  /**
   * Maior faturamento do período (AC2) — critério igual ao de ordenação, sem
   * lógica duplicada: é sempre a primeira linha da lista já ordenada.
   */
  melhorDesempenho: boolean;
};

export interface DesempenhoAtendenteContract {
  getDesempenho(filter?: ReportFilter): Promise<DesempenhoAtendenteRow[]>;
}
