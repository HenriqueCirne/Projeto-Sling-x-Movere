# Epic 2 Relatórios de Faturamento e Vendas por Item

**Objetivo expandido:** Entregar os relatórios que permitem à gestão entender a evolução do faturamento ao longo do tempo e o comportamento de vendas por item, loja, prazo e condição de pagamento — cobrindo os Requisitos 1, 2, 3, 4 e 6 da planilha original.

## Story 2.1 Faturamento por Data

As a gestor,
I want ver o faturamento diário e mensal,
so that eu acompanhe a evolução das vendas ao longo do tempo (Requisito 1).

### Acceptance Criteria

1: Gráfico de série temporal exibe faturamento diário.
2: Visão alternável para agregação mensal.
3: Filtro por período e por loja.
4: Valores batem com os cálculos da planilha Excel original para o mesmo período (validação de paridade).

## Story 2.2 Vendas por Item (Família/Grupo/Marca/Linha)

As a gestor,
I want ver a quantidade vendida agrupada por Família, Grupo e Item,
so that eu identifique quais produtos vendem mais (Requisito 2).

### Acceptance Criteria

1: Tabela exibe quantidade total vendida agrupada por Família, Grupo e Item.
2: Filtro por período.
3: Ordenação por quantidade.

## Story 2.3 Vendas por Item aberto por Loja

As a gestor,
I want ver a mesma visão de vendas por item, segmentada por loja,
so that eu compare o desempenho de produtos entre lojas (Requisito 6).

### Acceptance Criteria

1: Mesma visão da Story 2.2, com dimensão adicional de Loja.
2: Permite comparar quantidade vendida do mesmo item entre lojas.

## Story 2.4 Vendas por Faixa de Prazo Médio

As a gestor,
I want ver o total de vendas agrupado por faixa de prazo médio de recebimento,
so that eu entenda o perfil de risco/prazo das vendas (Requisito 3).

### Acceptance Criteria

1: Total de vendas agrupado por faixa de Prazo Médio de recebimento.
2: Faixas seguem a mesma lógica de corte usada na planilha original.

## Story 2.5 Faturamento por Condição de Pagamento

As a gestor,
I want ver o faturamento agrupado por condição de pagamento,
so that eu entenda como a rede está recebendo pelas vendas (Requisito 4).

### Acceptance Criteria

1: Faturamento agrupado por Condição de Pagamento.
2: Filtro por período e loja.

---
