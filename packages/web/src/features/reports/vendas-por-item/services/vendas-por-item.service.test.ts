import { describe, expect, it, vi } from 'vitest';

import type {
  OpcoesDeFiltro,
  RawGroup,
  RawGroupWithLoja,
  RawResumo,
  VendasPorItemRepository,
} from '../repositories/vendas-por-item.repository';
import { VendasPorItemService } from './vendas-por-item.service';

const OPCOES_VAZIAS: OpcoesDeFiltro = {
  marcas: [],
  grupos: [],
  familias: [],
  linhas: [],
  tiposPreco: [],
};

function createRepository(
  porItem: RawGroup[],
  porItemELoja: RawGroupWithLoja[] = [],
  resumoPorGrupo: RawResumo[] = [],
  resumoPorLoja: RawResumo[] = [],
  opcoesDeFiltro: OpcoesDeFiltro = OPCOES_VAZIAS,
) {
  return {
    findAgrupadoPorItem: vi.fn(async () => porItem),
    findAgrupadoPorItemELoja: vi.fn(async () => porItemELoja),
    findResumoPorGrupo: vi.fn(async () => resumoPorGrupo),
    findResumoPorLoja: vi.fn(async () => resumoPorLoja),
    findOpcoesDeFiltro: vi.fn(async () => opcoesDeFiltro),
  } satisfies VendasPorItemRepository;
}

function rawGroup(overrides: Partial<RawGroup> = {}): RawGroup {
  return {
    linha: 'Linha X',
    familia: 'Pneus',
    grupo: 'Aro 15',
    marca: 'Marca X',
    item: 'Item A',
    tipoPreco: 'VAREJO',
    quantidade: 100,
    faturamento: 5000,
    ...overrides,
  };
}

describe('VendasPorItemService.getPorItem', () => {
  it('repassa os grupos já ordenados pelo repositório, com todas as dimensões e faturamento', async () => {
    const repository = createRepository([
      rawGroup(),
      rawGroup({ item: 'Item B', quantidade: 50, faturamento: 8000 }),
    ]);
    const service = new VendasPorItemService(repository);

    const result = await service.getPorItem();

    expect(result).toEqual([
      {
        linha: 'Linha X',
        familia: 'Pneus',
        grupo: 'Aro 15',
        marca: 'Marca X',
        item: 'Item A',
        tipoPreco: 'VAREJO',
        quantidade: 100,
        faturamento: 5000,
      },
      {
        linha: 'Linha X',
        familia: 'Pneus',
        grupo: 'Aro 15',
        marca: 'Marca X',
        item: 'Item B',
        tipoPreco: 'VAREJO',
        quantidade: 50,
        faturamento: 8000,
      },
    ]);
  });

  it('substitui campos nulos por "Não informado" em vez de descartar a linha', async () => {
    const repository = createRepository([
      rawGroup({
        linha: null,
        familia: null,
        grupo: null,
        marca: null,
        item: null,
        tipoPreco: null,
      }),
    ]);
    const service = new VendasPorItemService(repository);

    const result = await service.getPorItem();

    expect(result[0]).toMatchObject({
      linha: 'Não informado',
      familia: 'Não informado',
      grupo: 'Não informado',
      marca: 'Não informado',
      item: 'Não informado',
      tipoPreco: 'Não informado',
    });
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
  it('inclui a dimensão loja, faturamento e trata nulos', async () => {
    const repository = createRepository(
      [],
      [{ loja: null, ...rawGroup({ quantidade: 20, faturamento: 1000 }) }],
    );
    const service = new VendasPorItemService(repository);

    const result = await service.getPorItemPorLoja();

    expect(result).toEqual([
      {
        loja: 'Não informado',
        linha: 'Linha X',
        familia: 'Pneus',
        grupo: 'Aro 15',
        marca: 'Marca X',
        item: 'Item A',
        tipoPreco: 'VAREJO',
        quantidade: 20,
        faturamento: 1000,
      },
    ]);
  });
});

describe('VendasPorItemService.getResumoPorGrupo', () => {
  it('repassa o resumo já ordenado pelo repositório e trata nulos', async () => {
    const repository = createRepository([], [], [
      { chave: 'Aro 15', quantidade: 300, faturamento: 15000 },
      { chave: null, quantidade: 10, faturamento: 100 },
    ]);
    const service = new VendasPorItemService(repository);

    const result = await service.getResumoPorGrupo();

    expect(result).toEqual([
      { chave: 'Aro 15', quantidade: 300, faturamento: 15000 },
      { chave: 'Não informado', quantidade: 10, faturamento: 100 },
    ]);
  });

  it('repassa o filtro ao repositório', async () => {
    const repository = createRepository([]);
    const service = new VendasPorItemService(repository);
    const filter = { loja: '01 - MT' };

    await service.getResumoPorGrupo(filter);

    expect(repository.findResumoPorGrupo).toHaveBeenCalledWith(filter);
  });
});

describe('VendasPorItemService.getResumoPorLoja', () => {
  it('repassa o resumo já ordenado pelo repositório e trata nulos', async () => {
    const repository = createRepository([], [], [], [
      { chave: '01 - MT', quantidade: 500, faturamento: 30000 },
    ]);
    const service = new VendasPorItemService(repository);

    const result = await service.getResumoPorLoja();

    expect(result).toEqual([{ chave: '01 - MT', quantidade: 500, faturamento: 30000 }]);
  });

  it('repassa o filtro ao repositório', async () => {
    const repository = createRepository([]);
    const service = new VendasPorItemService(repository);
    const filter = { dataInicial: new Date('2026-07-01') };

    await service.getResumoPorLoja(filter);

    expect(repository.findResumoPorLoja).toHaveBeenCalledWith(filter);
  });
});

describe('VendasPorItemService.getOpcoesDeFiltro', () => {
  it('repassa as opções do repositório sem transformação', async () => {
    const opcoes: OpcoesDeFiltro = {
      marcas: ['Marca X', 'Marca Y'],
      grupos: ['Aro 15'],
      familias: ['Pneus'],
      linhas: ['Linha X'],
      tiposPreco: ['VAREJO', 'ATACADO'],
    };
    const repository = createRepository([], [], [], [], opcoes);
    const service = new VendasPorItemService(repository);

    expect(await service.getOpcoesDeFiltro()).toEqual(opcoes);
  });
});
