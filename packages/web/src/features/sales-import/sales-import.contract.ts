/**
 * Contrato público da feature `sales-import` (Contract Pattern do preset).
 *
 * ⚠️ Módulo compartilhado com `prisma/import-sales-entries.ts`: só pode
 * importar de `node_modules` ou por caminho relativo — nada de alias `@/...`,
 * nada de `next/*` (mesma regra de `features/auth/services/seed-admin.service.ts`).
 *
 * Racional completo da importação: `docs/architecture/tech-decisions.md#TD-07`.
 */

/** Uma linha de `sales_entries` já validada e pronta para `createMany`. */
export type ParsedSalesEntryRow = {
  idLancamento: string | null;
  numeroDocumento: string | null;
  tipo: 'VENDA' | 'DEVOLUCAO';
  dataEmissao: Date;
  loja: string | null;
  cliente: string | null;
  atendente: string | null;
  item: string | null;
  familia: string | null;
  grupo: string | null;
  marca: string | null;
  linha: string | null;
  tipoPreco: string | null;
  condicaoPagamento: string | null;
  preco: string | null;
  valorTotal: string;
  quantidade: string;
  prazoMedio: string;
};

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
