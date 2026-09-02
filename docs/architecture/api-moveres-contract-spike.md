# Spike técnico — Contrato real da API Moveres Software

**Autor:** Dex (@dev)
**Data:** 2026-08-31
**Status:** ✅ Concluído — bloqueio original **retratado** em 2026-09-02 (Achado 8): era um bug de casing no próprio spike, não uma restrição do Moveres. Story 1.4 liberada.
**Contexto:** Executado a pedido do usuário, seguindo a recomendação do @architect em
`docs/architecture/tech-decisions.md` (TD-03): "Criar uma story de spike técnico...
executada por @dev, com as credenciais reais, ANTES de iniciar a Story 1.4."

> Este documento usa as credenciais reais `MOVERE_API_*` do `.env` local, only para
> chamadas **GET/POST de leitura** (login + consultas). Nenhum valor de credencial,
> token, ou dado pessoal de cliente real aparece nele — todo exemplo abaixo tem PII
> redigida (nomes, telefones, CPF/CNPJ substituídos por `[REDACTED]` ou por presença
> booleana).

---

## Resultado (resumo executivo) — 🔄 ATUALIZADO EM 2026-09-02, VER ACHADO 8

> **O bloqueio do Achado 4 foi RETRATADO em 2026-09-02 (Achado 8).** Não era uma
> restrição de permissão do Moveres — era um bug de *casing* neste próprio spike,
> exatamente a classe de erro que o Achado 3 já tinha alertado, só que desta vez nos
> campos aninhados (`produtos`/`Produtos`, `parcelas`/`Parcelas`) em vez do campo raiz
> (`nf`/`NF`). **Os itens de linha e as parcelas SEMPRE estiveram lá.**

| Risco do TD-03 | Status após o spike |
|---|---|
| Cobertura de campos | ✅ **RESOLVIDO (Achado 8)** — `Produtos`/`Parcelas` (casing correto) vêm preenchidos em 100%/92% das notas testadas |
| Consulta incremental | ✅ Validado — filtro por `emissaoInicial`/`emissaoFinal` (obrigatórios) |
| Paginação | ✅ Validado — parâmetro `pagina` (offset por página, não cursor) |
| Rate limits | ❌ Ainda não validado (poucas chamadas feitas; não houve erro 429 em nenhuma sessão do spike) |
| Chave estável de linha | ✅ Confirmado que NÃO existe (consistente com TD-04 Achado 3) — reforça que a decisão da Story 1.3 (sem `@unique`) estava correta |

**✅ A Story 1.4 pode ser implementada.** `GET /api/NotasFiscaisEmitidas` retorna o
cabeçalho da nota **e** os itens de linha (`Produtos`) **e** as parcelas (`Parcelas`)
num único payload — não é preciso o endpoint dedicado
`NotasFiscaisEmitidasPorEstruturaDeItens` (que continua vazio, mas deixou de ser
necessário: Achado 8). `item`/`quantidade`/`preco` por item (FR3, FR4, FR8, FR9) são
populáveis a partir de `Produtos`. `familia`/`grupo`/`marca`/`linha` (classificação do
item) ainda precisam de um lookup por `codigo` contra um catálogo — não confirmado
neste spike, fica para a implementação da 1.4.

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

## Achado 4 — ~~🛑 BLOQUEIO: itens de linha e parcelas não retornam dados~~ ❌ RETRATADO (ver Achado 8)

> **Este achado estava ERRADO.** O texto original abaixo foi mantido intacto por
> transparência (não é reescrito silenciosamente), mas a conclusão não vale mais —
> ver Achado 8 para a causa raiz (bug de casing neste spike) e a correção.

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

## Achado 7 (2026-09-01) — Não existe caminho alternativo para item-de-venda; o bloqueio é específico, não geral

Em resposta à pergunta "não existe outro caminho na API para os itens da venda?", testei
mais 7 endpoints além dos do Achado 4/6 (todos GET, somente leitura, mesma conta):

| Endpoint | Grupo | Resultado |
|---|---|---|
| `EstruturasDeItens` | movere-inteligente | ✅ Funciona — mas só devolve a hierarquia Linha→Família→Grupo (nomes e códigos de **categoria**), sem nenhum código de item individual dentro dela. Não serve para ligar um item vendido à sua classificação. |
| `ProdutosConsultaAvancada` | movere-inteligente | Array vazio (`[]`) — mesmo padrão de bloqueio silencioso do Achado 4, ou exige parâmetro de busca não descoberto |
| `PrecosDeItensPorEstabelecimentos` | movere-inteligente | ✅ Funciona — `codigoItem`, `precoVenda`, `precoCusto` por loja. É **catálogo de preço atual**, não o preço praticado em cada venda histórica |
| `EstoquesDeItens` | movere-inteligente | ✅ Funciona — `codigoItem` + estoque disponível por loja |
| `Vendedores` | movere-api | Array vazio (`[]`) — sem efeito prático: o nome do vendedor já vem embutido na própria nota (`Comercial.nomevendedor`, Achado 4) |
| `Clientes` | movere-api | ✅ Funciona — cadastro completo de clientes |
| `MarcasDeCaptacoes` | movere-api | ✅ Funciona — marcas/modelos de veículo (não é catálogo de produto/pneu; irrelevante para os relatórios) |

