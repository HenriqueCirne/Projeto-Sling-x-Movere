import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';

import type {
  DailyRevenuePoint,
  FaturamentoPorDataContract,
} from '../faturamento-por-data.contract';
import {
  faturamentoPorDataRepository,
  type FaturamentoPorDataRepository,
} from '../repositories/faturamento-por-data.repository';

/** `Date` → `YYYY-MM-DD` em UTC (mesma convenção de fronteira de dia usada no filtro, Story 2.1/1.5). */
function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class FaturamentoPorDataService implements FaturamentoPorDataContract {
  constructor(
    private readonly repository: FaturamentoPorDataRepository = faturamentoPorDataRepository,
  ) {}

  async getSerieDiaria(filter: ReportFilter = {}): Promise<DailyRevenuePoint[]> {
    const entries = await this.repository.findRawEntries(filter);

    const somaPorDia = new Map<string, number>();
    for (const entry of entries) {
      const dia = toIsoDate(entry.dataEmissao);
      somaPorDia.set(dia, (somaPorDia.get(dia) ?? 0) + entry.valorTotal);
    }

    return Array.from(somaPorDia.entries())
      .map(([data, faturamento]) => ({ data, faturamento }))
      .sort((a, b) => a.data.localeCompare(b.data));
  }
}

export const faturamentoPorDataService = new FaturamentoPorDataService();
