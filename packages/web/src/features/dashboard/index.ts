/**
 * Fachada da feature `dashboard` (server-only — arrasta Prisma).
 */
export type {
  DashboardKpis,
  DashboardKpisContract,
  DashboardResumosContract,
  DimensaoResumoRow,
  PainelResumosPorDimensao,
} from './dashboard.contract';
export { DashboardKpisService, dashboardKpisService } from './services/dashboard-kpis.service';
export {
  DashboardResumosService,
  dashboardResumosService,
} from './services/dashboard-resumos.service';
export { formatCurrency, formatInteger } from './format';