**Conclusão: não há atalho.** Nenhum dos 11 endpoints testados nas duas sessões deste
spike liga um item vendido à sua venda além dos dois já identificados no Achado 4
(`NotasFiscaisEmitidas.produtos` e `NotasFiscaisEmitidasPorEstruturaDeItens`), e ambos
continuam bloqueados/vazios para esta conta.

**Achado com valor real, mesmo sem resolver o bloqueio:** o bloqueio é **específico do
vínculo venda↔item**, não uma restrição geral a "dados de item" — a mesma conta acessa
sem problema o catálogo de itens por loja (preço, estoque) e a árvore de classificação
(Linha/Família/Grupo). Isso é evidência a favor de que o ajuste necessário no Moveres é
uma permissão pontual (algo como "ver produtos em documentos fiscais"), não uma
reconfiguração ampla da conta — vale citar isso ao suporte Moveres para agilizar o
diagnóstico deles.

## Achado 8 (2026-09-02) — ✅ RETRATA o Achado 4: era um bug de casing neste spike, não um bloqueio de permissão

O usuário trouxe uma informação externa: outro projeto que integra com a mesma API
Moveres usa `GET /api/NotasFiscaisEmitidas` (o endpoint simples, sem sufixo) e consegue
os itens de linha normalmente. Isso motivou reabrir o Achado 4 em vez de aceitá-lo como
definitivo.

**Causa raiz encontrada:** o Achado 3 já tinha documentado que o Swagger usa `nf`
minúsculo mas a resposta real usa `NF` maiúsculo. **O mesmo problema existe um nível
abaixo, e o spike original não pegou:** o Swagger documenta `produtos`/`parcelas`
(minúsculos), mas a resposta real usa **`Produtos`/`Parcelas`** (maiúsculos). O código
do spike original verificava `nf.produtos`/`nf.parcelas` — que em JavaScript, sendo
case-sensitive, retorna `undefined` em vez de lançar erro. `undefined` foi
interpretado como "vazio", quando na verdade a chave certa nunca foi consultada.

**Reteste em 2026-09-02, mesma conta (`MOVERE_API_*`), sem nenhuma mudança de permissão:**

- Login confirma `grupo: {codigo: 5, nome: "SEM ACESSO"}` — **igual ao Achado 2, sem
  mudança.** A hipótese de bloqueio por permissão nunca foi verdadeira para este dado.
