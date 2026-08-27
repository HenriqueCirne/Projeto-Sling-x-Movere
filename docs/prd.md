# Movimento Gerais Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Fornecer aos gestores da Cirne Pneus visibilidade diária e consolidada do faturamento, substituindo a planilha Excel manual.
- Replicar fielmente os 8 relatórios comerciais já validados no Excel, sem perda de informação.
- Integrar automaticamente com o ERP Moveres Software, eliminando a atualização manual de dados.
- Restringir o acesso aos dados comerciais apenas à gestão, com autenticação.
- Garantir que os dados nunca fiquem com mais de 24h de defasagem em relação ao ERP.

### Background Context

A Cirne Pneus opera uma rede de lojas de pneus e centro automotivo (marcas como Bridgestone, Firestone, Westlake; serviços de alinhamento, balanceamento, troca de óleo, freios e suspensão), com múltiplas lojas registrando lançamentos de venda em um ERP (Moveres Software). Atualmente, o acompanhamento comercial da rede depende de uma planilha Excel mantida manualmente, alimentada por exports periódicos do ERP (23.724 lançamentos apenas em Jul-Ago/2026), com 8 relatórios calculados via fórmulas SUMIFS.

Esse processo manual não escala e não atende à necessidade de visibilidade diária da gestão. O **Movimento Gerais** nasce para resolver isso, substituindo a planilha por uma aplicação web integrada diretamente à API do ERP, replicando os mesmos 8 relatórios já validados pelo negócio, com atualização automática diária.

### Change Log

| Date | Version | Description | Author |
|------|---------|--------------|--------|
| 2026-08-27 | 0.1 | Criação inicial do PRD a partir do Project Brief | Morgan (PM) |
| 2026-08-27 | 1.0 | PRD completo: requisitos, UI goals, technical assumptions, epics e stories | Morgan (PM) |

---

## Requirements

### Functional

1. FR1: O sistema deve exibir um Painel com KPIs de resumo (Faturamento Total, Quantidade Total, Nº de Lançamentos, Ticket Médio, Nº de Clientes) filtráveis por período.
2. FR2: O sistema deve exibir o faturamento diário e mensal em um gráfico de série temporal (Requisito 1 da planilha atual).
3. FR3: O sistema deve exibir a quantidade total vendida agrupada por Família/Grupo/Item (Requisito 2).
4. FR4: O sistema deve exibir a mesma visão do FR3 segmentada por loja (Requisito 6).
5. FR5: O sistema deve exibir o total de vendas agrupado por faixa de Prazo Médio de recebimento (Requisito 3).
6. FR6: O sistema deve exibir o faturamento agrupado por Condição de Pagamento (Requisito 4).
7. FR7: O sistema deve exibir um ranking de clientes ordenado por faturamento (Requisito 5).
8. FR8: O sistema deve exibir o faturamento cruzado por Tipo de Preço, Loja e Item, com seletor de filtro (Requisito 7).
9. FR9: O sistema deve exibir a quantidade e o faturamento por Atendente, destacando o melhor desempenho (Requisito 8).
10. FR10: O sistema deve sincronizar automaticamente os lançamentos de venda com a API do ERP Moveres Software, no mínimo uma vez por dia.
11. FR11: O sistema deve autenticar usuários (gestores) antes de exibir qualquer dado comercial.
12. FR12: Todos os relatórios devem permitir filtro por período (data inicial/final) e, quando aplicável, por loja.

### Non Functional

1. NFR1: Os dados exibidos não devem ter mais de 24 horas de defasagem em relação ao ERP.
2. NFR2: O sistema deve suportar o volume atual de dados (23.724+ lançamentos por bimestre, com tendência de crescimento) com tempos de resposta na casa de poucos segundos por relatório.
3. NFR3: O acesso à aplicação deve ser restrito a usuários autenticados (gestores); não deve haver acesso público ou anônimo.
4. NFR4: As credenciais de integração com o ERP não devem ser armazenadas em código-fonte versionado.
5. NFR5: O sistema deve ser responsivo, funcionando corretamente em navegadores desktop modernos (Chrome, Edge).
6. NFR6: Falhas na sincronização diária com o ERP devem ser registradas (log) para permitir diagnóstico técnico.

---

## User Interface Design Goals

### Visão Geral de UX

Um dashboard analítico direto ao ponto, priorizando clareza de números e gráficos sobre estética elaborada — o público é gestor interno que precisa checar KPIs rapidamente, não um produto voltado a clientes externos. Navegação simples entre o Painel geral e os 8 relatórios específicos, com filtros consistentes (período, loja) em todas as telas.

