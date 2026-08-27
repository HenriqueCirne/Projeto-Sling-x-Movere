# Decisões Técnicas — Movimento Gerais

**Autor:** Aria (@architect)
**Data:** 2026-08-27
**Status:** Ativo — vigente para a Epic 1 (Stories 1.1 a 1.5)
**Escopo:** desbloqueio técnico das 5 stories da Epic 1 validadas pelo @po

> Este documento é a referência técnica normativa para as Stories 1.1–1.5 enquanto não existe um
> architecture doc completo. Onde uma story disser "confirmar com @architect", a resposta está aqui.
> Este documento **não altera Acceptance Criteria** — isso é competência exclusiva do @po.

---

## Sumário das decisões

| # | Tema | Decisão | Status |
|---|------|---------|--------|
| TD-01 | Provedor de autenticação | **Auth.js (NextAuth v5) — Credentials + sessão em banco** | ✅ Decidido |
| TD-02 | Banco de dados | **PostgreSQL 16, acesso vendor-neutro via `DATABASE_URL` + Prisma; Docker local no dev** | ✅ Decidido |
| TD-03 | API Moveres Software | **Não validável sem credenciais — risco em aberto, exige spike antes da 1.4** | ⚠️ Risco aberto |
| TD-04 | Ticket Médio (1.3 × 1.5) | **Paridade confirmada por dado real: é por LINHA. Schema deve carregar `Nº documento` mesmo assim** | ✅ Decidido (com pergunta de negócio aberta) |
| TD-05 | Pipeline de CI (1.1 AC4) | **Delegação exclusiva ao @devops — não é tarefa do @dev** | ✅ Esclarecido |

---

## TD-01 — Provedor de autenticação (Story 1.2)

### Decisão

**Auth.js (NextAuth v5)** com:
- **Credentials provider** (e-mail + senha) — sem OAuth, sem login social;
- **hash de senha com `argon2id`** (fallback aceitável: `bcrypt` com cost ≥ 12);
- **sessão em banco de dados** (database session strategy) via `@auth/prisma-adapter`, não JWT stateless;
- cookie de sessão `HttpOnly`, `Secure`, `SameSite=Lax`;
- checagem de sessão em **Server Components / Route Handlers** via `auth()` — conforme já determinado nas stories, **sem `middleware.ts`** (Next.js 16+ usa Proxy);
- **script de seed idempotente** (`prisma/seed.ts`) para provisionar o(s) gestor(es) inicial(is), atendendo a AC5 da Story 1.2. Senha inicial injetada por variável de ambiente, **nunca** hardcoded nem versionada (NFR4).

### Racional

O app é interno, de leitura, com um punhado de gestores (o brief é explícito: "acesso restrito à gestão; atendentes/vendedores não têm acesso próprio no MVP"). Não há cadastro público, não há OAuth de terceiros, não há escala. O critério aqui é **menor superfície de ataque e menor número de sistemas**, não riqueza de features.

Auth.js é a escolha "boring technology": é a solução idiomática do ecossistema Next.js, integra nativamente com App Router e Server Components (exatamente o padrão que as Stories 1.2 e 1.5 já exigem), e mantém a identidade dos usuários **no mesmo PostgreSQL** que serve os relatórios — uma única migração, um único backup, zero sincronização entre sistemas.

Sessão em banco (e não JWT) porque com pouquíssimos usuários o custo da consulta é irrelevante e ganha-se **revogação imediata** de sessão (desligar um gestor = deletar a sessão), o que JWT stateless não dá sem infraestrutura extra.

### Trade-offs considerados

| Opção | Prós | Contras | Veredito |
|-------|------|---------|----------|
| **Auth.js (escolhida)** | Idiomático em Next.js 16/App Router; usuários no mesmo Postgres; sem vendor novo; sem custo | Fluxos de reset de senha/MFA precisam ser feitos à mão se um dia forem exigidos | ✅ **Adotada** |
| Supabase Auth | Reset de senha, e-mail, MFA prontos; gestão de usuários via console | Introduz um segundo sistema de identidade e um SDK cliente para atender ~5 usuários; puxa o modelo mental de RLS para um app que não precisa; acopla o projeto a um fornecedor numa decisão de hospedagem que **ainda é uma pergunta aberta de negócio** | ❌ Sobredimensionado |
| Auth custom | Controle total | Escrever à mão sessão, cookie, CSRF e hashing é risco de segurança puro, sem nenhum ganho funcional sobre Auth.js | ❌ Rejeitada (anti-padrão) |

