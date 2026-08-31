/** Fachada da feature `faturamento-por-data` (server-only — arrasta Prisma). */
export type { DailyRevenuePoint, MonthlyRevenuePoint } from './faturamento-por-data.contract';
export {
  FaturamentoPorDataService,
  faturamentoPorDataService,
} from './services/faturamento-por-data.service';
