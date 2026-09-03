import type { PrismaClient } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';
import { buildSalesEntryWhere } from '@/shared/report-filters/sales-entry-where';

export type RawGroup = {
  linha: string | null;
  familia: string | null;
  grupo: string | null;
  marca: string | null;
  item: string | null;
  tipoPreco: string | null;
  quantidade: number;
  faturamento: number;
};

export type RawGroupWithLoja = RawGroup & { loja: string | null };

export interface VendasPorItemRepository {
  findAgrupadoPorItem(filter: ReportFilter): Promise<RawGroup[]>;
  findAgrupadoPorItemELoja(filter: ReportFilter): Promise<RawGroupWithLoja[]>;
}

export class PrismaVendasPorItemRepository implements VendasPorItemRepository {
  constructor(private readonly resolveClient: () => PrismaClient = getPrismaClient) {}

  async findAgrupadoPorItem(filter: ReportFilter): Promise<RawGroup[]> {
    const prisma = this.resolveClient();

    const groups = await prisma.salesEntry.groupBy({
      by: ['linha', 'familia', 'grupo', 'marca', 'item', 'tipoPreco'],
      where: buildSalesEntryWhere(filter),
      _sum: { quantidade: true, valorTotal: true },
      orderBy: { _sum: { quantidade: 'desc' } },
    });

    return groups.map((g) => ({
      linha: g.linha,
      familia: g.familia,
      grupo: g.grupo,
      marca: g.marca,
      item: g.item,
      tipoPreco: g.tipoPreco,
      quantidade: g._sum.quantidade?.toNumber() ?? 0,
      faturamento: g._sum.valorTotal?.toNumber() ?? 0,
    }));
  }

  async findAgrupadoPorItemELoja(filter: ReportFilter): Promise<RawGroupWithLoja[]> {
    const prisma = this.resolveClient();

    const groups = await prisma.salesEntry.groupBy({
      by: ['loja', 'linha', 'familia', 'grupo', 'marca', 'item', 'tipoPreco'],
      where: buildSalesEntryWhere(filter),
      _sum: { quantidade: true, valorTotal: true },
      orderBy: { _sum: { quantidade: 'desc' } },
    });

    return groups.map((g) => ({
      loja: g.loja,
      linha: g.linha,
      familia: g.familia,
      grupo: g.grupo,
      marca: g.marca,
      item: g.item,
      tipoPreco: g.tipoPreco,
      quantidade: g._sum.quantidade?.toNumber() ?? 0,
      faturamento: g._sum.valorTotal?.toNumber() ?? 0,
    }));
  }
}

export const vendasPorItemRepository = new PrismaVendasPorItemRepository();
