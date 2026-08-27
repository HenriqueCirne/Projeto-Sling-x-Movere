---
name: epic-1-decisoes-arquiteturais-pendentes
description: Três decisões do @architect ainda em aberto na Epic 1 do Movimento Gerais (banco, provedor de auth, hospedagem/agendamento) e como elas afetam validação de stories
metadata:
  type: project
---

Em 2026-08-27, na validação das stories 1.1–1.5 da Epic 1, três decisões técnicas estavam **pendentes de @architect** e atravessavam várias stories:

1. **Banco de dados relacional** — PostgreSQL é recomendação do PRD, não confirmado. Story 1.1 oferece default de trabalho (PostgreSQL + Prisma).
2. **Provedor de autenticação** — NextAuth/Auth.js, Supabase Auth ou custom. Story 1.2 **não** oferece default e manda escalar.
3. **Hospedagem e mecanismo de agendamento (cron)** — indefinidos. Afeta a AC1 da Story 1.4.

**Why:** o projeto não tem `docs/architecture/` — @architect ainda não produziu o architecture doc, então todas as decisões técnicas das stories vêm do PRD e do preset `nextjs-react`. Isso torna as stories vulneráveis a invenção técnica (Constitution Artigo IV).

**How to apply:**
- Antes de validar novas stories da Epic 1/2/3, verifique se essas decisões já foram fechadas; se sim, esta memória está desatualizada e deve ser removida ou reescrita.
- Padrão de qualidade aceito neste projeto: uma decisão pendente **não** reprova a story se ela registrar um *default de trabalho derivável do PRD* + obrigação de documentar como pendente de ratificação. Uma decisão pendente **sem** default é a fraqueza real — foi a principal dedução de nota na Story 1.2.

Ver [[project-movimento-gerais]].
