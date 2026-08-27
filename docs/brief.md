# Project Brief: Movimento Gerais

## Executive Summary

**Movimento Gerais** é um dashboard comercial web de uso interno que substitui a planilha Excel manual atualmente usada para acompanhar vendas da Cirne Pneus (rede de lojas de pneus e centro automotivo), automatizando 8 relatórios/KPIs hoje calculados via fórmulas SUMIFS sobre uma base de dados extraída do ERP — agora com **integração direta ao ERP Moveres Software**, eliminando o processo manual de export/atualização.

**Problema principal:** a equipe comercial depende de uma planilha Excel que precisa ser atualizada manualmente a partir de exports do ERP (23.724 lançamentos só em Jul-Ago/2026), tornando o processo lento, sujeito a erros e sem atualização em tempo real.

**Mercado-alvo:** uso interno — gestores e sócios da Cirne Pneus.

**Proposta de valor:** substituir a planilha por uma aplicação integrada ao ERP, que apresenta os mesmos 8 relatórios já validados pelo negócio — com dados atualizados diariamente, sem risco de fórmulas quebradas, acessível a qualquer gestor sem depender de Excel.

## Problem Statement

**Estado atual e pontos de dor:**

Hoje, o acompanhamento comercial da rede depende de uma planilha Excel (`DOC/Dashboard_Vendas_Jul_Ago_2026.xlsx`) alimentada por uma base de dados bruta extraída do ERP (aba "Dados", 23.724 lançamentos apenas em Jul–Ago/2026). Os 8 relatórios do painel (faturamento diário/mensal, vendas por item, por loja, por prazo, por condição de pagamento, ranking de clientes, tipo de preço, desempenho por atendente) são calculados via fórmulas SUMIFS manuais sobre essa base.

**Impacto do problema:**

- Atualização depende de processo manual de extração e substituição da base na planilha — não há dado em tempo real.
- Fórmulas SUMIFS em planilhas grandes (23k+ linhas por bimestre) são frágeis: fácil quebrar ao editar, difícil auditar, lentas para recalcular.
- Sem controle de acesso — qualquer pessoa com o arquivo pode editar ou corromper as fórmulas.
- Não escala: conforme a base cresce a cada período, o arquivo Excel fica maior e mais lento.

**Por que soluções existentes não bastam:**

Continuar em Excel significa manutenção manual recorrente (alguém precisa gerar o export e colar na aba "Dados" a cada período) e nenhuma integração automática com o ERP.

**Urgência:** o negócio precisa de visibilidade **diária** sobre faturamento, vendas por loja/item e desempenho de atendentes. Hoje isso só é possível reconstruindo manualmente a planilha a cada atualização — incompatível com a cadência diária necessária para decisões comerciais ágeis.

## Proposed Solution

**Conceito central:** uma aplicação web de dashboard comercial que se conecta ao ERP Moveres Software e atualiza automaticamente (diariamente) os 8 relatórios já validados na planilha atual, eliminando o processo manual de export/cópia/fórmulas.

**Diferenciais-chave frente à planilha atual:**

- Dados sincronizados diariamente com o ERP — sem intervenção manual.
- Relatórios como visualizações interativas (filtros por loja, período, item, atendente) em vez de abas fixas.
- Performance estável independente do volume de lançamentos (a planilha degrada com o crescimento da base; uma aplicação com banco de dados não).
- Controle de acesso — apenas gestores autorizados visualizam os dados.

**Por que essa solução vai funcionar onde a planilha não escala:**

Os 8 requisitos já foram validados pelo negócio (é o que a planilha atual entrega) — o risco de "construir a coisa errada" é baixo, pois o escopo do MVP já está definido pelo uso real. O trabalho é de engenharia (integração + persistência + visualização), não de descoberta de requisitos do zero.

**Visão de alto nível:** um painel único ("Painel") com KPIs de resumo (faturamento total, quantidade, nº de lançamentos, ticket médio, nº de clientes) + telas dedicadas para cada um dos 8 relatórios, com sincronização automática diária substituindo a aba "Dados" da planilha.

## Target Users

### Primary User Segment: Gestores/Sócios da Cirne Pneus

