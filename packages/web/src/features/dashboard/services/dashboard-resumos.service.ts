import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';
import { labelOrNaoInformado } from '@/shared/reports/labels';

import type {
  DashboardResumosContract,
  DimensaoResumoRow,
  PainelResumosPorDimensao,
} from '../dashboard.contract';
import {
  dashboardResumosRepository,
  type DashboardResumosRepository,
  type RawResumo,
} from '../repositories/dashboard-resumos.repository';

function toRows(raw: RawResumo[]): DimensaoResumoRow[] {
  return raw.map((r) => ({ chave: labelOrNaoInformado(r.chave), faturamento: r.faturamento }));
}

export class DashboardResumosService implements DashboardResumosContract {
  constructor(
    private readonly repository: DashboardResumosRepository = dashboardResumosRepository,
  ) {}

  async getResumosPorDimensao(period: ReportFilter = {}): Promise<PainelResumosPorDimensao> {
    const raw = await this.repository.findResumosPorDimensao(period);

    return {
      loja: toRows(raw.loja),
      linha: toRows(raw.linha),
      familia: toRows(raw.familia),
      grupo: toRows(raw.grupo),
      marca: toRows(raw.marca),
      tipoPreco: toRows(raw.tipoPreco),
    };
  }
}

export const dashboardResumosService = new DashboardResumosService();
