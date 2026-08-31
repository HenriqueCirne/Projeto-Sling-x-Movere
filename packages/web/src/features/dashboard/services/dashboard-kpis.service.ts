import type { DashboardKpis, DashboardKpisContract, PeriodFilter } from '../dashboard.contract';
import {
  dashboardKpisRepository,
  type DashboardKpisRepository,
} from '../repositories/dashboard-kpis.repository';

/**
 * Calcula os 5 KPIs do Painel (AC1) a partir dos agregados do repositório.
 *
 * O cálculo de Ticket Médio mora AQUI, não no repositório: é regra de
 * negócio (TD-04 — Faturamento Total ÷ Nº de Lançamentos), não uma agregação
 * de banco.
 */
export class DashboardKpisService implements DashboardKpisContract {
  constructor(private readonly repository: DashboardKpisRepository = dashboardKpisRepository) {}

  async getKpis(period: PeriodFilter = {}): Promise<DashboardKpis> {
    const aggregates = await this.repository.getAggregates(period);

    return {
      faturamentoTotal: aggregates.faturamentoTotal,
      quantidadeTotal: aggregates.quantidadeTotal,
      numeroDeLancamentos: aggregates.numeroDeLancamentos,
      // Guarda contra divisão por zero: um período sem nenhum lançamento (ex:
      // filtro futuro, ou loja sem movimento) deve mostrar Ticket Médio = 0,
      // não NaN/Infinity renderizado na tela.
      ticketMedio:
        aggregates.numeroDeLancamentos > 0
          ? aggregates.faturamentoTotal / aggregates.numeroDeLancamentos
          : 0,
      numeroDeClientes: aggregates.numeroDeClientesDistintos,
    };
  }
}

export const dashboardKpisService = new DashboardKpisService();
