# Etapa 04 — Account Vue standalone

## O que foi criado

Foi criada em `apps/account-vue` uma SPA Vue 3 independente na porta 3002. A interface é um Single File Component que mostra o nome Denis, mantém o papel localmente e alterna entre Administrador e Operador.

## Por que foi criado

Account introduz um segundo framework antes da composição. Primeiro ele precisa funcionar sozinho, com build e lifecycle próprios, para que uma etapa futura possa tornar explícita a fronteira entre o shell React e o runtime Vue.

A criação da aplicação foi separada do ponto de montagem: `createAccountApp` constrói uma instância Vue e `index.ts` decide montá-la no elemento `#root` da página standalone. Futuramente, outro código poderá fornecer um elemento HTML externo sem que o componente de interface precise conhecê-lo.

## Fluxo de execução

1. Rsbuild inicia o app na porta 3002 e processa o Single File Component com o plugin Vue.
2. `index.ts` encontra o elemento `#root` da página standalone.
3. `createAccountApp` chama a API Vue `createApp(AccountApp)`.
4. `mount(rootElement)` conecta a instância Vue ao DOM.
5. `AccountApp.vue` renderiza a conta e mantém o papel em um `ref` local.

## `createApp`, componente raiz e ponto de montagem

`createApp` é uma API específica do Vue: ela cria uma instância de aplicação usando `AccountApp` como componente raiz. O componente raiz descreve a interface e o comportamento inicial da árvore Vue. O ponto de montagem é o elemento HTML concreto no qual essa árvore assume o controle.

Essas responsabilidades são diferentes: o mesmo componente raiz pode ser montado no `#root` da página standalone ou, futuramente, em um elemento entregue pelo shell. A ideia de receber um `HTMLElement` e oferecer operações de montagem/desmontagem pode virar um contrato genérico; `createApp`, a instância Vue e seu `unmount` continuam sendo detalhes da implementação Vue.

## Estilo `scoped` e micro frontends

O atributo `scoped` faz o compilador Vue acrescentar identificadores aos elementos e seletores deste componente, reduzindo colisões de classes como `.owner` ou `.details`. Ele ajuda a limitar a aplicação dos seletores, mas não cria isolamento completo de CSS.

Estilos globais externos ainda podem afetar elementos por herança, propriedades como fontes e cores atravessam a fronteira, variáveis CSS continuam visíveis pela cascata e regras globais ou recursos compartilhados podem colidir. Isolamento mais forte exigiria outras estratégias, como convenções, camadas CSS, Shadow DOM ou iframe, cada uma com seus próprios custos.

## Arquivos importantes

- `package.json`: dependências e comandos exclusivos de Account.
- `rsbuild.config.ts`: plugin Vue e porta 3002.
- `src/AccountApp.vue`: componente raiz, template, estado e estilo scoped.
- `src/createAccountApp.ts`: criação da instância Vue.
- `src/index.ts`: escolha do ponto de montagem standalone.

## Comandos

```powershell
pnpm install
pnpm run dev:account
pnpm run typecheck:account
pnpm run build:account
```

## Como validar

Abra `http://localhost:3002`, confira a marca de ownership, o nome e o papel inicial. Clique repetidamente em `Alternar papel` e confirme a alternância entre Administrador e Operador.

## Erros comuns

- Fazer `AccountApp.vue` procurar ou controlar diretamente o elemento de montagem.
- Importar Vue diretamente no shell React e acoplar os dois builds.
- Tratar `scoped` como isolamento absoluto de CSS.
- Adicionar Vue Router para uma única tela.
- Levar o papel para Pinia ou estado global sem outro consumidor.

## Perguntas de revisão

1. Qual parte da montagem é específica do Vue e qual parte pode formar um contrato genérico?
2. Por que o shell React não deveria importar diretamente o código-fonte de Account?
3. Quais efeitos de CSS ainda podem atravessar estilos `scoped`?

## Exercício manual

Troque temporariamente o papel inicial para Operador, execute o app e teste a alternância. Depois restaure Administrador antes do commit.

## Explicação de entrevista em até 90 segundos

Account é uma SPA Vue independente com componente raiz, estado local e build próprios. `createApp` cria a instância Vue a partir do componente `AccountApp`; `mount` conecta essa instância a um elemento HTML escolhido fora da interface. Essa separação prepara uma fronteira futura em que o shell React poderá fornecer o elemento sem importar ou conhecer os detalhes do Vue. O estilo scoped reduz colisões ao reescrever seletores, mas não bloqueia herança, variáveis CSS nem regras globais. Ainda não há micro frontend composto: não existe módulo federado nem contrato de lifecycle entre React e Vue.

