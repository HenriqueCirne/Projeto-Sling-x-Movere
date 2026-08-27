# User Interface Design Goals

## Visão Geral de UX

Um dashboard analítico direto ao ponto, priorizando clareza de números e gráficos sobre estética elaborada — o público é gestor interno que precisa checar KPIs rapidamente, não um produto voltado a clientes externos. Navegação simples entre o Painel geral e os 8 relatórios específicos, com filtros consistentes (período, loja) em todas as telas.

## Paradigmas-Chave de Interação

- Filtros persistentes de período e loja aplicáveis a qualquer relatório.
- Tabelas com ordenação por coluna (ex: ranking de clientes, desempenho por atendente).
- Gráficos interativos (hover para detalhes) nos relatórios de série temporal.
- Seletor explícito no relatório "Tipo de Preço × Loja × Item" (Requisito 7), conforme já existe na planilha atual.

## Telas e Views Principais

1. Login — autenticação restrita a gestores.
2. Painel (Dashboard geral) — KPIs de resumo + atalhos para os 8 relatórios.
3. Faturamento por Data — série temporal diária/mensal.
4. Vendas por Item (Família/Grupo/Marca/Linha) — com abertura por loja.
5. Vendas por Faixa de Prazo.
6. Faturamento por Condição de Pagamento.
7. Ranking de Clientes.
8. Tipo de Preço × Loja × Item.
9. Desempenho por Atendente.

## Acessibilidade: None

Ferramenta interna de uso restrito à gestão, sem requisito de conformidade declarado.

## Branding

Nenhum guia de marca ou identidade visual foi fornecido. Visual neutro/corporativo padrão até definição futura.

## Dispositivos e Plataformas-Alvo: Web Responsive

Desktop prioritário, mas responsivo.

---
