# Etapa 11 — Pacote de contratos em build time

## O que foi criado

Foi criado `packages/contracts`, uma biblioteca TypeScript chamada `@mfe-lab/contracts`. Ela gera ESM em `dist/index.js` e declarações em `dist/index.d.ts`, possui `exports` explícito e é consumida pelos três apps com `workspace:*`.

O pacote exporta somente:

- `AccountRole`;
- `AccountMountOptions`;
- `AccountMountHandle`;
- `LAB_EVENT_NAMES` para carrinho e perfil;
- `CartUpdatedEventPayload`;
- `ProfileUpdatedEventPayload`.

As cópias locais dos contratos de montagem foram removidas. Account importa os tipos do pacote, e a declaração federada do shell referencia os mesmos tipos. O papel local duplicado do componente Vue também passou a usar `AccountRole`.

## Por que foi criado

Antes desta etapa, producer e consumer escreviam separadamente aquilo que acreditavam ser o contrato de `account/mount`. As definições eram iguais, mas TypeScript não sabia que deveriam evoluir juntas. Uma equipe poderia alterar uma cópia e esquecer a outra.

Agora existe uma fonte comum de compilação. Pense no pacote como um formulário de acordo entregue às três equipes: ele descreve quais campos e nomes todos reconhecem, mas não transporta os valores atuais da aplicação.

## Fluxo de execução

```text
packages/contracts/src/index.ts
              ↓ Rslib build
       dist/index.js
       dist/index.d.ts
              ↓ pnpm workspace link
       shell / products / account
              ↓ typecheck e build
      bundles próprios dos apps
```

1. `pnpm install` reconhece `@mfe-lab/contracts` como pacote do workspace.
2. `workspace:*` cria a ligação local, sem baixar o pacote do npm.
3. Rslib compila primeiro os arquivos públicos de `contracts`.
4. Os consumidores resolvem o `exports` do pacote para `dist`.
5. TypeScript lê `index.d.ts` durante o typecheck.
6. O bundler inclui apenas valores usados no JavaScript do app; imports apenas de tipo são removidos.

## Contratos não são estado compartilhado

Um contrato define formato e vocabulário. Por exemplo, `CartUpdatedEventPayload` diz que uma mensagem de carrinho deverá possuir `totalItems: number`. Ele não armazena o total atual.

Estado compartilhado seria manter o valor vivo do carrinho ou do perfil em um objeto/store usado simultaneamente pelos apps. Não fizemos isso. Products continuará sendo responsável por seu contador, e a comunicação em runtime só será implementada em etapa própria.

```text
Contrato: “a mensagem terá este formato”
Estado:   “o valor atual neste momento é 3”
```

## Resolução em install e build time

`@mfe-lab/contracts` aparece em `dependencies` dos apps e é resolvido pelo pnpm. Seu `package.json` aponta para os artefatos de `dist`. Isso acontece antes de o navegador abrir a aplicação.

O pacote não possui manifest, remote entry ou container federado. Quando algum valor runtime do pacote for usado, ele será processado pelo build do consumidor como uma dependência normal. O navegador não fará uma requisição independente para buscar `contracts` como remote.

Os scripts da raiz buildam `contracts` antes dos apps. Isso torna explícita a dependência de build e evita que um clone limpo tente resolver um `dist/index.d.ts` inexistente.

## Consumer compilado contra contrato antigo

Um app já compilado não muda porque o fonte local ou uma versão futura do pacote mudou. Ele continua executando o JavaScript produzido com o contrato que conhecia.

Se a mudança for compatível, o app antigo pode continuar funcionando. Se um producer passar a enviar outro formato incompatível, o consumer antigo pode falhar em runtime mesmo que seu build anterior tenha passado. Evolução de contrato exige compatibilidade, versionamento e validação entre participantes.

No fluxo atual com `workspace:*`, atualizar o pacote requer ao menos rebuild e novo typecheck dos consumidores. Quando ele for publicado por versão, também será necessário atualizar ou instalar a versão desejada antes do rebuild.

## Por que TypeScript não valida runtime

Interfaces e aliases existem somente durante análise e compilação. Eles não viram verificações automáticas no JavaScript:

```typescript
interface CartUpdatedEventPayload {
  totalItems: number;
}
```

Esse tipo ajuda quem cria e usa código TypeScript corretamente, mas um servidor, script externo ou evento manual ainda pode entregar `{ totalItems: 'três' }`. Para desconfiar de dados de rede ou eventos externos, seria necessário executar validação runtime, como um type guard realmente usado ou um schema.

Nenhum type guard foi criado nesta etapa porque nenhum payload desconhecido começou a ser processado. Consequentemente, não há teste unitário artificial: o requisito de testar guards passa a valer quando existir um guard runtime real.

## `workspace:*` versus versão publicada

