# Spike técnico — Contrato real da API Moveres Software

**Autor:** Dex (@dev)
**Data:** 2026-08-31
**Status:** Concluído com **bloqueio** — ver "Resultado" abaixo
**Contexto:** Executado a pedido do usuário, seguindo a recomendação do @architect em
`docs/architecture/tech-decisions.md` (TD-03): "Criar uma story de spike técnico...
executada por @dev, com as credenciais reais, ANTES de iniciar a Story 1.4."

> Este documento usa as credenciais reais `MOVERE_API_*` do `.env` local, only para
> chamadas **GET/POST de leitura** (login + consultas). Nenhum valor de credencial,
> token, ou dado pessoal de cliente real aparece nele — todo exemplo abaixo tem PII
> redigida (nomes, telefones, CPF/CNPJ substituídos por `[REDACTED]` ou por presença
> booleana).

---

## Resultado (resumo executivo)

| Risco do TD-03 | Status após o spike |
|---|---|
| Cobertura de campos | ⚠️ **PARCIAL — BLOQUEIO ENCONTRADO** (ver Achado 4) |
| Consulta incremental | ✅ Validado — filtro por `emissaoInicial`/`emissaoFinal` (obrigatórios) |
| Paginação | ✅ Validado — parâmetro `pagina` (offset por página, não cursor) |
| Rate limits | ❌ Ainda não validado (poucas chamadas feitas; não houve erro 429 nas ~10 chamadas do spike) |
| Chave estável de linha | ✅ Confirmado que NÃO existe (consistente com TD-04 Achado 3) — reforça que a decisão da Story 1.3 (sem `@unique`) estava correta |

**🛑 Não recomendo iniciar a implementação da Story 1.4 antes de resolver o Achado 4.**
As credenciais `MOVERE_API_*` atuais retornam o cabeçalho de cada nota fiscal (cliente,
vendedor, valor total, data de emissão) mas **os itens de linha e as parcelas vêm
sempre vazios** — e o endpoint dedicado a itens de linha devolve **zero resultados**.
Sem itens de linha não é possível popular `item`, `familia`, `grupo`, `marca`, `linha`,
nem `quantidade`/`preco` por item — os campos centrais de FR3, FR4, FR8 e FR9.

---

## Achado 1 — Descoberta dos endpoints reais (Swagger)

O @architect tentou `/swagger/docs/v1` e `/swagger/v1/swagger.json` (ambos 404). A
página `https://api.moveresoftware.com/swagger/ui/index` carrega normalmente e seu
script inline revela os `discoveryPaths` reais:

```
https://api.moveresoftware.com/swagger/docs/movere-api
https://api.moveresoftware.com/swagger/docs/movere-inteligente
```

Os grupos certos são `movere-api` e `movere-inteligente`, não `v1`. Os dois specs são
públicos (200 OK sem autenticação) e juntos documentam ~42 endpoints.

Endpoints relevantes ao projeto (grupo `movere-api`, salvo indicação contrária):

| Endpoint | Método | Propósito |
|---|---|---|
| `/api/LoginComAmbiente` | POST | Autenticação — `{ambiente, usuario, senha}` → token + dados do usuário |
| `/api/Login` | POST | Autenticação sem ambiente — **testado e falha** para esta conta (ver Achado 2) |
| `/api/Estabelecimentos` | GET | Lojas (mapeia `codigoEstabelecimento` → nome, ex: "01 - MT") |
| `/api/NotasFiscaisEmitidas` | GET | Notas fiscais (cabeçalho) — **funciona, mas sem itens/parcelas** (Achado 3) |
| `/api/NotasFiscaisEmitidasPorEstruturaDeItens` | GET | Notas por item de linha — **retorna sempre vazio** (Achado 4) |
| `/api/Vendedores` | GET | Catálogo de atendentes/vendedores |
| `/api/Clientes` | GET | Catálogo de clientes |
| `/api/TiposDePrecos` | GET | Catálogo — testado, funciona (`codigoTipoPreco` → `nome`, ex: 1 → "VAREJO") |
| `/api/CondicoesDePagamento` | GET | Catálogo — testado, funciona (`codigoCondicao` → `nome`, ex: 1 → "DINHEIRO") |
| `/api/Itens` (grupo `movere-inteligente`) | GET | Catálogo de itens — **testado, retorna vazio** (mesma suspeita do Achado 4) |

## Achado 2 — Autenticação confirmada

`POST /api/LoginComAmbiente` com `{ambiente, usuario, senha}` (os 3 valores de
`MOVERE_API_ENVIRONMENT`/`MOVERE_API_USER`/`MOVERE_API_PASSWORD`) retorna **200** e um
token (~583 caracteres) usado como `Authorization: Bearer <token>` nas chamadas
seguintes — confirma o padrão documentado publicamente que o @architect já havia
identificado.

