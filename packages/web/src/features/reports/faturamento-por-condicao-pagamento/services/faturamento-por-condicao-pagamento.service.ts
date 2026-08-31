import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';
import { labelOrNaoInformado } from '@/shared/reports/labels';

import type {
  FaturamentoPorCondicaoPagamentoContract,
  FaturamentoPorCondicaoPagamentoRow,
} from '../faturamento-por-condicao-pagamento.contract';
import {
  faturamentoPorCondicaoPagamentoRepository,
  type FaturamentoPorCondicaoPagamentoRepository,
} from '../repositories/faturamento-por-condicao-pagamento.repository';

export class FaturamentoPorCondicaoPagamentoService
  implements FaturamentoPorCondicaoPagamentoContract
{
  constructor(
    private readonly repository: FaturamentoPorCondicaoPagamentoRepository = faturamentoPorCondicaoPagamentoRepository,
  ) {}

  async getFaturamentoPorCondicao(
    filter: ReportFilter = {},
  ): Promise<FaturamentoPorCondicaoPagamentoRow[]> {
    const groups = await this.repository.findAgrupadoPorCondicao(filter);

    return groups.map((g) => ({
      condicaoPagamento: labelOrNaoInformado(g.condicaoPagamento),
      faturamento: g.faturamento,
    }));
  }
}

export const faturamentoPorCondicaoPagamentoService =
  new FaturamentoPorCondicaoPagamentoService();
