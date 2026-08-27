# Technical Assumptions

## Repository Structure: Monorepo

Um único repositório contendo a aplicação Next.js (frontend + API routes) e o job de sincronização com o ERP, seguindo a estrutura de `packages/` já usada pelo framework AIOX neste projeto.

## Service Architecture

Monolito Next.js (App Router) servindo frontend + API routes, com um processo agendado (cron/scheduled job) responsável pela sincronização diária com a API Moveres Software. Não há necessidade de microsserviços — volume e complexidade (23k+ lançamentos/bimestre, 8 relatórios) não justificam essa sobrecarga operacional.

## Testing Requirements: Unit + Integration

Testes unitários para lógica de agregação dos relatórios (crítico, pois precisa reproduzir fielmente os cálculos hoje feitos via SUMIFS) + testes de integração para o job de sincronização com o ERP (mock da API Moveres). Testes E2E (Playwright, disponível no preset) recomendados para os fluxos críticos (login, Painel, cada um dos 8 relatórios), não exigidos para 100% da aplicação no MVP.

## Additional Technical Assumptions and Requests

- **Frontend/Backend:** Next.js 16+, React, TypeScript, Tailwind CSS (preset `nextjs-react` ativo no projeto, explicitamente indicado para "Dashboards administrativos").
- **Banco de dados:** relacional (PostgreSQL recomendado) — necessário para agregações tipo SUMIFS via SQL. **Não confirmado ainda** — requer validação com @architect (ex: Supabase, Postgres gerenciado, outro).
- **Integração ERP:** cliente HTTP para a API Moveres Software (`MOVERE_API_*` já configurado em `.env`), executado por um job agendado diário.
- **Validação de dados:** Zod (parte do preset) para validar o payload recebido da API do ERP antes de persistir.
- **Autenticação:** mecanismo simples de login restrito a gestores (NFR3) — provedor específico (ex: NextAuth, Supabase Auth) a definir com @architect.

---
