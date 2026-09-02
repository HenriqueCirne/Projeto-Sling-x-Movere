import { describe, expect, it, vi } from 'vitest';

import { SalesImportError } from '../sales-import.contract';
import {
  importSalesEntries,
  type ImportPrismaClient,
  type SalesEntryCreateInput,
} from './import-sales-entries.service';

const HEADER = [
  'Tipo',
  'Loja',
  'Marca Itens',
  'Grupo Itens',
  'Família Itens',
  'Linha Itens',
  'Item',
  'Quantidade',
  'Preço de Venda',
  'a',
  'Data de Emissão',
  'Prazo Médio',
  'Cliente',
  'Atendente',
  'Nº documento',
  'Id Lançamento',
  'Condições de Pagamento',
  'Tipo de preço',
];

function row(data: string, total: number, tipo = 'Venda'): unknown[] {
  return [
    tipo,
    'Loja 01',
    'Marca X',
    'Grupo X',
    'Familia X',
    'Linha X',
    'Pneu 175/65',
    2,
    total / 2,
    total,
    data,
    45,
    'Cliente X',
    'Atendente X',
    897699,
    1848158,
    '6 - BOLETO',
    'Padrão',
  ];
}

/** Fake in-memory do slice de Prisma que o serviço precisa, sem tocar em banco. */
function createFakePrisma(initialRows: SalesEntryCreateInput[] = []) {
  let store = [...initialRows];
  const deleteMany = vi.fn(async (args: { where: { dataEmissao: { gte: Date; lte: Date } } }) => {
    const before = store.length;
    store = store.filter(
      (entry) =>
        entry.dataEmissao < args.where.dataEmissao.gte ||
        entry.dataEmissao > args.where.dataEmissao.lte,
    );
    return { count: before - store.length };
  });
  const createMany = vi.fn(async (args: { data: SalesEntryCreateInput[] }) => {
    store.push(...args.data);
    return { count: args.data.length };
  });

  const prisma: ImportPrismaClient = {
    $transaction: async (fn) => fn({ salesEntry: { deleteMany, createMany } }),
  };

  return { prisma, deleteMany, createMany, getStore: () => store };
}

describe('importSalesEntries', () => {
  it('insere as linhas válidas e reporta o resumo correto', async () => {
    const { prisma, getStore } = createFakePrisma();

    const summary = await importSalesEntries(
      [HEADER, row('09/07/2026', 1550), row('10/07/2026', 500)],
      prisma,
    );

    expect(summary.totalRows).toBe(2);
    expect(summary.validRows).toBe(2);
    expect(summary.rejectedRows).toBe(0);
    expect(summary.insertedCount).toBe(2);
    expect(summary.deletedCount).toBe(0);
    expect(summary.dateRange?.min.toISOString().slice(0, 10)).toBe('2026-07-09');
    expect(summary.dateRange?.max.toISOString().slice(0, 10)).toBe('2026-07-10');
    expect(getStore()).toHaveLength(2);
  });

  function fixtureEntry(dataEmissao: string): SalesEntryCreateInput {
    return {
      tipo: 'VENDA',
      dataEmissao: new Date(dataEmissao),
      quantidade: '2.000',
      preco: '499.50',
      valorTotal: '999.00',
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
    };
  }

  it('substitui (delete+insert) só a janela de datas coberta pela planilha (TD-04b/TD-07)', async () => {
    const existingInWindow = fixtureEntry('2026-07-09T00:00:00.000Z');
    const existingOutsideWindow = fixtureEntry('2026-01-01T00:00:00.000Z');

    const { prisma, deleteMany, getStore } = createFakePrisma([
      existingInWindow,
      existingOutsideWindow,
    ]);

    const summary = await importSalesEntries([HEADER, row('09/07/2026', 1550)], prisma);

    expect(deleteMany).toHaveBeenCalledTimes(1);
    expect(summary.deletedCount).toBe(1); // só a linha de 09/07, não a de 01/01
    expect(summary.insertedCount).toBe(1);
    const store = getStore();
    expect(store).toHaveLength(2); // a de fora da janela + a nova
    expect(store.some((e) => e.dataEmissao.toISOString().slice(0, 10) === '2026-01-01')).toBe(
      true,
    );
  });

  it('divide inserções grandes em lotes (limite de parâmetros do Postgres)', async () => {
    const rows = Array.from({ length: 2500 }, (_, i) => row('09/07/2026', 100 + i));
    const { prisma, createMany } = createFakePrisma();

    const summary = await importSalesEntries([HEADER, ...rows], prisma);

    expect(summary.insertedCount).toBe(2500);
    expect(createMany).toHaveBeenCalledTimes(3); // 1000 + 1000 + 500
  });

  it('lança SalesImportError e não escreve nada quando nenhuma linha é válida', async () => {
    const { prisma, deleteMany, createMany } = createFakePrisma();

    await expect(
      importSalesEntries([HEADER, row('data-invalida', 1550)], prisma),
    ).rejects.toThrow(SalesImportError);
    expect(deleteMany).not.toHaveBeenCalled();
    expect(createMany).not.toHaveBeenCalled();
  });

  it('reporta linhas rejeitadas junto das válidas, sem abortar a importação', async () => {
    const { prisma } = createFakePrisma();

    const summary = await importSalesEntries(
      [HEADER, row('09/07/2026', 1550), row('data-invalida', 1550)],
      prisma,
    );

    expect(summary.validRows).toBe(1);
    expect(summary.rejectedRows).toBe(1);
    expect(summary.rejected[0]?.row).toBe(3);
  });
});
