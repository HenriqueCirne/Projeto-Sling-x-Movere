/**
 * Nomenclatura do cookie de sessão.
 *
 * Módulo deliberadamente SEM DEPENDÊNCIAS: ele é consultado tanto pela
 * configuração do Auth.js (que carrega Prisma e argon2) quanto pelo
 * `src/proxy.ts`, que roda antes de qualquer rota e não pode arrastar o cliente
 * de banco junto.
 */

/** Nome base do cookie de sessão (convenção do Auth.js v5). */
export const SESSION_COOKIE_BASE_NAME = 'authjs.session-token';

/**
 * O cookie deve ter os atributos `Secure` e o prefixo `__Secure-` em produção
 * (TD-01). Em desenvolvimento o servidor roda em `http://localhost`, onde um
 * cookie `Secure` simplesmente não é enviado pelo navegador — o login pararia
 * de funcionar localmente.
 */
export function usesSecureCookies(nodeEnv: string | undefined = process.env.NODE_ENV): boolean {
  return nodeEnv === 'production';
}

/** Nome efetivo do cookie de sessão para o ambiente informado. */
export function getSessionCookieName(secure: boolean = usesSecureCookies()): string {
  return secure ? `__Secure-${SESSION_COOKIE_BASE_NAME}` : SESSION_COOKIE_BASE_NAME;
}

/**
 * Ambos os nomes possíveis.
 *
 * O `proxy.ts` verifica os dois em vez de deduzir o ambiente: um proxy que
 * procura o nome errado deixa de redirecionar (falso "autenticado") ou
 * redireciona sempre (login em laço). Verificar os dois é uma checagem
 * otimista — a autorização real acontece no Server Component.
 */
export const SESSION_COOKIE_NAMES = [
  getSessionCookieName(false),
  getSessionCookieName(true),
] as const;