### Paradigmas-Chave de Interação

- Filtros persistentes de período e loja aplicáveis a qualquer relatório.
- Tabelas com ordenação por coluna (ex: ranking de clientes, desempenho por atendente).
- Gráficos interativos (hover para detalhes) nos relatórios de série temporal.
- Seletor explícito no relatório "Tipo de Preço × Loja × Item" (Requisito 7), conforme já existe na planilha atual.

### Telas e Views Principais

1. Login — autenticação restrita a gestores.
2. Painel (Dashboard geral) — KPIs de resumo + atalhos para os 8 relatórios.
3. Faturamento por Data — série temporal diária/mensal.
4. Vendas por Item (Família/Grupo/Marca/Linha) — com abertura por loja.
5. Vendas por Faixa de Prazo.
6. Faturamento por Condição de Pagamento.
7. Ranking de Clientes.
8. Tipo de Preço × Loja × Item.
9. Desempenho por Atendente.

### Acessibilidade: None

Ferramenta interna de uso restrito à gestão, sem requisito de conformidade declarado.

### Branding

Nenhum guia de marca ou identidade visual foi fornecido. Visual neutro/corporativo padrão até definição futura.

### Dispositivos e Plataformas-Alvo: Web Responsive

Desktop prioritário, mas responsivo.

---

## Technical Assumptions

### Repository Structure: Monorepo

Um único repositório contendo a aplicação Next.js (frontend + API routes) e o job de sincronização com o ERP, seguindo a estrutura de `packages/` já usada pelo framework AIOX neste projeto.

### Service Architecture

Monolito Next.js (App Router) servindo frontend + API routes, com um processo agendado (cron/scheduled job) responsável pela sincronização diária com a API Moveres Software. Não há necessidade de microsserviços — volume e complexidade (23k+ lançamentos/bimestre, 8 relatórios) não justificam essa sobrecarga operacional.

### Testing Requirements: Unit + Integration

Testes unitários para lógica de agregação dos relatórios (crítico, pois precisa reproduzir fielmente os cálculos hoje feitos via SUMIFS) + testes de integração para o job de sincronização com o ERP (mock da API Moveres). Testes E2E (Playwright, disponível no preset) recomendados para os fluxos críticos (login, Painel, cada um dos 8 relatórios), não exigidos para 100% da aplicação no MVP.

### Additional Technical Assumptions and Requests

- **Frontend/Backend:** Next.js 16+, React, TypeScript, Tailwind CSS (preset `nextjs-react` ativo no projeto, explicitamente indicado para "Dashboards administrativos").
- **Banco de dados:** relacional (PostgreSQL recomendado) — necessário para agregações tipo SUMIFS via SQL. **Não confirmado ainda** — requer validação com @architect (ex: Supabase, Postgres gerenciado, outro).
- **Integração ERP:** cliente HTTP para a API Moveres Software (`MOVERE_API_*` já configurado em `.env`), executado por um job agendado diário.
- **Validação de dados:** Zod (parte do preset) para validar o payload recebido da API do ERP antes de persistir.
- **Autenticação:** mecanismo simples de login restrito a gestores (NFR3) — provedor específico (ex: NextAuth, Supabase Auth) a definir com @architect.

---

## Epic List

- **Epic 1: Fundação, Autenticação e Integração com ERP** — Estabelece a base técnica do projeto (app, banco de dados, autenticação) e entrega a sincronização diária com o ERP Moveres Software, culminando em um Painel inicial funcional com os KPIs de resumo.
- **Epic 2: Relatórios de Faturamento e Vendas por Item** — Entrega os relatórios de faturamento ao longo do tempo e de vendas por item/loja (Requisitos 1, 2, 3, 4, 6).
- **Epic 3: Relatórios de Clientes, Preços e Atendentes** — Completa os 8 relatórios com ranking de clientes, tipo de preço e desempenho de atendentes (Requisitos 5, 7, 8), e valida a paridade final com a planilha Excel.

---

## Epic 1 Fundação, Autenticação e Integração com ERP

**Objetivo expandido:** Estabelecer a infraestrutura do projeto (Next.js, banco de dados, CI) com autenticação restrita a gestores, e entregar a sincronização diária dos lançamentos de venda com o ERP Moveres Software — culminando em um Painel inicial funcional com os KPIs de resumo (FR1, FR10, FR11), a primeira entrega de valor real da aplicação.

### Story 1.1 Setup do projeto Next.js e banco de dados

As a gestor,
I want uma aplicação base rodando com banco de dados configurado,
so that a equipe técnica tenha uma fundação sólida para construir os relatórios.

