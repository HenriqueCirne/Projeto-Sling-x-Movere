import { describe, expect, it } from 'vitest';

import { reportFilterInputSchema, toReportFilter } from './report-filter.schema';

describe('reportFilterInputSchema', () => {
  it('aceita um intervalo válido, com e sem loja', () => {
    expect(
      reportFilterInputSchema.safeParse({ dataInicial: '2026-07-01', dataFinal: '2026-08-31' })
        .success,
    ).toBe(true);
    expect(
      reportFilterInputSchema.safeParse({
        dataInicial: '2026-07-01',
        dataFinal: '2026-08-31',
        loja: '01 - MT',
      }).success,
    ).toBe(true);
  });

  it('aceita ausência de qualquer filtro', () => {
    expect(reportFilterInputSchema.safeParse({}).success).toBe(true);
  });

  it('rejeita data inicial depois da data final', () => {
    expect(
      reportFilterInputSchema.safeParse({ dataInicial: '2026-08-31', dataFinal: '2026-07-01' })
        .success,
    ).toBe(false);
  });

  it('rejeita loja vazia/só espaço', () => {
    expect(reportFilterInputSchema.safeParse({ loja: '' }).success).toBe(false);
    expect(reportFilterInputSchema.safeParse({ loja: '   ' }).success).toBe(false);
  });

  it('rejeita formato de data inválido', () => {
    expect(reportFilterInputSchema.safeParse({ dataInicial: '03/08/2026' }).success).toBe(false);
  });
});

describe('toReportFilter', () => {
  it('converte dataFinal para o último instante do dia e repassa a loja', () => {
    const filter = toReportFilter({
      dataInicial: '2026-07-01',
      dataFinal: '2026-08-31',
      loja: '01 - MT',
    });

    expect(filter.dataInicial?.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(filter.dataFinal?.toISOString()).toBe('2026-08-31T23:59:59.999Z');
    expect(filter.loja).toBe('01 - MT');
  });

  it('devolve undefined nas pontas ausentes', () => {
    expect(toReportFilter({})).toEqual({
      dataInicial: undefined,
      dataFinal: undefined,
      loja: undefined,
      marca: undefined,
      grupo: undefined,
      familia: undefined,
      linha: undefined,
      tipoPreco: undefined,
    });
  });

  it('repassa marca/grupo/familia/linha/tipoPreco', () => {
    const filter = toReportFilter({
      marca: 'Marca X',
      grupo: 'Grupo X',
      familia: 'Familia X',
      linha: 'Linha X',
      tipoPreco: 'VAREJO',
    });

    expect(filter.marca).toBe('Marca X');
    expect(filter.grupo).toBe('Grupo X');
    expect(filter.familia).toBe('Familia X');
    expect(filter.linha).toBe('Linha X');
    expect(filter.tipoPreco).toBe('VAREJO');
  });
});
