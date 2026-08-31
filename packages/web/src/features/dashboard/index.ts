/**
 * Fachada da feature `dashboard` (server-only — arrasta Prisma).
 */
export type { DashboardKpis, DashboardKpisContract, PeriodFilter } from './dashboard.contract';
export { DashboardKpisService, dashboardKpisService } from './services/dashboard-kpis.service';
export {
  periodFilterInputSchema,
  toPeriodFilter,
  type PeriodFilterInput,
} from './schemas/period-filter.schema';
export { formatCurrency, formatInteger } from './format';