#### Acceptance Criteria

1: Repositório Next.js (App Router) criado com TypeScript, Tailwind, seguindo o preset `nextjs-react`.
2: Banco de dados relacional configurado e acessível pela aplicação (migração inicial, ainda sem dados).
3: Aplicação sobe localmente (`npm run dev`) e exibe uma página inicial simples (health-check).
4: Pipeline de CI básico executa lint, typecheck e testes a cada push.

### Story 1.2 Autenticação de gestores

As a gestor,
I want fazer login com credenciais restritas,
so that apenas a gestão autorizada acesse os dados comerciais.

#### Acceptance Criteria

1: Existe uma tela de login funcional.
2: Usuários não autenticados são redirecionados para o login ao tentar acessar qualquer rota do dashboard.
3: Credenciais inválidas exibem mensagem de erro clara.
4: Sessão autenticada persiste entre navegações (cookie/sessão segura).

### Story 1.3 Modelagem de dados dos lançamentos de venda

As a developer,
I want um schema de banco de dados que espelhe os campos dos lançamentos de venda do ERP (Loja, Cliente, Item, Família/Grupo/Marca/Linha, Atendente, Preço, Prazo Médio, Condição de Pagamento, Data de Emissão),
so that todos os 8 relatórios possam ser calculados via consultas SQL.

#### Acceptance Criteria

1: Tabela `sales_entries` (ou equivalente) criada com todos os campos necessários aos 8 relatórios.
2: Migração versionada e documentada.
3: Índices criados nos campos usados para filtros/agregações (Data de Emissão, Loja, Cliente, Atendente).

### Story 1.4 Job de sincronização diária com a API Moveres Software

As a gestor,
I want que os dados de vendas sincronizem automaticamente uma vez por dia a partir do ERP,
so that eu não dependa de atualização manual.

#### Acceptance Criteria

1: Job agendado autentica na API Moveres Software usando as credenciais de `.env` (`MOVERE_API_*`).
2: Job busca lançamentos novos/atualizados e grava/atualiza na tabela `sales_entries`.
3: Execuções do job são registradas em log (sucesso/erro), atendendo NFR6.
4: Job pode ser executado manualmente para fins de teste/backfill inicial.
5: Falha na sincronização não derruba a aplicação (tratamento de erro isolado).

### Story 1.5 Painel (Dashboard geral) com KPIs de resumo

As a gestor,
I want ver um painel com os principais indicadores,
so that eu tenha uma visão imediata do desempenho comercial.

#### Acceptance Criteria

1: Painel exibe Faturamento Total, Quantidade Total, Nº de Lançamentos, Ticket Médio e Nº de Clientes.
2: KPIs são filtráveis por período (data inicial/final).
3: Painel só é acessível para usuários autenticados (depende da Story 1.2).
4: Dados exibidos vêm da tabela sincronizada (depende da Story 1.4).

---

## Epic 2 Relatórios de Faturamento e Vendas por Item

**Objetivo expandido:** Entregar os relatórios que permitem à gestão entender a evolução do faturamento ao longo do tempo e o comportamento de vendas por item, loja, prazo e condição de pagamento — cobrindo os Requisitos 1, 2, 3, 4 e 6 da planilha original.

### Story 2.1 Faturamento por Data

As a gestor,
I want ver o faturamento diário e mensal,
so that eu acompanhe a evolução das vendas ao longo do tempo (Requisito 1).

#### Acceptance Criteria

1: Gráfico de série temporal exibe faturamento diário.
2: Visão alternável para agregação mensal.
3: Filtro por período e por loja.
4: Valores batem com os cálculos da planilha Excel original para o mesmo período (validação de paridade).

### Story 2.2 Vendas por Item (Família/Grupo/Marca/Linha)

As a gestor,
I want ver a quantidade vendida agrupada por Família, Grupo e Item,
so that eu identifique quais produtos vendem mais (Requisito 2).

#### Acceptance Criteria

1: Tabela exibe quantidade total vendida agrupada por Família, Grupo e Item.
2: Filtro por período.
3: Ordenação por quantidade.

### Story 2.3 Vendas por Item aberto por Loja

As a gestor,
I want ver a mesma visão de vendas por item, segmentada por loja,
so that eu compare o desempenho de produtos entre lojas (Requisito 6).

#### Acceptance Criteria

1: Mesma visão da Story 2.2, com dimensão adicional de Loja.
2: Permite comparar quantidade vendida do mesmo item entre lojas.

### Story 2.4 Vendas por Faixa de Prazo Médio

