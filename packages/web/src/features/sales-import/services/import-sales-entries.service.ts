import {
  replaceSalesEntriesWindow,
  type SalesEntriesPrismaClient,
} from '../../../shared/sales-entries/replace-window.repository';
import { SalesImportError, type ImportSummary } from '../sales-import.contract';
import { parseWorkbook } from './parse-workbook.service';

/** Alias mantido por compatibilidade — o tipo mora em `shared/sales-entries`. */
export type ImportPrismaClient = SalesEntriesPrismaClient;

/**
 * Importa uma planilha de vendas para `sales_entries`, substituindo a janela
 * de datas coberta pelas linhas importadas (TD-07). Sem escopo de loja de
 * propósito: uma planilha da gestão é sempre um dump de todas as lojas de
 * uma vez, então substituir por data (não por data+loja) é o comportamento
 * correto aqui — ver `replaceSalesEntriesWindow` para o racional completo.
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

  const { dateRange, deletedCount, insertedCount } = await replaceSalesEntriesWindow(
    validRows,
    prisma,
  );

  return {
    totalRows: rawRows.length - 1,
    validRows: validRows.length,
    rejectedRows: rejected.length,
    rejected,
    dateRange,
    deletedCount,
    insertedCount,
  };
}
