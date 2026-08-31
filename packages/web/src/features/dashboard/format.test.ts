import { describe, expect, it } from 'vitest';

import { formatCurrency, formatInteger } from './format';

describe('formatCurrency', () => {
  it('formata em Real brasileiro', () => {
    expect(formatCurrency(10_394_644.52)).toBe('R$ 10.394.644,52');
  });

  it('formata valor negativo (devoluções, TD-04)', () => {
    expect(formatCurrency(-336_972.09)).toBe('-R$ 336.972,09');
  });

  it('formata zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });
});

describe('formatInteger', () => {
  it('formata com separador de milhar pt-BR', () => {
    expect(formatInteger(23_724)).toBe('23.724');
  });

  it('formata zero', () => {
    expect(formatInteger(0)).toBe('0');
  });
});
