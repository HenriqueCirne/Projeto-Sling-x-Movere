import { SalesImportError, type ImportSummary, type ParsedSalesEntryRow } from '../sales-import.contract';
import { parseWorkbook } from './parse-workbook.service';

export type SalesEntryCreateInput = ParsedSalesEntryRow;

/** Fatia do `PrismaClient` de que a importação precisa — permite teste sem banco. */
export type SalesEntryTransactionClient = {
  salesEntry: {
    deleteMany(args: {
      where: { dataEmissao: { gte: Date; lte: Date } };
    }): Promise<{ count: number }>;
    createMany(args: { data: SalesEntryCreateInput[] }): Promise<{ count: number }>;
  };
};

export type ImportPrismaClient = {
  $transaction<T>(
    fn: (tx: SalesEntryTransactionClient) => Promise<T>,
    options?: { timeout?: number; maxWait?: number },
  ): Promise<T>;
};

const CREATE_MANY_CHUNK_SIZE = 1000;

/**
 * Timeout generoso para a transação: a importação roda contra um Postgres
 * remoto (Supabase, TD-07), não local — o default do Prisma (5s) não é
 * suficiente para ~24k linhas.
 */
const TRANSACTION_TIMEOUT_MS = 5 * 60 * 1000;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Importa uma planilha de vendas para `sales_entries`, substituindo a janela
 * de datas coberta pelas linhas importadas — a mesma estratégia de
 * sincronização idempotente já decidida para a Story 1.4 (TD-04b), reusada
 * aqui (TD-07) porque nenhuma coluna do export identifica uma linha de forma
 * única (TD-04, Achado 3): upsert por chave não é uma opção.
 *
 * Tudo roda em uma única transação: se a inserção falhar no meio, a janela
 * apagada não fica sem os dados de volta.
 *
 * @throws {SalesImportError} Planilha inválida (ver `parseWorkbook`) ou
 * nenhuma linha válida encontrada.
 */
export async function importSalesEntries(
  rawRows: readonly (readonly unknown[])[],
  prisma: ImportPrismaClient,
): Promise<ImportSummary> {
  const { validRows, rejected } = parseWorkbook(rawRows);

  if (validRows.length === 0) {
    throw new SalesImportError(
      `Nenhuma linha válida encontrada na planilha (${rejected.length} rejeitada(s)). Nada foi importado.`,
    );
  }

  const timestamps = validRows.map((row) => row.dataEmissao.getTime());
  const min = new Date(Math.min(...timestamps));
  const max = new Date(Math.max(...timestamps));

  const { deletedCount, insertedCount } = await prisma.$transaction(
    async (tx) => {
      const deleted = await tx.salesEntry.deleteMany({
        where: { dataEmissao: { gte: min, lte: max } },
      });

      let insertedCount = 0;
      for (const batch of chunk(validRows, CREATE_MANY_CHUNK_SIZE)) {
        const created = await tx.salesEntry.createMany({ data: batch });
        insertedCount += created.count;
      }

      return { deletedCount: deleted.count, insertedCount };
    },
    { timeout: TRANSACTION_TIMEOUT_MS, maxWait: TRANSACTION_TIMEOUT_MS },
  );

  return {
    totalRows: rawRows.length - 1,
    validRows: validRows.length,
    rejectedRows: rejected.length,
    rejected,
    dateRange: { min, max },
    deletedCount,
    insertedCount,
  };
}
