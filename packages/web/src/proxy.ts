import { NextResponse, type NextRequest } from 'next/server';

import {
  buildLoginRedirectPath,
  isProtectedPath,
} from '@/features/auth/services/route-guard.service';
import { SESSION_COOKIE_NAMES } from '@/features/auth/session-cookie';

/**
 * Proxy do Next.js 16 (AC2) — o sucessor do antigo `middleware.ts`.
 *
 * **Isto é uma checagem OTIMISTA, não a autorização.** O único teste feito aqui
 * é "existe um cookie de sessão?"; ninguém valida se ele corresponde a uma
 * sessão viva no banco. A autorização de verdade é o `auth()` do layout em
 * `app/(protected)/layout.tsx`, que consulta a tabela `sessions`.
 *
 * O valor deste arquivo é o inverso: garantir que uma rota criada sob
 * `/dashboard` sem o layout protegido ainda assim mande o anônimo para o login,
 * em vez de renderizar a página. A documentação do próprio Next.js é explícita
 * em não usar Proxy como solução de sessão (ele não deve fazer I/O lento).
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const hasSessionCookie = SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name));
  if (hasSessionCookie) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(buildLoginRedirectPath(pathname, search), request.url));
}

export const config = {
  // Precisa listar a rota exata e as filhas: `:path*` casa zero segmentos, mas
  // manter as duas entradas deixa a intenção explícita para quem for estender.
  matcher: ['/dashboard', '/dashboard/:path*'],
};