### Implicações de segurança

- AC3 da 1.2 (mensagem de erro) deve ser **genérica e idêntica** para usuário inexistente e senha errada — evita enumeração de usuários.
- Aplicar **rate limiting** na rota de login (ex: 5 tentativas / 15 min por IP+usuário). Não está em nenhuma AC; registrado aqui como recomendação de arquitetura, cabe ao @po decidir se vira AC.
- `AUTH_SECRET` obrigatório em `.env` e espelhado em `.env.example` **sem valor** (NFR4).

---

## TD-02 — Banco de dados (Stories 1.1, 1.3, 1.4, 1.5)

### Decisão

**PostgreSQL 16**, ratificando a recomendação do PRD, com três qualificações arquiteturais:

1. **Acesso exclusivamente via `DATABASE_URL` padrão + Prisma.** Nenhuma feature proprietária de fornecedor: sem SDK Supabase, sem PostgREST, sem RLS como mecanismo de autorização da aplicação. A autorização é feita na camada de aplicação (TD-01).
2. **Ambiente de desenvolvimento: PostgreSQL 16 em Docker local** (`docker-compose.yml` no repositório). Isso desbloqueia integralmente as Stories 1.1, 1.3, 1.4 e 1.5 **sem depender de nenhuma decisão de hospedagem**.
3. **Provedor gerenciado de produção: deliberadamente adiado.** Hospedagem é uma pergunta aberta de negócio no brief ("Preferência de hospedagem — cloud própria, servidor local da empresa?"), não uma pergunta de arquitetura. Qualquer Postgres gerenciado (Supabase Postgres, Neon, Railway, RDS) ou self-hosted atende, porque a decisão 1 garante portabilidade.

### Racional

O requisito real é agregação tipo SUMIFS sobre ~23,7k lançamentos/bimestre com resposta em poucos segundos (NFR2). Isso é trabalho trivial para qualquer PostgreSQL com os índices da Story 1.3 — o volume não é o fator de decisão, e por isso **não faz sentido deixar a Epic 1 bloqueada esperando uma decisão de hospedagem que só se torna relevante no deploy**.

A coerência com TD-01 se resolve por eliminação: como **não** escolhemos Supabase Auth, desaparece o argumento que amarraria o projeto ao Supabase Postgres. Adotar Supabase agora seria escolher um fornecedor antes de existir qualquer requisito que o justifique — e a Cirne Pneus pode perfeitamente querer o banco no servidor local da loja, cenário em que o Supabase seria retrabalho.

### Consequências para o @dev

- Story 1.1 Task 2: seguir com **PostgreSQL 16 + Prisma**, decisão ratificada — o "BLOQUEIO PENDENTE" está resolvido.
- Adicionar `DATABASE_URL` a `.env` e a `.env.example` (sem valor real).
- Valores monetários: `Decimal` no Prisma → `numeric(14,2)` no Postgres. **Nunca `float`/`double`** (já apontado na 1.3).

---

## TD-03 — API Moveres Software: validação técnica (Story 1.4)

### Resultado da tentativa de validação: **INCONCLUSIVO**

Tentei validar a API pelas fontes públicas. Registro honesto do que aconteceu:

| Fonte | Resultado |
|-------|-----------|
| `https://api.moveresoftware.com/swagger/ui/index#/` | Retorna apenas o *shell* JavaScript do Swagger UI. Nenhum endpoint, campo ou schema no HTML servido. |
| `https://api.moveresoftware.com/swagger/docs/v1` | **HTTP 404** |
| `https://api.moveresoftware.com/swagger/v1/swagger.json` | **HTTP 404** |
| Artigo de documentação (via `/support/solutions/articles/27000069342`) | Acessível — mas descreve apenas o *processo* de autenticação, não o contrato da API. |

**Não usei — e não devo usar — as credenciais `MOVERE_API_*`.** Elas existem para o job de sincronização do @dev, não para exploração por agente.

### O que ficou estabelecido (fonte: documentação pública do fornecedor)

