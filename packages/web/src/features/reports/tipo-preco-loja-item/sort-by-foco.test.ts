import { describe, expect, it } from 'vitest';

import { sortByFoco } from './sort-by-foco';

const rows = [
  { tipoPreco: 'VAREJO', loja: '02 - MO', item: 'Item B', faturamento: 100, quantidade: 1 },
  { tipoPreco: 'ATACADO', loja: '01 - MT', item: 'Item A', faturamento: 500, quantidade: 5 },
  { tipoPreco: 'VAREJO', loja: '01 - MT', item: 'Item C', faturamento: 50, quantidade: 1 },
];

describe('sortByFoco', () => {
  it('agrupa por tipoPreco quando o foco é tipoPreco', () => {
    const sorted = sortByFoco(rows, 'tipoPreco');
    expect(sorted.map((r) => r.tipoPreco)).toEqual(['ATACADO', 'VAREJO', 'VAREJO']);
  });

  it('agrupa por loja quando o foco é loja', () => {
    const sorted = sortByFoco(rows, 'loja');
    expect(sorted.map((r) => r.loja)).toEqual(['01 - MT', '01 - MT', '02 - MO']);
  });

  it('dentro do mesmo valor da dimensão de foco, ordena por faturamento decrescente', () => {
    const sorted = sortByFoco(rows, 'tipoPreco');
    const varejo = sorted.filter((r) => r.tipoPreco === 'VAREJO');
    expect(varejo.map((r) => r.faturamento)).toEqual([100, 50]);
  });

  it('não modifica o array original', () => {
    const original = [...rows];
    sortByFoco(rows, 'item');
    expect(rows).toEqual(original);
  });
});
