---
name: dev-machine-constraints
description: Docker and WSL are not installed on this dev machine — blocks real-DB verification and all CodeRabbit gates for the Movimento Gerais project
metadata:
  type: project
---

A máquina de desenvolvimento deste projeto **não tem Docker nem WSL instalados** (verificado em 2026-08-27: `docker`, `docker-compose`, `psql` ausentes do PATH; nada escutando em 5432; `wsl.exe -l -v` → "O Subsistema do Windows para Linux não está instalado").

**Why:** Duas consequências recorrentes que afetam todo gate de QA neste projeto:
1. O `docker-compose.yml` sobe PostgreSQL 16 para dev (TD-02), mas **nada que dependa de um banco real pode ser verificado aqui** — migrações Prisma, caminhos "conectado" de health-check e testes de integração ficam cobertos apenas por mock.
2. O CLI do CodeRabbit só roda via WSL, então o gate de revisão automatizada é sempre pulado por graceful degradation — em todas as fases, @dev e @qa.

**How to apply:** Ao revisar qualquer story que toque banco de dados, não aceite "testado" para o caminho que exige Postgres de pé — verifique se a cobertura é mock ou real, e rebaixe para CONCERNS com um item de verificação pendente em vez de dar PASS silencioso. Foi exatamente esse o driver do TEST-001 na Story 1.1. **Reconfirme o estado antes de agir** — Docker/WSL podem ter sido instalados desde então. Relacionado: [[epic1-ac4-ci-pendente]].
