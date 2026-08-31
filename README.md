# Movimento Gerais

Dashboard comercial da Cirne Pneus — substitui a planilha de acompanhamento de vendas por
relatórios servidos direto do ERP.

## Stack

| Camada    | Tecnologia                                        |
| --------- | ------------------------------------------------- |
| Aplicação | Next.js 16 (App Router) + React 19 + TypeScript   |
| Estilo    | Tailwind CSS 4                                    |
| Banco     | PostgreSQL 16 (Docker no dev) + Prisma            |
| Autenticação | Auth.js (NextAuth v5) — Credentials + sessão em banco |
| Validação | Zod                                               |
| Testes    | Vitest                                            |

Decisões técnicas: [`docs/architecture/tech-decisions.md`](docs/architecture/tech-decisions.md).

## Estrutura

```
.
├── docker-compose.yml    # PostgreSQL 16 para desenvolvimento local
├── prisma/               # Schema e migrações (banco compartilhado do projeto)
└── packages/
    └── web/              # Aplicação Next.js
        └── src/
            ├── app/      # Rotas (App Router)
            ├── config/   # Variáveis de ambiente validadas
            ├── features/ # Features autocontidas (contract → service → repository)
            ├── lib/      # Integrações de terceiros (Prisma)
            └── shared/   # Código realmente compartilhado
```

## Pré-requisitos

- Node.js 20+
- Docker (para o PostgreSQL local)

## Setup

```bash
# 1. Dependências (o postinstall roda `prisma generate`)
npm install

# 2. Ambiente — preencha DATABASE_URL e as variáveis POSTGRES_*
cp .env.example .env

# 3. Banco de dados local
npm run db:up      # sobe o PostgreSQL 16
npm run db:deploy  # aplica as migrações

# 4. Gestor inicial — preencha AUTH_SECRET, SEED_ADMIN_EMAIL e
#    SEED_ADMIN_PASSWORD (mínimo 12 caracteres) no .env antes de rodar
npm run db:seed

# 5. Aplicação
npm run dev        # http://localhost:3000
```

A página inicial é o health-check: mostra o ambiente e o estado da conexão com o banco.
Sem banco de pé a aplicação **sobe assim mesmo** e reporta `degraded` — a falha é
diagnosticada, não escondida.

Login em [`/login`](http://localhost:3000/login) com as credenciais semeadas no passo 4.
Não há cadastro público (NFR3) — `npm run db:seed` é o único caminho para criar um
gestor, e é idempotente: rodar de novo não recria nem sobrescreve quem já existe.

## Comandos

| Comando              | Descrição                                     |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Sobe a aplicação em modo desenvolvimento      |
| `npm run build`      | Build de produção                             |
| `npm run lint`       | ESLint                                        |
| `npm run typecheck`  | `tsc --noEmit`                                |
| `npm test`           | Suíte de testes (Vitest)                      |
| `npm run db:up`      | Sobe o PostgreSQL local                       |
| `npm run db:down`    | Derruba o PostgreSQL local (volume persiste)  |
| `npm run db:migrate` | Cria/aplica migração em desenvolvimento       |
| `npm run db:deploy`  | Aplica migrações pendentes                    |
| `npm run db:seed`    | Provisiona o gestor inicial (idempotente)     |
| `npm run db:studio`  | Prisma Studio                                 |

## Segurança

Credenciais **nunca** são versionadas (NFR4). O `.env` é ignorado pelo Git; o
`.env.example` lista as variáveis necessárias sem valores. O `docker-compose.yml`
não define senhas padrão — ele falha explicitamente se as variáveis estiverem ausentes.
