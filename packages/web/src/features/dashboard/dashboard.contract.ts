/**
 * API pública da feature `dashboard` (Contract Pattern do preset).
 *
 * Story 1.5 — Painel com os 5 KPIs de resumo. Fórmulas confirmadas contra a
 * planilha de referência (`DOC/Dashboard_Vendas_Jul_Ago_2026.xlsx`) pelo
 * @architect em `docs/architecture/tech-decisions.md` (TD-04):
 *
 * - Faturamento Total = SUM(valorTotal)
 * - Quantidade Total = SUM(quantidade)
 * - Nº de Lançamentos = COUNT(*) — conta LINHAS de item, não notas/vendas
 * - Ticket Médio = Faturamento Total ÷ Nº de Lançamentos (por linha, não por
 *   venda — ver TD-04 Achado 2; é uma pergunta de negócio em aberto, R1, que
 *   não bloqueia esta story)
 * - Nº de Clientes = COUNT(DISTINCT cliente)
 *
 * As devoluções (`tipo = DEVOLUCAO`, valor negativo) NÃO são filtradas — a
 * planilha de referência não as filtra, e filtrá-las quebraria a paridade.
 */

/** Os 5 KPIs exibidos no Painel (AC1). */
export type DashboardKpis = {
  faturamentoTotal: number;
  quantidadeTotal: number;
  numeroDeLancamentos: number;
  ticketMedio: number;
  numeroDeClientes: number;
};

/**
 * Filtro de período (AC2). `undefined` em qualquer uma das pontas significa
 * "sem limite" naquela direção — não há um período padrão definido em nenhum
 * documento do projeto, então a ausência de filtro mostra todos os
 * lançamentos em vez de inventar uma janela (ex: "últimos 30 dias").
 */
export type PeriodFilter = {
  dataInicial?: Date;
  dataFinal?: Date;
};

export interface DashboardKpisContract {
  /**
   * Calcula os 5 KPIs para o período informado.
   *
   * @param period - Filtro de período. Objeto vazio/ausente = todos os
   *   lançamentos.
   */
  getKpis(period?: PeriodFilter): Promise<DashboardKpis>;
}
