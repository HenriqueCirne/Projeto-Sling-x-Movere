# Epic 1 Fundação, Autenticação e Integração com ERP

**Objetivo expandido:** Estabelecer a infraestrutura do projeto (Next.js, banco de dados, CI) com autenticação restrita a gestores, e entregar a sincronização diária dos lançamentos de venda com o ERP Moveres Software — culminando em um Painel inicial funcional com os KPIs de resumo (FR1, FR10, FR11), a primeira entrega de valor real da aplicação.

## Story 1.1 Setup do projeto Next.js e banco de dados

As a gestor,
I want uma aplicação base rodando com banco de dados configurado,
so that a equipe técnica tenha uma fundação sólida para construir os relatórios.

### Acceptance Criteria

1: Repositório Next.js (App Router) criado com TypeScript, Tailwind, seguindo o preset `nextjs-react`.
2: Banco de dados relacional configurado e acessível pela aplicação (migração inicial, ainda sem dados).
3: Aplicação sobe localmente (`npm run dev`) e exibe uma página inicial simples (health-check).
4: Pipeline de CI básico executa lint, typecheck e testes a cada push.

## Story 1.2 Autenticação de gestores

As a gestor,
I want fazer login com credenciais restritas,
so that apenas a gestão autorizada acesse os dados comerciais.

### Acceptance Criteria

1: Existe uma tela de login funcional.
2: Usuários não autenticados são redirecionados para o login ao tentar acessar qualquer rota do dashboard.
3: Credenciais inválidas exibem mensagem de erro clara.
4: Sessão autenticada persiste entre navegações (cookie/sessão segura).

## Story 1.3 Modelagem de dados dos lançamentos de venda

As a developer,
I want um schema de banco de dados que espelhe os campos dos lançamentos de venda do ERP (Loja, Cliente, Item, Família/Grupo/Marca/Linha, Atendente, Preço, Prazo Médio, Condição de Pagamento, Data de Emissão),
so that todos os 8 relatórios possam ser calculados via consultas SQL.

### Acceptance Criteria

1: Tabela `sales_entries` (ou equivalente) criada com todos os campos necessários aos 8 relatórios.
2: Migração versionada e documentada.
3: Índices criados nos campos usados para filtros/agregações (Data de Emissão, Loja, Cliente, Atendente).

## Story 1.4 Job de sincronização diária com a API Moveres Software

As a gestor,
I want que os dados de vendas sincronizem automaticamente uma vez por dia a partir do ERP,
so that eu não dependa de atualização manual.

### Acceptance Criteria

1: Job agendado autentica na API Moveres Software usando as credenciais de `.env` (`MOVERE_API_*`).
2: Job busca lançamentos novos/atualizados e grava/atualiza na tabela `sales_entries`.
3: Execuções do job são registradas em log (sucesso/erro), atendendo NFR6.
4: Job pode ser executado manualmente para fins de teste/backfill inicial.
5: Falha na sincronização não derruba a aplicação (tratamento de erro isolado).

## Story 1.5 Painel (Dashboard geral) com KPIs de resumo

As a gestor,
I want ver um painel com os principais indicadores,
so that eu tenha uma visão imediata do desempenho comercial.

### Acceptance Criteria

1: Painel exibe Faturamento Total, Quantidade Total, Nº de Lançamentos, Ticket Médio e Nº de Clientes.
2: KPIs são filtráveis por período (data inicial/final).
3: Painel só é acessível para usuários autenticados (depende da Story 1.2).
4: Dados exibidos vêm da tabela sincronizada (depende da Story 1.4).

---
