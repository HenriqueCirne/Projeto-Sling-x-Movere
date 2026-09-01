/**
 * Fachada da feature `auth` (server-only).
 *
 * Componentes de cliente (`LoginForm`, `SignOutButton`) NÃO são reexportados
 * aqui de propósito: este barrel arrasta Prisma e argon2 e não pode acabar no
 * bundle do navegador. Importe-os pelo caminho do componente.
 */
export {
  DEFAULT_AUTHENTICATED_PATH,
  INVALID_CREDENTIALS_MESSAGE,
  LOGIN_PATH,
  SESSION_MAX_AGE_SECONDS,
  SESSION_UPDATE_AGE_SECONDS,
  type AuthenticatedUser,
  type CredentialsContract,
  type LoginResult,
  type UserRole,
} from './auth.contract';

export { auth, handlers, signIn, signOut } from './auth';
export { sanitizeCallbackUrl } from './services/route-guard.service';
