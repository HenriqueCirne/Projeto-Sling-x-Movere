'use server';

import { LOGIN_PATH } from '../auth.contract';
import { signOut } from '../auth';

/**
 * Encerra a sessão do gestor (Task 4).
 *
 * Como a sessão vive no banco (TD-01), `signOut` apaga a linha em `sessions`
 * além de limpar o cookie — o token deixa de valer imediatamente, inclusive em
 * outra aba que já o tivesse em mãos.
 */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: LOGIN_PATH });
}
