import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';
import { labelOrNaoInformado } from '@/shared/reports/labels';

import type {
  DesempenhoAtendenteContract,
  DesempenhoAtendenteRow,
} from '../desempenho-atendente.contract';
import {
  desempenhoAtendenteRepository,
  type DesempenhoAtendenteRepository,
} from '../repositories/desempenho-atendente.repository';

export class DesempenhoAtendenteService implements DesempenhoAtendenteContract {
  constructor(
    private readonly repository: DesempenhoAtendenteRepository = desempenhoAtendenteRepository,
  ) {}

  async getDesempenho(filter: ReportFilter = {}): Promise<DesempenhoAtendenteRow[]> {
    const groups = await this.repository.findAgrupadoPorAtendente(filter);

    return groups.map((g, index) => ({
      atendente: labelOrNaoInformado(g.atendente),
      faturamento: g.faturamento,
      quantidade: g.quantidade,
      // O repositório já ordena por faturamento decrescente — o "melhor
      // desempenho" (AC2) é sempre o primeiro, nunca uma segunda comparação.
      melhorDesempenho: index === 0,
    }));
  }
}

export const desempenhoAtendenteService = new DesempenhoAtendenteService();
