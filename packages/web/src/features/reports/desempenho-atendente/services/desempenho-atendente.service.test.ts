import { describe, expect, it, vi } from 'vitest';

import type {
  DesempenhoAtendenteRepository,
  RawGroup,
} from '../repositories/desempenho-atendente.repository';
import { DesempenhoAtendenteService } from './desempenho-atendente.service';

function createRepository(groups: RawGroup[]) {
  return {
    findAgrupadoPorAtendente: vi.fn(async () => groups),
  } satisfies DesempenhoAtendenteRepository;
}

describe('DesempenhoAtendenteService', () => {
  it('marca apenas o primeiro (maior faturamento) como melhor desempenho', async () => {
    const repository = createRepository([
      { atendente: 'Atendente A', faturamento: 1000, quantidade: 20 },
      { atendente: 'Atendente B', faturamento: 500, quantidade: 15 },
    ]);
    const service = new DesempenhoAtendenteService(repository);

    const result = await service.getDesempenho();

    expect(result[0]).toMatchObject({ atendente: 'Atendente A', melhorDesempenho: true });
    expect(result[1]).toMatchObject({ atendente: 'Atendente B', melhorDesempenho: false });
  });

  it('substitui atendente nulo por "Não informado"', async () => {
    const repository = createRepository([{ atendente: null, faturamento: 10, quantidade: 1 }]);
    const service = new DesempenhoAtendenteService(repository);

    expect((await service.getDesempenho())[0]?.atendente).toBe('Não informado');
  });

  it('devolve lista vazia sem erro quando não há lançamentos', async () => {
    const repository = createRepository([]);
    const service = new DesempenhoAtendenteService(repository);

    expect(await service.getDesempenho()).toEqual([]);
  });
});
