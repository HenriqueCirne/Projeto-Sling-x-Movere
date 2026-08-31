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
import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';

/** Os 5 KPIs exibidos no Painel (AC1). */
export type DashboardKpis = {
  faturamentoTotal: number;
  quantidadeTotal: number;
  numeroDeLancamentos: number;
  ticketMedio: number;
  numeroDeClientes: number;
};

export interface DashboardKpisContract {
  /**
   * Calcula os 5 KPIs para o período informado.
   *
   * @param period - Filtro de período. Objeto vazio/ausente = todos os
   *   lançamentos.
   */
  getKpis(period?: ReportFilter): Promise<DashboardKpis>;
}
