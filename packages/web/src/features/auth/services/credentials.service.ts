import { randomBytes } from 'node:crypto';

import type { AuthenticatedUser, CredentialsContract } from '../auth.contract';
import type { AuthUserRepository } from '../repositories/user.repository';
import { authUserRepository } from '../repositories/user.repository';
import { loginSchema, normalizeEmail } from '../schemas/credentials.schema';
import { hashPassword, verifyPassword } from './password.service';

/** Assinatura mínima do hasher, para permitir teste sem argon2 real. */
export type PasswordHasher = {
  hash(plainPassword: string): Promise<string>;
  verify(storedHash: string, plainPassword: string): Promise<boolean>;
};

const defaultHasher: PasswordHasher = {
  hash: hashPassword,
  verify: verifyPassword,
};

export class CredentialsService implements CredentialsContract {
  /**
   * Hash descartável usado para equalizar o tempo de resposta quando o e-mail
   * não existe. Criado uma única vez, sob demanda, a partir de bytes aleatórios
   * — nunca é uma senha real e nunca é comparado com sucesso.
   */
  private dummyHash: Promise<string> | null = null;

  constructor(
    private readonly users: AuthUserRepository = authUserRepository,
    private readonly hasher: PasswordHasher = defaultHasher,
  ) {}

  async authenticate(input: unknown): Promise<AuthenticatedUser | null> {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      return null;
    }

    const email = normalizeEmail(parsed.data.email);
    const user = await this.users.findByEmail(email);

    if (!user?.passwordHash) {
      // Sem este verify "no vazio", responder a um e-mail inexistente custaria
      // ~1 ms e responder a uma senha errada custaria ~50 ms. A diferença é
      // medível de fora e transforma o login em um oráculo de enumeração de
      // usuários — a mesma falha que a mensagem genérica do AC3 evita na
      // superfície visível.
      await this.consumeDummyVerification(parsed.data.password);
      return null;
    }

    const passwordMatches = await this.hasher.verify(user.passwordHash, parsed.data.password);
    if (!passwordMatches) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  private async consumeDummyVerification(candidatePassword: string): Promise<void> {
    this.dummyHash ??= this.hasher.hash(randomBytes(32).toString('hex'));
    await this.hasher.verify(await this.dummyHash, candidatePassword);
  }
}

export const credentialsService = new CredentialsService();
