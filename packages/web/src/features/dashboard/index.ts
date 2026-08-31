/**
 * Fachada da feature `dashboard` (server-only — arrasta Prisma).
 */
export type { DashboardKpis, DashboardKpisContract } from './dashboard.contract';
export { DashboardKpisService, dashboardKpisService } from './services/dashboard-kpis.service';
export { formatCurrency, formatInteger } from './format';
