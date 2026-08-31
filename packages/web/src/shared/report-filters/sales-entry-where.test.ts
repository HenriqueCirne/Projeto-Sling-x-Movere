import { describe, expect, it } from 'vitest';

import { buildSalesEntryWhere } from './sales-entry-where';

describe('buildSalesEntryWhere', () => {
  it('retorna where vazio quando nenhum filtro é informado', () => {
    expect(buildSalesEntryWhere({})).toEqual({});
  });

  it('inclui apenas gte quando só a data inicial é informada', () => {
    const dataInicial = new Date('2026-07-01T00:00:00.000Z');
    expect(buildSalesEntryWhere({ dataInicial })).toEqual({
      dataEmissao: { gte: dataInicial },
    });
  });

  it('inclui apenas lte quando só a data final é informada', () => {
    const dataFinal = new Date('2026-08-31T23:59:59.999Z');
    expect(buildSalesEntryWhere({ dataFinal })).toEqual({
      dataEmissao: { lte: dataFinal },
    });
  });

  it('inclui gte e lte quando ambas as datas são informadas', () => {
    const dataInicial = new Date('2026-07-01T00:00:00.000Z');
    const dataFinal = new Date('2026-08-31T23:59:59.999Z');
    expect(buildSalesEntryWhere({ dataInicial, dataFinal })).toEqual({
      dataEmissao: { gte: dataInicial, lte: dataFinal },
    });
  });

  it('inclui loja quando informada, combinada com o período', () => {
    const dataInicial = new Date('2026-07-01T00:00:00.000Z');
    expect(buildSalesEntryWhere({ dataInicial, loja: '01 - MT' })).toEqual({
      dataEmissao: { gte: dataInicial },
      loja: '01 - MT',
    });
  });

  it('inclui loja sozinha, sem filtro de período', () => {
    expect(buildSalesEntryWhere({ loja: '01 - MT' })).toEqual({ loja: '01 - MT' });
  });
});