`POST /api/Login` (sem `ambiente`) foi testado e retornou **400**:
`"Não há conexão com o banco de dados para o ambiente: ConexaoPadrao"` — confirma que
`LoginComAmbiente` é o fluxo correto para este projeto (o de-para 1:1 com as 3 variáveis
de ambiente já existentes é o caminho certo, não um atalho a simplificar).

⚠️ **Achado colateral:** a resposta do login inclui `grupo: { codigo: 5, nome: "SEM
ACESSO" }` para a conta configurada. Ver Achado 4 — é a hipótese mais provável para o
bloqueio.

## Achado 3 — Divergência de casing entre o Swagger e a resposta real

O Swagger documenta `/api/NotasFiscaisEmitidas` como retornando
`{ nf: { ... } }` (chave `nf` minúscula). **A resposta real usa `{ "NF": { ... } }`**
(maiúscula). Um cliente HTTP escrito estritamente a partir do Swagger (ex: Zod schema
com `nf` minúsculo) falharia silenciosamente — o campo apareceria como `undefined` em
vez de lançar um erro óbvio, porque JSON é case-sensitive e TypeScript não avisa sobre
uma chave ausente em tempo de execução.

**Implicação para a Story 1.4:** o anti-corruption layer (já recomendado pelo TD-03)
deve validar a resposta real com Zod contra a **casing observada em produção**, não
contra o Swagger — e o spike recomenda um teste de contrato (ex: fixture de resposta
real, redigida) para pegar futuras mudanças de casing/schema sem depender de rodar
contra o ambiente real a cada CI.

## Achado 4 — 🛑 BLOQUEIO: itens de linha e parcelas não retornam dados

Testado com a conta configurada, loja `1` (codigoEstabelecimento), duas janelas de
data (`2026-08-03` isolado, e `2026-07-01`–`2026-08-31` mais larga):

- `GET /api/NotasFiscaisEmitidas` retorna corretamente os cabeçalhos das notas (100
  notas na janela larga, 17 na janela de 1 dia) — `dtaemissao`, `valortotalnota`,
  `idnotafiscal`, `Comercial.tipopreco`, `Comercial.idvendedor`/`nomevendedor`,
  `identradasaida`/`descricaoentradaesaida` (ver Achado 5) todos presentes e com
  valores plausíveis.
- **Em TODAS as notas de ambas as janelas, `produtos: []` e `parcelas: []`** (arrays
  vazios), apesar de o Swagger documentar esses campos como presentes na resposta.
- `GET /api/NotasFiscaisEmitidasPorEstruturaDeItens` — o endpoint dedicado a retornar
  notas com itens de linha (`produtosDaNota`) — **retornou 0 resultados** nas duas
  janelas testadas (mesma loja).
- `GET /api/Itens` (catálogo de itens, grupo `movere-inteligente`) — **retornou `[]`**
  (array vazio) sem filtro algum.

**Três chamadas independentes, dois endpoints diferentes, duas janelas de data —
resultado consistente: zero acesso a dados de item de linha.** Não é uma falha
pontual de um dia específico.

**Hipótese mais provável:** a conta configurada em `MOVERE_API_*` pertence ao grupo de
permissão `"SEM ACESSO"` (Achado 2) e esse grupo bloqueia especificamente os dados de
item/produto — enquanto o cabeçalho da nota (cliente, vendedor, valor total) continua
visível. Isso é consistente com um sistema ERP que segrega permissão por módulo
(cabeçalho financeiro/comercial vs. detalhe de estoque/produto).

**Impacto se não resolvido:** sem itens de linha, os campos `item`, `familia`,
`grupo`, `marca`, `linha` e a **quantidade/preço por item** (não por nota) do schema da
Story 1.3 ficam **impossíveis de popular** — o que inviabiliza diretamente FR3, FR4,
FR8 e FR9 (4 dos 8 relatórios da Epic 2/3), além de tornar o Faturamento Total (FR1)
calculável só via `valortotalnota` agregado por nota, não por item.

## Achado 5 — Discriminador Venda × Transferência × Outras Saídas (crítico para AC2 da 1.4)

A janela de 1 dia (loja 1, 2026-08-03) trouxe 17 notas com estes valores de
`descricaoentradaesaida`:

| `descricaoentradaesaida` | `identradasaida` | `idtipoentradasaida` | Ocorrências no dia | Incluir em `sales_entries`? |
|---|---|---|---|---|
| `VENDAS DE MERCADORIAS/SERVIÇOS` | 1 | 2 | 13 | ✅ Sim — é o "Venda" do TD-04 |
| `SAIDA DE TRANSFERENCIA` | 26 | 1 | 2 | ❌ Não — transferência entre lojas, não é venda a cliente |
| `OUTRAS SAIDAS` | 22 | 10 | 1 | ⚠️ Indefinido — não observei exemplo suficiente para classificar |
| `Devolução` (do export de referência, TD-04) | — | — | 0 nesta amostra | Não apareceu na janela testada — apenas confirmado que a planilha de referência tem essa categoria |

**Confirma, com dado real e não só a planilha de referência, que `/api/NotasFiscaisEmitidas`
retorna TODOS os tipos de movimento fiscal, não só vendas a cliente.** A Story 1.4 DEVE
filtrar por `descricaoentradaesaida`/`identradasaida` (ou o código `idtipoentradasaida`,
que parece mais estável para lógica de código do que a string) antes de gravar em
`sales_entries` — sincronizar sem esse filtro contaminaria os relatórios com
transferências de estoque, inflando o Faturamento Total artificialmente.

**Pendente:** a planilha de referência do TD-04 usa exatamente dois valores (`Venda` e
`Devolução`) na coluna `Tipo` — o mapeamento exato de `idtipoentradasaida`/
`descricaoentradaesaida` do ERP para esses dois valores (incluindo o que fazer com
`OUTRAS SAIDAS`) não está confirmado. Precisa de mais amostragem (idealmente contra o
mesmo período `Jul-Ago 2026` do export de referência) ou confirmação do suporte
Moveres/da Cirne Pneus sobre o significado de cada `idtipoentradasaida`.

## Achado 6 — Catálogos de apoio confirmados (para desnormalizar os IDs em texto)

`Comercial.tipopreco` (int) e `Comercial.idvendedor` (int) na nota vêm como **códigos**,
não texto — a Story 1.3 modelou `tipoPreco`/`atendente` como texto (`String?`), então o
job de sincronização da 1.4 precisa resolver esses códigos:

- `tipopreco` → `GET /api/TiposDePrecos` (testado, funciona): `{codigoTipoPreco, nome}` (ex: 1 → "VAREJO", 2 → "ATACADO")
- `idvendedor` → já vem resolvido como `nomevendedor` na própria nota (não precisa de lookup separado)
- `Condição de Pagamento` → `GET /api/CondicoesDePagamento` (testado, funciona: `{codigoCondicao, nome}`, ex: 1 → "DINHEIRO", 2 → "CHEQUE"), mas **não encontrei o campo que liga a nota a um `codigoCondicao`** na resposta de `/api/NotasFiscaisEmitidas` testada — pode estar em `parcelas` (que veio sempre vazio, Achado 4) ou em outro campo não capturado nesta amostra. Fica como pendência do Achado 4.
- `Prazo Médio` → provavelmente derivado de `parcelas[].dtavencto` vs. `dtaemissao` (média ponderada dos vencimentos) — também bloqueado pelo Achado 4, já que `parcelas` veio sempre vazio.

## Recomendação

1. **Não iniciar a implementação da Story 1.4 agora.** O Achado 4 é um bloqueio real,
   não uma dúvida de design — sem resolver isso, qualquer código escrito para
   itens/parcelas seria especulativo (violaria o Artigo IV da Constitution, "No
   Invention").
2. **Ação humana necessária:** verificar com o administrador da conta Moveres (ou
   suporte Moveres) por que o grupo de permissão retornado é `"SEM ACESSO"` e se existe
   um grupo/permissão que habilite os endpoints de item de linha
   (`NotasFiscaisEmitidasPorEstruturaDeItens`, `Itens`) e parcelas.
3. Depois de resolvido, repetir os testes deste spike (o `spike.js`/`spike2.js`/`spike3.js`
   usados aqui ficaram só no scratchpad da sessão, não foram commitados — reproduzíveis
   a partir da lista de endpoints e parâmetros documentada acima) para confirmar que os
   arrays `produtos`/`parcelas` passam a vir preenchidos, e então mapear o Achado 5
   (discriminador Venda/Devolução/Outras Saídas) com uma amostra maior antes de
   escrever o anti-corruption layer da Story 1.4.
4. Nenhuma mudança é necessária no schema `sales_entries` da Story 1.3 — todos os campos
   já modelados continuam corretos; o problema é de acesso aos dados, não de modelagem.

## Change Log

| Data | Versão | Descrição | Autor |
|---|---|---|---|
| 2026-08-31 | 1.0 | Spike técnico executado com credenciais reais (`.env`). Endpoints reais descobertos via `discoveryPaths` do Swagger UI. Autenticação, paginação e filtro incremental confirmados. Bloqueio encontrado: itens de linha e parcelas retornam vazios para a conta configurada (grupo "SEM ACESSO") | Dex (@dev) |
