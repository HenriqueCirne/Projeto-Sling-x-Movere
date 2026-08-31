'use server';

import { AuthError } from 'next-auth';
import { z } from 'zod';

import { INVALID_CREDENTIALS_MESSAGE, type LoginResult } from '../auth.contract';
import { CREDENTIALS_PROVIDER_ID } from '../auth.config';
import { signIn } from '../auth';
import { loginSchema, normalizeEmail } from '../schemas/credentials.schema';
import { sanitizeCallbackUrl } from '../services/route-guard.service';
import { isFailedSignInResult } from '../services/sign-in-result.service';

const loginActionSchema = loginSchema.extend({
  callbackUrl: z.string().optional(),
});

const failure = (): LoginResult => ({ ok: false, message: INVALID_CREDENTIALS_MESSAGE });

/**
 * Autentica o gestor e estabelece a sessão (AC1, AC3, AC4).
 *
 * Devolve sempre a mesma mensagem em caso de falha — validação malformada,
 * e-mail inexistente e senha errada são indistinguíveis para quem chama.
 *
 * O redirecionamento fica a cargo do cliente: a Server Action só grava o cookie
 * de sessão e informa o destino já sanitizado.
 */
export async function loginAction(rawInput: unknown): Promise<LoginResult> {
  const parsed = loginActionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return failure();
  }

  const redirectTo = sanitizeCallbackUrl(parsed.data.callbackUrl);

  try {
    const signInResult: unknown = await signIn(CREDENTIALS_PROVIDER_ID, {
      email: normalizeEmail(parsed.data.email),
      password: parsed.data.password,
      redirect: false,
      redirectTo,
    });

    if (isFailedSignInResult(signInResult)) {
      return failure();
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return failure();
    }
    // Erros de infraestrutura (banco fora do ar, por exemplo) NÃO viram
    // "credenciais inválidas": mascará-los faria o gestor trocar a senha
    // repetidamente enquanto o problema real é outro.
    console.error('[auth] falha inesperada ao autenticar:', error);
    throw error;
  }

  return { ok: true, redirectTo };
}
