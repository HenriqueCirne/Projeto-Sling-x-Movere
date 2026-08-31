import { describe, expect, it, vi } from 'vitest';

import type {
  FaturamentoPorCondicaoPagamentoRepository,
  RawGroup,
} from '../repositories/faturamento-por-condicao-pagamento.repository';
import { FaturamentoPorCondicaoPagamentoService } from './faturamento-por-condicao-pagamento.service';

function createRepository(groups: RawGroup[]) {
  return {
    findAgrupadoPorCondicao: vi.fn(async () => groups),
  } satisfies FaturamentoPorCondicaoPagamentoRepository;
}

describe('FaturamentoPorCondicaoPagamentoService', () => {
  it('repassa os grupos já ordenados', async () => {
    const repository = createRepository([
      { condicaoPagamento: 'DINHEIRO', faturamento: 1000 },
      { condicaoPagamento: 'CHEQUE', faturamento: 500 },
    ]);
    const service = new FaturamentoPorCondicaoPagamentoService(repository);

    expect(await service.getFaturamentoPorCondicao()).toEqual([
      { condicaoPagamento: 'DINHEIRO', faturamento: 1000 },
      { condicaoPagamento: 'CHEQUE', faturamento: 500 },
    ]);
  });

  it('substitui condição nula por "Não informado"', async () => {
    const repository = createRepository([{ condicaoPagamento: null, faturamento: 10 }]);
    const service = new FaturamentoPorCondicaoPagamentoService(repository);

    expect(await service.getFaturamentoPorCondicao()).toEqual([
      { condicaoPagamento: 'Não informado', faturamento: 10 },
    ]);
  });

  it('repassa o filtro ao repositório', async () => {
    const repository = createRepository([]);
    const service = new FaturamentoPorCondicaoPagamentoService(repository);
    const filter = { loja: '01 - MT' };

    await service.getFaturamentoPorCondicao(filter);

    expect(repository.findAgrupadoPorCondicao).toHaveBeenCalledWith(filter);
  });
});