- **Autenticação:** token via login; header `Authorization: Bearer <token>`. O usuário precisa de permissão na rotina **[R1000 — Centro de Integração]**; o *environment* é fornecido pelo suporte Moveres (coerente com `MOVERE_API_ENVIRONMENT`).
- **A API é segmentada em "grupos"** selecionáveis por um dropdown no Swagger — ou seja, **não há um único spec**; é preciso saber qual grupo consultar.
- **Existem APIs relevantes ao projeto**, nominalmente: *API de Vendas*, *API Notas Fiscais Emitidas*, *API Notas Emitidas por Estrutura de Itens*.
- Há suporte a **filtros de liberação** por estabelecimento e por tabela de preço vinculada ao cadastro do cliente.
- **Aviso do fornecedor:** APIs riscadas no Swagger estão obsoletas e não devem ser usadas.

### O que permanece NÃO VALIDADO (risco aberto)

1. **Cobertura de campos** — se a API expõe os campos exigidos (Loja, Cliente, Item, Família/Grupo/Marca/Linha, Atendente, Preço de Venda, Prazo Médio, Condição de Pagamento, Data de Emissão).
2. **Consulta incremental** — se há filtro por data de alteração/emissão que permita sync diário sem varrer a base inteira (NFR1 depende disso).
3. **Paginação** — existência, mecanismo (offset/cursor) e tamanho máximo de página.
4. **Rate limits** e janela de resposta para o backfill histórico.
5. **Chave estável de linha** — ver TD-04, achado crítico.

### Recomendação

**Criar uma story de spike técnico (sugestão: 1.0 ou 1.3.5) executada por @dev, com as credenciais reais, ANTES de iniciar a Story 1.4.** Entregável: um documento de contrato da API (endpoint escolhido, mapa campo-a-campo API → `sales_entries`, estratégia de paginação e de incremento). Sem isso, a Story 1.4 começa com o requisito mais arriscado do projeto ainda não verificado — e é exatamente o risco nº 1 do brief ("Cobertura de campos da API").

**Mitigação de arquitetura (já aplicável, independente do spike):** a Story 1.4 deve isolar o cliente HTTP atrás de um *anti-corruption layer* — um módulo com contrato Zod próprio, mapeando o payload do ERP para o modelo interno. Assim, uma divergência de campos da API vira mudança em um mapper, não uma refatoração de todos os relatórios.

---

## TD-04 — Coerência 1.3 × 1.5: Ticket Médio, chave de upsert e devoluções

Este ponto **era** uma ambiguidade. Resolvi-a com dado real: analisei a planilha de referência `DOC/Dashboard_Vendas_Jul_Ago_2026.xlsx` (aba `Painel` e aba `Dados`, 23.724 linhas).

### Achado 1 — A fórmula do Painel, extraída literalmente da planilha

```excel
Faturamento Total  = SUM(Dados!$U$2:$U$23725)                        → 10.394.644,52
Quantidade Total   = SUM(Dados!$N$2:$N$23725)                        → 49.265
Nº de Lançamentos  = COUNTA(Dados!$A$2:$A$23725)                     → 23.724
Ticket Médio       = SUM(Dados!$U:$U) / COUNTA(Dados!$A:$A)          → 438,15
Nº de Clientes     = SUMPRODUCT((Dados!$Y:$Y<>"")/COUNTIF(...))      → 5.186  (distinct)
```

**Decisão TD-04a:** a fórmula do Ticket Médio na Story 1.5 (`Faturamento Total ÷ Nº de Lançamentos`) **está correta para paridade com a planilha**. O `COUNTA` opera sobre a coluna `A` (`Tipo`) da aba `Dados`, ou seja, conta **linhas de item**, não notas. O AUTO-DECISION do @po está confirmado por evidência, e a condição de parada que ele registrou ("se a planilha definir por venda/nota, PARAR") **não se materializou**. A Story 1.5 pode prosseguir como está.

Mapeamento confirmado dos KPIs → colunas: `U = Total Preço de Venda` (faturamento), `N = Quantidade`, `Y = Cliente` (distinct), contagem de linhas = nº de lançamentos.

### Achado 2 — A pergunta de negócio que permanece aberta (NÃO é decisão de arquitetura)

Os números da própria planilha:

