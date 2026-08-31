---
name: epic1-ac4-ci-pendente
description: Story 1.1 fechou como Done com a AC4 (pipeline de CI) não cumprida — decisão de governança do TD-05 ainda pendente no @po
metadata:
  type: project
---

A **AC4 da Story 1.1 (pipeline de CI) foi fechada como Done sem ser cumprida**. `.github/workflows/` não existe. Não é falha do @dev: o TD-05 (`docs/architecture/tech-decisions.md`) ratifica que CI/CD é operação exclusiva do @devops.

**Why:** O TD-05 deixou explicitamente uma decisão em aberto para o @po — "mover a AC4 para uma story de @devops ou registrar a delegação explicitamente" — e essa decisão **nunca foi tomada**. O resultado é uma AC não cumprida saindo para `Done`, onde o único mecanismo que impede o esquecimento é prosa dentro do story file. Foi o achado REQ-001 do gate CONCERNS de 2026-08-27.

**How to apply:** Se a AC4 continuar sem story própria quando as Stories 1.2–1.5 chegarem ao gate, escale — é dívida de processo acumulando, não um detalhe. O projeto está rodando **sem nenhuma verificação automatizada em push**: nem CI, nem CodeRabbit (ver [[dev-machine-constraints]]). Isso eleva o peso de cada gate manual meu. Comandos que o pipeline deve rodar, todos já verificados localmente: `npm ci` → `npm run lint` → `npm run typecheck` → `npm test` → `npm run build`.
