# Etapa 09 — Lifecycle Vue como remote

## O que foi criado

Account passou a ser simultaneamente uma SPA Vue standalone e um producer de Module Federation chamado `account`. O producer expõe `./mount`, gera `mf-manifest.json`, `remoteEntry.js` e tipos federados e mostra `Remote version: account-v1`.

Foi criado um contrato com `mount(container, options)`, que recebe um `HTMLElement` e dados iniciais, monta a aplicação Vue e devolve um handle com `unmount()`. O mesmo contrato agora é usado pelo bootstrap standalone.

## Por que foi criado

O shell é React e Account é Vue. Um componente Vue não possui o formato que React espera renderizar, pois os frameworks têm runtimes, árvores virtuais e ciclos de vida diferentes. A fronteira de DOM evita acoplar o host à API do Vue: futuramente o shell só precisará oferecer um elemento HTML e respeitar o lifecycle público.

## Fluxo de execução

### Standalone

1. O navegador abre `http://localhost:3002/`.
2. `index.ts` importa `bootstrap.ts` de forma assíncrona, depois da inicialização do share scope.
3. O bootstrap localiza `#root` e chama `mount` com `source: 'account-standalone'` e `initialUserName: 'Denis'`.
4. `mount` valida o elemento, impede duplicidade, cria a aplicação Vue e a monta.
5. `AccountApp.vue` recebe os dados como props e mantém o papel em estado local.

### Remote

1. Um consumer futuro registra o manifest de `account`.
2. O runtime resolve `account/mount`, que corresponde ao expose `./mount`.
3. O consumer cria e fornece um `HTMLElement`.
4. O remote monta Vue somente dentro desse elemento.
5. Ao remover aquela área, o consumer chama o `unmount()` devolvido pelo remote.

## Superfície pública

```typescript
interface AccountMountOptions {
  initialUserName: string;
  source: string;
}

interface AccountMountHandle {
  unmount(): void;
}

function mount(
  container: HTMLElement,
  options: AccountMountOptions,
): AccountMountHandle;
```

`account/mount` é a superfície pública. `AccountApp.vue`, `createAccountApp` e o bootstrap continuam detalhes internos.

## Fronteira neutra entre frameworks

O contrato usa somente DOM, objetos TypeScript simples e uma função de cleanup. Ele não recebe um componente React, não devolve um componente Vue e não obriga o consumer a importar `vue` ou chamar `createApp`.

O futuro host será dono da posição e da existência do container. Enquanto estiver montado, Account e o runtime Vue serão donos do DOM interno desse elemento. O host não deverá inserir, remover ou atualizar nós filhos manualmente, porque isso entraria em conflito com a árvore controlada pelo Vue.

## `mount`, proteção contra duplicidade e cleanup

Um `WeakMap` associa cada container ao handle de sua montagem. Se `mount` receber novamente o mesmo elemento antes do cleanup, falha com uma mensagem explícita, impedindo aplicações Vue sobrepostas.

`unmount()` chama `app.unmount()`, permitindo que o Vue encerre componentes, efeitos reativos e listeners que controla. Depois remove o container do registro. O handle também é idempotente: chamadas seguintes não desmontam duas vezes. Sem cleanup, uma troca de rota poderia deixar listeners, efeitos, referências e instâncias antigas vivas, além de causar interface duplicada ao retornar.

O `WeakMap` não mantém o elemento vivo artificialmente. Ainda assim, a proteção vale para uma instância carregada do módulo; carregar cópias independentes do mesmo remote criaria registros independentes.

## Expor uma aplicação versus um componente puro

Products expõe um componente React puro porque producer e consumer usam React compatível, permitindo inserir `ProductApp` diretamente na árvore existente. Account atravessa React e Vue, então expõe uma operação imperativa que cria sua própria aplicação Vue dentro de uma fronteira de DOM.

Expor o `.vue` diretamente faria o consumer conhecer detalhes do framework e não resolveria quem cria a aplicação, onde ela monta nem quando ela é destruída. Expor o bootstrap também seria errado: ele procura um `#root` pertencente à página standalone, enquanto o consumer precisa escolher seu próprio container.

## Vue em `shared`

`vue` foi declarado com `singleton: true` e `requiredVersion: '3.5.42'`, igual à versão fixa usada pelo app. Isso permite que runtimes federados negociem uma instância compatível quando houver outro participante Vue. Não significa que React passa a renderizar Vue, nem elimina a dependência do app standalone.

Nesta composição, o shell React não oferece Vue; portanto, Account pode usar sua própria implementação disponível como fallback. A decisão prepara a negociação entre módulos Vue sem instalar React no remote.