As a gestor,
I want ver o total de vendas agrupado por faixa de prazo médio de recebimento,
so that eu entenda o perfil de risco/prazo das vendas (Requisito 3).

#### Acceptance Criteria

1: Total de vendas agrupado por faixa de Prazo Médio de recebimento.
2: Faixas seguem a mesma lógica de corte usada na planilha original.

### Story 2.5 Faturamento por Condição de Pagamento

As a gestor,
I want ver o faturamento agrupado por condição de pagamento,
so that eu entenda como a rede está recebendo pelas vendas (Requisito 4).

#### Acceptance Criteria

1: Faturamento agrupado por Condição de Pagamento.
2: Filtro por período e loja.

---

## Epic 3 Relatórios de Clientes, Preços e Atendentes

**Objetivo expandido:** Completar o conjunto de 8 relatórios com foco em desempenho de clientes, política de preços e equipe comercial (Requisitos 5, 7 e 8), e validar a paridade total com a planilha atual antes do go-live.

### Story 3.1 Ranking de Clientes por Faturamento

As a gestor,
I want ver um ranking de clientes por faturamento,
so that eu identifique meus clientes mais valiosos (Requisito 5).

#### Acceptance Criteria

1: Lista de clientes ordenada por faturamento total, decrescente.
2: Filtro por período.
3: Exibe posição/rank e valor faturado por cliente.

### Story 3.2 Tipo de Preço × Loja × Item

As a gestor,
I want cruzar Tipo de Preço, Loja e Item,
so that eu analise a política de preços praticada (Requisito 7).

#### Acceptance Criteria

1: Relatório cruza Tipo de Preço, Loja e Item.
2: Seletor permite escolher a dimensão de foco, replicando o comportamento da planilha atual.

### Story 3.3 Desempenho por Atendente

As a gestor,
I want ver quantidade e faturamento por atendente,
so that eu avalie a equipe comercial (Requisito 8).

#### Acceptance Criteria

1: Relatório exibe quantidade e faturamento por atendente.
2: O melhor desempenho do período é destacado visualmente.
3: Filtro por período e loja.

### Story 3.4 Validação de paridade final e ajustes finos

As a gestor,
I want ter confiança de que todos os 8 relatórios batem com a planilha Excel atual,
so that eu possa aposentar com segurança o processo manual.

#### Acceptance Criteria

1: Todos os 8 relatórios foram comparados lado a lado com a planilha Excel para o mesmo período e os valores conferem.
2: Divergências encontradas foram documentadas e corrigidas ou justificadas.
3: Checklist de paridade (8/8) documentado e aprovado pela gestão.

---

## Checklist Results Report

**Avaliação rápida (pm-checklist, modo autônomo):**

- ✅ Goals e Background Context derivados diretamente do Project Brief — sem invenção de escopo.
- ✅ Requisitos funcionais mapeiam 1:1 para os 8 relatórios já validados na planilha atual.
- ✅ Requisitos não-funcionais derivam de decisões já confirmadas (frescor de 24h, volume de dados, segurança de credenciais).
- ✅ Epics sequenciais: Epic 1 estabelece fundação + entrega inicial de valor (Painel); Epic 2 e 3 constroem incrementalmente sobre a base.
- ✅ Stories dimensionadas para sessões curtas de desenvolvimento (uma tela/relatório por story).
- ⚠️ **Pendências explícitas (não bloqueiam o PRD, mas bloqueiam a arquitetura):** escolha final do banco de dados, provedor de autenticação, e validação técnica da cobertura de campos da API Moveres Software.
- ⚠️ **Pendências de negócio:** orçamento, prazo, e necessidade de importar histórico anterior a Jul/2026 (herdadas do Project Brief, ainda em aberto).

## Next Steps

### UX Expert Prompt

Use este PRD (`docs/prd.md`), especialmente a seção "User Interface Design Goals" e a lista de 9 telas, para propor um frontend-spec e wireframes de baixa fidelidade do Movimento Gerais — um dashboard interno para gestores da Cirne Pneus, com foco em clareza de dados e filtros consistentes de período/loja.

### Architect Prompt

Use este PRD (`docs/prd.md`) como entrada para o modo de criação de arquitetura. Pontos que precisam de decisão técnica explícita: (1) escolha do banco de dados relacional, (2) provedor de autenticação, (3) validação técnica da API Moveres Software (endpoints, paginação, rate limits, cobertura de campos frente à aba "Dados" da planilha atual), (4) mecanismo de agendamento do job diário de sincronização. A stack de frontend/backend já está definida pelo preset `nextjs-react`.
