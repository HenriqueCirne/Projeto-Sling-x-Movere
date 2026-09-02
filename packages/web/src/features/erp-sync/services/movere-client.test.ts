import { describe, expect, it, vi } from 'vitest';

import { MoveresApiError } from '../erp-sync.contract';
import {
  fetchEstabelecimentos,
  fetchNotasFiscaisPaginado,
  fetchTiposDePrecos,
  loginMoveres,
} from './movere-client';

const CONFIG = {
  baseUrl: 'https://api.example.test',
  ambiente: 'Ambiente',
  usuario: 'user',
  senha: 'pass',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('loginMoveres', () => {
  it('retorna token e grupo em caso de sucesso', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ token: 'abc123', grupo: { codigo: 5, nome: 'SEM ACESSO' } }),
    );

    const session = await loginMoveres(CONFIG, fetchImpl);

    expect(session.token).toBe('abc123');
    expect(session.grupo).toEqual({ codigo: 5, nome: 'SEM ACESSO' });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.example.test/api/LoginComAmbiente',
      expect.objectContaining({ method: 'POST' }),
    );
    // nunca deve mandar a senha em query string / URL
    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url).not.toContain('pass');
  });

  it('aceita Token/Grupo com maiúscula (mesma cautela de casing do Achado 3/8)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ Token: 'xyz' }));
    const session = await loginMoveres(CONFIG, fetchImpl);
    expect(session.token).toBe('xyz');
    expect(session.grupo).toBeNull();
  });

  it('lança MoveresApiError em HTTP não-2xx', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 400));
    await expect(loginMoveres(CONFIG, fetchImpl)).rejects.toThrow(MoveresApiError);
  });

  it('lança MoveresApiError se a resposta não tiver token', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ grupo: null }));
    await expect(loginMoveres(CONFIG, fetchImpl)).rejects.toThrow(MoveresApiError);
  });
});

describe('fetchEstabelecimentos / fetchTiposDePrecos', () => {
  it('retorna o array quando a resposta é válida', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse([{ codigoEstabelecimento: 1, nome: '01 - MT', ativo: true }]));
    const result = await fetchEstabelecimentos(CONFIG, 'token', fetchImpl);
    expect(result).toEqual([{ codigoEstabelecimento: 1, nome: '01 - MT', ativo: true }]);
  });

  it('retorna [] se a resposta não for um array', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(null));
    const result = await fetchTiposDePrecos(CONFIG, 'token', fetchImpl);
    expect(result).toEqual([]);
  });

  it('lança MoveresApiError em HTTP não-2xx', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 500));
    await expect(fetchEstabelecimentos(CONFIG, 'token', fetchImpl)).rejects.toThrow(
      MoveresApiError,
    );
  });
});

describe('fetchNotasFiscaisPaginado', () => {
  it('acumula páginas até vir vazia (array vazio)', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(Array.from({ length: 100 }, (_, i) => ({ id: i }))))
      .mockResolvedValueOnce(jsonResponse(Array.from({ length: 15 }, (_, i) => ({ id: 100 + i }))))
      .mockResolvedValueOnce(jsonResponse([]));

    const notas = await fetchNotasFiscaisPaginado(
      CONFIG,
      'token',
      { codigoLoja: 1, emissaoInicial: '2026-07-01', emissaoFinal: '2026-08-31' },
      fetchImpl,
    );

    expect(notas).toHaveLength(115);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('para quando a página vem `null` (Achado 8 — fim de dados real da API)', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ id: 1 }]))
      .mockResolvedValueOnce(jsonResponse(null));

    const notas = await fetchNotasFiscaisPaginado(
      CONFIG,
      'token',
      { codigoLoja: 1, emissaoInicial: '2026-08-03', emissaoFinal: '2026-08-03' },
      fetchImpl,
    );

    expect(notas).toEqual([{ id: 1 }]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('passa codigoLoja/emissaoInicial/emissaoFinal/pagina na query string', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse([]));
    await fetchNotasFiscaisPaginado(
      CONFIG,
      'token',
      { codigoLoja: 7, emissaoInicial: '2026-07-01', emissaoFinal: '2026-08-31' },
      fetchImpl,
    );
    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url).toContain('codigoLoja=7');
    expect(url).toContain('emissaoInicial=2026-07-01');
    expect(url).toContain('emissaoFinal=2026-08-31');
    expect(url).toContain('pagina=1');
  });

  it('lança MoveresApiError se alguma página falhar', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 503));
    await expect(
      fetchNotasFiscaisPaginado(
        CONFIG,
        'token',
        { codigoLoja: 1, emissaoInicial: '2026-07-01', emissaoFinal: '2026-08-31' },
        fetchImpl,
      ),
    ).rejects.toThrow(MoveresApiError);
  });
});
