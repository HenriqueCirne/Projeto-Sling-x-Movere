import type { PrismaClient } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';

import type { UserRole } from '../auth.contract';

/**
 * Registro de usuário necessário para autenticar — e nada além disso.
 *
 * O `passwordHash` circula até o serviço de credenciais e para ali: ele nunca
 * entra em uma Server Action de retorno, em uma sessão ou em um log.
 */
export type AuthUserRecord = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string | null;
  role: UserRole;
};

export interface AuthUserRepository {
  /** Busca por e-mail JÁ NORMALIZADO. Retorna `null` se não existir. */
  findByEmail(email: string): Promise<AuthUserRecord | null>;
}

export class PrismaAuthUserRepository implements AuthUserRepository {
  constructor(private readonly resolveClient: () => PrismaClient = getPrismaClient) {}

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    const prisma = this.resolveClient();

    // `select` explícito em vez do registro inteiro: garante que colunas
    // adicionadas ao model no futuro não vazem por acidente para esta camada.
    return prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true, role: true },
    });
  }
}

export const authUserRepository = new PrismaAuthUserRepository();
