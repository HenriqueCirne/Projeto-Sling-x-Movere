import { DEFAULT_AUTHENTICATED_PATH, LOGIN_PATH, REPORTS_PATH_PREFIX } from '../auth.contract';

/**
 * Regras puras de proteção de rota (AC2).
 *
 * Separadas do `src/proxy.ts` porque proxy é um ponto de integração do
 * framework — difícil de exercitar em teste. As decisões ficam aqui, testáveis
 * como funções; o proxy só liga os fios.
 */

/**
 * Prefixos que exigem sessão. Ao criar uma nova área autenticada, acrescente
 * o prefixo aqui **e** em `src/proxy.ts#config.matcher` (o Next.js exige que
 * o matcher do proxy seja um array estático — não dá para derivá-lo deste
 * array em tempo de execução) **e** coloque a rota sob `src/app/(protected)/`.
 * As três coisas: o proxy é a rede de segurança rápida (cookie), o layout é
 * a autorização de verdade (sessão no banco).
 *
 * Story 2.1 esqueceu o passo do proxy ao adicionar `/relatorios` — descoberto
 * só em teste manual (as rotas continuaram protegidas pelo layout, mas sem o
 * atalho otimista). Ver MNT-002 no gate da Story 1.5, que já previu este
 * exato risco.
 */
export const PROTECTED_PATH_PREFIXES = [DEFAULT_AUTHENTICATED_PATH, REPORTS_PATH_PREFIX] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Detecta caracteres de controle, que permitem contrabandear cabeçalhos. */
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

/**
 * Valida um destino pós-login vindo da URL (`?callbackUrl=`).
 *
 * Só aceita caminho relativo à própria aplicação. Sem isso,
 * `/login?callbackUrl=https://sitemalicioso/` transforma a tela de login em um
 * open redirect — a isca clássica de phishing, hospedada no domínio confiável.
 *
 * @param rawCallbackUrl - Valor não confiável, direto da query string.
 */
export function sanitizeCallbackUrl(
  rawCallbackUrl: string | null | undefined,
  fallback: string = DEFAULT_AUTHENTICATED_PATH,
): string {
  if (typeof rawCallbackUrl !== 'string' || rawCallbackUrl.length === 0) {
    return fallback;
  }

  // Precisa começar com uma única barra: `//host` e `/\host` são interpretados
  // como URLs absolutas protocol-relative pelos navegadores.
  if (!rawCallbackUrl.startsWith('/')) {
    return fallback;
  }
  if (rawCallbackUrl.startsWith('//') || rawCallbackUrl.startsWith('/\\')) {
    return fallback;
  }
  if (CONTROL_CHARACTERS.test(rawCallbackUrl)) {
    return fallback;
  }

  return rawCallbackUrl;
}

/**
 * Monta o destino de redirecionamento para quem tentou acessar rota protegida
 * sem sessão, preservando a intenção original em `callbackUrl`.
 */
export function buildLoginRedirectPath(pathname: string, search = ''): string {
  const attempted = sanitizeCallbackUrl(`${pathname}${search}`, DEFAULT_AUTHENTICATED_PATH);
  return `${LOGIN_PATH}?callbackUrl=${encodeURIComponent(attempted)}`;
}
