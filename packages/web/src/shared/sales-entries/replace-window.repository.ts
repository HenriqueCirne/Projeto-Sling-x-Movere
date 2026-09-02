import type { SalesEntryRow } from './sales-entry.contract';

/** Fatia do `PrismaClient` de que a escrita precisa — permite teste sem banco. */
export type SalesEntryTransactionClient = {
  salesEntry: {
    deleteMany(args: {
      where: { dataEmissao: { gte: Date; lte: Date }; loja?: string | null };
    }): Promise<{ count: number }>;
    createMany(args: { data: SalesEntryRow[] }): Promise<{ count: number }>;
  };
};

export type SalesEntriesPrismaClient = {
  $transaction<T>(
    fn: (tx: SalesEntryTransactionClient) => Promise<T>,
    options?: { timeout?: number; maxWait?: number },
  ): Promise<T>;
};

const CREATE_MANY_CHUNK_SIZE = 1000;

/**
 * Timeout generoso: as duas fontes de dados (planilha, ERP) escrevem contra
 * um Postgres remoto (Supabase), não local — o default do Prisma (5s) não é
 * suficiente para lotes grandes.
 */
const TRANSACTION_TIMEOUT_MS = 5 * 60 * 1000;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export type ReplaceWindowResult = {
  dateRange: { min: Date; max: Date };
  deletedCount: number;
  insertedCount: number;
};

/**
 * Substitui, numa única transação, as linhas de `sales_entries` na janela
 * `[min(dataEmissao), max(dataEmissao)]` de `rows` — a estratégia de
 * sincronização idempotente decidida em TD-04b (Story 1.3), reusada tanto
 * pela importação de planilha (TD-07) quanto pela sincronização com o ERP
 * (Story 1.4): nenhuma coluna do export/API identifica uma linha de forma
 * única (TD-04, Achado 3), então upsert por chave não é uma opção.
 *
 * `options.loja`, quando informado, escopa TAMBÉM por loja — TD-04b define a
 * janela como `(Data de Emissão, Loja)`, não só data. A sincronização do ERP
 * roda loja a loja (a API exige `codigoLoja`); sem esse filtro, sincronizar
 * a Loja A apagaria também os lançamentos da Loja B no mesmo período. A
 * importação de planilha (que é sempre um dump de todas as lojas de uma vez)
 * omite `loja` de propósito — o comportamento antigo, por data apenas,
 * continua correto para esse caso.
 *
 * Tudo roda em uma única transação: se a inserção falhar no meio, a janela
 * apagada não fica sem os dados de volta.
 *
 * @throws {Error} se `rows` estiver vazio — não há janela para calcular.
 */
export async function replaceSalesEntriesWindow(
  rows: readonly SalesEntryRow[],
  prisma: SalesEntriesPrismaClient,
  options: { loja?: string } = {},
): Promise<ReplaceWindowResult> {
  if (rows.length === 0) {
    throw new Error('replaceSalesEntriesWindow: nenhuma linha para substituir — nada a fazer.');
  }

  const timestamps = rows.map((row) => row.dataEmissao.getTime());
  const min = new Date(Math.min(...timestamps));
  const max = new Date(Math.max(...timestamps));

  const { deletedCount, insertedCount } = await prisma.$transaction(
    async (tx) => {
      const deleted = await tx.salesEntry.deleteMany({
        where: {
          dataEmissao: { gte: min, lte: max },
          ...(options.loja !== undefined ? { loja: options.loja } : {}),
        },
      });

      let insertedCount = 0;
      for (const batch of chunk(rows, CREATE_MANY_CHUNK_SIZE)) {
        const created = await tx.salesEntry.createMany({ data: batch });
        insertedCount += created.count;
      }

      return { deletedCount: deleted.count, insertedCount };
    },
    { timeout: TRANSACTION_TIMEOUT_MS, maxWait: TRANSACTION_TIMEOUT_MS },
  );

  return { dateRange: { min, max }, deletedCount, insertedCount };
}
