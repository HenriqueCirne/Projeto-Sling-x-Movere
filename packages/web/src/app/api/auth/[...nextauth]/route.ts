import { handlers } from '@/features/auth';

/**
 * Rotas internas do Auth.js (`/api/auth/*`): callback de credenciais, sessão,
 * CSRF e signout. São consumidas pelo próprio Auth.js — não chame direto.
 */
export const { GET, POST } = handlers;
