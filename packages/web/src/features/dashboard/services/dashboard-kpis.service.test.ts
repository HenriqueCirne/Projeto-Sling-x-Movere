import { describe, expect, it, vi } from 'vitest';

import type {
  DashboardAggregates,
  DashboardKpisRepository,
} from '../repositories/dashboard-kpis.repository';
import { DashboardKpisService } from './dashboard-kpis.service';

const baseAggregates: DashboardAggregates = {
  faturamentoTotal: 10_394_644.52,
  quantidadeTotal: 49_265,
  numeroDeLancamentos: 23_724,
  numeroDeClientesDistintos: 5_186,
};

function createRepository(aggregates: DashboardAggregates) {
  return {
    getAggregates: vi.fn(async () => aggregates),
  } satisfies DashboardKpisRepository;
}

describe('DashboardKpisService', () => {
  it('repassa faturamento, quantidade, nº de lançamentos e nº de clientes do repositório', async () => {
    const repository = createRepository(baseAggregates);
    const service = new DashboardKpisService(repository);

    const kpis = await service.getKpis();

    expect(kpis.faturamentoTotal).toBe(baseAggregates.faturamentoTotal);
    expect(kpis.quantidadeTotal).toBe(baseAggregates.quantidadeTotal);
    expect(kpis.numeroDeLancamentos).toBe(baseAggregates.numeroDeLancamentos);
    expect(kpis.numeroDeClientes).toBe(baseAggregates.numeroDeClientesDistintos);
  });

  it('calcula Ticket Médio = Faturamento Total ÷ Nº de Lançamentos (paridade com a planilha, TD-04)', async () => {
    const repository = createRepository(baseAggregates);
    const service = new DashboardKpisService(repository);

    const kpis = await service.getKpis();

    // 10.394.644,52 / 23.724 ≈ 438,15 — o número que a planilha de referência
    // do TD-04 reporta. Ponto de regressão: se alguém trocar a fórmula para
    // "por venda" (dividir por clientes ou por documento), este teste falha.
    expect(kpis.ticketMedio).toBeCloseTo(438.15, 2);
  });

  it('não filtra devoluções: um faturamento líquido menor (por causa de valores negativos) ainda é repassado como está', async () => {
    // As 73 devoluções do TD-04 já vêm compensadas no SUM feito pelo
    // repositório (valores negativos). O service não deve "corrigir" nada.
    const repository = createRepository({ ...baseAggregates, faturamentoTotal: -336_972.09 });
    const service = new DashboardKpisService(repository);

    const kpis = await service.getKpis();

    expect(kpis.faturamentoTotal).toBe(-336_972.09);
  });

  it('retorna Ticket Médio = 0 (não NaN/Infinity) quando não há lançamentos no período (estado vazio)', async () => {
    const repository = createRepository({
      faturamentoTotal: 0,
      quantidadeTotal: 0,
      numeroDeLancamentos: 0,
      numeroDeClientesDistintos: 0,
    });
    const service = new DashboardKpisService(repository);

    const kpis = await service.getKpis();

    expect(kpis.ticketMedio).toBe(0);
    expect(Number.isFinite(kpis.ticketMedio)).toBe(true);
  });

  it('repassa o período informado ao repositório', async () => {
    const repository = createRepository(baseAggregates);
    const service = new DashboardKpisService(repository);
    const period = { dataInicial: new Date('2026-07-01'), dataFinal: new Date('2026-08-31') };

    await service.getKpis(period);

    expect(repository.getAggregates).toHaveBeenCalledWith(period);
  });

  it('usa período vazio (todos os lançamentos) quando nenhum é informado', async () => {
    const repository = createRepository(baseAggregates);
    const service = new DashboardKpisService(repository);

    await service.getKpis();

    expect(repository.getAggregates).toHaveBeenCalledWith({});
  });
});
