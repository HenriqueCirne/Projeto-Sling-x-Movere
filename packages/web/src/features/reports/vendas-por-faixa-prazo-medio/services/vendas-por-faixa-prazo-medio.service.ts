import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';

import { groupByFaixaPrazoMedio } from '../faixa-prazo-medio';
import type {
  VendasPorFaixaPrazoMedioContract,
  VendasPorFaixaPrazoMedioRow,
} from '../vendas-por-faixa-prazo-medio.contract';
import {
  vendasPorFaixaPrazoMedioRepository,
  type VendasPorFaixaPrazoMedioRepository,
} from '../repositories/vendas-por-faixa-prazo-medio.repository';

export class VendasPorFaixaPrazoMedioService implements VendasPorFaixaPrazoMedioContract {
  constructor(
    private readonly repository: VendasPorFaixaPrazoMedioRepository = vendasPorFaixaPrazoMedioRepository,
  ) {}

  async getVendasPorFaixa(filter: ReportFilter = {}): Promise<VendasPorFaixaPrazoMedioRow[]> {
    const entries = await this.repository.findRawEntries(filter);
    return groupByFaixaPrazoMedio(entries);
  }
}

export const vendasPorFaixaPrazoMedioService = new VendasPorFaixaPrazoMedioService();
