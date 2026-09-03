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

/** Uma linha de resumo (Grupo ou Loja), sem o detalhe de Item/Marca/Tipo de Preço. */
export type RawResumo = { chave: string | null; quantidade: number; faturamento: number };

/** Valores distintos existentes no dado, para popular os seletores do filtro. */
export type OpcoesDeFiltro = {
  lojas: string[];
  marcas: string[];
  grupos: string[];
  familias: string[];
  linhas: string[];
  tiposPreco: string[];
};

export interface VendasPorItemRepository {
  findAgrupadoPorItem(filter: ReportFilter): Promise<RawGroup[]>;
  findAgrupadoPorItemELoja(filter: ReportFilter): Promise<RawGroupWithLoja[]>;
  findResumoPorGrupo(filter: ReportFilter): Promise<RawResumo[]>;
  findResumoPorLoja(filter: ReportFilter): Promise<RawResumo[]>;
  /** Não recebe `ReportFilter`: as opções são sempre todos os valores existentes na tabela, não só no período filtrado — evita um seletor que muda de opções a cada filtro aplicado. */
  findOpcoesDeFiltro(): Promise<OpcoesDeFiltro>;
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

  async findResumoPorGrupo(filter: ReportFilter): Promise<RawResumo[]> {
    const prisma = this.resolveClient();

    const groups = await prisma.salesEntry.groupBy({
      by: ['grupo'],
      where: buildSalesEntryWhere(filter),
      _sum: { quantidade: true, valorTotal: true },
      orderBy: { _sum: { valorTotal: 'desc' } },
    });

    return groups.map((g) => ({
      chave: g.grupo,
      quantidade: g._sum.quantidade?.toNumber() ?? 0,
      faturamento: g._sum.valorTotal?.toNumber() ?? 0,
    }));
  }

  async findResumoPorLoja(filter: ReportFilter): Promise<RawResumo[]> {
    const prisma = this.resolveClient();

    const groups = await prisma.salesEntry.groupBy({
      by: ['loja'],
      where: buildSalesEntryWhere(filter),
      _sum: { quantidade: true, valorTotal: true },
      orderBy: { _sum: { valorTotal: 'desc' } },
    });

    return groups.map((g) => ({
      chave: g.loja,
      quantidade: g._sum.quantidade?.toNumber() ?? 0,
      faturamento: g._sum.valorTotal?.toNumber() ?? 0,
    }));
  }

  async findOpcoesDeFiltro(): Promise<OpcoesDeFiltro> {
    const prisma = this.resolveClient();

    const [lojas, marcas, grupos, familias, linhas, tiposPreco] = await Promise.all([
      prisma.salesEntry.groupBy({ by: ['loja'], where: { loja: { not: null } } }),
      prisma.salesEntry.groupBy({ by: ['marca'], where: { marca: { not: null } } }),
      prisma.salesEntry.groupBy({ by: ['grupo'], where: { grupo: { not: null } } }),
      prisma.salesEntry.groupBy({ by: ['familia'], where: { familia: { not: null } } }),
      prisma.salesEntry.groupBy({ by: ['linha'], where: { linha: { not: null } } }),
      prisma.salesEntry.groupBy({ by: ['tipoPreco'], where: { tipoPreco: { not: null } } }),
    ]);

    const toSortedList = (values: (string | null)[]): string[] =>
      values.filter((v): v is string => v !== null).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return {
      lojas: toSortedList(lojas.map((g) => g.loja)),
      marcas: toSortedList(marcas.map((g) => g.marca)),
      grupos: toSortedList(grupos.map((g) => g.grupo)),
      familias: toSortedList(familias.map((g) => g.familia)),
      linhas: toSortedList(linhas.map((g) => g.linha)),
      tiposPreco: toSortedList(tiposPreco.map((g) => g.tipoPreco)),
    };
  }
}

export const vendasPorItemRepository = new PrismaVendasPorItemRepository();
