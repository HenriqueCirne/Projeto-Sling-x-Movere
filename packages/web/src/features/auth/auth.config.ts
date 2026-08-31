import { randomUUID } from 'node:crypto';

import { PrismaAdapter } from '@auth/prisma-adapter';
import type { NextAuthConfig } from 'next-auth';
import type { JWT, JWTEncodeParams } from 'next-auth/jwt';
import { encode as defaultJwtEncode } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';

import { lazyPrismaClient } from '@/lib/prisma';

import {
  LOGIN_PATH,
  SESSION_MAX_AGE_SECONDS,
  SESSION_UPDATE_AGE_SECONDS,
} from './auth.contract';
import { credentialsService } from './services/credentials.service';
import { getSessionCookieName, usesSecureCookies } from './session-cookie';

/**
 * Configuração do Auth.js v5 (TD-01).
 *
 * Exportada separada da instância (`auth.ts`) para poder ser inspecionada em
 * teste sem instanciar o NextAuth nem tocar no banco.
 */

export const CREDENTIALS_PROVIDER_ID = 'credentials';

export const authPrismaAdapter = PrismaAdapter(lazyPrismaClient);

/** Marca gravada no token pelo callback `jwt` para o `encode` reconhecer o fluxo. */
type CredentialsAwareJWT = JWT & { credentials?: boolean };

const secureCookies = usesSecureCookies();

/**
 * `AUTH_TRUST_HOST` já existe em `.env`/`.env.example` desde a Story 1.2
 * ("Deixe `true` ao hospedar fora da Vercel"), mas nunca tinha sido lido em
 * lugar nenhum — sem isso, toda requisição loga `UntrustedHost` e `auth()`
 * nunca resolve uma sessão em nenhum host que não seja a própria Vercel
 * (inclusive `localhost` em dev, e qualquer servidor próprio/Docker atrás de
 * nginx em produção). Bug pré-existente descoberto ao testar manualmente a
 * Story 1.5 — extraído como função pura (mesmo padrão de `usesSecureCookies`
 * em `session-cookie.ts`) para não repetir a lacuna de teste que permitiu o
 * bug passar despercebido na Story 1.2.
 */
export function shouldTrustHost(
  authTrustHost: string | undefined = process.env.AUTH_TRUST_HOST,
): boolean {
  return authTrustHost === 'true';
}

/**
 * ## Por que a sessão fica no banco mesmo usando Credentials
 *
 * O TD-01 exige sessão em banco (revogação imediata). O Auth.js, porém, recusa
 * `session.strategy: 'database'` EXPLÍCITO quando o único provider é
 * Credentials (`@auth/core/lib/utils/assert.js` → `UnsupportedStrategy`).
 *
 * A saída é a documentada pela própria Auth.js: **não declarar a estratégia**.
 * Com um `adapter` presente, o padrão resolvido em `@auth/core/lib/init.js` já
 * é `"database"` — e a asserção só dispara para a forma explícita. A leitura da
 * sessão passa então por `adapter.getSessionAndUser(cookie)`, como desejado.
 *
 * Falta apenas o lado da ESCRITA: o fluxo de Credentials sempre passa por
 * `jwt.encode` e grava o resultado no cookie. Sobrescrevendo `encode`, gravamos
 * um `sessionToken` de uma linha real em `sessions` em vez de um JWT.
 *
 * **NÃO adicione `session: { strategy: 'database' }` "para ficar explícito".**
 * Isso derruba a aplicação inteira na inicialização do Auth.js.
 */
export const authConfig = {
  adapter: authPrismaAdapter,

  trustHost: shouldTrustHost(),

  session: {
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },

  pages: {
    signIn: LOGIN_PATH,
    // Falhas de autenticação voltam para a própria tela de login, que exibe a
    // mensagem genérica do AC3 — e não para a página de erro padrão do Auth.js,
    // que nomeia o motivo.
    error: LOGIN_PATH,
  },

  cookies: {
    sessionToken: {
      name: getSessionCookieName(secureCookies),
      options: {
        // Os três atributos exigidos pelo TD-01, declarados explicitamente
        // (e não herdados do default) para que sejam auditáveis e testáveis.
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: secureCookies,
      },
    },
  },

  providers: [
    Credentials({
      id: CREDENTIALS_PROVIDER_ID,
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      /**
       * Retornar `null` faz o Auth.js emitir `CredentialsSignin` — sem
       * distinguir e-mail inexistente de senha errada (AC3).
       */
      authorize: async (rawCredentials) => {
        const user = await credentialsService.authenticate(rawCredentials);
        if (!user) {
          return null;
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],

  callbacks: {
    jwt: ({ token, account }) => {
      if (account?.provider === CREDENTIALS_PROVIDER_ID) {
        (token as CredentialsAwareJWT).credentials = true;
      }
      return token;
    },

    /**
     * ⚠️ **Callback de segurança, não de conveniência.**
     *
     * O padrão do Auth.js para estratégia de banco monta a sessão como
     * `{ ...sessionRow, user: userRow }` (`@auth/core/lib/actions/session.js`).
     * Devolvido como está, o JSON de `/api/auth/session` — legível por qualquer
     * JavaScript da página — conteria `user.passwordHash` e, pior, o próprio
     * `sessionToken`, anulando por completo o cookie `HttpOnly`.
     *
     * Por isso este retorno é uma lista de permissão explícita, e não um spread.
     * Ao adicionar um campo aqui, pergunte se ele pode ser lido pelo navegador.
     */
    session: ({ session, user }) => ({
      expires: session.expires,
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? null,
      },
    }),
  },

  jwt: {
    /**
     * Troca o JWT do fluxo de Credentials por um `sessionToken` persistido.
     * Ver o bloco de comentário do `authConfig` para o porquê.
     */
    encode: async (params: JWTEncodeParams): Promise<string> => {
      const token = params.token as CredentialsAwareJWT | undefined;

      if (token?.credentials !== true) {
        return defaultJwtEncode(params);
      }

      const userId = token.sub;
      if (!userId) {
        throw new Error('Fluxo de credenciais sem identificador de usuário no token.');
      }

      const sessionToken = randomUUID();
      const createdSession = await authPrismaAdapter.createSession?.({
        sessionToken,
        userId,
        expires: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
      });

      if (!createdSession) {
        throw new Error('Não foi possível persistir a sessão do usuário.');
      }

      return sessionToken;
    },
  },
} satisfies NextAuthConfig;
