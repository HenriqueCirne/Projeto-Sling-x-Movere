# Decision Log: Story 1.1 — Setup do projeto Next.js e banco de dados

**Gerado:** 2026-08-27
**Agente:** @dev (Dex)
**Modo:** YOLO (desenvolvimento autônomo)
**Story:** `docs/stories/1.1.story.md`
**Rollback:** primeiro commit do repositório — `git update-ref -d HEAD` (não há commit anterior)

---

## Contexto

Primeira story do projeto. Repositório Git local sem nenhum commit, sem `package.json`.
Todas as decisões abaixo foram tomadas autonomamente e ancoradas em
`docs/architecture/tech-decisions.md` (TD-01, TD-02, TD-05), no PRD e no preset
`nextjs-react`, conforme autorizado pelo modo YOLO.

---

## Decisões autônomas

### D1 — Monorepo com npm workspaces; app em `packages/web/`

- **Tipo:** architecture | **Prioridade:** high
- **Razão:** a Task 1 da story determina `packages/web/` (convenção de monorepo do PRD).
  npm workspaces é a opção nativa do gerenciador já em uso — zero ferramenta nova para
  um repositório com um único pacote.
- **Alternativas:** app na raiz (contraria a story); pnpm/Turborepo (introduz ferramenta
  sem requisito que a justifique nesta fase).

### D2 — `prisma/` na RAIZ do monorepo, não em `packages/web/`

- **Tipo:** architecture | **Prioridade:** high
- **Razão:** (a) o CLI do Prisma resolve `.env` a partir do cwd — com o schema na raiz,
  o `.env` único do projeto é encontrado sem nenhuma flag; (b) o banco é infraestrutura
  do projeto, não da UI: o job de sincronização da Story 1.4 pode não morar em `web`.
- **Alternativas:** `packages/web/prisma/` (exigiria `--schema` em todo comando e um
  segundo `.env` dentro do pacote).

### D3 — `.env` único na raiz + ponte via `@next/env`

- **Tipo:** architecture | **Prioridade:** high
- **Razão:** a story manda seguir "o padrão já usado pelas variáveis `MOVERE_API_*`",
  que vivem no `.env` da raiz. Mas o Next.js carrega `.env` do diretório da aplicação.
  `loadEnvConfig(monorepoRoot)` em `next.config.ts` resolve o conflito mantendo UM
  arquivo de ambiente. O `docker-compose.yml` lê o mesmo arquivo nativamente.
- **Alternativas:** dois `.env` (raiz + `packages/web`) — sairiam de sincronia;
  `dotenv-cli` nos scripts (dependência a mais para o mesmo resultado).

### D4 — Migração inicial escrita à mão (`prisma/migrations/0_init/`)

- **Tipo:** architecture | **Prioridade:** medium
- **Razão:** a Task 2 pede "migração inicial vazia". `prisma migrate dev` exige um banco
  de pé, indisponível nesta máquina (ver Limitação L1). O layout `0_init` é o formato
  oficial de baseline do Prisma e fixa o `provider = postgresql` no `migration_lock.toml`.
- **Alternativas:** não criar migração (deixaria a story sem o entregável pedido).

### D5 — Instalar apenas as dependências exigidas pelas ACs

- **Tipo:** library-choice | **Prioridade:** medium
- **Razão:** a Task 1 lista explicitamente next, react, react-dom, typescript, tailwindcss
  e zod. Zustand, React Query, React Hook Form, Playwright e MSW constam do preset mas
  nenhuma AC desta story os exige — instalá-los agora seria adicionar superfície não
  pedida. Entram na story que primeiro os usar.
- **Alternativas:** instalar o preset inteiro de uma vez.

### D6 — Vitest com `environment: 'node'`, sem Testing Library

- **Tipo:** testing | **Prioridade:** medium
- **Razão:** os testes desta story cobrem lógica pura (service + validação de env).
  O preset é explícito: "Never test framework internals". jsdom e Testing Library entram
  quando existir o primeiro componente com comportamento próprio.
- **Alternativas:** configurar jsdom + Testing Library desde já.

### D7 — Health-check degrada, não quebra

- **Tipo:** architecture | **Prioridade:** high
- **Razão:** `PrismaClient` é instanciado preguiçosamente e o ping é encapsulado em
  try/catch. Sem banco, a aplicação **sobe** e reporta `degraded`/`Sem resposta`, em vez
  de derrubar a própria página que existe para diagnosticar o problema.
- **Alternativas:** instanciar o Prisma no carregamento do módulo (quebra a app inteira
  quando `DATABASE_URL` falta).

