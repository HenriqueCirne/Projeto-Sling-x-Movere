/**
 * Filtro compartilhado por período (+ loja opcional), reutilizado por todos
 * os relatórios da Epic 1/2/3 que consultam `sales_entries`. Movido de
 * `features/dashboard` (Story 1.5) para cá na Story 2.1, quando um segundo
 * consumidor apareceu — REUSE > ADAPT > CREATE.
 */
export type ReportFilter = {
  dataInicial?: Date;
  dataFinal?: Date;
  /** Código/nome da loja, conforme persistido em `SalesEntry.loja`. */
  loja?: string;
};
