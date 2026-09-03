import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';
import { labelOrNaoInformado } from '@/shared/reports/labels';

import type {
  VendasPorItemContract,
  VendasPorItemPorLojaRow,
  VendasPorItemRow,
} from '../vendas-por-item.contract';
import {
  vendasPorItemRepository,
  type VendasPorItemRepository,
} from '../repositories/vendas-por-item.repository';

export class VendasPorItemService implements VendasPorItemContract {
  constructor(
    private readonly repository: VendasPorItemRepository = vendasPorItemRepository,
  ) {}

  async getPorItem(filter: ReportFilter = {}): Promise<VendasPorItemRow[]> {
    const groups = await this.repository.findAgrupadoPorItem(filter);

    return groups.map((g) => ({
      familia: labelOrNaoInformado(g.familia),
      grupo: labelOrNaoInformado(g.grupo),
      item: labelOrNaoInformado(g.item),
      quantidade: g.quantidade,
      faturamento: g.faturamento,
    }));
  }

  async getPorItemPorLoja(filter: ReportFilter = {}): Promise<VendasPorItemPorLojaRow[]> {
    const groups = await this.repository.findAgrupadoPorItemELoja(filter);

    return groups.map((g) => ({
      loja: labelOrNaoInformado(g.loja),
      familia: labelOrNaoInformado(g.familia),
      grupo: labelOrNaoInformado(g.grupo),
      item: labelOrNaoInformado(g.item),
      quantidade: g.quantidade,
      faturamento: g.faturamento,
    }));
  }
}

export const vendasPorItemService = new VendasPorItemService();