- `GET /api/NotasFiscaisEmitidas` (loja 1, `2026-08-03`, 17 notas): **17/17 notas com
  `Produtos` preenchido** (39 itens). Amostra de um item: `{codigo, descricao,
  codFabricacao, quantidade, precounitario, precotabela, custocompra, custoreposicao,
  valortotalitem}` — dados plausíveis, com nome de item completo (`descricao`, ex: "P
  225/75R16C 10L 118/116R H-188").
- Mesma loja, janela larga (`2026-07-01`–`2026-08-31`, 100 notas): **100/100 com
  `Produtos`** (175 itens) e **92/100 com `Parcelas`** preenchido (os 8 sem parcela são
  provavelmente à vista — condizente com `diasDasParcelas: "0"` de "DINHEIRO" no
  catálogo `CondicoesDePagamento`). Amostra de uma parcela: `{iddocumento, idparcela,
  sequencianoportador, idserie, idestab, dtalancto, dtaemissao, dtavencto,
  valordocumento, valorsaldoreceber, nossonumero, valorabatimento, valormoradiaria,
  idsituacaotitulo, idtipodocumento, idtransacao, idportadororiginal, idportador}`.
- Achado colateral: existe também uma chave `Cancelamento` (maiúscula) a nível de nota
  — `{dtacancelamento, motivocancelamento, idusuariocancelamento}`, presente só em
  notas canceladas. Não confirmado ainda se é o equivalente ao "Devolução" da planilha
  de referência (TD-04) — pode ser um conceito diferente (nota cancelada por erro
  operacional, não devolução de mercadoria). Fica como pendência para a 1.4: nenhuma
  das 100 notas da amostra tinha `idtipoentradasaida` correspondente a devolução, então
  não há dado real ainda para confirmar o mapeamento.
- Achado 5 (discriminador Venda/Transferência/Outras Saídas) **continua válido** —
  reconfirmado na mesma amostra de 100 notas: 93 vendas (`id=1` e `id=2`), 6
  transferências, 1 garantia. O filtro por `idtipoentradasaida` continua necessário.
- O Swagger não documenta nenhum parâmetro de query para "incluir produtos" — os únicos
  parâmetros de `/api/NotasFiscaisEmitidas` são `codigoLoja`, `emissaoInicial`,
  `emissaoFinal` (todos obrigatórios) e `pagina` (opcional). `Produtos`/`Parcelas` vêm
  sempre embutidos na resposta, sem precisar pedir.

**O que ainda falta (não é bloqueio, é trabalho normal de implementação):**

1. **Classificação do item** (`familia`/`grupo`/`marca`/`linha`): `Produtos[].codigo`
   dá o código do item, mas não a classificação — precisa de um lookup contra um
   catálogo (candidato: `EstruturasDeItens`, grupo `movere-inteligente`, já confirmado
   funcionando no Achado 7, mas cujo formato exato de resposta não foi mapeado campo a
   campo neste spike).
2. **Condição de Pagamento por nota**: nenhum campo de `Parcelas` bate obviamente com
   `codigoCondicao` do catálogo `CondicoesDePagamento` (testado: `idtipodocumento`,
   `idportador`/`idportadororiginal` não têm correspondência clara na amostra) — a
   pendência do Achado 6 permanece, mas agora com o dado de `Parcelas` disponível para
   investigar de verdade, em vez de bloqueada por um array vazio.
3. **`NotasFiscaisEmitidasPorEstruturaDeItens` continua retornando vazio** — não importa
   mais: `/api/NotasFiscaisEmitidas` sozinho já traz tudo. Não precisa mais investigar
   por que o endpoint dedicado está quebrado.

**Lição de processo, para não repetir:** o Achado 3 já tinha alertado exatamente sobre
esse risco de casing — "um cliente HTTP escrito estritamente a partir do Swagger...
falharia silenciosamente" — mas o próprio spike não aplicou a lição consistentemente em
todos os níveis do payload, só no nível raiz (`NF`). Ao escrever o anti-corruption layer
da Story 1.4, validar a resposta real (Zod) contra a casing observada em produção **em
TODOS os níveis aninhados**, não só no topo — e testar com um objeto real, nunca assumir
que o Swagger está certo sobre nomes de campo.

## Recomendação — 🔄 ATUALIZADA (Achado 8, 2026-09-02)

1. **✅ A Story 1.4 pode ser implementada.** O bloqueio do Achado 4 foi retratado — não
   é mais necessário esperar nenhuma ação humana junto ao Moveres.
2. Escrever o anti-corruption layer com Zod validando a casing **real** de cada nível
   aninhado (`NF`, `Produtos`, `Parcelas`, `Comercial`, `Cliente`, `NFe`, `Cancelamento`
   — todos maiúsculos no nível do campo, conforme observado neste spike), não a do
   Swagger. Escrever um teste de contrato (fixture redigida) para pegar mudança de
   casing/schema sem depender do ambiente real a cada CI.
3. Antes de codificar, resolver as duas pendências abertas do Achado 8: (a) de onde vem
   `familia`/`grupo`/`marca`/`linha` do item (`EstruturasDeItens`, não mapeado em
   detalhe ainda) e (b) como ligar uma `Parcela` a um `codigoCondicao` de
   `CondicoesDePagamento`. Nenhuma delas bloqueia o essencial (item, quantidade, preço,
   faturamento) — só refinam dimensões secundárias.
4. Mapear o discriminador Venda/Devolução (Achado 5) com uma amostra que realmente
   contenha devoluções — a amostra de 100 notas deste spike não tinha nenhuma; útil
   avaliar se `Cancelamento` é o campo certo ou se é outro conceito.
5. Nenhuma mudança é necessária no schema `sales_entries` da Story 1.3 — todos os campos
   já modelados continuam corretos.
6. TD-07 (importação de planilha) não precisa ser descontinuada — pode conviver com a
   1.4 como um caminho de backfill/correção manual, mesmo depois do sync automático
   existir.

## Change Log

| Data | Versão | Descrição | Autor |
|---|---|---|---|
| 2026-08-31 | 1.0 | Spike técnico executado com credenciais reais (`.env`). Endpoints reais descobertos via `discoveryPaths` do Swagger UI. Autenticação, paginação e filtro incremental confirmados. Bloqueio encontrado: itens de linha e parcelas retornam vazios para a conta configurada (grupo "SEM ACESSO") | Dex (@dev) |
| 2026-09-01 | 1.1 | Achado 7: testados mais 7 endpoints em busca de um caminho alternativo para item-de-venda (pergunta do usuário). Nenhum resolve o bloqueio — confirmado que os únicos dois endpoints com esse dado (Achado 4) continuam vazios/bloqueados. Achado com valor: o bloqueio é específico do vínculo venda↔item, não geral — catálogo de preço/estoque/classificação de item funciona normalmente com a mesma conta, o que sugere uma permissão pontual no Moveres, não uma reconfiguração ampla | Dex (@dev) |
| 2026-09-02 | 2.0 | **Achado 8, RETRATA o Achado 4.** Usuário trouxe informação de outro projeto usando `/api/NotasFiscaisEmitidas` com sucesso — motivou reteste. Causa raiz: bug de casing no spike original (`produtos`/`parcelas` minúsculos verificados, mas a resposta real usa `Produtos`/`Parcelas` maiúsculos — mesma classe de erro do Achado 3, não aplicada consistentemente). Reteste confirma: 100% das notas (100/100, janela Jul-Ago) com `Produtos` preenchido, 92% com `Parcelas`. Não era bloqueio de permissão — a conta nunca precisou de ajuste. Story 1.4 liberada para implementação; resumo executivo e recomendação reescritos | Dex (@dev) |
