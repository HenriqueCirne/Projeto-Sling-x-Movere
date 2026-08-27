---
name: execucao-autonoma-ate-primeira-entrega
description: O usuário pediu execução autônoma (YOLO) até a primeira entrega do sistema — decidir e documentar em vez de parar para elicitação
metadata:
  type: feedback
---

Executar o pipeline AIOX em modo autônomo até a primeira entrega funcional; não parar para elicitação a menos que um artefato realmente falhe a validação.

**Why:** o usuário quer velocidade até a primeira entrega de valor (Painel da Story 1.5) e explicitamente autorizou decisões autônomas. Parar para perguntar em cada ambiguidade destrói o ganho do modo autônomo.

**How to apply:**
- Ambiguidade decidível a partir do PRD/brief/preset → decida, marque como `[AUTO-DECISION]` no artefato e registre no Change Log com o motivo. Não pergunte.
- Ambiguidade que exige autoridade de outro agente (arquitetura, banco, provedor de auth) → registre um *default de trabalho derivado das fontes* + obrigação de ratificação, em vez de bloquear.
- Só pare de verdade quando uma story reprovar a validação (<7/10) ou quando a decisão puder invalidar trabalho já feito (ex: mudança de fórmula de KPI que altera o schema).
- Respeite os limites de autoridade mesmo em YOLO: como @po eu edito Title/Description/AC/Scope e faço append no Change Log — **não** edito Dev Notes, Tasks nem File List (são do @dev).
