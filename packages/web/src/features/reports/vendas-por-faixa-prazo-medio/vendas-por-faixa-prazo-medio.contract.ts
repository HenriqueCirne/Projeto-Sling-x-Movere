import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';

import type { VendasPorFaixaPrazoMedioRow } from './faixa-prazo-medio';

export type { VendasPorFaixaPrazoMedioRow };

/** "Vendas por Faixa de Prazo Médio" (Story 2.4, FR5). */
export interface VendasPorFaixaPrazoMedioContract {
  getVendasPorFaixa(filter?: ReportFilter): Promise<VendasPorFaixaPrazoMedioRow[]>;
}
