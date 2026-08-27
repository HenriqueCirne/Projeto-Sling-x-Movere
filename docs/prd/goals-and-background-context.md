# Goals and Background Context

## Goals

- Fornecer aos gestores da Cirne Pneus visibilidade diária e consolidada do faturamento, substituindo a planilha Excel manual.
- Replicar fielmente os 8 relatórios comerciais já validados no Excel, sem perda de informação.
- Integrar automaticamente com o ERP Moveres Software, eliminando a atualização manual de dados.
- Restringir o acesso aos dados comerciais apenas à gestão, com autenticação.
- Garantir que os dados nunca fiquem com mais de 24h de defasagem em relação ao ERP.

## Background Context

A Cirne Pneus opera uma rede de lojas de pneus e centro automotivo (marcas como Bridgestone, Firestone, Westlake; serviços de alinhamento, balanceamento, troca de óleo, freios e suspensão), com múltiplas lojas registrando lançamentos de venda em um ERP (Moveres Software). Atualmente, o acompanhamento comercial da rede depende de uma planilha Excel mantida manualmente, alimentada por exports periódicos do ERP (23.724 lançamentos apenas em Jul-Ago/2026), com 8 relatórios calculados via fórmulas SUMIFS.

Esse processo manual não escala e não atende à necessidade de visibilidade diária da gestão. O **Movimento Gerais** nasce para resolver isso, substituindo a planilha por uma aplicação web integrada diretamente à API do ERP, replicando os mesmos 8 relatórios já validados pelo negócio, com atualização automática diária.

## Change Log

| Date | Version | Description | Author |
|------|---------|--------------|--------|
| 2026-08-27 | 0.1 | Criação inicial do PRD a partir do Project Brief | Morgan (PM) |
| 2026-08-27 | 1.0 | PRD completo: requisitos, UI goals, technical assumptions, epics e stories | Morgan (PM) |

---
