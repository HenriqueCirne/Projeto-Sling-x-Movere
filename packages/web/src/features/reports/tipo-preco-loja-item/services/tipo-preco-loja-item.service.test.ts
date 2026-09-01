import { describe, expect, it, vi } from 'vitest';

import type {
  RawGroup,
  TipoPrecoLojaItemRepository,
} from '../repositories/tipo-preco-loja-item.repository';
import { TipoPrecoLojaItemService } from './tipo-preco-loja-item.service';

function createRepository(groups: RawGroup[]) {
  return { findCruzamento: vi.fn(async () => groups) } satisfies TipoPrecoLojaItemRepository;
}

describe('TipoPrecoLojaItemService', () => {
  it('repassa as 3 dimensões e as 2 métricas', async () => {
    const repository = createRepository([
      {
        tipoPreco: 'VAREJO',
        loja: '01 - MT',
        item: 'Item A',
        faturamento: 500,
        quantidade: 10,
      },
    ]);
    const service = new TipoPrecoLojaItemService(repository);

    expect(await service.getCruzamento()).toEqual([
      { tipoPreco: 'VAREJO', loja: '01 - MT', item: 'Item A', faturamento: 500, quantidade: 10 },
    ]);
  });

  it('substitui qualquer dimensão nula por "Não informado"', async () => {
    const repository = createRepository([
      { tipoPreco: null, loja: null, item: null, faturamento: 10, quantidade: 1 },
    ]);
    const service = new TipoPrecoLojaItemService(repository);

    expect(await service.getCruzamento()).toEqual([
      {
        tipoPreco: 'Não informado',
        loja: 'Não informado',
        item: 'Não informado',
        faturamento: 10,
        quantidade: 1,
      },
    ]);
  });
});
