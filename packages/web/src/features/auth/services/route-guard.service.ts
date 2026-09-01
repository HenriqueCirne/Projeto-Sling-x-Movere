import { DEFAULT_AUTHENTICATED_PATH } from '../auth.contract';

/**
 * Sanitização de destino pós-login.
 *
 * A checagem de rota protegida (`isProtectedPath`/`PROTECTED_PATH_PREFIXES`)
 * que vivia aqui foi removida em 2026-09-01 — decisão do stakeholder de
 * remover a exigência de sessão (ver `docs/architecture/tech-decisions.md#TD-06`).
 * `sanitizeCallbackUrl` continua em uso: a tela de login em si não foi
 * removida, só deixou de ser obrigatória.
 */

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
