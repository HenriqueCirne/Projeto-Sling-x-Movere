import { describe, expect, it, vi } from 'vitest';

import type {
  RawGroup,
  RawGroupWithLoja,
  VendasPorItemRepository,
} from '../repositories/vendas-por-item.repository';
import { VendasPorItemService } from './vendas-por-item.service';

function createRepository(porItem: RawGroup[], porItemELoja: RawGroupWithLoja[] = []) {
  return {
    findAgrupadoPorItem: vi.fn(async () => porItem),
    findAgrupadoPorItemELoja: vi.fn(async () => porItemELoja),
  } satisfies VendasPorItemRepository;
}

describe('VendasPorItemService.getPorItem', () => {
  it('repassa os grupos já ordenados pelo repositório', async () => {
    const repository = createRepository([
      { familia: 'Pneus', grupo: 'Aro 15', item: 'Item A', quantidade: 100 },
      { familia: 'Pneus', grupo: 'Aro 17', item: 'Item B', quantidade: 50 },
    ]);
    const service = new VendasPorItemService(repository);

    const result = await service.getPorItem();

    expect(result).toEqual([
      { familia: 'Pneus', grupo: 'Aro 15', item: 'Item A', quantidade: 100 },
      { familia: 'Pneus', grupo: 'Aro 17', item: 'Item B', quantidade: 50 },
    ]);
  });

  it('substitui campos nulos por "Não informado" em vez de descartar a linha', async () => {
    const repository = createRepository([
      { familia: null, grupo: null, item: null, quantidade: 10 },
    ]);
    const service = new VendasPorItemService(repository);

    const result = await service.getPorItem();

    expect(result).toEqual([
      { familia: 'Não informado', grupo: 'Não informado', item: 'Não informado', quantidade: 10 },
    ]);
  });

  it('repassa o filtro ao repositório', async () => {
    const repository = createRepository([]);
    const service = new VendasPorItemService(repository);
    const filter = { loja: '01 - MT' };

    await service.getPorItem(filter);

    expect(repository.findAgrupadoPorItem).toHaveBeenCalledWith(filter);
  });
});

describe('VendasPorItemService.getPorItemPorLoja', () => {
  it('inclui a dimensão loja e trata nulos', async () => {
    const repository = createRepository([], [
      { loja: null, familia: 'Pneus', grupo: 'Aro 15', item: 'Item A', quantidade: 20 },
    ]);
    const service = new VendasPorItemService(repository);

    const result = await service.getPorItemPorLoja();

    expect(result).toEqual([
      {
        loja: 'Não informado',
        familia: 'Pneus',
        grupo: 'Aro 15',
        item: 'Item A',
        quantidade: 20,
      },
    ]);
  });
});
