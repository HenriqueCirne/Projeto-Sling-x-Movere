import { describe, expect, it } from 'vitest';

import { faixaDoPrazoMedio, FAIXAS_PRAZO_MEDIO, groupByFaixaPrazoMedio } from './faixa-prazo-medio';

describe('faixaDoPrazoMedio', () => {
  it('classifica os limites exatos de cada faixa', () => {
    expect(faixaDoPrazoMedio(0).codigo).toBe('P4');
    expect(faixaDoPrazoMedio(34).codigo).toBe('P4');
    expect(faixaDoPrazoMedio(35).codigo).toBe('P5');
    expect(faixaDoPrazoMedio(47).codigo).toBe('P5');
    expect(faixaDoPrazoMedio(48).codigo).toBe('P6');
    expect(faixaDoPrazoMedio(62).codigo).toBe('P6');
    expect(faixaDoPrazoMedio(63).codigo).toBe('P7');
    expect(faixaDoPrazoMedio(77).codigo).toBe('P7');
    expect(faixaDoPrazoMedio(78).codigo).toBe('P8');
    expect(faixaDoPrazoMedio(92).codigo).toBe('P8');
    expect(faixaDoPrazoMedio(93).codigo).toBe('P9');
    expect(faixaDoPrazoMedio(109).codigo).toBe('P9');
  });

  it('classifica qualquer valor acima de 109 como P1 (o "acima de X dias" do gestor)', () => {
    expect(faixaDoPrazoMedio(110).codigo).toBe('P1');
    expect(faixaDoPrazoMedio(250).codigo).toBe('P1');
    expect(faixaDoPrazoMedio(9999).codigo).toBe('P1');
  });

  it('aceita prazo médio fracionário sem buraco entre faixas (Decimal(8,2) no schema)', () => {
    // 34,5 fica entre o teto de P4 (34) e o piso nominal de P5 (35) — não
    // pode cair "entre" as faixas; a lógica em cascata garante que sempre
    // haja uma faixa correspondente.
    expect(faixaDoPrazoMedio(34.5).codigo).toBe('P5');
    expect(faixaDoPrazoMedio(109.99).codigo).toBe('P1');
  });

  it('trata prazo médio negativo (não deveria existir) como P4, sem lançar', () => {
    expect(faixaDoPrazoMedio(-1).codigo).toBe('P4');
  });
});

describe('groupByFaixaPrazoMedio', () => {
  it('soma o faturamento por faixa', () => {
    const rows = groupByFaixaPrazoMedio([
      { prazoMedio: 10, valorTotal: 100 },
      { prazoMedio: 20, valorTotal: 50 },
      { prazoMedio: 40, valorTotal: 200 },
    ]);

    expect(rows).toEqual([
      { faixa: 'P4 (0 a 34 dias)', faturamento: 150 },
      { faixa: 'P5 (35 a 47 dias)', faturamento: 200 },
    ]);
  });

  it('ordena pela ordem crescente de dias das faixas (P4→P9, depois P1), não por valor', () => {
    const rows = groupByFaixaPrazoMedio([
      { prazoMedio: 250, valorTotal: 1 }, // P1
      { prazoMedio: 0, valorTotal: 1 }, // P4
      { prazoMedio: 100, valorTotal: 1 }, // P9
    ]);

    expect(rows.map((r) => r.faixa)).toEqual([
      'P4 (0 a 34 dias)',
      'P9 (93 a 109 dias)',
      'P1 (acima de 109 dias)',
    ]);
  });

  it('não inclui faixas sem nenhum lançamento no período', () => {
    const rows = groupByFaixaPrazoMedio([{ prazoMedio: 0, valorTotal: 10 }]);
    expect(rows).toHaveLength(1);
    expect(FAIXAS_PRAZO_MEDIO.length).toBeGreaterThan(1); // existem outras faixas possíveis, só não apareceram
  });

  it('devolve vazio para entrada vazia', () => {
    expect(groupByFaixaPrazoMedio([])).toEqual([]);
  });

  it('soma devoluções (valor negativo) normalmente, sem filtrar', () => {
    const rows = groupByFaixaPrazoMedio([
      { prazoMedio: 10, valorTotal: 100 },
      { prazoMedio: 10, valorTotal: -30 },
    ]);
    expect(rows).toEqual([{ faixa: 'P4 (0 a 34 dias)', faturamento: 70 }]);
  });
});