| Métrica | Valor |
|---|---|
| Linhas de item | 23.724 |
| Documentos distintos (`Nº documento`) | 10.619 |
| **Ticket Médio por linha** (o que a planilha mostra hoje) | **R$ 438,15** |
| **Ticket Médio por documento/venda** | **R$ 978,87** |

A diferença é de **2,23×**. A planilha entrega R$ 438,15 — mas "ticket médio" no vocabulário comercial normalmente significa *quanto vale uma venda*, não *quanto vale uma linha de uma venda*.

**Isto é uma pergunta de dado de negócio, não de arquitetura, e eu deliberadamente não a decido.** O gestor da Cirne Pneus precisa responder: *"o número R$ 438 que você usa hoje é o que você quer, ou você sempre entendeu esse indicador como o valor médio por venda?"*

Enquanto a resposta não vier, **paridade com a planilha prevalece** (o critério de sucesso do MVP é substituir o Excel, e mudar a métrica unilateralmente quebraria a comparação que o gestor vai fazer no dia 1).

### Achado 3 — ⚠️ CRÍTICO: não existe chave natural de linha no export do ERP

A Story 1.3 (Task 2) pede "um campo de identificação única do lançamento vindo do ERP (necessário para upsert idempotente na Story 1.4)". Testei os candidatos contra os dados reais:

| Chave candidata | Valores distintos (de 23.724 linhas) | Única? |
|---|---|---|
| `Id Lançamento` (col. CF) | 11.552 | ❌ Não |
| `Nº documento` (col. AU) | 10.619 | ❌ Não |
| `Id Lançamento` + `Cód Item` | 23.015 | ❌ Não |
| `Nº documento` + `Cód Item` + `Cód Loja` | 23.015 | ❌ Não |
| `Id Lançamento`+`Nº doc`+`Cód Item`+`Cód Loja`+`Tipo` | 23.015 | ❌ Não |

**Nenhuma combinação de colunas do export identifica unicamente uma linha** — restam 709 linhas colidentes (mesmo item, mesma nota, mesma loja: item repetido na mesma venda, provavelmente com preço/desconto diferentes).

Também verifiquei: `Id Lançamento` mapeia para exatamente **um** `Nº documento` (0 casos de 1→N em 11.552), ou seja, `Id Lançamento` identifica a **transação**, não a linha.

**Decisão TD-04b — estratégia de sincronização idempotente para a Story 1.4:**

1. **Preferencial:** o spike do TD-03 deve verificar se a **API** expõe um identificador de linha (ex: `idItemLancamento`, sequencial da linha) que o relatório exportado não traz. Se existir, use-o como chave de upsert. *É o cenário mais provável — relatórios de BI costumam omitir chaves técnicas que a API expõe.*
2. **Fallback (se não existir):** adotar **sincronização por janela (delete-and-replace)** — para cada janela `(Data de Emissão, Loja)` sincronizada, apagar as linhas existentes daquela janela e reinserir o payload completo. É idempotente **sem depender de chave natural**, e é seguro porque a aplicação é somente-leitura (o ERP é a fonte da verdade; nada se perde ao reescrever).
3. **Anti-padrão a evitar:** `upsert` por `Id Lançamento` isolado — silenciosamente **descartaria ~52% das linhas** e corromperia todos os 8 relatórios. Registrado aqui explicitamente porque é o caminho que a leitura ingênua da Story 1.3 induziria.

**Decisão TD-04c — campos que o schema `sales_entries` DEVE conter (além do já listado na Story 1.3):**

- **`numero_documento`** (`AU`) — resolve o *should-fix* que o @po registrou na 1.3. Custo hoje: uma coluna. Custo depois: migração + rebackfill de toda a base. Com ele, o Ticket Médio por venda passa a ser calculável a qualquer momento **sem mudança de schema**, seja qual for a resposta do negócio ao Achado 2.
- **`id_lancamento`** (`CF`) — identificador de transação; útil para auditoria e para agrupar linhas de uma mesma venda.
- **`tipo`** (`A`) — ver Achado 4.

### Achado 4 — Devoluções e Faixa de Prazo (afeta a correção dos relatórios)

