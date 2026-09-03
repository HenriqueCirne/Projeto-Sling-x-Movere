import { describe, expect, it, vi } from 'vitest';

import type {
  RawEntry,
  VendasPorFaixaPrazoMedioRepository,
} from '../repositories/vendas-por-faixa-prazo-medio.repository';
import { VendasPorFaixaPrazoMedioService } from './vendas-por-faixa-prazo-medio.service';

function createRepository(entries: RawEntry[]) {
  return {
    findRawEntries: vi.fn(async () => entries),
  } satisfies VendasPorFaixaPrazoMedioRepository;
}

describe('VendasPorFaixaPrazoMedioService', () => {
  it('agrupa as linhas brutas por faixa de Prazo Médio', async () => {
    const repository = createRepository([
      { prazoMedio: 10, valorTotal: 100 },
      { prazoMedio: 200, valorTotal: 50 },
    ]);
    const service = new VendasPorFaixaPrazoMedioService(repository);

    expect(await service.getVendasPorFaixa()).toEqual([
      { faixa: 'P4 (0 a 34 dias)', faturamento: 100 },
      { faixa: 'P1 (acima de 109 dias)', faturamento: 50 },
    ]);
  });

  it('repassa o filtro ao repositório', async () => {
    const repository = createRepository([]);
    const service = new VendasPorFaixaPrazoMedioService(repository);
    const filter = { dataInicial: new Date('2026-07-01') };

    await service.getVendasPorFaixa(filter);

    expect(repository.findRawEntries).toHaveBeenCalledWith(filter);
  });

  it('devolve vazio quando não há lançamentos', async () => {
    const repository = createRepository([]);
    const service = new VendasPorFaixaPrazoMedioService(repository);
    expect(await service.getVendasPorFaixa()).toEqual([]);
  });
});
