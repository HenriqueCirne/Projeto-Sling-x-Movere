import type { DailyRevenuePoint, MonthlyRevenuePoint } from './faturamento-por-data.contract';

/**
 * Agrega a série diária em mensal (Story 2.1, AC2) — pura, sem dependências,
 * para ser chamada no toggle client-side (sem novo round-trip ao servidor).
 */
export function groupByMonth(daily: DailyRevenuePoint[]): MonthlyRevenuePoint[] {
  const somaPorMes = new Map<string, number>();

  for (const point of daily) {
    const mes = point.data.slice(0, 7); // "YYYY-MM-DD" → "YYYY-MM"
    somaPorMes.set(mes, (somaPorMes.get(mes) ?? 0) + point.faturamento);
  }

  return Array.from(somaPorMes.entries())
    .map(([mes, faturamento]) => ({ mes, faturamento }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}
