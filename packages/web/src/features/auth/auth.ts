import NextAuth from 'next-auth';

import { authConfig } from './auth.config';

/**
 * Instância única do Auth.js.
 *
 * `auth()` é a checagem de sessão AUTORITATIVA — ela consulta a linha em
 * `sessions` no banco. É o que deve ser usado em Server Components, Route
 * Handlers e Server Actions. O `src/proxy.ts` faz apenas uma checagem otimista
 * de presença de cookie e nunca substitui esta.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