- **Perfil:** donos ou gestores responsáveis pelo acompanhamento comercial da rede de lojas.
- **Comportamento atual:** consultam manualmente a planilha Excel para faturamento, ranking de clientes e desempenho de atendentes.
- **Necessidades:** visão consolidada e por loja do faturamento, atualizada diariamente, sem depender de planilha manual.
- **Objetivo:** tomar decisões comerciais (metas, campanhas, reposição de estoque, avaliação de atendentes) com dados confiáveis e atuais.

*(Sem segmento secundário — acesso restrito à gestão; atendentes/vendedores não têm acesso próprio no MVP.)*

## Goals & Success Metrics

### Business Objectives

- Eliminar a atualização manual da planilha, reduzindo o tempo entre "dado gerado no ERP" e "dado disponível para decisão" de um processo manual periódico para **atualização diária automática**.
- Substituir completamente o uso do arquivo Excel como ferramenta de acompanhamento comercial.

### User Success Metrics

- Gestor consegue consultar o faturamento do dia anterior logo pela manhã, sem intervenção manual de ninguém.
- Todos os 8 relatórios hoje disponíveis no Excel estão disponíveis e corretos na aplicação.

### Key Performance Indicators (KPIs)

- **Cobertura de paridade:** 8/8 relatórios da planilha replicados corretamente no MVP.
- **Frescor do dado:** dados nunca com mais de 24h de defasagem em relação ao ERP.
- **Adoção:** planilha Excel deixa de ser usada pela gestão após o lançamento (meta qualitativa).

## MVP Scope

### Core Features (Must Have)

- **Painel (visão geral):** KPIs de resumo — Faturamento Total, Quantidade Total, Nº de Lançamentos, Ticket Médio, Nº de Clientes, filtráveis por período.
- **Faturamento por Data (Requisito 1):** faturamento diário e mensal, com gráfico de série temporal.
- **Vendas por Item — Família/Grupo/Marca/Linha (Requisito 2):** quantidade total vendida, agrupada por Família/Grupo/Item.
- **Vendas por Item aberto por Loja (Requisito 6):** mesma visão do Requisito 2, segmentada por loja.
- **Vendas por Faixa de Prazo (Requisito 3):** total de vendas agrupado por faixa de Prazo Médio de recebimento.
- **Faturamento por Condição de Pagamento (Requisito 4):** faturamento agrupado por condição de pagamento.
- **Ranking de Clientes (Requisito 5):** clientes ordenados por faturamento.
- **Tipo de Preço × Loja × Item (Requisito 7):** faturamento cruzado por tipo de preço, loja e item, com seletor.
- **Desempenho por Atendente (Requisito 8):** quantidade e faturamento por atendente, com destaque para o melhor desempenho.
- **Integração automática com ERP Moveres Software:** sincronização diária dos lançamentos (substitui a aba "Dados" da planilha), autenticada via credenciais configuradas em `.env` (`MOVERE_API_*`).
- **Login restrito a gestores:** autenticação simples, acesso interno apenas.

### Out of Scope for MVP

- Acesso de atendentes/vendedores ao próprio desempenho.
- Edição de dados pela aplicação (somente leitura/consulta — a fonte de verdade continua sendo o ERP).
- Exportação para Excel/PDF dos relatórios.
- Alertas/notificações automáticas (ex: queda de faturamento).
- App mobile nativo (web responsivo é suficiente para MVP).
- Metas/orçamento comercial (comparar realizado vs. meta).

### MVP Success Criteria

Os 8 relatórios estão disponíveis na aplicação com dados sincronizados diariamente do ERP Moveres Software, substituindo por completo o uso da planilha Excel pela gestão.

## Post-MVP Vision

### Phase 2 Features

- Exportação dos relatórios para Excel/PDF.
- Alertas automáticos (ex: queda de faturamento dia a dia, meta não atingida).
- Comparação com metas/orçamento comercial por loja ou atendente.
- Acesso segmentado para atendentes visualizarem o próprio desempenho.

### Long-term Vision

Evoluir de um dashboard de acompanhamento para uma ferramenta de gestão comercial mais completa — com metas, alertas proativos e, possivelmente, previsão de vendas — mantendo a integração com o ERP Moveres Software como fonte única de dados.

### Expansion Opportunities

Estender a integração ERP para outras áreas além de vendas (ex: estoque, compras, financeiro), caso o valor do dashboard comercial seja validado.

## Technical Considerations

### Platform Requirements

