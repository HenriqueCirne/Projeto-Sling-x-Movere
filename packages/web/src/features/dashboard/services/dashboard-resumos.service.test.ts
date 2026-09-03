import { describe, expect, it, vi } from 'vitest';

import type {
  DashboardResumosRepository,
  RawResumosPorDimensao,
} from '../repositories/dashboard-resumos.repository';
import { DashboardResumosService } from './dashboard-resumos.service';

const RAW_VAZIO: RawResumosPorDimensao = {
  loja: [],
  linha: [],
  familia: [],
  grupo: [],
  marca: [],
  tipoPreco: [],
};

function createRepository(raw: Partial<RawResumosPorDimensao> = {}) {
  return {
    findResumosPorDimensao: vi.fn(async () => ({ ...RAW_VAZIO, ...raw })),
  } satisfies DashboardResumosRepository;
}

describe('DashboardResumosService.getResumosPorDimensao', () => {
  it('mapeia cada dimensão, substituindo chave nula por "Não informado"', async () => {
    const repository = createRepository({
      loja: [
        { chave: '01 - MT', faturamento: 1000 },
        { chave: null, faturamento: 50 },
      ],
      marca: [{ chave: 'Marca X', faturamento: 500 }],
    });
    const service = new DashboardResumosService(repository);

    const result = await service.getResumosPorDimensao();

    expect(result.loja).toEqual([
      { chave: '01 - MT', faturamento: 1000 },
      { chave: 'Não informado', faturamento: 50 },
    ]);
    expect(result.marca).toEqual([{ chave: 'Marca X', faturamento: 500 }]);
    expect(result.linha).toEqual([]);
    expect(result.familia).toEqual([]);
    expect(result.grupo).toEqual([]);
    expect(result.tipoPreco).toEqual([]);
  });

  it('repassa o filtro ao repositório', async () => {
    const repository = createRepository();
    const service = new DashboardResumosService(repository);
    const filter = { loja: '01 - MT' };

    await service.getResumosPorDimensao(filter);

    expect(repository.findResumosPorDimensao).toHaveBeenCalledWith(filter);
  });

  it('devolve as 6 dimensões vazias quando não há dado', async () => {
    const repository = createRepository();
    const service = new DashboardResumosService(repository);

    const result = await service.getResumosPorDimensao();

    expect(result).toEqual({
      loja: [],
      linha: [],
      familia: [],
      grupo: [],
      marca: [],
      tipoPreco: [],
    });
  });
});
