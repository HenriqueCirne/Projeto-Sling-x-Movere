import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthUserRecord, AuthUserRepository } from '../repositories/user.repository';
import { CredentialsService, type PasswordHasher } from './credentials.service';

const gestor: AuthUserRecord = {
  id: 'user_1',
  email: 'gestor@cirnepneus.com.br',
  name: 'Gestor',
  passwordHash: '$argon2id$hash-ficticio',
  role: 'GESTOR',
};

describe('CredentialsService', () => {
  let users: { findByEmail: ReturnType<typeof vi.fn> } & AuthUserRepository;
  let hasher: { hash: ReturnType<typeof vi.fn>; verify: ReturnType<typeof vi.fn> } & PasswordHasher;
  let service: CredentialsService;

  beforeEach(() => {
    users = { findByEmail: vi.fn() } as unknown as typeof users;
    hasher = {
      hash: vi.fn(async () => '$argon2id$hash-descartavel'),
      verify: vi.fn(async () => false),
    } as unknown as typeof hasher;
    service = new CredentialsService(users, hasher);
  });

  it('autentica com credenciais válidas', async () => {
    users.findByEmail.mockResolvedValue(gestor);
    hasher.verify.mockResolvedValue(true);

    const result = await service.authenticate({
      email: 'gestor@cirnepneus.com.br',
      password: 'senha-correta',
    });

    expect(result).toEqual({
      id: 'user_1',
      email: 'gestor@cirnepneus.com.br',
      name: 'Gestor',
      role: 'GESTOR',
    });
  });

  it('normaliza o e-mail antes de consultar o repositório', async () => {
    users.findByEmail.mockResolvedValue(gestor);
    hasher.verify.mockResolvedValue(true);

    await service.authenticate({
      email: '  Gestor@CirnePneus.com.BR  ',
      password: 'senha-correta',
    });

    expect(users.findByEmail).toHaveBeenCalledWith('gestor@cirnepneus.com.br');
  });

  it('nunca devolve o hash da senha', async () => {
    users.findByEmail.mockResolvedValue(gestor);
    hasher.verify.mockResolvedValue(true);

    const result = await service.authenticate({
      email: gestor.email,
      password: 'senha-correta',
    });

    expect(JSON.stringify(result)).not.toContain('argon2');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('recusa senha errada', async () => {
    users.findByEmail.mockResolvedValue(gestor);
    hasher.verify.mockResolvedValue(false);

    await expect(
      service.authenticate({ email: gestor.email, password: 'senha-errada' }),
    ).resolves.toBeNull();
  });

  it('recusa e-mail inexistente', async () => {
    users.findByEmail.mockResolvedValue(null);

    await expect(
      service.authenticate({ email: 'ninguem@cirnepneus.com.br', password: 'qualquer' }),
    ).resolves.toBeNull();
  });

  it('recusa usuário sem hash de senha cadastrado', async () => {
    users.findByEmail.mockResolvedValue({ ...gestor, passwordHash: null });

    await expect(
      service.authenticate({ email: gestor.email, password: 'qualquer' }),
    ).resolves.toBeNull();
  });

  it('gasta uma verificação de hash mesmo quando o e-mail não existe (anti-enumeração)', async () => {
    users.findByEmail.mockResolvedValue(null);

    await service.authenticate({ email: 'ninguem@cirnepneus.com.br', password: 'qualquer' });

    // Sem este verify no vazio, o tempo de resposta denunciaria quais e-mails
    // existem no sistema — o mesmo vazamento que a mensagem genérica evita.
    expect(hasher.verify).toHaveBeenCalledTimes(1);
  });

  it('reaproveita o hash descartável entre tentativas', async () => {
    users.findByEmail.mockResolvedValue(null);

    await service.authenticate({ email: 'a@cirnepneus.com.br', password: 'x' });
    await service.authenticate({ email: 'b@cirnepneus.com.br', password: 'y' });

    expect(hasher.hash).toHaveBeenCalledTimes(1);
    expect(hasher.verify).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['payload vazio', {}],
    ['e-mail em formato inválido', { email: 'nao-e-email', password: 'senha' }],
    ['senha vazia', { email: 'gestor@cirnepneus.com.br', password: '' }],
    ['tipos errados', { email: 42, password: true }],
    ['nulo', null],
  ])('recusa payload inválido: %s', async (_label, payload) => {
    await expect(service.authenticate(payload)).resolves.toBeNull();
    expect(users.findByEmail).not.toHaveBeenCalled();
  });
});
