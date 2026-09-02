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
| TD-03 | API Moveres Software | **Validada com dado real — itens de linha e parcelas disponíveis (Achado 8, 2026-09-02 retrata o bloqueio anterior)** | ✅ Resolvido |
| TD-04 | Ticket Médio (1.3 × 1.5) | **Paridade confirmada por dado real: é por LINHA. Schema deve carregar `Nº documento` mesmo assim** | ✅ Decidido (com pergunta de negócio aberta) |
| TD-05 | Pipeline de CI (1.1 AC4) | **Delegação exclusiva ao @devops — não é tarefa do @dev** | ✅ Esclarecido |
| TD-06 | Autenticação (Stories 1.2/1.5) | **Tela de login removida da rota obrigatória — decisão explícita do stakeholder, sobrepõe a NFR3** | ⚠️ Decisão de negócio registrada |
| TD-07 | Fonte de dados (Story 1.4) | **Importação manual de planilha, como caminho complementar à sincronização automática — R2 deixou de bloquear (2026-09-02)** | ✅ Decidido |

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

### 🛑 Atualização (2026-08-31) — Spike executado, BLOQUEIO encontrado

O spike recomendado acima foi executado por @dev com as credenciais reais do `.env`.
Documento completo: `docs/architecture/api-moveres-contract-spike.md`. Resumo:

- ✅ **Autenticação, paginação e filtro incremental confirmados** — `POST
  /api/LoginComAmbiente`, parâmetro `pagina`, filtro obrigatório por
  `emissaoInicial`/`emissaoFinal` + `codigoLoja`.
- ✅ Endpoints reais descobertos (o Swagger do @architect tentou o grupo `v1`, que não
  existe — os grupos certos são `movere-api` e `movere-inteligente`, visíveis no
  `discoveryPaths` do script inline da própria página do Swagger UI).
- 🛑 **BLOQUEIO:** os arrays de itens de linha (`produtos`) e parcelas (`parcelas`)
  vêm **sempre vazios** em `/api/NotasFiscaisEmitidas`, e o endpoint dedicado a itens de
  linha (`/api/NotasFiscaisEmitidasPorEstruturaDeItens`) retorna **zero resultados** —
  testado em duas janelas de data diferentes, sem exceção. A conta configurada retorna
  `grupo: "SEM ACESSO"` no login, hipótese mais provável para o bloqueio.
- **Sem itens de linha, os campos `item`/`familia`/`grupo`/`marca`/`linha` e a
  quantidade/preço por item (FR3, FR4, FR8, FR9) não são populáveis.** Nenhuma mudança
  é necessária no schema da Story 1.3 — o problema é de acesso aos dados, não de
  modelagem.

**Consequência para R2 (tabela de riscos abertos abaixo):** o risco R2 deixa de ser
"contrato não validado" e passa a ser **"contrato validado, mas acesso a itens de linha
bloqueado por permissão"** — uma ação humana (verificar com o administrador da conta
Moveres/suporte por que o grupo é "SEM ACESSO") substitui a necessidade de mais
investigação técnica. **A Story 1.4 continua bloqueada** até essa ação ser resolvida.

### ✅ Atualização (2026-09-02) — Bloqueio RETRATADO: era bug de casing, não permissão

O usuário passou uma informação de outro projeto que integra a mesma API Moveres usando
`GET /api/NotasFiscaisEmitidas` com sucesso — motivo suficiente para reabrir o Achado 4
em vez de aceitá-lo como definitivo. Resultado, documentado em detalhe no Achado 8 de
`docs/architecture/api-moveres-contract-spike.md`:

**O bloqueio nunca existiu de verdade.** O spike original verificava `nf.produtos`/
`nf.parcelas` (minúsculos, como o Swagger documenta) — mas a resposta real usa
`Produtos`/`Parcelas` (maiúsculos). JavaScript é case-sensitive: isso retorna
`undefined` silenciosamente em vez de um erro, e foi mal-interpretado como "vazio". É
exatamente a mesma classe de bug que o próprio Achado 3 já tinha documentado para
`NF`/`nf` — só que dessa vez num nível aninhado, não pego na primeira passada.

