import { describe, expect, it } from 'vitest';

import { authConfig } from './auth.config';
import { LOGIN_PATH, SESSION_MAX_AGE_SECONDS, SESSION_UPDATE_AGE_SECONDS } from './auth.contract';

/**
 * `authConfig` é um objeto de configuração puro — importá-lo não toca o banco
 * (o `PrismaAdapter` só acessa o `lazyPrismaClient` quando um de seus métodos é
 * chamado, não na construção). Isso permite testar os atributos de segurança
 * do cookie de sessão (AC4, foco primário do CodeRabbit desta story) sem
 * depender de Postgres — algo que uma revisão manual de código não protege
 * contra regressão.
 */
describe('authConfig', () => {
  it('exige os três atributos de segurança do cookie de sessão (TD-01)', () => {
    const { options } = authConfig.cookies.sessionToken;

    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe('lax');
    expect(options.path).toBe('/');
  });

  it('usa `Secure` apenas em produção (cookie Secure não é enviado em http://localhost)', () => {
    // Neste processo de teste NODE_ENV é "test", então o cookie não deve ser
    // marcado Secure — do contrário, o dev nunca teria a sessão enviada de volta.
    expect(authConfig.cookies.sessionToken.options.secure).toBe(false);
    expect(authConfig.cookies.sessionToken.name).toBe('authjs.session-token');
  });

  it('usa a janela de sessão definida no contrato (AC4)', () => {
    expect(authConfig.session.maxAge).toBe(SESSION_MAX_AGE_SECONDS);
    expect(authConfig.session.updateAge).toBe(SESSION_UPDATE_AGE_SECONDS);
  });

  it('redireciona falhas de autenticação para a própria tela de login (AC3)', () => {
    expect(authConfig.pages.signIn).toBe(LOGIN_PATH);
    expect(authConfig.pages.error).toBe(LOGIN_PATH);
  });

  it('a sessão devolvida ao cliente nunca inclui passwordHash nem sessionToken', () => {
    const session = authConfig.callbacks.session({
      session: { expires: '2026-01-01T00:00:00.000Z' } as never,
      user: {
        id: 'user_1',
        email: 'gestor@cirnepneus.com.br',
        name: 'Gestor',
        passwordHash: '$argon2id$deveria-nunca-aparecer',
      } as never,
    } as never);

    const serialized = JSON.stringify(session);
    expect(serialized).not.toContain('argon2');
    expect(session).not.toHaveProperty('sessionToken');
    expect((session.user as { passwordHash?: unknown }).passwordHash).toBeUndefined();
  });

  it('declara exatamente um provider: Credentials', () => {
    expect(authConfig.providers).toHaveLength(1);
    expect(authConfig.providers[0]?.id).toBe('credentials');
  });
});
