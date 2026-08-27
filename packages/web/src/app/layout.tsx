import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'Movimento Gerais',
  description: 'Dashboard comercial da Cirne Pneus',
};

// Tipagem explícita em vez do helper global `LayoutProps<'/'>`: aquele tipo só
// existe depois que o Next.js gera `.next/types`, o que faria `npm run typecheck`
// depender de um build prévio — armadilha certa no pipeline de CI.
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