- **Plataformas-alvo:** Web responsivo (desktop prioritário, uso interno de gestão).
- **Suporte a navegadores:** navegadores modernos (Chrome, Edge) — sem necessidade de suporte legado.
- **Performance:** consultas sobre uma base que cresce ~23k+ lançamentos por bimestre; requer banco de dados relacional com índices adequados, não recálculo em memória a cada acesso.

### Technology Preferences

- **Frontend:** a definir com @architect.
- **Backend:** requer um job/rotina agendada (scheduler) para sincronizar diariamente com a API Moveres Software.
- **Banco de dados:** relacional, para armazenar os lançamentos sincronizados e permitir agregações (SUMIFS-like) via SQL.
- **Hospedagem:** a definir — sem preferência declarada ainda.

### Architecture Considerations

- **Repository Structure:** a definir com @architect.
- **Service Architecture:** requer minimamente (1) um processo de sincronização com o ERP Moveres, (2) uma API/backend para servir os relatórios agregados, (3) um frontend web.
- **Integration Requirements:** API REST da Moveres Software (`https://api.moveresoftware.com`, Swagger disponível, ambiente `CirnePneus`, autenticação via usuário/senha configurados em `.env` — ver `MOVERE_API_BASE_URL`, `MOVERE_API_ENVIRONMENT`, `MOVERE_API_USER`, `MOVERE_API_PASSWORD`).
- **Security/Compliance:** credenciais do ERP nunca em código-fonte versionado (já configuradas em `.env`, fora do Git); acesso à aplicação restrito a gestores autenticados.

## Constraints & Assumptions

### Constraints

- **Orçamento:** não informado.
- **Prazo:** não informado.
- **Recursos:** não informado (equipe de desenvolvimento a definir).
- **Técnico:** dependente da disponibilidade e dos limites (rate limits) da API Moveres Software, ainda não validados na prática.

### Key Assumptions

- A API Moveres Software expõe todos os campos hoje presentes na aba "Dados" da planilha (Loja, Cliente, Item, Família/Grupo/Marca/Linha, Atendente, Preço, Prazo Médio, Condição de Pagamento, Data de Emissão etc.).
- A API permite tanto consulta de dados históricos quanto incrementais diários (necessário para o backfill inicial + sincronização contínua).
- "CirnePneus" é o identificador do ambiente/tenant único da empresa na API — não há múltiplos ambientes a gerenciar.

## Risks & Open Questions

### Key Risks

- **Cobertura de campos da API:** a API pode não expor 1:1 todos os campos usados hoje nas fórmulas do Excel — precisa validação técnica antes de comprometer prazo.
- **Confiabilidade da sincronização diária:** falha no job diário gera dado desatualizado sem que o gestor perceba — precisa de monitoramento/alerta técnico (distinto dos "alertas de negócio", que estão fora do MVP).
- **Volume de dados históricos:** se for necessário importar todo o histórico (não só Jul-Ago/2026), o volume real pode ser maior que 23.724 registros.

### Open Questions

- Orçamento e prazo do projeto.
- É necessário importar dados históricos anteriores a Jul/2026, ou o dashboard começa a contar a partir do go-live?
- Preferência de hospedagem (cloud própria, servidor local da empresa, etc.)?

### Areas Needing Further Research

- Validação técnica da API Moveres Software (endpoints disponíveis, paginação, rate limits) — recomendado como primeira tarefa técnica com @architect antes de detalhar a arquitetura.

## Appendices

### C. References

- Planilha atual: `DOC/Dashboard_Vendas_Jul_Ago_2026.xlsx` (8 requisitos + base "Dados", 23.724 lançamentos)
- Export de referência do ERP: `DOC/AGO.27.26-Planilha Dashboard.xlsx`
- API Moveres Software (Swagger): https://api.moveresoftware.com/swagger/ui/index#/
- Documentação da API: https://meajuda.moveresoftware.com/a/solutions/articles/27000069342

## Next Steps

### Immediate Actions

1. @architect valida tecnicamente a API Moveres Software (campos disponíveis, autenticação, limites).
2. Criar o PRD (`*create-prd`) detalhando os 8 relatórios como requisitos funcionais formais e épicos/stories.
3. Definir orçamento/prazo com stakeholders (pendente).

### PM Handoff

Este Project Brief fornece o contexto completo do **Movimento Gerais**. Please start in 'PRD Generation Mode', review the brief thoroughly to work with the user to create the PRD section by section as the template indicates, asking for any necessary clarification or suggesting improvements.
