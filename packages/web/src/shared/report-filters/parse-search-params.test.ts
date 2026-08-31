import { describe, expect, it } from 'vitest';

import { parseReportFilterSearchParams } from './parse-search-params';

describe('parseReportFilterSearchParams', () => {
  it('valida e converte um filtro válido', () => {
    const result = parseReportFilterSearchParams({
      dataInicial: '2026-07-01',
      dataFinal: '2026-08-31',
      loja: '01 - MT',
    });

    expect(result.valid).toBe(true);
    expect(result.filter.dataInicial?.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(result.filter.loja).toBe('01 - MT');
  });

  it('degrada para filtro vazio quando o input é inválido (datas invertidas)', () => {
    const result = parseReportFilterSearchParams({
      dataInicial: '2026-08-31',
      dataFinal: '2026-07-01',
    });

    expect(result.valid).toBe(false);
    expect(result.filter).toEqual({});
  });

  it('ignora parâmetros que não são string (ex: array de query repetida)', () => {
    const result = parseReportFilterSearchParams({ dataInicial: ['a', 'b'] });

    expect(result.valid).toBe(true);
    expect(result.filter.dataInicial).toBeUndefined();
  });

  it('trata ausência total de parâmetros como filtro vazio válido', () => {
    const result = parseReportFilterSearchParams({});

    expect(result.valid).toBe(true);
    expect(result.filter).toEqual({ dataInicial: undefined, dataFinal: undefined, loja: undefined });
  });
});