### D8 — Segurança: erro do banco nunca chega à camada de apresentação

- **Tipo:** security | **Prioridade:** high
- **Razão:** mensagens de erro do Prisma podem conter a connection string com senha. O
  repositório loga o erro bruto no servidor e devolve apenas `{ reachable, latencyMs }`.
  Há um teste que falha se a connection string aparecer no relatório (NFR4).
- **Alternativas:** propagar `error.message` para a UI (vazamento de credencial).

### D9 — `docker-compose.yml` sem senha padrão

- **Tipo:** security | **Prioridade:** high
- **Razão:** `${POSTGRES_PASSWORD:?...}` faz o Compose falhar com mensagem clara se a
  variável faltar, em vez de subir um banco com senha conhecida e versionada (NFR4).
- **Alternativas:** `${POSTGRES_PASSWORD:-postgres}` (credencial hardcoded no repo).

### D10 — `export const dynamic = 'force-dynamic'` na página de health-check

- **Tipo:** architecture | **Prioridade:** high
- **Razão:** sem isso o Next.js pré-renderiza a página no build, o que exigiria um banco
  de pé durante o CI e congelaria um status que precisa ser lido em tempo real.
  Verificado: o build classifica `/` como `ƒ (Dynamic)`.

### D11 — Remover `next/font/google` do layout

- **Tipo:** architecture | **Prioridade:** low
- **Razão:** o scaffold usa Geist via Google Fonts, o que faz o build depender de rede —
  ponto de falha gratuito no pipeline de CI da AC4. Sem decisão de design system tomada
  (escopo da @ux-design-expert), a stack de fontes do sistema basta.

### D12 — Tipagem explícita do `RootLayout` em vez de `LayoutProps<'/'>`

- **Tipo:** architecture | **Prioridade:** medium
- **Razão:** `LayoutProps` é um tipo global gerado em `.next/types`; usá-lo faria
  `npm run typecheck` falhar sempre que rodasse antes de um build — exatamente a ordem
  natural de um pipeline de CI. Detectado pelo próprio typecheck durante a implementação.

### D13 — AC4 (pipeline de CI) NÃO implementada — delegação formal

- **Tipo:** governance | **Prioridade:** high
- **Razão:** TD-05 ratifica que CI/CD é operação **exclusiva** do @devops
  (`.claude/rules/agent-authority.md`). `.github/workflows/` não foi criado.
- **Entregue no lugar:** os comandos que o pipeline deve executar, já verificados
  localmente: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

---

## Limitações do ambiente (não são falhas de implementação)

### L1 — Docker não instalado nesta máquina

`docker --version` → *command not found*. Consequências:

- O `docker-compose.yml` foi escrito e revisado, mas **não foi executado**.
- A migração `0_init` **não foi aplicada** contra um Postgres real.
- O health-check foi validado no caminho de falha (`degraded` / "Sem resposta"),
  que é o comportamento correto sem banco. O caminho `connected` está coberto por
  teste unitário, mas não por verificação end-to-end.

**Verificação pendente para quem tiver Docker:** `npm run db:up && npm run db:deploy`
e conferir que a página passa a exibir "Operacional" / "Conectado".

### L2 — CodeRabbit indisponível

`wsl.exe` reporta que o Subsistema Windows para Linux não está instalado, e o CLI do
CodeRabbit só está configurado para rodar via WSL. Conforme
`coderabbit_integration.graceful_degradation.skip_if_not_installed: true`, o gate foi
pulado. A revisão automatizada fica pendente para o @qa/@devops em ambiente com WSL.

---

## Mudanças de implementação

Ver a seção **File List** de `docs/stories/1.1.story.md`.

### Resultados de teste

- ✅ `npm run lint` — sem erros
- ✅ `npm run typecheck` — sem erros
- ✅ `npm test` — 8 testes, 2 arquivos, todos passando
- ✅ `npm run build` — build de produção OK, `/` como rota dinâmica
- ✅ `npm run dev` — HTTP 200 em `http://localhost:3000`

---

## Dívida técnica registrada

| Item | Severidade | Detalhe |
|------|------------|---------|
| `deepmerge-ts` (GHSA-ggr8-5vv4) | HIGH (npm audit) | Transitiva do CLI `prisma` (`@prisma/config` → `deepmerge-ts`). Dependência de **desenvolvimento**, fora do bundle de runtime. Sem correção disponível sem forçar breaking change no Prisma. Reavaliar no próximo bump do Prisma. |
| Verificação end-to-end do banco | MEDIUM | Ver L1. |
| Revisão CodeRabbit | MEDIUM | Ver L2. |
