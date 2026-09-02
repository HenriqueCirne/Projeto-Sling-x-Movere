/**
 * Contrato público da feature `sales-import` (Contract Pattern do preset).
 *
 * ⚠️ Módulo compartilhado com `prisma/import-sales-entries.ts`: só pode
 * importar de `node_modules` ou por caminho relativo — nada de alias `@/...`,
 * nada de `next/*` (mesma regra de `features/auth/services/seed-admin.service.ts`).
 *
 * Racional completo da importação: `docs/architecture/tech-decisions.md#TD-07`.
 */

/**
 * Uma linha de `sales_entries` já validada e pronta para `createMany`.
 * Alias mantido por compatibilidade — o tipo mora em `shared/sales-entries`
 * (compartilhado com `features/erp-sync`, Story 1.4).
 */
export type { SalesEntryRow as ParsedSalesEntryRow } from '../../shared/sales-entries/sales-entry.contract';

/** Linha da planilha rejeitada, com o motivo e o número de linha do Excel (cabeçalho = linha 1). */
export type RowRejection = {
  row: number;
  reason: string;
};

export type ImportSummary = {
  totalRows: number;
  validRows: number;
  rejectedRows: number;
  rejected: RowRejection[];
  dateRange: { min: Date; max: Date } | null;
  deletedCount: number;
  insertedCount: number;
};

/** Erro de dado/configuração da importação — mensagem segura para exibir no terminal. */
export class SalesImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SalesImportError';
  }
}
