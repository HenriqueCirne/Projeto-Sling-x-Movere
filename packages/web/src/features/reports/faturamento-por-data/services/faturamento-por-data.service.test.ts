import { describe, expect, it, vi } from 'vitest';

import type {
  FaturamentoPorDataRepository,
  RawEntry,
} from '../repositories/faturamento-por-data.repository';
import { FaturamentoPorDataService } from './faturamento-por-data.service';

function createRepository(entries: RawEntry[]) {
  return { findRawEntries: vi.fn(async () => entries) } satisfies FaturamentoPorDataRepository;
}

describe('FaturamentoPorDataService', () => {
  it('agrega o faturamento por dia', async () => {
    const repository = createRepository([
      { dataEmissao: new Date('2026-08-03T09:00:00.000Z'), valorTotal: 100 },
      { dataEmissao: new Date('2026-08-03T15:00:00.000Z'), valorTotal: 50 },
      { dataEmissao: new Date('2026-08-04T09:00:00.000Z'), valorTotal: 200 },
    ]);
    const service = new FaturamentoPorDataService(repository);

    const serie = await service.getSerieDiaria();

    expect(serie).toEqual([
      { data: '2026-08-03', faturamento: 150 },
      { data: '2026-08-04', faturamento: 200 },
    ]);
  });

  it('ordena a série ascendentemente por data, independente da ordem de chegada', async () => {
    const repository = createRepository([
      { dataEmissao: new Date('2026-08-05T00:00:00.000Z'), valorTotal: 10 },
      { dataEmissao: new Date('2026-08-01T00:00:00.000Z'), valorTotal: 20 },
    ]);
    const service = new FaturamentoPorDataService(repository);

    const serie = await service.getSerieDiaria();

    expect(serie.map((p) => p.data)).toEqual(['2026-08-01', '2026-08-05']);
  });

  it('não filtra devoluções (valor negativo somado normalmente)', async () => {
    const repository = createRepository([
      { dataEmissao: new Date('2026-08-03T00:00:00.000Z'), valorTotal: 100 },
      { dataEmissao: new Date('2026-08-03T00:00:00.000Z'), valorTotal: -30 },
    ]);
    const service = new FaturamentoPorDataService(repository);

    const serie = await service.getSerieDiaria();

    expect(serie).toEqual([{ data: '2026-08-03', faturamento: 70 }]);
  });

  it('devolve série vazia quando não há lançamentos no período', async () => {
    const repository = createRepository([]);
    const service = new FaturamentoPorDataService(repository);

    expect(await service.getSerieDiaria()).toEqual([]);
  });

  it('repassa o filtro informado ao repositório', async () => {
    const repository = createRepository([]);
    const service = new FaturamentoPorDataService(repository);
    const filter = { loja: '01 - MT' };

    await service.getSerieDiaria(filter);

    expect(repository.findRawEntries).toHaveBeenCalledWith(filter);
  });
});
