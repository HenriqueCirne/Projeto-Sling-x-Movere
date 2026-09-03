import type { PrismaClient } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';
import { buildSalesEntryWhere } from '@/shared/report-filters/sales-entry-where';

/**
 * Limite de barras por gráfico — `Grupo` sozinho tem ~80 valores distintos
 * no dado real (`Marca`/`Família` também dezenas), inviável num gráfico de
 * barras sem recorte. As maiores por faturamento primeiro.
 */
const TOP_N = 8;

export type RawResumo = { chave: string | null; faturamento: number };

export type RawResumosPorDimensao = {
  loja: RawResumo[];
  linha: RawResumo[];
  familia: RawResumo[];
  grupo: RawResumo[];
  marca: RawResumo[];
  tipoPreco: RawResumo[];
};

export interface DashboardResumosRepository {
  findResumosPorDimensao(filter: ReportFilter): Promise<RawResumosPorDimensao>;
}

export class PrismaDashboardResumosRepository implements DashboardResumosRepository {
  constructor(private readonly resolveClient: () => PrismaClient = getPrismaClient) {}

  async findResumosPorDimensao(filter: ReportFilter): Promise<RawResumosPorDimensao> {
    const prisma = this.resolveClient();
    const where = buildSalesEntryWhere(filter);

    // Uma query por dimensão (não uma genérica parametrizada por nome de
    // campo): `groupBy` do Prisma exige o campo de agrupamento como literal
    // de tipo para type-check `_sum`/`orderBy`/o resultado — mesma escolha já
    // feita em `vendas-por-item.repository.ts`
    // (findResumoPorGrupo/findResumoPorLoja separados, não unificados).
    const [loja, linha, familia, grupo, marca, tipoPreco] = await Promise.all([
      prisma.salesEntry.groupBy({
        by: ['loja'],
        where,
        _sum: { valorTotal: true },
        orderBy: { _sum: { valorTotal: 'desc' } },
        take: TOP_N,
      }),
      prisma.salesEntry.groupBy({
        by: ['linha'],
        where,
        _sum: { valorTotal: true },
        orderBy: { _sum: { valorTotal: 'desc' } },
        take: TOP_N,
      }),
      prisma.salesEntry.groupBy({
        by: ['familia'],
        where,
        _sum: { valorTotal: true },
        orderBy: { _sum: { valorTotal: 'desc' } },
        take: TOP_N,
      }),
      prisma.salesEntry.groupBy({
        by: ['grupo'],
        where,
        _sum: { valorTotal: true },
        orderBy: { _sum: { valorTotal: 'desc' } },
        take: TOP_N,
      }),
      prisma.salesEntry.groupBy({
        by: ['marca'],
        where,
        _sum: { valorTotal: true },
        orderBy: { _sum: { valorTotal: 'desc' } },
        take: TOP_N,
      }),
      prisma.salesEntry.groupBy({
        by: ['tipoPreco'],
        where,
        _sum: { valorTotal: true },
        orderBy: { _sum: { valorTotal: 'desc' } },
        take: TOP_N,
      }),
    ]);

    return {
      loja: loja.map((g) => ({ chave: g.loja, faturamento: g._sum.valorTotal?.toNumber() ?? 0 })),
      linha: linha.map((g) => ({
        chave: g.linha,
        faturamento: g._sum.valorTotal?.toNumber() ?? 0,
      })),
      familia: familia.map((g) => ({
        chave: g.familia,
        faturamento: g._sum.valorTotal?.toNumber() ?? 0,
      })),
      grupo: grupo.map((g) => ({
        chave: g.grupo,
        faturamento: g._sum.valorTotal?.toNumber() ?? 0,
      })),
      marca: marca.map((g) => ({
        chave: g.marca,
        faturamento: g._sum.valorTotal?.toNumber() ?? 0,
      })),
      tipoPreco: tipoPreco.map((g) => ({
        chave: g.tipoPreco,
        faturamento: g._sum.valorTotal?.toNumber() ?? 0,
      })),
    };
  }
}

export const dashboardResumosRepository = new PrismaDashboardResumosRepository();
