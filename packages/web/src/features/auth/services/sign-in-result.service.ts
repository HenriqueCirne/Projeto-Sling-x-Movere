/**
 * Interpretação do retorno de `signIn(..., { redirect: false })`.
 *
 * Com `redirect: false`, o Auth.js **não lança** em credencial inválida: ele
 * devolve a URL para onde teria redirecionado, e é o parâmetro `error` dessa
 * URL que carrega a falha. Uma Server Action que só use `try/catch` conclui
 * silenciosamente que o login deu certo e devolve o usuário para uma área
 * protegida sem sessão.
 */

/** Base arbitrária: só serve para permitir `new URL` com caminhos relativos. */
const RELATIVE_URL_BASE = 'http://localhost';

/**
 * Indica se o retorno de `signIn` representa uma falha de autenticação.
 *
 * @param signInResult - Valor retornado por `signIn(..., { redirect: false })`.
 * @returns `true` para falha. Retorno em formato inesperado é tratado como
 *   falha — na dúvida, não conceder acesso.
 */
export function isFailedSignInResult(signInResult: unknown): boolean {
  if (typeof signInResult !== 'string' || signInResult.length === 0) {
    return true;
  }

  try {
    return new URL(signInResult, RELATIVE_URL_BASE).searchParams.has('error');
  } catch {
    return true;
  }
}
