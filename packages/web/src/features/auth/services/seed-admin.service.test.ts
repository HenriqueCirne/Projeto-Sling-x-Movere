import { describe, expect, it, vi } from 'vitest';

import { SeedConfigurationError, seedAdminUser, type SeedUserStore } from './seed-admin.service';

const fakeHash = vi.fn(async (plainPassword: string) => `hashed:${plainPassword}`);

function createStore(existing: { id: string } | null = null): SeedUserStore & {
  create: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
} {
  return {
    findUnique: vi.fn(async () => existing),
    create: vi.fn(async ({ data }) => ({ id: 'new-user-id', ...data })),
  };
}

describe('seedAdminUser', () => {
  it('cria o gestor quando o e-mail ainda não existe', async () => {
    const users = createStore(null);

    const outcome = await seedAdminUser(
      users,
      { SEED_ADMIN_EMAIL: 'Gestor@CirnePneus.com.br', SEED_ADMIN_PASSWORD: 'senha-forte-12345' },
      fakeHash,
    );

    expect(outcome).toEqual({ status: 'created', email: 'gestor@cirnepneus.com.br', userId: 'new-user-id' });
    expect(users.create).toHaveBeenCalledWith({
      data: {
        email: 'gestor@cirnepneus.com.br',
        name: null,
        passwordHash: 'hashed:senha-forte-12345',
      },
    });
  });

  it('é idempotente: não recria nem sobrescreve um gestor já existente', async () => {
    const users = createStore({ id: 'existing-id' });

    const outcome = await seedAdminUser(
      users,
      { SEED_ADMIN_EMAIL: 'gestor@cirnepneus.com.br', SEED_ADMIN_PASSWORD: 'senha-forte-12345' },
      fakeHash,
    );

    expect(outcome).toEqual({
      status: 'already_exists',
      email: 'gestor@cirnepneus.com.br',
      userId: 'existing-id',
    });
    expect(users.create).not.toHaveBeenCalled();
  });

  it('rejeita quando SEED_ADMIN_EMAIL está ausente', async () => {
    const users = createStore(null);

    await expect(
      seedAdminUser(users, { SEED_ADMIN_PASSWORD: 'senha-forte-12345' }, fakeHash),
    ).rejects.toBeInstanceOf(SeedConfigurationError);
    expect(users.create).not.toHaveBeenCalled();
  });

  it('rejeita quando SEED_ADMIN_PASSWORD é curta demais', async () => {
    const users = createStore(null);

    await expect(
      seedAdminUser(
        users,
        { SEED_ADMIN_EMAIL: 'gestor@cirnepneus.com.br', SEED_ADMIN_PASSWORD: 'curta' },
        fakeHash,
      ),
    ).rejects.toBeInstanceOf(SeedConfigurationError);
  });

  it('nunca inclui a senha em texto claro na mensagem de erro', async () => {
    const users = createStore(null);
    const plainPassword = 'senha-secreta-em-texto-claro';

    try {
      await seedAdminUser(
        users,
        { SEED_ADMIN_EMAIL: 'nao-e-email', SEED_ADMIN_PASSWORD: plainPassword },
        fakeHash,
      );
      expect.unreachable('deveria ter lançado SeedConfigurationError');
    } catch (error) {
      expect(error).toBeInstanceOf(SeedConfigurationError);
      expect((error as Error).message).not.toContain(plainPassword);
    }
  });

  it('usa o nome informado quando presente', async () => {
    const users = createStore(null);

    await seedAdminUser(
      users,
      {
        SEED_ADMIN_EMAIL: 'gestor@cirnepneus.com.br',
        SEED_ADMIN_PASSWORD: 'senha-forte-12345',
        SEED_ADMIN_NAME: 'Gestor Principal',
      },
      fakeHash,
    );

    expect(users.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: 'Gestor Principal' }),
    });
  });
});
