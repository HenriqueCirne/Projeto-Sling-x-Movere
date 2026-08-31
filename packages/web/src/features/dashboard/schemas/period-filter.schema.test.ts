import { describe, expect, it } from 'vitest';

import { periodFilterInputSchema, toPeriodFilter } from './period-filter.schema';

describe('periodFilterInputSchema', () => {
  it('aceita um intervalo válido', () => {
    const result = periodFilterInputSchema.safeParse({
      dataInicial: '2026-07-01',
      dataFinal: '2026-08-31',
    });

    expect(result.success).toBe(true);
  });

  it('aceita ausência de qualquer data (sem filtro)', () => {
    expect(periodFilterInputSchema.safeParse({}).success).toBe(true);
  });

  it('aceita apenas uma das pontas', () => {
    expect(periodFilterInputSchema.safeParse({ dataInicial: '2026-07-01' }).success).toBe(true);
    expect(periodFilterInputSchema.safeParse({ dataFinal: '2026-08-31' }).success).toBe(true);
  });

  it('rejeita data inicial depois da data final', () => {
    const result = periodFilterInputSchema.safeParse({
      dataInicial: '2026-08-31',
      dataFinal: '2026-07-01',
    });

    expect(result.success).toBe(false);
  });

  it('aceita data inicial igual à data final (um único dia)', () => {
    const result = periodFilterInputSchema.safeParse({
      dataInicial: '2026-08-03',
      dataFinal: '2026-08-03',
    });

    expect(result.success).toBe(true);
  });

  it('rejeita formato de data inválido', () => {
    expect(periodFilterInputSchema.safeParse({ dataInicial: '03/08/2026' }).success).toBe(false);
    expect(periodFilterInputSchema.safeParse({ dataInicial: 'ontem' }).success).toBe(false);
  });
});

describe('toPeriodFilter', () => {
  it('converte dataFinal para o último instante do dia (evita excluir o próprio dia do filtro)', () => {
    const period = toPeriodFilter({ dataInicial: '2026-07-01', dataFinal: '2026-08-31' });

    expect(period.dataInicial?.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(period.dataFinal?.toISOString()).toBe('2026-08-31T23:59:59.999Z');
  });

  it('devolve undefined nas pontas ausentes', () => {
    expect(toPeriodFilter({})).toEqual({ dataInicial: undefined, dataFinal: undefined });
  });
});