```text
workspace:*
└── pnpm exige e liga o pacote local do monorepo

1.0.0
└── gerenciador instala o artefato dessa versão a partir de um registry
```

`workspace:*` é ótimo durante desenvolvimento coordenado no monorepo e falha se não encontrar o pacote local. Ao empacotar, o pnpm pode converter o protocolo workspace para uma versão publicável apropriada.

Uma versão publicada representa um tarball imutável armazenado em registry. Estar no mesmo repositório não obriga um app a usar o fonte local quando a dependência está configurada para vir do registry; essa diferença será demonstrada em etapa posterior.

## Por que o pacote não conhece frameworks ou DOM

O `tsconfig` de `contracts` usa somente a biblioteca `ES2022`, sem tipos de DOM. O pacote não depende de React ou Vue e não referencia `HTMLElement`, `CustomEvent` ou `window`.

O contrato de montagem descreve opções e o handle retornado. A assinatura federada do shell continua responsável por dizer que `mount` recebe um `HTMLElement`, pois essa é a fronteira específica de integração no navegador, não uma necessidade dos contratos compartilhados no import.

## Arquivos importantes

- `packages/contracts/src/index.ts`: superfície pública framework-agnostic.
- `packages/contracts/package.json`: nome, scripts, arquivos e `exports`.
- `packages/contracts/rslib.config.ts`: build ESM e geração de DTS.
- `packages/contracts/tsconfig.json`: TypeScript estrito sem DOM.
- `apps/account-vue/src/mount.ts`: implementação usando os tipos compartilhados.
- `apps/account-vue/src/AccountApp.vue`: papel importado do contrato.
- `apps/shell-react/src/account-remote.d.ts`: assinatura federada referenciando o pacote.
- `package.json`: ordem de build do pacote antes dos apps.

## Comandos

```powershell
pnpm install
pnpm run build:contracts
pnpm run typecheck:contracts
pnpm run typecheck
pnpm run build
pnpm run check
```

## Como validar

Execute `pnpm run build:contracts` e confirme a existência de:

```text
packages/contracts/dist/index.js
packages/contracts/dist/index.d.ts
```

Abra o `.d.ts` e confira todos os tipos públicos. Depois execute `pnpm run typecheck` e `pnpm run build`. Use `pnpm --filter @mfe-lab/shell-react why @mfe-lab/contracts` para confirmar que o shell recebe a dependência pelo workspace.

Verifique também que não existem imports de React ou Vue em `packages/contracts` e que o código-fonte não contém referências a APIs do DOM.

## Erros comuns

- Colocar store, usuário atual ou contador dentro do pacote de contratos.
- Importar React, Vue, `window` ou `CustomEvent` no pacote.
- Apontar `exports` para um `.d.ts` que o build não gerou.
- Fazer os apps importarem diretamente `packages/contracts/src`.
- Acreditar que `workspace:*` atualiza automaticamente um app já compilado.
- Tratar interfaces TypeScript como validação de dados em runtime.
- Criar type guards sem nenhum local real que os utilize.
- Confundir o pacote npm com um remote de Module Federation.

## Perguntas de revisão

1. Por que `@mfe-lab/contracts` é resolvido antes do runtime, enquanto `account/mount` é resolvido pelo manifest?
2. O que acontece com um shell já compilado quando o fonte de `contracts` muda?
3. Por que um payload pode estar errado em runtime mesmo sendo descrito por uma interface TypeScript?

## Exercício manual

Abra `packages/contracts/dist/index.d.ts` e encontre `AccountMountOptions`. Depois siga seu uso até `apps/account-vue/src/mount.ts` e `apps/shell-react/src/account-remote.d.ts`. Confirme que não existe mais uma interface local repetindo seus campos.

## Explicação de entrevista em até 90 segundos

Criamos `@mfe-lab/contracts` como uma biblioteca ESM TypeScript consumida por `workspace:*`. Ela centraliza formatos e nomes compartilhados, mas não contém estado, React, Vue ou acesso ao DOM. Rslib gera JavaScript e declarações `.d.ts`, e os apps resolvem o pacote durante instalação e build, diferentemente de um remote carregado por manifest em runtime. Alterar o pacote exige validar e rebuildar consumidores; um app já compilado não muda sozinho. TypeScript reduz incompatibilidades no desenvolvimento, mas seus tipos desaparecem no JavaScript, então payloads externos ainda precisam de validação runtime quando não são confiáveis. `workspace:*` liga o pacote local; uma versão publicada seria instalada como tarball vindo de um registry.

## Referências oficiais consultadas

- [Configuração do Rslib](https://rslib.rs/guide/basic/configure-rslib)
- [Formato de saída ESM](https://rslib.rs/guide/basic/output-format)
- [Geração de declarações TypeScript](https://rslib.rs/config/lib/dts)