Reteste em 2026-09-02, mesma conta, **sem qualquer mudança de permissão** (`grupo`
continua `"SEM ACESSO"`): 100/100 notas de uma janela de 2 meses vêm com `Produtos`
preenchido, 92/100 com `Parcelas`. R2 está **resolvido — não bloqueia mais a Story
1.4.** TD-07 (importação de planilha) não precisa ser desfeito; passa a ser um caminho
complementar (backfill/correção manual) em vez do único caminho de dados.

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

## TD-06 — Remoção da exigência de login (Stories 1.2, 1.5)

### Decisão

A partir de **2026-09-01**, `/dashboard` e `/relatorios/*` deixam de exigir sessão autenticada. Mudanças aplicadas:

- `src/proxy.ts` (a rede de segurança rápida via cookie) foi **removido**.
- O grupo de rotas `src/app/(protected)/` foi **renomeado para `src/app/(app)/`** — mantinha o nome antigo seria enganoso, já que ele não protege mais nada.
- `AppLayout` (antes com checagem `auth()` + redirect para `/login`) não faz mais checagem de sessão nenhuma.
- `isProtectedPath`, `PROTECTED_PATH_PREFIXES` e `buildLoginRedirectPath` (em `route-guard.service.ts`) foram removidos por serem código morto após a remoção do proxy; `sanitizeCallbackUrl` foi mantida.
- A **tela de login em si não foi removida** (`/login` continua no ar, `Auth.js`/Credentials/argon2id continuam funcionais) — ela só deixou de ser **obrigatória**. Um gestor pode logar se quiser, mas nada exige isso para ver os relatórios.

### Racional

Isto é uma **decisão de stakeholder, não uma recomendação de arquitetura.** O login (TD-01) já estava implementado e verificado ponta-a-ponta contra um Postgres real (Supabase) quando a remoção foi pedida — não é um caso de "login não funcionava, então tiramos". A decisão foi tomada e confirmada explicitamente duas vezes pelo stakeholder, a segunda já ciente do trade-off (pergunta feita via `AskUserQuestion`, resposta: *"Remover mesmo assim"*).

### Conflito com requisito documentado

Isto **contradiz diretamente a NFR3** do PRD (`docs/prd/requirements.md`): *"não deve haver acesso público ou anônimo"*. O documento de requisitos foi atualizado com uma nota apontando para esta seção — não foi silenciosamente apagado (ver Change Log da NFR3).

### Consequência

- Dados comerciais reais (faturamento, clientes, itens vendidos) ficam acessíveis a qualquer pessoa com a URL, sem autenticação. Aceito conscientemente pelo stakeholder.
- Se a decisão for revertida no futuro: restaurar `src/proxy.ts` (histórico no git antes deste commit), devolver a checagem `auth()`/redirect ao `AppLayout`, e restaurar `isProtectedPath`/`PROTECTED_PATH_PREFIXES`/`buildLoginRedirectPath` em `route-guard.service.ts` (também disponíveis no histórico do git). A tela de login e a tabela de usuários não precisam de nenhuma mudança — nunca saíram do ar.

---

## TD-07 — Fonte de dados: importação de planilha substitui sync automático (Story 1.4)

### Decisão

Enquanto o **R2** (permissão da conta Moveres bloqueando itens de linha) não for resolvido pelo stakeholder junto ao fornecedor, a fonte de dados do MVP passa a ser **importação manual de planilha** (o mesmo arquivo que já alimenta o Excel hoje), carregada diretamente no schema `sales_entries` já validado pela Story 1.3 — nenhum modelo de dado novo, nenhum trabalho da Epic 1/2/3 é descartado.

### Racional

