---
name: project-movimento-gerais
description: Movimento Gerais — dashboard comercial para a Cirne Pneus; contexto de produto, origem (planilha SUMIFS) e integração com o ERP Moveres Software
metadata:
  type: project
---

"Movimento Gerais" é um dashboard comercial para a **Cirne Pneus**. O MVP substitui uma planilha Excel de análise de vendas (cálculos SUMIFS) por 8 relatórios + um Painel de KPIs, alimentados por sincronização diária com o ERP **Moveres Software** (API REST, credenciais `MOVERE_API_*`).

**Why:** a gestão hoje depende de atualização manual de planilha; o valor do produto é eliminar esse trabalho e dar visão comercial com no máximo 24h de defasagem (NFR1).

**How to apply:**
- Fidelidade de cálculo é o requisito mais crítico do produto — qualquer relatório deve reproduzir exatamente o que a planilha faz hoje (`DOC/Dashboard_Vendas_Jul_Ago_2026.xlsx` é a referência). Ao validar stories de agregação, exija que a fórmula seja rastreável à planilha ou ao PRD, nunca inventada.
- Epic 1 = fundação + auth + sync + Painel. Epics 2 e 3 = os 8 relatórios.
- Todos os relatórios compartilham filtro por período (e loja quando aplicável) — FR12. Componentes de filtro devem nascer reutilizáveis já na Story 1.5.

Ver [[epic-1-decisoes-arquiteturais-pendentes]].
