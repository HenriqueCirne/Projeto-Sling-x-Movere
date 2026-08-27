---
name: project-movimento-gerais
description: Movimento Gerais project context — dashboard for Cirne Pneus replacing Excel, Epic 1 status and pending architecture decisions
metadata:
  type: project
---

**Movimento Gerais** is a commercial dashboard (Next.js/React/TypeScript, `nextjs-react` preset) for Cirne Pneus (tire/auto-parts store chain), replacing a manual Excel spreadsheet (`DOC/Dashboard_Vendas_Jul_Ago_2026.xlsx`, 23,724+ entries/bimester) with an app synced daily to the Moveres Software ERP (`https://api.moveresoftware.com`). 8 reports + 1 summary Painel (dashboard), all read-only/internal to managers ("gestores").

PRD is sharded at `docs/prd/` (see `docs/prd/index.md`). Epics: Epic 1 (Foundation/Auth/ERP integration, 5 stories), Epic 2 (Billing/sales-by-item reports), Epic 3 (Customer/price/attendant reports).

**Why:** Business already validated the 8 reports (they exist in the Excel today) — low risk of "building the wrong thing," this is pure engineering (integration + persistence + visualization), not requirements discovery.

**How to apply:** When drafting/expanding stories for Epic 2/3, reuse the same env var names, DB/auth pending-decision framing, and dependency chain established in Epic 1 (see [[epic-1-status]]). Always check `docs/architecture/` first — as of 2026-08-27 it does not exist yet (no @architect run performed).
