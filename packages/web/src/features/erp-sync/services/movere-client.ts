import { MoveresApiError } from '../erp-sync.contract';

export type MoveresConfig = {
  baseUrl: string;
  ambiente: string;
  usuario: string;
  senha: string;
};

export type MoveresSession = {
  token: string;
  grupo: { codigo: number; nome: string } | null;
};

export type Estabelecimento = { codigoEstabelecimento: number; nome: string; ativo: boolean };
export type TipoDePreco = { codigoTipoPreco: number; nome: string };

/** Tamanho de página observado empiricamente (Achado 8) — a API não documenta isso. */
const PAGE_SIZE_SAFETY_CAP = 1000;

/**
 * Autentica na API Moveres. **Nunca loga `senha`** — só o resultado
 * (sucesso/falha) e o `grupo` retornado (não é segredo, é metadado de
 * permissão, já citado nos documentos técnicos do projeto).
 *
 * @throws {MoveresApiError} HTTP não-2xx ou resposta sem token.
 */
export async function loginMoveres(
  config: MoveresConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<MoveresSession> {
  const response = await fetchImpl(`${config.baseUrl}/api/LoginComAmbiente`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ambiente: config.ambiente,
      usuario: config.usuario,
      senha: config.senha,
    }),
  });

  if (!response.ok) {
    throw new MoveresApiError(`Falha ao autenticar na API Moveres: HTTP ${response.status}`);
  }

  const body = (await response.json()) as Record<string, unknown>;
  const token = body.token ?? body.Token;
  if (typeof token !== 'string' || token.length === 0) {
    throw new MoveresApiError('Login na API Moveres retornou 200 mas sem token na resposta.');
  }

  const grupoRaw = (body.grupo ?? body.Grupo) as { codigo?: unknown; nome?: unknown } | undefined;
  const grupo =
    grupoRaw && typeof grupoRaw.codigo === 'number' && typeof grupoRaw.nome === 'string'
      ? { codigo: grupoRaw.codigo, nome: grupoRaw.nome }
      : null;

  return { token, grupo };
}

async function authorizedGet(
  baseUrl: string,
  path: string,
  token: string,
  fetchImpl: typeof fetch,
): Promise<unknown> {
  const response = await fetchImpl(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new MoveresApiError(`Falha ao chamar ${path}: HTTP ${response.status}`);
  }
  return response.json();
}

/** `GET /api/Estabelecimentos` — catálogo de lojas (código → nome). */
export async function fetchEstabelecimentos(
  config: MoveresConfig,
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Estabelecimento[]> {
  const body = await authorizedGet(config.baseUrl, '/api/Estabelecimentos', token, fetchImpl);
  return Array.isArray(body) ? (body as Estabelecimento[]) : [];
}

/** `GET /api/TiposDePrecos` — catálogo de tipo de preço (código → nome). */
export async function fetchTiposDePrecos(
  config: MoveresConfig,
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<TipoDePreco[]> {
  const body = await authorizedGet(config.baseUrl, '/api/TiposDePrecos', token, fetchImpl);
  return Array.isArray(body) ? (body as TipoDePreco[]) : [];
}

/**
 * `GET /api/NotasFiscaisEmitidas`, paginado até a página vir vazia.
 *
 * A API não documenta o tamanho de página nem confirma o índice inicial —
 * empiricamente (Achado 8) a página 1 tem 100 resultados e uma página sem
 * mais dados retorna o corpo `null` (HTTP 200, não um erro). O laço para
 * quando a página não é um array não-vazio, com um teto de segurança para
 * nunca rodar indefinidamente se a API se comportar de forma inesperada.
 *
 * @throws {MoveresApiError} HTTP não-2xx em qualquer página.
 */
export async function fetchNotasFiscaisPaginado(
  config: MoveresConfig,
  token: string,
  params: { codigoLoja: number; emissaoInicial: string; emissaoFinal: string },
  fetchImpl: typeof fetch = fetch,
): Promise<unknown[]> {
  const todasAsNotas: unknown[] = [];

  for (let pagina = 1; pagina <= PAGE_SIZE_SAFETY_CAP; pagina++) {
    const query = new URLSearchParams({
      codigoLoja: String(params.codigoLoja),
      emissaoInicial: params.emissaoInicial,
      emissaoFinal: params.emissaoFinal,
      pagina: String(pagina),
    });

    const body = await authorizedGet(
      config.baseUrl,
      `/api/NotasFiscaisEmitidas?${query.toString()}`,
      token,
      fetchImpl,
    );

    if (!Array.isArray(body) || body.length === 0) break;
    todasAsNotas.push(...body);
  }

  return todasAsNotas;
}
