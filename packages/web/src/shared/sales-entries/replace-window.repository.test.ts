import { describe, expect, it, vi } from 'vitest';

import type { SalesEntryRow } from './sales-entry.contract';
import { replaceSalesEntriesWindow, type SalesEntriesPrismaClient } from './replace-window.repository';

function row(overrides: Partial<SalesEntryRow> = {}): SalesEntryRow {
  return {
    tipo: 'VENDA',
    dataEmissao: new Date('2026-07-09T00:00:00.000Z'),
    quantidade: '2.000',
    preco: '775.00',
    valorTotal: '1550.00',
    prazoMedio: '45.00',
    loja: 'Loja 01',
    cliente: 'Cliente X',
    atendente: 'Atendente X',
    item: 'Pneu 175/65',
    familia: 'Familia X',
    grupo: 'Grupo X',
    marca: 'Marca X',
    linha: 'Linha X',
    tipoPreco: 'Padrão',
    condicaoPagamento: '6 - BOLETO',
    numeroDocumento: '897699',
    idLancamento: '1848158',
    ...overrides,
  };
}

function createFakePrisma(initialRows: SalesEntryRow[] = []) {
  let store = [...initialRows];
  const deleteMany = vi.fn(
    async (args: {
      where: { dataEmissao: { gte: Date; lte: Date }; loja?: string | null };
    }) => {
      const before = store.length;
      store = store.filter((entry) => {
        const inWindow =
          entry.dataEmissao >= args.where.dataEmissao.gte &&
          entry.dataEmissao <= args.where.dataEmissao.lte;
        const lojaMatches = args.where.loja === undefined || entry.loja === args.where.loja;
        return !(inWindow && lojaMatches);
      });
      return { count: before - store.length };
    },
  );
  const createMany = vi.fn(async (args: { data: SalesEntryRow[] }) => {
    store.push(...args.data);
    return { count: args.data.length };
  });

  const prisma: SalesEntriesPrismaClient = {
    $transaction: async (fn) => fn({ salesEntry: { deleteMany, createMany } }),
  };

  return { prisma, deleteMany, createMany, getStore: () => store };
}

describe('replaceSalesEntriesWindow', () => {
  it('lança erro se não houver linhas', async () => {
    const { prisma } = createFakePrisma();
    await expect(replaceSalesEntriesWindow([], prisma)).rejects.toThrow(/nenhuma linha/i);
  });

  it('sem loja: substitui só por data, entre lojas diferentes (comportamento da importação de planilha)', async () => {
    const lojaA = row({ loja: 'Loja A', dataEmissao: new Date('2026-07-09T00:00:00.000Z') });
    const lojaBForaDaJanela = row({
      loja: 'Loja B',
      dataEmissao: new Date('2026-01-01T00:00:00.000Z'),
    });
    const { prisma, getStore } = createFakePrisma([lojaA, lojaBForaDaJanela]);

    const novaLojaA = row({ loja: 'Loja A', dataEmissao: new Date('2026-07-09T00:00:00.000Z') });
    const novaLojaB = row({ loja: 'Loja B', dataEmissao: new Date('2026-07-09T00:00:00.000Z') });
    const result = await replaceSalesEntriesWindow([novaLojaA, novaLojaB], prisma);

    expect(result.deletedCount).toBe(1); // só a lojaA, que estava dentro da janela
    expect(result.insertedCount).toBe(2);
    const store = getStore();
    expect(store).toHaveLength(3); // lojaBForaDaJanela (preservada) + as 2 novas
  });

  it('com loja: substitui só a janela (data + loja), preservando outras lojas no mesmo período (TD-04b)', async () => {
    const lojaA = row({ loja: 'Loja A', dataEmissao: new Date('2026-07-09T00:00:00.000Z') });
    const lojaB = row({ loja: 'Loja B', dataEmissao: new Date('2026-07-09T00:00:00.000Z') });
    const { prisma, deleteMany, getStore } = createFakePrisma([lojaA, lojaB]);

    const novaLojaA = row({ loja: 'Loja A', dataEmissao: new Date('2026-07-09T00:00:00.000Z') });
    const result = await replaceSalesEntriesWindow([novaLojaA], prisma, { loja: 'Loja A' });

    expect(deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ loja: 'Loja A' }) }),
    );
    expect(result.deletedCount).toBe(1);
    expect(result.insertedCount).toBe(1);
    const store = getStore();
    expect(store).toHaveLength(2); // lojaB preservada + a nova lojaA
    expect(store.some((e) => e.loja === 'Loja B')).toBe(true);
  });

  it('calcula a janela de datas a partir do mínimo e máximo das linhas', async () => {
    const { prisma } = createFakePrisma();
    const rows = [
      row({ dataEmissao: new Date('2026-07-01T00:00:00.000Z') }),
      row({ dataEmissao: new Date('2026-07-15T00:00:00.000Z') }),
    ];
    const result = await replaceSalesEntriesWindow(rows, prisma);
    expect(result.dateRange.min.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(result.dateRange.max.toISOString()).toBe('2026-07-15T00:00:00.000Z');
  });

  it('divide inserções grandes em lotes', async () => {
    const rows = Array.from({ length: 2500 }, () => row());
    const { prisma, createMany } = createFakePrisma();
    const result = await replaceSalesEntriesWindow(rows, prisma);
    expect(result.insertedCount).toBe(2500);
    expect(createMany).toHaveBeenCalledTimes(3); // 1000 + 1000 + 500
  });
});
