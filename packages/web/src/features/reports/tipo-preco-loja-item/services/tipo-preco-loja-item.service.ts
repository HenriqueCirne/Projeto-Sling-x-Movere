import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';
import { labelOrNaoInformado } from '@/shared/reports/labels';

import type {
  TipoPrecoLojaItemContract,
  TipoPrecoLojaItemRow,
} from '../tipo-preco-loja-item.contract';
import {
  tipoPrecoLojaItemRepository,
  type TipoPrecoLojaItemRepository,
} from '../repositories/tipo-preco-loja-item.repository';

export class TipoPrecoLojaItemService implements TipoPrecoLojaItemContract {
  constructor(
    private readonly repository: TipoPrecoLojaItemRepository = tipoPrecoLojaItemRepository,
  ) {}

  async getCruzamento(filter: ReportFilter = {}): Promise<TipoPrecoLojaItemRow[]> {
    const groups = await this.repository.findCruzamento(filter);

    return groups.map((g) => ({
      tipoPreco: labelOrNaoInformado(g.tipoPreco),
      loja: labelOrNaoInformado(g.loja),
      item: labelOrNaoInformado(g.item),
      faturamento: g.faturamento,
      quantidade: g.quantidade,
    }));
  }
}

export const tipoPrecoLojaItemService = new TipoPrecoLojaItemService();
