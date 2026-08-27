---
name: project-movimento-gerais
description: Movimento Gerais (dashboard comercial Cirne Pneus) — mandato de execução autônoma até a primeira entrega e decisões humanas que continuam pendentes
metadata:
  type: project
---

O projeto **Movimento Gerais** (dashboard Next.js para a Cirne Pneus, substitui planilha Excel, integra ao ERP Moveres Software) roda em **modo de execução autônoma até a primeira entrega do sistema** — agentes decidem sozinhos e documentam como `[AUTO-DECISION]` em vez de parar para elicitação.

**Why:** o usuário pediu explicitamente execução autônoma; parar a cada decisão técnica trava a Epic 1 inteira, cujas stories já vinham com bloqueios do tipo "escalar para @architect".

**How to apply:** decida e documente o racional + trade-offs. A exceção importante: **questões de dado de negócio real não são decisões de arquitetura** — documente a ambiguidade com números em vez de escolher (foi o caso do Ticket Médio: a planilha calcula por linha, R$ 438,15, mas por venda daria R$ 978,87; a decisão é do gestor).

Decisões técnicas da Epic 1 estão em `docs/architecture/tech-decisions.md` (TD-01 a TD-05). Perguntas que ainda dependem de humano estão na seção "Riscos abertos" desse mesmo doc — a mais importante é **R2: ninguém validou o contrato da API Moveres** (Swagger público não expõe spec; exige spike com credenciais reais antes da Story 1.4).

Fonte de verdade do negócio: as planilhas em `DOC/` — `Dashboard_Vendas_Jul_Ago_2026.xlsx` tem a aba `Painel` com as fórmulas originais e a aba `Dados` com 99 colunas do export do ERP. Vale abrir (é zip: `unzip` + parse do XML) antes de assumir qualquer regra de cálculo.