- A coluna `Tipo` tem dois valores: **`Venda` (23.651)** e **`Devolução` (73)**. As 73 devoluções têm `Total Preço de Venda` **negativo**, somando **−R$ 336.972,09**.
- A planilha **não filtra devoluções**: o `SUM` as compensa naturalmente e o `COUNTA` as conta como lançamentos. **Para manter paridade, o app também não deve filtrá-las** — e a coluna de valor precisa aceitar negativos (atenção a qualquer validação Zod com `.positive()`, que rejeitaria devoluções e quebraria a paridade silenciosamente).
- A coluna `Faixa Prazo Médio` (`CU`) **está vazia em todas as linhas de dados** — é uma coluna derivada da planilha, não um dado do ERP. O relatório FR5 ("vendas por faixa de Prazo Médio") deve **derivar as faixas** a partir de `Prazo Médio` (`W`, presente e preenchido em 100% das 23.724 linhas). **Os limites das faixas não estão documentados em lugar nenhum** — é uma segunda pergunta de negócio, mas ela só bloqueia a Epic 2/3, não a Epic 1.

### Bônus: o export do ERP tem 99 colunas

A aba `Dados` traz 99 colunas, muito além dos ~15 que os 8 relatórios exigem (inclui endereço, CPF/CNPJ, telefone, placa/veículo, limite de crédito, custos). **Recomendação:** `sales_entries` deve persistir **apenas os campos usados pelos relatórios**, não as 99 colunas. Minimização de dados é boa prática de privacidade (há CPF/CNPJ, telefone e data de nascimento no export — dados pessoais sob a LGPD) e mantém a tabela enxuta para as agregações do NFR2. Persistir dado pessoal que nenhum relatório usa é passivo sem contrapartida.

---

## TD-05 — Pipeline de CI (Story 1.1, AC4)

**Esclarecimento de governança.** A Task 4 da Story 1.1 diz "COORDENAR COM @devops", o que é ambíguo o bastante para o @dev acabar criando o workflow por conta própria.

**A leitura correta é delegação, não coordenação:** CI/CD pipeline management é **operação exclusiva do @devops (Gage)** conforme `.claude/rules/agent-authority.md`. O @dev **não deve criar nem alterar** `.github/workflows/ci.yml`. O @po já registrou isso como *should-fix* no Change Log da 1.1; ratifico como regra arquitetural.

**Consequência prática:** a AC4 da Story 1.1 **não é entregável pelo @dev**. Ela deve ser executada por @devops (que também detém `git push` e `gh pr create`). O @dev entrega as ACs 1–3 e fornece ao @devops os comandos que o pipeline deve executar (`npm run lint`, `npm run typecheck`, `npm test`). Se a AC4 permanecer como critério de aceite da story sob executor `@dev`, ela ficará permanentemente não-cumprível — **cabe ao @po decidir** entre mover a AC4 para uma story de @devops ou registrar a delegação explicitamente. Não altero ACs.

---

## Riscos abertos que exigem decisão humana (não técnica)

| # | Questão | Bloqueia | Quem decide |
|---|---|---|---|
| R1 | **Ticket Médio é por linha (R$ 438,15) ou por venda (R$ 978,87)?** Hoje a planilha usa por linha; o schema vai suportar ambos | Não bloqueia a 1.5 (paridade prevalece) | Gestor / @po |
| R2 | **Credenciais e spike da API Moveres** — contrato não validado (campos, paginação, incremento, rate limit) | **BLOQUEIA a Story 1.4** | Stakeholder (acesso) + @dev (spike) |
| R3 | **Hospedagem** (cloud, Postgres gerenciado ou servidor local da loja) | Não bloqueia a Epic 1 (dev roda em Docker local) | Stakeholder |
| R4 | **Backfill histórico** — dashboard começa no go-live ou importa histórico anterior a Jul/2026? Muda o volume e o custo do primeiro sync | Afeta escopo da 1.4 | Stakeholder |
| R5 | **Limites das faixas de Prazo Médio** (FR5) — não documentados em lugar nenhum | Bloqueia Epic 2/3, não a Epic 1 | Gestor / @po |

---

## Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-08-27 | 1.0 | Documento criado: TD-01 a TD-05, desbloqueio técnico da Epic 1. Achados TD-04 baseados em análise dos dados reais de `DOC/Dashboard_Vendas_Jul_Ago_2026.xlsx` | Aria (@architect) |
