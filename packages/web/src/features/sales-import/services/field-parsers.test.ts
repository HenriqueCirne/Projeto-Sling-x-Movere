import { describe, expect, it } from 'vitest';

import {
  parseDataEmissao,
  parseDecimal,
  parseDecimalNullable,
  parseNullableString,
  parsePrazoMedio,
  parseTipo,
} from './field-parsers';

describe('parseNullableString', () => {
  it('mantém texto já limpo e apara espaços', () => {
    expect(parseNullableString('  Cirne Pneus  ')).toEqual({ ok: true, value: 'Cirne Pneus' });
  });

  it('converte número para texto (ex: código de cliente)', () => {
    expect(parseNullableString(293723)).toEqual({ ok: true, value: '293723' });
  });

  it('trata null/undefined/string vazia como ausência de valor', () => {
    expect(parseNullableString(null)).toEqual({ ok: true, value: null });
    expect(parseNullableString(undefined)).toEqual({ ok: true, value: null });
    expect(parseNullableString('   ')).toEqual({ ok: true, value: null });
  });

  it('rejeita tipos inesperados', () => {
    expect(parseNullableString({}).ok).toBe(false);
  });
});

describe('parseTipo', () => {
  it('reconhece "Venda"', () => {
    expect(parseTipo('Venda')).toEqual({ ok: true, value: 'VENDA' });
  });

  it('reconhece "Devolução" com e sem acento', () => {
    expect(parseTipo('Devolução')).toEqual({ ok: true, value: 'DEVOLUCAO' });
    expect(parseTipo('Devolucao')).toEqual({ ok: true, value: 'DEVOLUCAO' });
  });

  it('rejeita valor não observado nos dados reais (TD-04)', () => {
    expect(parseTipo('Orçamento').ok).toBe(false);
    expect(parseTipo(null).ok).toBe(false);
    expect(parseTipo('').ok).toBe(false);
  });
});

describe('parseDataEmissao', () => {
  it('aceita o formato dd/mm/aaaa dos exports de referência', () => {
    const result = parseDataEmissao('09/07/2026');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.toISOString()).toBe('2026-07-09T00:00:00.000Z');
    }
  });

  it('aceita instância de Date', () => {
    const result = parseDataEmissao(new Date(Date.UTC(2026, 6, 9, 15, 30)));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.toISOString()).toBe('2026-07-09T00:00:00.000Z');
    }
  });

  it('aceita serial numérico do Excel', () => {
    // 46212 = 09/07/2026 no epoch do Excel (1899-12-30).
    const result = parseDataEmissao(46212);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.toISOString().slice(0, 10)).toBe('2026-07-09');
    }
  });

  it('rejeita data que não existe (31/02) e formato errado', () => {
    expect(parseDataEmissao('31/02/2026').ok).toBe(false);
    expect(parseDataEmissao('2026-07-09').ok).toBe(false);
    expect(parseDataEmissao(null).ok).toBe(false);
  });
});

describe('parseDecimal', () => {
  it('aceita número puro do Excel e arredonda para a precisão pedida', () => {
    expect(parseDecimal(1550, 'Total', 2)).toEqual({ ok: true, value: '1550.00' });
    expect(parseDecimal(438.156, 'Ticket', 2)).toEqual({ ok: true, value: '438.16' });
  });

  it('aceita texto com ponto decimal simples', () => {
    expect(parseDecimal('248.97', 'Total', 2)).toEqual({ ok: true, value: '248.97' });
  });

  it('aceita texto no formato PT-BR (milhar com ponto, decimal com vírgula)', () => {
    expect(parseDecimal('1.550,00', 'Total', 2)).toEqual({ ok: true, value: '1550.00' });
  });

  it('preserva valores negativos (devoluções, TD-04 Achado 4)', () => {
    expect(parseDecimal(-1884, 'Total', 2)).toEqual({ ok: true, value: '-1884.00' });
  });

  it('rejeita vazio e não-numérico', () => {
    expect(parseDecimal(null, 'Total', 2).ok).toBe(false);
    expect(parseDecimal('abc', 'Total', 2).ok).toBe(false);
  });
});

describe('parseDecimalNullable', () => {
  it('trata em branco como null válido', () => {
    expect(parseDecimalNullable(null, 'Preço', 2)).toEqual({ ok: true, value: null });
  });

  it('ainda rejeita valor presente mas inválido', () => {
    expect(parseDecimalNullable('abc', 'Preço', 2).ok).toBe(false);
  });
});

describe('parsePrazoMedio', () => {
  it('aceita inteiro', () => {
    expect(parsePrazoMedio(45)).toEqual({ ok: true, value: 45 });
  });

  it('rejeita vazio e fracionário', () => {
    expect(parsePrazoMedio(null).ok).toBe(false);
    expect(parsePrazoMedio(45.5).ok).toBe(false);
  });
});
