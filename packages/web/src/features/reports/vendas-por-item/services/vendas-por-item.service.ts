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
      linha: labelOrNaoInformado(g.linha),
      familia: labelOrNaoInformado(g.familia),
      grupo: labelOrNaoInformado(g.grupo),
      marca: labelOrNaoInformado(g.marca),
      item: labelOrNaoInformado(g.item),
      tipoPreco: labelOrNaoInformado(g.tipoPreco),
      quantidade: g.quantidade,
      faturamento: g.faturamento,
    }));
  }

  async getPorItemPorLoja(filter: ReportFilter = {}): Promise<VendasPorItemPorLojaRow[]> {
    const groups = await this.repository.findAgrupadoPorItemELoja(filter);

    return groups.map((g) => ({
      loja: labelOrNaoInformado(g.loja),
      linha: labelOrNaoInformado(g.linha),
      familia: labelOrNaoInformado(g.familia),
      grupo: labelOrNaoInformado(g.grupo),
      marca: labelOrNaoInformado(g.marca),
      item: labelOrNaoInformado(g.item),
      tipoPreco: labelOrNaoInformado(g.tipoPreco),
      quantidade: g.quantidade,
      faturamento: g.faturamento,
    }));
  }
}

export const vendasPorItemService = new VendasPorItemService();