## Manifest, remote entry e tipos

O manifest em `http://localhost:3002/mf-manifest.json` identifica o container `account`, o remote entry e o expose `mount`. O remote entry implementa o container federado, enquanto os chunks contêm o código de `mount`, da interface e do Vue.

O plugin também gera declarações de tipos para a função e seus contratos. A declaração tipada para arquivos `.vue` em `env.d.ts` foi necessária para o gerador de DTS entender o Single File Component sem recorrer a `any`.

## Limitações do contrato manual

- As opções são apenas iniciais; não existe ainda uma operação `update`.
- Eventos do remote para o host ainda não fazem parte do contrato.
- Não há protocolo de prontidão assíncrona além da resolução do import.
- Erros de rede e carregamento serão responsabilidade da fronteira do consumer.
- Estilos `scoped` reduzem colisões de seletores, mas regras globais e herança de CSS ainda podem atravessar a fronteira.
- O primeiro teste completo de saída de rota e cleanup acontecerá quando o shell consumir Account na etapa seguinte.

## Arquivos importantes

- `apps/account-vue/rsbuild.config.ts`: container, expose, manifest, tipos e Vue compartilhado.
- `apps/account-vue/src/mount.ts`: superfície pública e lifecycle.
- `apps/account-vue/src/mountContract.ts`: opções e handle tipados.
- `apps/account-vue/src/createAccountApp.ts`: criação interna da aplicação Vue com props.
- `apps/account-vue/src/bootstrap.ts`: adaptação do modo standalone para o mesmo `mount`.
- `apps/account-vue/src/index.ts`: fronteira assíncrona de entrada.
- `apps/account-vue/src/AccountApp.vue`: interface e estado local.
- `apps/account-vue/dist/mf-manifest.json`: catálogo federado gerado.

## Comandos

```powershell
pnpm install
pnpm run typecheck:account
pnpm run build:account
pnpm run dev:account
```

## Como validar

Abra `http://localhost:3002/` e confirme `ACCOUNT · VUE · STANDALONE`, `Denis`, `Remote version: account-v1` e `Origem: account-standalone`. Alterne o papel para confirmar que o estado continua local.

Depois abra `http://localhost:3002/mf-manifest.json` e localize `name: account`, `remoteEntry.js`, o expose de caminho `./mount` e Vue `3.5.42` como singleton. No build, verifique `dist/@mf-types.zip`, `dist/@mf-types.d.ts` e `dist/remoteEntry.js`.

A montagem standalone prova que o bootstrap reutiliza a superfície pública. A desmontagem acionada por um consumer será validada ao navegar repetidamente na etapa 10; não foi criado um host ou runner de testes antecipadamente nesta etapa.

## Erros comuns

- Expor `AccountApp.vue` e esperar que React o renderize diretamente.
- Expor o bootstrap que procura `#root` em vez de aceitar o container do host.
- Criar outro caminho de `createApp` exclusivo para o modo standalone.
- Montar duas aplicações no mesmo elemento.
- Remover o container sem chamar `unmount()`.
- Fazer o host manipular os filhos que pertencem ao Vue.
- Confundir `shared: vue` com a superfície pública definida por `exposes`.
- Esconder falhas de tipagem de `.vue` com `any`.

## Perguntas de revisão

1. Qual é a superfície pública de Account e quais detalhes permanecem privados?
2. Quem fornece o elemento HTML e quem controla seu conteúdo interno?
3. Que recursos podem permanecer vivos se o host remover a rota sem chamar `unmount()`?

## Exercício manual

Com Account standalone aberto, encontre no manifest a entrada `account:mount` e compare os assets listados com `dist`. Em seguida, leia `bootstrap.ts` e confirme que ele não chama `createApp`: ele usa o mesmo `mount` público que o shell usará depois.

## Explicação de entrevista em até 90 segundos

Um componente Vue não pode entrar diretamente numa árvore React porque cada framework possui seu próprio runtime e lifecycle. Por isso, Account expõe `account/mount`, um contrato neutro que recebe um `HTMLElement` e props iniciais. O remote cria e monta a aplicação Vue dentro desse container e devolve `unmount()` para cleanup. O host é dono do container; Vue é dono do DOM interno. Um `WeakMap` bloqueia montagem duplicada no mesmo elemento, e o cleanup chama `app.unmount()` e libera o registro. O bootstrap standalone reutiliza exatamente o mesmo contrato. Vue está no share scope como singleton compatível, mas isso não faz React importar ou renderizar Vue. O contrato manual é simples e explícito, porém ainda não cobre updates, eventos ou um protocolo de erros.
