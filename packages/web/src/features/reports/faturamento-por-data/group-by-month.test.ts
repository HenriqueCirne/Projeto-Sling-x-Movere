import { describe, expect, it } from 'vitest';

import { groupByMonth } from './group-by-month';

describe('groupByMonth', () => {
  it('agrega dias do mesmo mês', () => {
    const monthly = groupByMonth([
      { data: '2026-07-01', faturamento: 100 },
      { data: '2026-07-15', faturamento: 50 },
      { data: '2026-08-01', faturamento: 200 },
    ]);

    expect(monthly).toEqual([
      { mes: '2026-07', faturamento: 150 },
      { mes: '2026-08', faturamento: 200 },
    ]);
  });

  it('ordena os meses ascendentemente', () => {
    const monthly = groupByMonth([
      { data: '2026-08-01', faturamento: 1 },
      { data: '2026-07-01', faturamento: 1 },
    ]);

    expect(monthly.map((m) => m.mes)).toEqual(['2026-07', '2026-08']);
  });

  it('devolve vazio para entrada vazia', () => {
    expect(groupByMonth([])).toEqual([]);
  });
});
