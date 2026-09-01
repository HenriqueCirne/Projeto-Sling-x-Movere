import type { PrismaClient } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';
import { buildSalesEntryWhere } from '@/shared/report-filters/sales-entry-where';

export type RawGroup = {
  tipoPreco: string | null;
  loja: string | null;
  item: string | null;
  faturamento: number;
  quantidade: number;
};

export interface TipoPrecoLojaItemRepository {
  findCruzamento(filter: ReportFilter): Promise<RawGroup[]>;
}

export class PrismaTipoPrecoLojaItemRepository implements TipoPrecoLojaItemRepository {
  constructor(private readonly resolveClient: () => PrismaClient = getPrismaClient) {}

  async findCruzamento(filter: ReportFilter): Promise<RawGroup[]> {
    const prisma = this.resolveClient();

    const groups = await prisma.salesEntry.groupBy({
      by: ['tipoPreco', 'loja', 'item'],
      where: buildSalesEntryWhere(filter),
      _sum: { valorTotal: true, quantidade: true },
      orderBy: { _sum: { valorTotal: 'desc' } },
    });

    return groups.map((g) => ({
      tipoPreco: g.tipoPreco,
      loja: g.loja,
      item: g.item,
      faturamento: g._sum.valorTotal?.toNumber() ?? 0,
      quantidade: g._sum.quantidade?.toNumber() ?? 0,
    }));
  }
}

export const tipoPrecoLojaItemRepository = new PrismaTipoPrecoLojaItemRepository();