O stakeholder decidiu não esperar a resolução do bloqueio de permissão da API (TD-03/R2) para colocar o sistema em uso. Como o schema `sales_entries` já foi desenhado a partir da mesma planilha de referência (`DOC/Dashboard_Vendas_Jul_Ago_2026.xlsx`, ver TD-04), importar a planilha diretamente é reaproveitamento total do trabalho já feito — não é um novo caminho de dados, é o caminho de dados original (Excel) apontado para o Postgres em vez de para o próprio Excel.

### Consequência

- A Story 1.4 ("sincronização automática com o ERP") fica **pausada, não cancelada** — permanece bloqueada por R2 e pode ser retomada quando a permissão for corrigida.
- Uma nova capacidade de **importação de planilha → `sales_entries`** precisa ser especificada e implementada (story ainda não criada nesta sessão).
- Como consequência de TD-02, o banco de desenvolvimento passou de "Docker local, decisão de produção em aberto (R3)" para **Supabase Postgres (Session Pooler)** já em uso — resolve R3 na prática, ainda que não formalmente ratificado como decisão de produção definitiva. Detalhe de conexão: a porta 5432 (Session Pooler) é obrigatória com Prisma — a porta 6543 (Transaction Pooler) quebra com `"prepared statement already exists"` por incompatibilidade entre PgBouncer/Supavisor em modo transação e prepared statements do Prisma.

### Implementado e executado (2026-09-02)

Feature `packages/web/src/features/sales-import/` (parsers puros e testados, 36 testes) + `prisma/import-sales-entries.ts` (CLI, mesmo padrão de `prisma/seed.ts`, sem alias `@/...`). Leitura da planilha via **`exceljs`**, não `xlsx`/SheetJS: a versão do SheetJS publicada no npm (0.18.5) tem duas vulnerabilidades HIGH sem correção (prototype pollution, ReDoS) — a versão corrigida só é distribuída pelo CDN próprio da SheetJS, fora do registro npm, e instalar de uma URL externa foi bloqueado pelo classificador de segurança do ambiente. `exceljs` não tem esse problema (só um `moderate` transitivo em `uuid`, não exercitado pelo caminho de leitura usado aqui).

**Achado crítico corrigido antes da importação valer:** a primeira execução (`npm run db:import`) rejeitou 46% das linhas reais (10.923 de 23.724) porque `prazoMedio` estava modelado como `Int` — TD-04 tinha assumido "Prazo Médio" inteiro a partir de uma amostra pequena, mas a maioria das linhas reais é fracionária (ex: `105.17`, `45.5`, `33.67`, provavelmente uma média entre parcelas). Corrigido: `prazoMedio` agora é `Decimal(8,2)` (migração `20260902120000_change_prazo_medio_to_decimal`, gerada via `prisma migrate diff` porque `prisma migrate dev` exige um terminal interativo que este ambiente não tem). Reimportada a planilha depois da correção: **23.724/23.724 linhas válidas, 0 rejeitadas.**

**Validado contra o banco após a importação** — bate exatamente com os números de referência do TD-04 (Achado 1, extraídos de `DOC/Dashboard_Vendas_Jul_Ago_2026.xlsx`), confirmando que `DOC/AGO.27.26-Planilha Dashboard.xlsx` é o mesmo período (Jul–Ago 2026), só re-exportado:

| Métrica | TD-04 (planilha de referência) | Banco após importação |
|---|---|---|
| Faturamento total | R$ 10.394.644,52 | R$ 10.394.644,52 |
| Quantidade total | 49.265 | 49.265 |
| Vendas / Devoluções | 23.651 / 73 | 23.651 / 73 |

**Performance do `exceljs`:** `eachRow`/`eachCell` com `includeEmpty: true` degrada catastroficamente em planilhas grandes (>60s sem terminar 23,7k linhas; sem essa opção, a mesma leitura leva ~150ms). O CLI usa `eachRow` sem `includeEmpty` e indexa por `row.number` (não por ordem de chegada) para não desalinhar a numeração de linha caso uma linha fique totalmente em branco no meio da planilha.

