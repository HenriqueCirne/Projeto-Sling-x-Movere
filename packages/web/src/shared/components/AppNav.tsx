'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const REPORTS: readonly { href: string; label: string }[] = [
  { href: '/relatorios/faturamento-por-data', label: 'Faturamento por Data' },
  { href: '/relatorios/vendas-por-item', label: 'Vendas por Item' },
  { href: '/relatorios/vendas-por-item-por-loja', label: 'Vendas por Item por Loja' },
  {
    href: '/relatorios/faturamento-por-condicao-pagamento',
    label: 'Faturamento por Condição de Pagamento',
  },
  { href: '/relatorios/ranking-clientes', label: 'Ranking de Clientes' },
  { href: '/relatorios/tipo-preco-loja-item', label: 'Tipo de Preço × Loja × Item' },
  { href: '/relatorios/desempenho-atendente', label: 'Desempenho por Atendente' },
  { href: '/relatorios/vendas-por-faixa-prazo-medio', label: 'Vendas por Faixa de Prazo Médio' },
];

const linkClass = (active: boolean) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    active
      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
  }`;

/**
 * Navegação da Análise de Vendas e dos 8 relatórios (Epic 2/3), num único
 * menu — antes cada rota só era acessível digitando a URL de cabeça.
 * "Análise de Vendas" fica direto no cabeçalho; os relatórios ficam
 * agrupados no menu "Relatórios" (são 7, não cabem lado a lado sem quebrar
 * o cabeçalho em telas menores).
 */
export function AppNav() {
  const pathname = usePathname();
  const [reportsOpen, setReportsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDashboard = pathname === '/dashboard';
  const isReportsRoute = pathname?.startsWith('/relatorios') ?? false;

  useEffect(() => {
    if (!reportsOpen) return;

    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setReportsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setReportsOpen(false);
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [reportsOpen]);

  return (
    <nav className="flex items-center gap-1">
      <Link href="/dashboard" className={linkClass(isDashboard)}>
        Análise de Vendas
      </Link>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setReportsOpen((open) => !open)}
          aria-expanded={reportsOpen}
          aria-haspopup="true"
          className={`${linkClass(isReportsRoute)} inline-flex items-center gap-1`}
        >
          Relatórios
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className={`h-3.5 w-3.5 transition-transform ${reportsOpen ? 'rotate-180' : ''}`}
          >
            <path
              d="M5 7.5 10 12.5 15 7.5"
              stroke="currentColor"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {reportsOpen && (
          <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            {REPORTS.map((report) => (
              <Link
                key={report.href}
                href={report.href}
                onClick={() => setReportsOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  pathname === report.href
                    ? 'bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {report.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
