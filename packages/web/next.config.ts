import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';

/**
 * Ponte de ambiente do monorepo.
 *
 * O `.env` do projeto vive na raiz do repositório (mesmo arquivo das variáveis
 * `MOVERE_API_*` e do `docker-compose.yml`), mas o Next.js carrega `.env` a
 * partir do diretório da aplicação (`packages/web`). `loadEnvConfig` aponta o
 * carregador para a raiz, mantendo UM único arquivo de ambiente no projeto —
 * em vez de dois arquivos que inevitavelmente sairiam de sincronia.
 *
 * Roda no carregamento do config, ou seja, antes do servidor subir — vale para
 * `next dev`, `next build` e `next start`.
 */
const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
loadEnvConfig(monorepoRoot, process.env.NODE_ENV !== 'production');

const nextConfig: NextConfig = {
  // Next.js 16+ substituiu `middleware.ts` pelo sistema de Proxy: redirects,
  // rewrites e headers ficam centralizados aqui. A checagem de sessão da Story
  // 1.2 acontece em Server Components / Route Handlers via `auth()`.
};

export default nextConfig;
