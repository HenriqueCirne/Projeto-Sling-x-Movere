import { describe, expect, it, vi } from 'vitest';

import type {
  RankingClientesRepository,
  RawGroup,
} from '../repositories/ranking-clientes.repository';
import { RankingClientesService } from './ranking-clientes.service';

function createRepository(groups: RawGroup[]) {
  return {
    findAgrupadoPorCliente: vi.fn(async () => groups),
  } satisfies RankingClientesRepository;
}

describe('RankingClientesService', () => {
  it('numera a posição 1-based na ordem devolvida pelo repositório', async () => {
    const repository = createRepository([
      { cliente: 'Cliente A', faturamento: 1000 },
      { cliente: 'Cliente B', faturamento: 500 },
      { cliente: 'Cliente C', faturamento: 100 },
    ]);
    const service = new RankingClientesService(repository);

    expect(await service.getRanking()).toEqual([
      { posicao: 1, cliente: 'Cliente A', faturamento: 1000 },
      { posicao: 2, cliente: 'Cliente B', faturamento: 500 },
      { posicao: 3, cliente: 'Cliente C', faturamento: 100 },
    ]);
  });

  it('devolve lista vazia quando não há clientes no período', async () => {
    const repository = createRepository([]);
    const service = new RankingClientesService(repository);

    expect(await service.getRanking()).toEqual([]);
  });

  it('repassa o filtro ao repositório', async () => {
    const repository = createRepository([]);
    const service = new RankingClientesService(repository);
    const filter = { dataInicial: new Date('2026-07-01') };

    await service.getRanking(filter);

    expect(repository.findAgrupadoPorCliente).toHaveBeenCalledWith(filter);
  });
});
