---
name: project-dev-environment-limits
description: Docker e WSL não estão instalados na máquina de desenvolvimento do Movimento Gerais — afeta validação de banco e o gate CodeRabbit
metadata:
  type: project
---

A máquina de desenvolvimento deste projeto **não tem Docker nem WSL instalados**
(verificado em 2026-08-27 durante a Story 1.1: `docker --version` → command not found;
`wsl.exe` → "Subsistema do Windows para Linux não está instalado").

**Why:** o `docker-compose.yml` da raiz é a forma oficial de subir o PostgreSQL 16 local
(TD-02), e o CLI do CodeRabbit só está configurado para rodar via WSL
(`.aiox-core/core-config.yaml` → `coderabbit_integration.installation_mode: wsl`).
Sem essas duas ferramentas, nenhuma story consegue validar o banco end-to-end nem passar
pelo gate automatizado de revisão de código.

**How to apply:**
- Antes de prometer verificação real contra o Postgres, confirme se o Docker já foi
  instalado — não assuma. Se não estiver, implemente e valide o caminho de falha, e
  registre explicitamente na story o que ficou pendente de verificação.
- O gate CodeRabbit deve ser pulado por graceful degradation
  (`skip_if_not_installed: true`), nunca tratado como falha da implementação.
- Prefira designs que degradem em vez de quebrar quando o banco está ausente — foi por
  isso que o health-check da Story 1.1 instancia o `PrismaClient` preguiçosamente.

Verifique se ainda é verdade antes de agir: o usuário pode ter instalado Docker/WSL
depois desta anotação.
