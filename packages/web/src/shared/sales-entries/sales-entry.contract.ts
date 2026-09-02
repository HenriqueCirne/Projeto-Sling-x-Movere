/**
 * Forma de uma linha pronta para `sales_entries`, compartilhada entre
 * `features/sales-import` (planilha, TD-07) e `features/erp-sync` (API
 * Moveres, Story 1.4) — as duas fontes de dados alimentam a mesma tabela
 * (Story 1.3) e reusam a mesma estratégia de escrita idempotente (TD-04b).
 *
 * ⚠️ Compartilhado com `prisma/*.ts` (scripts fora do Next.js, via `tsx`): só
 * pode importar de `node_modules` ou por caminho relativo — nada de alias
 * `@/...`, nada de `next/*` (mesma regra de `seed-admin.service.ts`).
 */
export type SalesEntryRow = {
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
