# Requirements

## Functional

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

## Non Functional

1. NFR1: Os dados exibidos não devem ter mais de 24 horas de defasagem em relação ao ERP.
2. NFR2: O sistema deve suportar o volume atual de dados (23.724+ lançamentos por bimestre, com tendência de crescimento) com tempos de resposta na casa de poucos segundos por relatório.
3. NFR3: O acesso à aplicação deve ser restrito a usuários autenticados (gestores); não deve haver acesso público ou anônimo.
4. NFR4: As credenciais de integração com o ERP não devem ser armazenadas em código-fonte versionado.
5. NFR5: O sistema deve ser responsivo, funcionando corretamente em navegadores desktop modernos (Chrome, Edge).
6. NFR6: Falhas na sincronização diária com o ERP devem ser registradas (log) para permitir diagnóstico técnico.

---
