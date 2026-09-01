import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';

import type { RankingClientesContract, RankingClientesRow } from '../ranking-clientes.contract';
import {
  rankingClientesRepository,
  type RankingClientesRepository,
} from '../repositories/ranking-clientes.repository';

export class RankingClientesService implements RankingClientesContract {
  constructor(
    private readonly repository: RankingClientesRepository = rankingClientesRepository,
  ) {}

  async getRanking(filter: ReportFilter = {}): Promise<RankingClientesRow[]> {
    const groups = await this.repository.findAgrupadoPorCliente(filter);

    // Posição é o índice (1-based) do array já ordenado pelo repositório —
    // não uma segunda ordenação aqui, para nunca divergir da ordem real.
    return groups.map((g, index) => ({
      posicao: index + 1,
      cliente: g.cliente,
      faturamento: g.faturamento,
    }));
  }
}

export const rankingClientesService = new RankingClientesService();