---

## Riscos abertos que exigem decisão humana (não técnica)

| # | Questão | Bloqueia | Quem decide |
|---|---|---|---|
| R1 | **Ticket Médio é por linha (R$ 438,15) ou por venda (R$ 978,87)?** Hoje a planilha usa por linha; o schema vai suportar ambos | Não bloqueia a 1.5 (paridade prevalece) | Gestor / @po |
| R2 | ~~Permissão da conta Moveres bloqueia itens de linha/parcelas~~ **RESOLVIDO 2026-09-02** — era bug de casing no spike (Achado 8), não permissão. `Produtos`/`Parcelas` confirmados presentes (100%/92% de 100 notas testadas) | Não bloqueia mais nada | — |
| R3 | **Hospedagem** (cloud, Postgres gerenciado ou servidor local da loja) | Resolvido na prática para o banco — **Supabase Postgres** em uso (ver TD-07). Hospedagem da aplicação em si (Vercel/Railway/outro) continua em aberto | Stakeholder |
| R4 | **Backfill histórico** — dashboard começa no go-live ou importa histórico anterior a Jul/2026? Muda o volume e o custo do primeiro sync | Afeta escopo da 1.4 | Stakeholder |
| R5 | **Limites das faixas de Prazo Médio** (FR5) — não documentados em lugar nenhum | Bloqueia Epic 2/3, não a Epic 1 | Gestor / @po |

---

## Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-08-27 | 1.0 | Documento criado: TD-01 a TD-05, desbloqueio técnico da Epic 1. Achados TD-04 baseados em análise dos dados reais de `DOC/Dashboard_Vendas_Jul_Ago_2026.xlsx` | Aria (@architect) |
| 2026-08-31 | 1.1 | Spike técnico da API Moveres executado (TD-03) — ver `docs/architecture/api-moveres-contract-spike.md`. Autenticação/paginação/incremento confirmados; bloqueio encontrado no acesso a itens de linha e parcelas (grupo de permissão "SEM ACESSO"). R2 atualizado: de "contrato não validado" para "permissão da conta bloqueia itens de linha" — Story 1.4 continua bloqueada até ação do stakeholder junto ao Moveres | Dex (@dev) |
| 2026-09-01 | 1.2 | TD-06 (remoção da exigência de login, decisão de stakeholder, sobrepõe NFR3) e TD-07 (importação de planilha substitui sync automático enquanto R2 não é resolvido; Supabase Postgres em uso, resolvendo R3 na prática) registrados | Dex (@dev) |
| 2026-09-02 | 1.3 | TD-07 implementado e executado: feature `sales-import` + CLI `db:import`. Achado corrigido antes de valer: `prazoMedio` (col. W) é fracionário na maioria das linhas reais, não inteiro como o TD-04 assumiu — schema alterado de `Int` para `Decimal(8,2)` (migração `20260902120000_change_prazo_medio_to_decimal`). Planilha `DOC/AGO.27.26-Planilha Dashboard.xlsx` importada com sucesso: 23.724/23.724 linhas, faturamento e quantidade batendo exatamente com os números de referência do TD-04 | Dex (@dev) |
| 2026-09-02 | 1.4 | TD-03 RETRATADO: o bloqueio de itens de linha/parcelas da API Moveres (R2) nunca foi um problema de permissão — era um bug de casing no spike original (`produtos`/`parcelas` vs `Produtos`/`Parcelas`, mesma classe de erro do Achado 3, não pega na primeira passada). Reteste com a mesma conta (sem mudança de permissão) confirma dado real disponível. Ver Achado 8 em `docs/architecture/api-moveres-contract-spike.md`. Story 1.4 liberada para implementação; R2 fechado | Dex (@dev) |
