---
name: epic-1-status
description: Epic 1 (Fundação, Autenticação e Integração com ERP) stories created 2026-08-27, pending decisions, and dependency chain
metadata:
  type: project
---

Created `docs/stories/1.1.story.md` through `1.5.story.md` on 2026-08-27, all Status: Draft, from `docs/prd/epic-1-fundao-autenticao-e-integrao-com-erp.md`. Not yet validated by @po (`*validate-story-draft`).

**Dependency chain:** 1.1 (Next.js scaffold + DB) is prerequisite for all. 1.2 (auth) and 1.3 (sales_entries schema) can run in parallel after 1.1. 1.4 (daily ERP sync job) depends on 1.3. 1.5 (Painel/dashboard KPIs) depends on both 1.2 and 1.4.

**Two architecture decisions are explicitly PENDING (not invented, flagged in every story's Dev Notes as "BLOQUEIO PENDENTE"):**
- Relational DB technology — PRD recommends PostgreSQL but @architect has not confirmed. Stories instruct dev to default to PostgreSQL as working assumption if still undecided when implementation starts, and log it as a pending-review decision.
- Auth provider (NextAuth vs Supabase Auth vs custom) — same treatment, story 1.2 explicitly says to escalate to @architect rather than choose unilaterally given the structural impact.

**Why:** `docs/architecture/` does not exist yet (@architect has not run `*create-doc architecture`). Per Constitution Article IV (No Invention), stories cite only `docs/prd/*.md` and `.aiox-core/data/tech-presets/nextjs-react.md` as sources — never invented technical details.

**How to apply:** Before @po validates or @dev implements 1.1, check whether @architect has since produced `docs/architecture/`. If so, the DB/auth pending-decision language in these 5 stories is stale and should be updated to reference the confirmed architecture doc instead of the PRD's tentative recommendation.

**Non-obvious technical detail baked into all 5 stories:** Next.js 16+ replaced `middleware.ts` with a Proxy system (`next.config.ts` + Server Component checks) — this is critical for story 1.2's route-protection AC and is called out explicitly so @dev doesn't reach for the deprecated middleware pattern. [Source: `.aiox-core/data/tech-presets/nextjs-react.md#Next.js 16+ Proxy`]

**ERP integration env vars** (names only, never values, per NFR4): `MOVERE_API_BASE_URL`, `MOVERE_API_ENVIRONMENT`, `MOVERE_API_USER`, `MOVERE_API_PASSWORD` — already present in `.env`/`.env.example`. Used in story 1.4.

See [[project-movimento-gerais]] for overall project context.
