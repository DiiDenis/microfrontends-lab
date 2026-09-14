# Caderno do futuro e-book — Micro Frontends com Module Federation

Este arquivo preserva o aprendizado conceitual construído durante o laboratório. As lições numeradas registram cada implementação técnica; este caderno registra a narrativa didática, as analogias, as dúvidas importantes e as ideias que deverão aparecer no e-book final.

## Objetivo editorial

Produzir, ao final do laboratório, um guia que possa ser lido por alguém que não participou do treinamento e ainda não conhece micro frontends. O texto deve partir do problema, introduzir cada conceito somente quando ele se tornar necessário e conectar configuração, runtime, deploy e experiência do usuário.

O guia deverá:

- usar linguagem simples antes de apresentar o termo técnico;
- explicar o motivo antes da configuração;
- separar claramente desenvolvimento, build e runtime;
- usar analogias sem substituir a explicação técnica;
- mostrar fluxos e diagramas;
- incluir exemplos pequenos extraídos do laboratório;
- destacar erros comuns e decisões de arquitetura;
- terminar capítulos com perguntas, exercício e resposta curta de entrevista;
- deixar claro o que normalmente já existe em uma empresa e o que um desenvolvedor mantém no cotidiano.

## Diretriz visual obrigatória

O e-book final deve incorporar as ilustrações e os diagramas conceituais usados durante a conversa, redesenhados com identidade visual consistente e acompanhados de texto alternativo. Eles não devem ser tratados como decoração: cada figura precisa explicar uma relação que seria mais difícil compreender somente em prosa.

Usar `Manual_DeNode_Usuario.pdf` como referência de ritmo editorial e aplicar dois tipos de página:

- páginas especiais, como capa, abertura de parte, divisória de capítulo ou composição com imagem de fundo, devem ocupar 100% da largura e da altura do A4, sem as margens brancas do miolo;
- páginas comuns de conteúdo devem preservar margens confortáveis, cabeçalho, rodapé e paginação consistentes;
- screenshots, diagramas e figuras inseridos em uma página de conteúdo continuam dentro da área editorial e não viram full bleed automaticamente;
- imagens usadas como fundo de página devem preencher toda a página, sem faixas brancas, distorção ou margem padrão;
- textos em páginas full bleed precisam manter uma margem interna de segurança, mesmo que o fundo alcance todas as bordas;
- capa e divisórias não devem herdar cabeçalho, rodapé ou numeração visual do miolo.

Em resumo: o fundo pode ir até a borda; o conteúdo textual continua respeitando uma área segura.

Preservar especialmente:

- os três apps separados antes da federação;
- a relação producer → `exposes` → manifest → remote entry → chunks;
- a relação consumer → rota → `lazy` → `remotes` → módulo exposto;
- o fluxo completo de carregamento de `/products` em runtime;
- a diferença entre loading (`Suspense`), erro (Error Boundary) e sucesso;
- a negociação de React e ReactDOM no share scope;
- o fluxo `env` → URL escolhida → manifest;
- a comparação entre manifest, remote entry e assets;
- a separação entre componente, criação da aplicação e bootstrap/montagem;
- a comparação entre `pnpm`, `tsc`, Rsbuild e servidor de desenvolvimento;
- a evolução incremental do laboratório, do standalone à composição.

Além dos diagramas já versionados em `docs/diagrams`, reconstruir no e-book as ilustrações explicativas que apareceram somente na conversa. Antes de finalizar, revisar o histórico e este caderno para não perder nenhuma figura útil.

## Explicação central para preservar

> O shell registra o remote por uma URL configurável. Quando a rota é acessada, o runtime consulta o manifest, encontra os assets do módulo exposto, negocia as dependências compartilhadas e renderiza o componente. Loading e falhas ficam isolados na fronteira da rota.

Essa explicação deve aparecer no e-book depois que `producer`, `consumer`, `exposes`, `remotes` e manifest já tiverem sido apresentados separadamente.

## Receita humana e reproduzível

O e-book deve apresentar cada integração duas vezes: primeiro como uma história simples, que o leitor consegue visualizar, e depois como configuração técnica. A leitura precisa permitir que alguém reproduza o padrão sem tratar Module Federation como mágica.

### Começar com três projetos independentes

Usar uma explicação semelhante a:

> Pense em três projetos: Shell, Products e Account. Cada um abre sozinho, possui seu próprio servidor, sua própria porta e seu próprio build. Nesse momento eles sabem que os outros existem apenas porque nós, desenvolvedores, sabemos; tecnicamente ainda não existe composição.

```text
shell-react      http://localhost:3000
products-react   http://localhost:3001
account-vue      http://localhost:3002
```

O pnpm executa e organiza os três projetos, mas não coloca uma interface dentro da outra. Essa composição só começa quando um projeto publica uma superfície e outro projeto decide consumi-la.

### Transformar Products em algo consumível

Apresentar o raciocínio nesta ordem:

1. Products instala o plugin de Module Federation compatível com Rsbuild.
2. Products escolhe um nome federado estável: `products`.
3. Em `exposes`, cria um nome público para o componente.
4. Esse nome público aponta para o arquivo físico que existe somente dentro de Products.
5. O build gera manifest, remote entry e chunks carregáveis.

```typescript
pluginModuleFederation({
  name: 'products',
  exposes: {
    './ProductApp': './src/ProductApp.tsx',
  },
  manifest: true,
});
```

Explicar visualmente o mapa de nomes:

```text
Nome do remote       products
Nome público         ./ProductApp
Arquivo físico       ./src/ProductApp.tsx
Import do consumer   products/ProductApp
```

Preservar esta frase:

> `./ProductApp` não é uma pasta nova. É o nome público escolhido pelo producer. O valor `./src/ProductApp.tsx` é o endereço físico privado da implementação.

Depois do build, explicar os artefatos sem excesso de detalhes:

```text
mf-manifest.json  → catálogo que descreve o remote
remoteEntry.js    → entrada executável do container federado
chunks com hash   → arquivos que carregam o código real e o CSS
@mf-types.zip     → contrato TypeScript gerado para consumers
```

### Ensinar o shell a encontrar Products

Mostrar que o shell precisa de duas informações diferentes:

1. onde encontrar o remote;
2. qual módulo público deseja carregar.

```typescript
pluginModuleFederation({
  name: 'shell',
  remotes: {
    products: 'products@http://localhost:3001/mf-manifest.json',
  },
});
```

```typescript
const remoteModule = await import('products/ProductApp');
```

Traduzir o import em linguagem humana:

```text
products/ProductApp
    │         │
    │         └── módulo público ./ProductApp
    └──────────── alias products registrado no shell
```

> O shell não conhece `apps/products-react/src/ProductApp.tsx`. Ele conhece somente o alias `products`, a URL do manifest e o nome público `ProductApp`.

### Repetir o raciocínio com Vue, destacando a diferença

Account segue o mesmo processo de publicação, mas não expõe um componente Vue diretamente para React. Ele expõe um lifecycle neutro:

```typescript
pluginModuleFederation({
  name: 'account',
  exposes: {
    './mount': './src/mount.ts',
  },
  manifest: true,
});
```

Mapa equivalente:

```text
Nome do remote       account
Nome público         ./mount
Arquivo físico       ./src/mount.ts
Import do consumer   account/mount
```

No shell:

```typescript
const accountModule = await import('account/mount');

const handle = accountModule.mount(container, {
  source: 'shell-react',
  initialUserName: 'Denis',
});
```

Ao sair da rota:

```typescript
handle.unmount();
```

Preservar a comparação direta:

```text
React → React
O producer expõe um componente.
O shell renderiza esse componente na árvore React existente.

Vue → React
O producer expõe mount/unmount.
O shell fornece uma div e Vue controla o conteúdo interno.
```

### Checklist visual de reprodução

Cada capítulo prático do e-book deve terminar com um quadro de consulta rápida:

```text
NO PRODUCER
[ ] instalar e registrar o plugin
[ ] escolher o nome federado
[ ] declarar exposes: nome público → arquivo físico
[ ] gerar manifest
[ ] manter o modo standalone
[ ] conferir manifest, remote entry e chunks

NO CONSUMER
[ ] registrar alias → URL do manifest
[ ] importar alias/módulo-publicado
[ ] carregar de forma assíncrona
[ ] mostrar loading
[ ] isolar erros
[ ] respeitar o contrato e o lifecycle
```

Sempre incluir uma seção “onde cada coisa está” com links ou caminhos dos arquivos reais do laboratório. O objetivo é que o leitor consiga olhar o diagrama, comparar producer e consumer e reconstruir a integração sem decorar configuração solta.

## Linha de aprendizado construída

### 1. Repositório e workspace

- O monorepo reúne vários projetos no mesmo repositório, mas não transforma automaticamente esses projetos em micro frontends.
- `pnpm-workspace.yaml` informa quais pastas são pacotes do workspace.
- O `package.json` da raiz funciona como painel de comandos do laboratório.
- O `package.json` de cada app contém os comandos e dependências próprios daquele app.
- `pnpm --filter` seleciona qual pacote executará um script.
- Um script geral sem sufixo pode executar todos os apps; scripts como `dev:products` selecionam somente um.
- A raiz do monorepo não é um servidor. Ela organiza código, dependências e comandos.

### 2. Ferramentas que não devem ser confundidas

- `pnpm` instala dependências, administra o workspace e executa scripts.
- `tsc --noEmit` verifica tipos e não gera nem serve a aplicação.
- Rsbuild transforma os módulos e assets em arquivos executáveis pelo navegador.
- O servidor de desenvolvimento do Rsbuild é quem atende as portas locais.
- `dev`, `typecheck` e `build` são tarefas diferentes, embora possam ser combinadas por scripts da raiz.

### 3. Apps standalone antes da federação

- Shell React, Products React e Account Vue começaram como três SPAs completas e independentes.
- Ter três aplicações em portas ou deploys diferentes não significa que exista composição de micro frontends.
- Abrir outra URL é navegação entre documentos; carregar um remote é inserir código de outro build na mesma experiência.
- O estado do contador pertence inicialmente a Products, não ao shell nem a um estado global.
- Router só foi adicionado onde existiam rotas reais: o shell.

### 4. Componente raiz e bootstrap

- `ProductApp` contém a interface e o estado de Products; não deve chamar `createRoot`.
- O bootstrap React encontra um elemento HTML e chama `createRoot` uma única vez para a SPA standalone.
- No Vue, `Account.vue` é a interface, `createAccountApp()` cria a instância Vue e `.mount(rootElement)` decide onde ela será montada.
- Separar criação, interface e montagem prepara contratos reutilizáveis sem configurar antecipadamente a federação.
- Quando um componente React remoto entra no shell React, ele participa da raiz React já criada pelo shell; importar o bootstrap remoto criaria uma raiz indevida.

### 5. Producer e `exposes`

- Products virou producer quando passou a oferecer um módulo para outros builds.
- `exposes` define a superfície pública do producer.
- A chave `./ProductApp` é o nome público; `./src/ProductApp.tsx` é a implementação interna.
- A combinação pode ser entendida como um alias público, mas também representa um contrato de distribuição em runtime.
- Somente arquivos declarados em `exposes` fazem parte da API federada.
- O bootstrap não é exposto porque ele controla uma página standalone e chama `createRoot`.

### 6. Manifest, remote entry e assets

- `mf-manifest.json` é gerado pelo plugin; não é escrito manualmente.
- Depois do build, ele existe em `apps/products-react/dist/mf-manifest.json`.
- Durante o desenvolvimento, é servido em `http://localhost:3001/mf-manifest.json`.
- O manifest é um catálogo: descreve o container, módulos expostos, remote entry, chunks, CSS e dependências compartilhadas.
- O manifest não contém HTML pronto nem é o componente.
- `remoteEntry.js` é a entrada executável do container; os chunks contêm a implementação compilada.
- O `remoteEntry.js` pertence ao producer que oferece os módulos. No laboratório, ele é gerado pelo build de Products em `apps/products-react/dist/remoteEntry.js` e depois servido para o shell.
- Ele não é escrito manualmente, não fica no `src` e não é o próprio `ProductApp`. Sua função é inicializar o container, participar da negociação do share scope, localizar os módulos expostos e entregar a implementação solicitada ao consumer.
- Em uma arquitetura com Products, Account e Checkout como producers, cada remote normalmente gera e publica seu próprio `remoteEntry.js`.
- O shell consulta o manifest de cada producer, encontra seu remote entry e solicita o expose necessário. O shell pode também gerar artefatos federados por usar o plugin, mas só oferece módulos a terceiros quando declara `exposes`.
- O shell aponta para um manifest de endereço estável e não precisa conhecer nomes de chunks com hash, que podem mudar a cada build.

Frase curta para preservar:

> `remoteEntry.js` é a porta de entrada executável do projeto que compartilha módulos; ele pertence ao producer e permite que o consumer solicite os exposes desse container.

Analogia a preservar:

- manifest: catálogo da biblioteca;
- remote entry: bibliotecário que sabe localizar e entregar;
- chunk: o livro solicitado;
- `ProductApp`: o conteúdo que será usado.

### 7. Consumer e `remotes`

- O shell virou consumer ao registrar o remote `products`.
- Em `products@URL`, `products` é o nome real do container e a URL aponta para seu manifest.
- A chave `products` em `remotes` é o alias usado pelo shell.
- `import('products/ProductApp')` combina o alias do remote com o nome público definido em `exposes`.
- Esse import não procura um caminho local nem um pacote no `node_modules`; o runtime do Module Federation o resolve.
- O shell não copia `ProductApp` e o remote não entra antecipadamente no bundle inicial do shell.

### 8. Variável de ambiente da URL

- A variável `PRODUCTS_REMOTE_URL` escolhe onde o shell procurará o manifest.
- Sem a variável, o laboratório usa `http://localhost:3001/mf-manifest.json` como fallback explícito.
- Local, homologação e produção podem usar o mesmo código do shell com URLs diferentes.
- `.env.example` apenas documenta a variável; `.env` contém uma configuração local real e não é versionado.
- No modelo atual, a variável é lida quando o Rsbuild inicia ou gera o build; ela não altera dinamicamente um build estático já publicado.
- Um build de produção não deve manter `localhost`, pois esse endereço apontaria para o computador do visitante.

Frase curta para preservar:

> O `env` escolhe onde procurar. O manifest informa o que existe e onde estão os arquivos. O remote entry sabe entregar o módulo. Os chunks contêm o código real do componente.

### 9. Carregamento e isolamento de falhas

- `React.lazy` inicia uma importação assíncrona quando a parte correspondente da árvore é renderizada.
- `Suspense` trata espera, não erro; seu fallback aparece enquanto a Promise está pendente.
- Error Boundary trata falhas de carregamento ou renderização abaixo de sua fronteira.
- A fronteira foi colocada apenas ao redor da rota remota para que Products não derrube Home nem Account.
- A referência federada foi isolada em um chunk local lazy para que a operação que pode falhar aconteça dentro da fronteira protegida.

Analogia a preservar:

- `Suspense`: “a encomenda está a caminho”;
- Error Boundary: “não foi possível entregar a encomenda”;
- componente remoto renderizado: “a encomenda chegou”.

### 10. `shared` e share scope

- `shared` não expõe `ProductApp` e não substitui `exposes`.
- Cada app continua declarando React em suas próprias dependências porque também funciona standalone.
- Na composição, o share scope negocia a reutilização de dependências compatíveis.
- React e ReactDOM são singletons porque hooks, Context e reconciliação não devem atravessar instâncias incompatíveis na mesma árvore.
- `requiredVersion` registra a versão esperada por cada participante.
- `loaded-first` prioriza uma versão compatível já carregada e evita consultar Products antes de o shell montar Home.
- A indisponibilidade de Products só deve ser relevante quando sua rota realmente for acessada.

### 11. Tipos federados (`dts`)

- Arquivos `.d.ts` descrevem a superfície TypeScript sem carregar a implementação.
- Products gera um pacote de tipos para `ProductApp`.
- O shell baixa esses tipos para `@mf-types` e resolve `products/ProductApp` durante o typecheck.
- A pasta é cache gerado e não deve ser confundida com uma cópia da implementação.
- Tipos detectam incompatibilidades durante desenvolvimento e build, mas não garantem que o servidor remoto estará disponível em runtime.
- Error Boundary continua necessária mesmo quando todos os tipos estão corretos.

### 12. O cotidiano em uma vaga

- Em muitas empresas, shell, templates, pipeline, convenções de URL, Error Boundaries e estratégia de compartilhamento já existem.
- O trabalho frequente é manter o padrão, adicionar um novo remote, evoluir contratos, investigar falhas e coordenar deploys.
- Entender a montagem desde o zero permite diagnosticar problemas sem depender apenas de copiar configuração.
- O objetivo do laboratório não é decorar todas as opções, mas formar um modelo mental que possa ser aplicado à arquitetura específica de uma empresa.

### 13. Deploy independente não é HMR

- HMR pertence ao servidor de desenvolvimento e troca módulos enquanto o desenvolvedor trabalha, sem representar um deploy.
- No preview de produção, uma mudança só aparece depois de um novo build do app alterado.
- O shell pode permanecer com exatamente os mesmos arquivos enquanto Products publica um novo manifest e novos chunks na mesma origem.
- Manter estável a URL do manifest permite que o runtime descubra nomes de assets com hashes diferentes em cada versão.
- O `assetPrefix` do producer informa a origem pública de `remoteEntry.js` e dos chunks; sem ele, um manifest de produção pode apontar assets para a origem errada.
- Cache do manifest ou do remote entry pode atrasar a atualização mesmo quando o deploy foi concluído.
- Deploy independente não significa independência absoluta: nome do expose, exports, props, versões compartilhadas e comportamento ainda formam contratos entre equipes.

Frase curta para preservar:

> O shell não precisa ser reconstruído para cada mudança interna compatível do remote; ele precisa continuar conseguindo localizar o manifest e consumir o mesmo contrato público.

### 14. Artefatos de build, hashes e publicação

- Cada app gera seu próprio diretório `dist`; esse diretório é o produto do build e normalmente não é versionado no Git.
- O hash curto no nome de um chunk é um identificador de conteúdo criado pelo bundler para cache busting; não deve ser confundido com o SHA-256 completo calculado por `Get-FileHash`.
- O Module Federation não exige uma hierarquia universal de pastas no servidor. Exige que as URLs publicadas no manifest continuem válidas.
- Em produção, shell e remotes podem estar em domínios, buckets, serviços ou prefixos de pasta diferentes.
- A URL do manifest tende a permanecer estável, enquanto chunks com hash podem ser imutáveis e mudar de nome a cada conteúdo novo.
- `assetPrefix` é a base pública que o producer anuncia para localizar `remoteEntry.js`, chunks e CSS; não é o diretório local `dist`.
- A URL configurada em `remotes` responde “onde o shell encontra o manifest”; o `assetPrefix` responde “onde o remote diz que seus próprios assets estão”.
- Uma publicação segura envia primeiro os novos chunks e somente depois atualiza o manifest. Assets antigos devem permanecer disponíveis por algum tempo para páginas que ainda carregaram o manifest anterior.
- Mudar somente a implementação interna e preservar o contrato permite alterar os hashes do remote sem mudar os arquivos do shell.

### 15. Composição por rota e montagem em elemento HTML

- Rota e elemento de montagem não são alternativas excludentes. A rota pode decidir quando ativar um micro frontend e, dentro dela, o shell pode oferecer uma `<div>` como alvo de montagem.
- Products é React dentro de um shell React, então `ProductApp` entra diretamente na árvore React já existente; o remote não chama outro `createRoot`.
- Account será Vue dentro do host React. O shell não deve tratar um componente Vue como componente React; ele renderiza um elemento contêiner e entrega esse `HTMLElement` ao contrato remoto.
- O remote Vue implementa uma fronteira explícita de lifecycle: cria a aplicação com `createApp`, executa `mount(element)` e oferece `unmount()` para limpeza quando a rota sair.
- O shell é dono da posição e do elemento contêiner; o remote é dono do conteúdo renderizado dentro desse elemento.
- O mesmo contrato de montagem poderia ser usado fora de uma rota, por exemplo em um dashboard com vários widgets simultâneos. A rota é apenas uma forma de decidir quando montar.
- Um Web Component representa outra fronteira: ele pode aparecer como uma tag no template de React ou Vue, embora sua distribuição como pacote continue sendo diferente de um remote carregado por Module Federation.

### 16. Lifecycle neutro para atravessar frameworks

- Um Single File Component Vue não pode ser renderizado por React como se fosse um componente React: cada framework possui seu próprio formato de árvore virtual, runtime e lifecycle.
- O remote Account publica `account/mount`, e não o arquivo `.vue`. Sua superfície pública recebe um `HTMLElement` e dados simples e devolve um handle com `unmount()`.
- O elemento HTML é uma fronteira neutra: qualquer host capaz de fornecer DOM pode chamar o contrato sem precisar conhecer `createApp` nem importar Vue.
- `mount` cria a aplicação Vue, entrega ao Vue o conteúdo interno do container e registra aquela montagem. Uma segunda montagem no mesmo elemento falha cedo em vez de criar duas aplicações sobrepostas.
- `unmount` encerra a aplicação Vue, remove os efeitos e listeners gerenciados por ela e libera o container no registro. A operação é idempotente no mesmo handle.
- O bootstrap standalone não cria um caminho paralelo: ele encontra `#root` e chama exatamente o mesmo `mount` que um consumer usará no futuro.
- O `WeakMap` evita reter o container artificialmente, mas sua proteção contra duplicidade pertence à instância carregada desse módulo; não é um registro global entre bundles duplicados.
- O contrato atual só contempla opções iniciais. Atualização de props, eventos entre apps, prontidão assíncrona e tratamento padronizado de erros exigiriam evolução explícita do contrato.
- Compartilhar Vue como singleton negocia uma instância compatível quando houver participantes Vue. O shell React não passa a importar Vue por causa disso, e o remote ainda precisa carregar Vue quando funciona standalone.

Frase curta para preservar:

> O host oferece o terreno, um `HTMLElement`; o remote Vue constrói dentro dele e devolve a chave de desmontagem. O host não precisa saber como o Vue cria ou destrói sua interface.

### 17. Adapter React para um remote Vue

- O adapter `VueRemoteRoute` é um componente React, mas sua função não é converter Vue em React. Ele traduz o lifecycle da rota React para o contrato imperativo do remote.
- `useRef` guarda o container real que React criou. Vue recebe esse elemento somente depois que ele existe no DOM.
- `useEffect` inicia o import assíncrono e devolve o cleanup. Ao sair da rota, React executa esse cleanup e o handle remoto chama `app.unmount()`.
- React controla o elemento contêiner; Vue controla somente os filhos internos. O adapter não renderiza conteúdo React dentro da área entregue ao Vue.
- Um sinal `cancelled` resolve a corrida em que o usuário sai da rota antes de `import('account/mount')` terminar. Nesse caso, o resultado atrasado é ignorado e Vue não monta em uma tela que já deixou de existir.
- Loading e erro pertencem ao adapter React. A falha fica restrita a `/account`.
- O runtime pode manter em memória a falha de carregamento do manifest. Por isso, o retry simples desta etapa recarrega a URL atual: a nova página cria outra instância do runtime e tenta Account novamente. Retentativas sem reload exigiriam controlar o cache pela API ou pelo plugin oficial de retry.
- Em desenvolvimento, `StrictMode` pode executar setup, cleanup e setup do efeito para revelar problemas de lifecycle. Um adapter correto precisa tolerar essa sequência sem deixar duas aplicações montadas.

Frase curta para preservar:

> React não renderiza Vue: React decide quando existe um container, e o adapter traduz essa existência em `mount` e `unmount`.

### 18. Contrato compartilhado não é estado compartilhado

- Imagine que Shell, Products e Account trabalhavam com cópias separadas do mesmo formulário de acordo. Na etapa 11, essas cópias foram substituídas por um documento comum chamado `@mfe-lab/contracts`.
- O pacote contém formatos e nomes: opções de montagem, handle de desmontagem, papéis aceitos, nomes de eventos e formatos de payload. Ele não guarda o usuário atual, o contador atual nem qualquer store.
- `workspace:*` diz ao pnpm para ligar o consumidor ao pacote local do mesmo workspace. O consumidor encontra o pacote durante install/build, não consultando um manifest em runtime.
- O `package.json` do pacote aponta para `dist/index.js` e `dist/index.d.ts`; por isso o build do pacote acontece antes do typecheck e do build dos apps.
- Alterar um contrato não modifica um consumer já compilado. O consumer precisa receber a nova versão ou conteúdo, passar pelo typecheck e gerar outro build.
- TypeScript verifica código durante desenvolvimento e compilação, mas os tipos são apagados do JavaScript. Um payload vindo de evento, rede ou armazenamento pode estar errado em runtime; quando isso importa, é necessário validar dados de verdade.
- Nenhum type guard foi criado apenas para preencher a arquitetura. Guards só devem existir quando algum dado desconhecido for realmente validado, e então merecem testes unitários.

Comparação para consulta rápida:

```text
PACOTE DE CONTRATOS
install/build → tipos e constantes entram no consumidor → requer rebuild para atualizar

MODULE FEDERATION
runtime → shell consulta manifest → remote pode mudar sem rebuild do shell se preservar contrato
```

Frase curta para preservar:

> Compartilhar contrato é concordar sobre o formato da conversa; compartilhar estado seria dividir a informação viva que muda durante a conversa.

## Glossário inicial do e-book

- **Shell/host:** aplicação que controla a experiência principal e compõe partes externas.
- **Producer/remote:** build que publica módulos para outros apps.
- **Consumer:** build que solicita e usa módulos publicados.
- **Standalone:** app capaz de abrir e funcionar sozinho.
- **Composição:** renderização de partes de builds diferentes dentro da mesma experiência.
- **`exposes`:** superfície pública oferecida pelo producer.
- **`remotes`:** catálogo de producers conhecidos pelo consumer.
- **Manifest:** metadados para localizar container, módulos e assets.
- **Remote entry:** código executável que implementa o container federado.
- **Share scope:** espaço de negociação de dependências compartilhadas.
- **Singleton:** solicitação para reutilizar uma única instância compatível.
- **Bootstrap:** ponto que monta a aplicação standalone em um elemento HTML.
- **Contrato de montagem:** função ou API que separa a interface do local onde será montada.
- **Lifecycle:** operações explícitas que iniciam e encerram a presença de um micro frontend, como `mount` e `unmount`.
- **Error Boundary:** limite React que impede uma falha interna de derrubar uma área maior.
- **DTS:** declarações TypeScript que descrevem o contrato de um módulo.

## Fontes internas para o e-book

- `docs/lessons/01-esqueleto-contrato-trabalho.md`
- `docs/lessons/02-shell-react-standalone.md`
- `docs/lessons/03-products-react-standalone.md`
- `docs/lessons/04-account-vue-standalone.md`
- `docs/lessons/05-three-independent-apps.md`
- `docs/lessons/06-products-producer.md`
- `docs/lessons/07-shell-consumes-products.md`
- `docs/lessons/08-independent-remote-deploy.md`
- `docs/lessons/09-vue-lifecycle-remote.md`
- `docs/lessons/10-react-consumes-vue.md`
- `docs/lessons/11-build-time-contract-package.md`
- `docs/lessons/12-cross-mfe-events.md`
- `docs/lessons/13-design-tokens-package.md`
- `docs/lessons/14-react-ui-npm-package.md`
- `docs/diagrams/05-before-federation.md`
- `docs/diagrams/07-products-runtime-flow.md`
- `docs/diagrams/10-react-host-vue-lifecycle.md`
- `docs/experiments/01-remote-independent-update.md`

## Orientação para continuar registrando

A cada nova etapa, acrescentar aqui somente os conceitos e dúvidas que melhorarem a futura narrativa. A implementação completa permanece na lição numerada. No encerramento do laboratório, transformar este caderno e as lições em capítulos progressivos, revisar exemplos contra o código final e gerar o e-book em um formato solicitado pelo aluno.
## 19. Comunicação em runtime: os apps conversam sem dividir o estado

Pense novamente nos três projetos:

```text
shell-react       → mostra informações gerais no header
products-react    → é dono do contador do carrinho
account-vue       → é dono do nome e do papel
```

O shell não entra no Products para buscar seu `useState` e não entra no Vue para ler seu `ref`. Cada remote anuncia um fato usando um evento do navegador:

```text
Products: “o carrinho agora tem 2 itens” ──► cart-updated
Account:  “Denis agora é Operador”       ──► profile-updated
Shell:    escuta e atualiza somente o header
```

O pacote `@mfe-lab/contracts` funciona como o modelo do envelope: define o nome da mensagem e quais campos ela carrega. `CustomEvent` é o entregador em runtime. O estado continua dentro do MFE que o controla.

Frase para memorizar:

> O contrato diz como a mensagem deve ser; o Custom Event transporta a mensagem; o micro frontend de origem continua dono do dado.

### Receita pequena

No emissor React:

```typescript
window.dispatchEvent(
  new CustomEvent<CartUpdatedEventPayload>(LAB_EVENT_NAMES.cartUpdated, {
    detail: { totalItems },
  }),
);
```

No emissor Vue, a ideia é a mesma: mudou o `ref`, cria o `CustomEvent` e despacha no `window`.

No shell:

```typescript
useEffect(() => {
  function handleCartUpdated(event: CustomEvent<CartUpdatedEventPayload>) {
    setCartTotal(event.detail.totalItems);
  }

  window.addEventListener(LAB_EVENT_NAMES.cartUpdated, handleCartUpdated);

  return () => {
    window.removeEventListener(LAB_EVENT_NAMES.cartUpdated, handleCartUpdated);
  };
}, []);
```

O `return` continua sendo o segredo do cleanup: quando o componente que registrou o listener desmonta, React remove a inscrição. Sem isso, eventos podem ser tratados repetidamente após remontagens.

Custom Events são adequados para poucas notificações desacopladas na mesma página. URL é melhor para estado navegável; backend é melhor para dados duráveis e de negócio; props/callbacks são melhores quando há uma relação direta de montagem; um store compartilhado aumenta o acoplamento e só deve ser adotado com ownership claro.

### `window` é global em qual espaço?

Explicar com cuidado que `window` não é global entre todos os projetos, servidores ou usuários. Ele é o objeto global de uma página aberta no navegador.

Quando o shell carrega Products por Module Federation e monta Account dentro de um container, os três códigos executam no mesmo documento e enxergam o mesmo `window`:

```text
Página localhost:3000
│
├── Shell React
├── Products React carregado como remote
└── Account Vue montado em uma div
        │
        └── todos usam o mesmo window
```

Ao abrir Products sozinho em `localhost:3001`, surge outra página com outro `window`. Um evento disparado nessa aba não chega automaticamente ao shell aberto em `localhost:3000`.

```text
Aba localhost:3000 → window A
Aba localhost:3001 → window B

evento no window B ≠ evento recebido no window A
```

Essa distinção evita a falsa impressão de que Custom Events atravessam deploys, processos, abas ou rede.

### `dispatchEvent` em linguagem humana

`dispatch` pode ser lido como “disparar”, “enviar” ou “publicar agora”. Ele não executa outra aplicação diretamente. O navegador procura os listeners registrados para aquele nome e chama seus handlers.

```text
dispatchEvent = tocar a campainha
listener      = quem está ouvindo a campainha
handler       = o que a pessoa faz quando escuta
detail        = o conteúdo entregue com o aviso
```

Fluxo completo do carrinho:

```text
1. A pessoa clica em Adicionar
2. Products altera seu useState de 0 para 1
3. Products dispara cart-updated { totalItems: 1 }
4. window localiza os listeners de cart-updated
5. o navegador chama handleCartUpdated(event)
6. o shell lê event.detail.totalItems
7. setCartTotal(1) agenda uma nova renderização
8. o header passa a mostrar Carrinho: 1
```

### Não é um Event Bus do Vue

Registrar a reação do aluno: mesmo um desenvolvedor experiente pode nunca ter visto `window` usado dessa forma, porque frameworks normalmente conduzem a props, Context, stores e APIs próprias. A API nativa já aparece em eventos como `resize`, `scroll`, `storage` e `keydown`; a novidade didática é criar um nome de evento com `CustomEvent` e transportar dados em `detail`.

No Vue 2 era comum criar um Event Bus baseado em uma instância Vue e usar `$emit` e `$on`. Aqui o Vue apenas percebe a alteração de seu `ref` e chama uma API do navegador. React, Vue, Angular, Svelte ou JavaScript puro podem entender o mesmo evento.

Conceitualmente, usar `window` dessa maneira tem publicação e assinatura, portanto lembra um Event Bus pequeno. Tecnicamente, não criamos uma classe, singleton próprio ou biblioteca com `publish` e `subscribe`: usamos `dispatchEvent`, `addEventListener` e `removeEventListener` diretamente.

Limitações que precisam aparecer no e-book:

- funciona apenas no mesmo documento;
- não persiste nem guarda histórico;
- não entrega novamente para quem começou a ouvir depois;
- os listeners são executados de forma síncrona durante o dispatch;
- excesso de eventos cria uma “rádio global” difícil de rastrear;
- nomes, payloads, ownership e cleanup precisam ser explícitos;
- TypeScript não valida sozinho o payload em runtime.

### Como ler a função `App` do shell

Separar visualmente as três responsabilidades introduzidas na etapa 12:

```text
useState
└── guarda a última fotografia recebida para apresentar no header

useEffect com []
├── registra os listeners uma vez quando App monta
└── devolve o cleanup executado quando App desmonta

JSX
└── lê cartTotal e profile e redesenha o header
```

Ressaltar que trocar `/products` por `/account` não desmonta normalmente o `App` do shell. Somente o conteúdo escolhido pelo router muda. Por isso os listeners do shell continuam ativos durante a navegação. O cleanup do `App` acontece quando o próprio shell desmonta, enquanto o cleanup de `VueRemoteRoute` acontece ao sair da rota Account.

Products continua sendo a fonte da verdade do contador, e Account continua sendo a fonte da verdade do perfil. `cartTotal` e `profile` no shell são projeções para leitura, sem comandos para alterar o estado dos remotes.

### Decidir que será MFE não significa usar `window` em tudo

Para um projeto novo, ensinar esta ordem de perguntas:

```text
1. Qual é o domínio de negócio?
2. Qual equipe é responsável por ele?
3. Existe necessidade real de deploy independente?
4. Ele funcionará standalone, dentro de um shell ou nos dois modos?
5. Qual superfície pública será exposta?
6. Quais dados entram no MFE?
7. Quais acontecimentos saem dele?
8. Qual canal é adequado para cada comunicação?
```

Micro frontend não deve ser escolhido apenas para separar pastas. A autonomia de equipe, ownership de domínio e necessidade de entrega independente precisam compensar custos como contratos, observabilidade, versionamento, resiliência e coordenação visual.

Depois de escolher a fronteira, avaliar o canal:

```text
Shell → remote diretamente relacionado     → props ou opções de mount
Remote → shell com notificação pequena     → callback ou Custom Event
Estado navegável e compartilhável          → URL
Dado durável, multiusuário ou de negócio   → backend
Estado muito coordenado na mesma página    → store, com ownership explícito
```

Exemplo humano para o futuro e-book:

```text
Novo MFE: checkout

Entradas:
- identificador do carrinho
- moeda
- usuário autenticado

Saídas:
- checkout iniciado
- pagamento concluído
- checkout cancelado

Dados duráveis:
- carrinho
- pagamento
- pedido
→ pertencem ao backend, não ao window
```

Frase de fechamento:

> Ao criar um MFE, planeje cedo a fronteira e os contratos. Use `window` apenas quando Custom Events forem o canal adequado — não como comunicação padrão para tudo.

## 20. Design tokens: compartilhar decisões visuais sem compartilhar componentes

Apresentar primeiro o problema humano:

```text
Shell escreve:   border: 1px solid #cbd5e1
Products copia:  border: 1px solid #cbd5e1
Account copia:   border: 1px solid #cbd5e1
```

As interfaces parecem consistentes, mas não existe uma fonte comum. Se a marca mudar a borda, três equipes precisam encontrar o mesmo valor copiado.

Com tokens:

```text
@mfe-lab/design-tokens
└── --mfe-color-border: #cbd5e1
       ├── Shell usa no CSS Module
       ├── Products usa no CSS Module
       └── Account usa no style scoped
```

Frase para memorizar:

> Token compartilha uma decisão visual; componente compartilha estrutura e comportamento.

React e Vue não precisam entender um ao outro. Ambos geram elementos HTML, e o navegador resolve `var(--mfe-color-border)`. Por isso cores, espaçamentos, raios e tipografia podem formar um pacote neutro.

Reforçar a separação:

```text
GLOBAL POR INTENÇÃO
:root e propriedades --mfe-*

LOCAL POR OWNERSHIP
classes, seletores, layout e comportamento de cada app
```

O pacote é ligado por `workspace:*` e incluído durante o build de cada consumidor. Ele não tem manifest nem remote entry. Alterar seu fonte não muda um app já compilado; o consumidor precisa adotar a versão, rebuildar e fazer deploy.

O e-book deve mostrar o erro encontrado no laboratório: o primeiro build não gerou o CSS porque o bundler eliminou um import sem exportação observável. Marcar `**/*.css` como `sideEffects` explicou, na prática, que importar CSS causa um efeito no documento mesmo sem retornar um valor JavaScript. `output.target: 'web'` também é necessário porque Rslib tem alvo Node por padrão.

Alertar sobre versões divergentes. Como `:root` é global, dois remotes podem trazer versões diferentes do mesmo nome e a cascata decidir qual valor vence pela ordem de carregamento. Versionamento ajuda adoção e rollback, mas não elimina a necessidade de compatibilidade e coordenação.

## 21. Biblioteca React: reutilização não é micro frontend

Usar a seguinte evolução didática:

```text
design-tokens
└── compartilha valores visuais entre qualquer framework

ui-react
└── compartilha pequenos componentes somente entre consumidores React

ProductApp remote
└── entrega um domínio e uma interface em runtime
```

`LabButton` e `AppBoundaryLabel` entram no shell e em Products durante o build de cada consumidor. Eles não possuem servidor, manifest ou deploy próprio. Por isso uma biblioteca de componentes não é automaticamente um micro frontend.

### Analogia do motor

`peerDependencies` pode ser explicado assim:

> A biblioteca é uma peça feita para um modelo de motor, mas não leva outro motor dentro da caixa. O aplicativo informa qual React compatível está instalado e a peça usa esse React.

Se `ui-react` levasse React dentro de seu bundle, o shell poderia terminar com React A e a biblioteca com React B. Além do peso, Hooks, Context e identidade da árvore poderiam deixar de concordar.

Separar as categorias:

```text
dependencies
└── o pacote precisa disso para funcionar quando distribuído

devDependencies
└── o autor precisa disso para desenvolver, tipar e construir

peerDependencies
└── o consumidor precisa fornecer uma versão compatível
```

O build deve ser mostrado no e-book: o pequeno `dist/index.js` contém import de `react/jsx-runtime` e não uma cópia da implementação React. Essa evidência torna “React externo” concreto.

### Build time versus runtime novamente

```text
Atualizar ui-react
→ publicar/ligar nova versão
→ instalar no consumidor
→ rebuildar consumidor
→ fazer deploy do consumidor

Atualizar ProductApp remote preservando contrato
→ rebuildar Products
→ fazer deploy de Products
→ shell consulta o manifest em runtime
```

Frase para memorizar:

> `ui-react` compartilha peças no build; `ProductApp` entrega uma aplicação de domínio no runtime.

Vue não usa naturalmente `LabButton` porque um componente React é entendido pelo reconciliador React, enquanto o template Vue é entendido pelo lifecycle e renderer Vue. Compartilhar tokens é neutro; compartilhar componentes de framework exige compatibilidade, wrapper ou outra fronteira web.

### `workspace:*`, registry e fotografias com tags

Deixar claro que `workspace:*` não é uma solução apenas didática. Ele é comum quando aplicações e bibliotecas são desenvolvidas no mesmo monorepo. O link local existe durante instalação e build; o navegador em produção recebe somente os artefatos compilados.

```text
Mesmo monorepo e mesma esteira
→ workspace:* costuma ser adequado

Repositórios, equipes ou ciclos de versão independentes
→ registry privado costuma ser adequado
```

O Verdaccio demonstrará o segundo fluxo sem publicar nada no npm público. Os apps deixarão de resolver os pacotes diretamente pelo workspace e instalarão versões publicadas no registry local. Isso não substitui Module Federation: Verdaccio distribui pacotes de build time; o manifest distribui remotes em runtime.

Evitar deixar alguns apps usando o registry e outros usando links locais apenas para demonstrar os dois modelos. Uma arquitetura híbrida tornaria os experimentos de atualização difíceis de interpretar. Em vez de duplicar projetos, preservar fotografias importantes com commits e tags Git.

Analogia para o e-book:

> Branch é uma estrada que continua sendo construída. Tag é uma placa fixa indicando um ponto daquela estrada.

Exemplo visual:

```text
A ── B ── C ── D
     ↑         ↑
etapa-14     main
workspace   continua avançando
```

Comandos a explicar:

```bash
git tag etapa-14-workspace-packages
git show etapa-14-workspace-packages
git switch --detach etapa-14-workspace-packages
git switch main
```

Assim, o leitor poderá consultar e executar o estado com `workspace:*` pelo commit marcado, enquanto a linha principal evolui posteriormente para o Verdaccio.

## 22. Web Component: uma tag neutra entre React e Vue

Começar com o problema humano deixado pela biblioteca anterior:

```text
LabButton React
├── Shell React usa
├── Products React usa
└── Account Vue não entende
```

Em seguida mostrar a alternativa desta etapa:

```text
<lab-status-chip>
├── Shell React escreve a tag
├── Account Vue escreve a tag
└── navegador cria e controla o elemento
```

Frase para memorizar:

> React e Vue não renderizam um ao outro; ambos sabem colocar uma tag no DOM, e o navegador sabe executar um Custom Element registrado.

Usar a analogia de um aparelho com tomada padrão. `LabButton` possui um encaixe React. `lab-status-chip` usa o encaixe da própria plataforma web. Isso aumenta o alcance, mas não significa que Web Components substituem todos os componentes específicos de framework.

Mostrar o registro idempotente como uma regra global do navegador:

```ts
if (!customElements.get('lab-status-chip')) {
  customElements.define('lab-status-chip', LabStatusChipElement);
}
```

O shell e o remote Vue podem carregar cópias do pacote na mesma página. O registry é global, portanto a consulta impede uma segunda definição do mesmo nome.

### Shadow DOM sem misticismo

```text
<lab-status-chip>
└── #shadow-root
    ├── style
    └── span.chip
```

Seletores ficam contidos, mas variáveis CSS são herdadas pelo host e podem ser consumidas internamente:

```css
color: var(--mfe-color-text, #0f172a);
```

Explicar que isso combina duas propriedades úteis: isolamento de estrutura/seletores e tematização por contrato. Também destacar que não é isolamento absoluto; eventos, propriedades herdáveis e APIs globais ainda precisam de decisões conscientes.

### Tipos sem transformar o pacote em React

O módulo principal expõe tipos DOM neutros. Uma entrada opcional `@mfe-lab/ui-web/react` ensina ao JSX quais atributos a tag aceita, mas seu JavaScript é vazio e não executa React. Para Vue, a configuração `isCustomElement` evita que o compilador procure um componente Vue inexistente.

### Build time continua sendo build time

```text
ui-web nova versão
→ instalar/resolver no consumidor
→ rebuildar Shell e/ou Account
→ publicar os consumidores
```

Não há manifest, remote entry ou servidor para `ui-web`. Ser framework-agnostic não é o mesmo que possuir deploy independente.

Fechar comparando as três camadas:

```text
design-tokens → valores visuais neutros
ui-react      → componentes com melhor DX para React
ui-web        → componente nativo atravessando frameworks
remotes       → aplicações/domínios carregados em runtime
```

### O significado concreto de `workspace:*`

Explicar que `workspace:*` não significa “qualquer versão da internet”. O prefixo obriga o pnpm a localizar um pacote com aquele nome dentro do workspace e criar uma ligação local. O `*` aceita a versão atualmente declarada pelo pacote encontrado.

```text
apps/shell-react
└── @mfe-lab/ui-web: workspace:*
              │
              └── ligação local → packages/ui-web
```

Mesmo ligado localmente, o consumidor respeita `package.json` e `exports`. Como `ui-web` aponta para `dist`, a biblioteca precisa ser construída antes do app. Na publicação, o protocolo workspace é convertido para uma versão publicável; os consumidores externos nunca recebem `workspace:*` dentro do tarball final.

### Por que existe um `export {}` vazio

Deixar explícito que `export {}` não exporta um objeto vazio. Ele marca um arquivo como módulo TypeScript sem criar valor de runtime. Na entrada de tipos React, sua função é evidenciar que o arquivo existe para ampliar `React.JSX.IntrinsicElements` sem poluir o escopo global como um script comum.

Neste caso, `import type` já tornaria o arquivo um módulo, então `export {}` é redundante do ponto de vista técnico, mas serve como marcador explícito. O artefato `react.js` gerado com zero bytes comprova que a entrada influencia a checagem de tipos, não o navegador.

### Por que o código nativo parece mais “raiz”

Comparar:

```text
React/Vue
→ template declarativo, atualização e lifecycle abstraídos

Custom Element nativo
→ HTMLElement, attachShadow, createElement,
  observedAttributes e customElements.define explícitos
```

O laboratório evita Lit de propósito para revelar as primitivas da plataforma. Web Components são usados em design systems, widgets, integrações entre frameworks e migrações, mas componentes complexos frequentemente usam Lit, Stencil, FAST ou wrappers específicos para reduzir boilerplate e melhorar a experiência de desenvolvimento.

Evitar prometer que “funciona para tudo”. A tag atravessa frameworks, mas formulários, SSR, eventos complexos, objetos e ergonomia de cada framework ainda podem exigir adapters.

## 23. Do `workspace:*` ao pacote publicado

Abrir com a continuação direta da analogia dos três projetos:

```text
Antes
Shell ── link local ──> packages/ui-react/src/dist

Agora
packages/ui-react
  ── build ──> dist
  ── pack ───> ui-react-1.0.0.tgz
  ── publish ─> Verdaccio
  ── install ─> Shell
```

Frase humana para memorizar:

> `workspace:*` é pegar a ferramenta diretamente na oficina ao lado. Publicar é embalar uma versão, colocá-la no estoque com etiqueta e fazer o app pedir exatamente aquela caixa.

Explicar que o Verdaccio não hospeda os micro frontends. Ele guarda pacotes usados no install/build. Quem hospeda o código federado em runtime continua sendo o servidor de cada remote, por meio de manifest, remote entry e chunks.

```text
Verdaccio / npm privado
→ distribui contracts, tokens e componentes
→ entra antes do build do consumidor

Module Federation
→ distribui ProductApp e account/mount
→ entra no navegador, em runtime
```

### O mesmo repositório não significa a mesma fonte

Mostrar que `packages/ui-react/src` pode continuar ao lado do Shell no monorepo, mas `linkWorkspacePackages: false` e a dependência exata `1.0.0` evitam o atalho local:

```text
apps/shell-react/package.json
└── @mfe-lab/ui-react: 1.0.0
        ↓ .npmrc escolhe registry por escopo
http://127.0.0.1:4873
        ↓ baixa tarball
node_modules/.pnpm/@mfe-lab+ui-react@1.0.0...
```

Editar a fonte local não muda o app. É necessário gerar uma nova versão, publicar, instalar e rebuildar o consumidor. Isso cria uma fronteira parecida com a de repositórios separados sem perder a conveniência do monorepo.

### O que foi realmente publicado

O registry recebe um `.tgz` contendo `package.json` e os arquivos permitidos de `dist`; não recebe magicamente todo o projeto. `pnpm pack --dry-run` permite abrir a lista da caixa antes do envio.

Destacar também a conversão do protocolo interno:

```text
fonte de ui-react:       design-tokens = workspace:*
manifest no tarball:     design-tokens = 1.0.0
```

O primeiro é uma garantia de desenvolvimento no workspace. O segundo é uma dependência compreensível por qualquer consumidor do registry.

### O lockfile como comprovante

Comparar visualmente:

```yaml
# antes: fonte ligada
specifier: workspace:*
version: link:../../packages/ui-react

# depois: artefato versionado
specifier: 1.0.0
version: 1.0.0
```

O lockfile registra a decisão reprodutível e a integridade do conteúdo. O metadata do Verdaccio mostra ainda a URL do tarball. `pnpm why` responde qual consumidor pediu aquela versão.

### Por que existe `bootstrap:local`

Num registry vazio, os apps pedem pacotes que ainda não foram publicados. Portanto, o fluxo limpo precisa respeitar a ordem:

```text
subir Verdaccio
→ instalar toolchain apenas dos pacotes
→ buildar
→ inspecionar tarballs
→ publicar dependências em ordem
→ instalar os apps
→ executar checks
```

O pnpm 11 normalmente verifica e instala dependências antes de rodar scripts. Para não deixar essa conveniência tentar instalar os apps cedo demais, o laboratório define `verifyDepsBeforeRun: false` e deixa o próprio bootstrap controlar a sequência. Isso não desliga a validação do lockfile nos comandos `install --frozen-lockfile`; apenas remove a instalação implícita anterior ao script.

O nome do container deve aparecer nas ilustrações e troubleshooting: `microfrontends-lab-verdaccio`. Isso ajuda o leitor a reconhecer que aquele container é a prateleira local de pacotes do laboratório, não um servidor do Shell.

## 24. A comparação central: caixa versionada versus restaurante ao vivo

Usar a etapa 17 como o capítulo que une tudo. Começar com uma única tela mostrando versões diferentes:

```text
SHELL · UI React 1.0.0
└── PRODUCTS · UI React 1.1.0 · products-v3
```

Analogia humana:

> Uma biblioteca npm é um ingrediente embalado que o restaurante comprou antes de abrir. Um remote é um balcão parceiro servindo parte do pedido enquanto o cliente está no salão.

Para a biblioteca:

```text
ui-react@1.1.0 foi colocado na prateleira
≠
todos os apps trocaram automaticamente sua caixa 1.0.0
```

Publicar apenas disponibiliza. Cada consumidor escolhe quando adotar, atualiza seu `package.json`, instala, builda e faz deploy. Por isso Shell pôde permanecer em `1.0.0` enquanto Products adotou `1.1.0`.

Para o remote:

```text
Shell buildado conhece a placa:
http://localhost:3001/mf-manifest.json

Products troca os pratos/chunks atrás da mesma placa
→ no próximo carregamento, Shell encontra products-v3
```

Destacar o trade-off sem vender uma solução como universalmente superior:

```text
Pacote npm
+ versão e rollback explícitos
+ falha do registry não afeta usuário após deploy
- adoção exige rebuild/redeploy do consumidor

Module Federation
+ remote atualiza sem rebuild do host
+ autonomia de release do domínio
- disponibilidade e contrato importam em runtime
- cache e observabilidade ficam mais importantes
```

Frase para entrevista:

> Publicação não é adoção. Um pacote novo só chega após o consumidor atualizar e rebuildar; um remote novo pode chegar no próximo carregamento pela mesma URL, desde que o contrato continue compatível.

## 25. A mesa de negociação do `shared`

Usar a analogia de uma sala com uma mesa chamada `default`:

```text
Share scope "default"
├── Shell oferece React 19.2.8
├── Products oferece React 19.2.8
├── ambos pedem singleton
└── runtime escolhe a instância reutilizada
```

Frase humana:

> `shared` não envia a feature de um app para outro; ele cria uma mesa onde os containers negociam quem fornece uma dependência comum.

Explicar os três conceitos separadamente:

```text
shared          → esta dependência participa da mesa
singleton       → queremos uma única instância nesse escopo
requiredVersion → esta é a versão que meu código espera
```

Destacar que singleton não significa “sempre vai funcionar”. Se todos forem obrigados a usar uma única ferramenta incompatível, continua existindo problema; apenas não existem duas ferramentas.

### Subpaths também entram pela porta

Mostrar imports reais:

```ts
import { jsx } from 'react/jsx-runtime';
import { createRoot } from 'react-dom/client';
```

Compartilhar apenas os nomes raiz não deve esconder que subpaths são módulos solicitados separadamente. A configuração com `react/` e `react-dom/` intercepta a família de imports e o manifest mostra as chaves finais negociadas.

### Por que UI React continua fora

Retomar a tela da etapa anterior:

```text
Shell    → ui-react 1.0.0
Products → ui-react 1.1.0
```

Essa diferença é intencional e saudável para o experimento. Colocar `ui-react` em `shared` poderia fazer o runtime escolher uma versão para ambos, mudando o código efetivamente testado por uma equipe. Compartilhar tudo economiza bytes às custas de autonomia e previsibilidade.

### Painel por contrato, não por espionagem

O painel técnico importa `products/technicalInfo` e `account/technicalInfo`, exposes públicos pequenos. Não acessa globals ou caches privados do Module Federation. Usar a analogia de cada time entregar um crachá com suas informações, em vez de o Shell vasculhar a mochila interna dos remotes.

Mostrar o painel apenas em desenvolvimento e registrar suas linhas como uma ilustração futura:

```text
React Shell ............. 19.2.8
React Products .......... 19.2.8
Products usa React Shell  sim
Vue Account ............. 3.5.42
Remote Products ......... products-v3
Remote Account .......... account-v1
UI React Shell .......... 1.0.0
UI React Products ....... 1.1.0
Manifests ............... :3001 / :3002
```

Explicar que duas versões iguais na tela ainda poderiam vir de duas cópias distintas. Para tornar a reutilização concreta sem ler internals, Products entrega uma referência pública a `useState` e o Shell a compara com a sua usando `===`. O resultado `sim` significa que ambas as fronteiras receberam a mesma identidade de função naquela execução.

## 26. Quando o restaurante parceiro fecha: resiliência em runtime

Retomar a analogia do restaurante ao vivo:

> O Shell continua sendo o salão e o cardápio principal. Products e Account são cozinhas parceiras. Se uma cozinha ficar indisponível, o salão não deve apagar as luzes nem expulsar todo mundo; apenas aquela parte do pedido precisa mostrar uma alternativa.

Mostrar as fronteiras como caixas independentes:

```text
SHELL
├── header e navegação ........ continuam vivos
├── Home ...................... continua local
├── /products
│   ├── loading
│   ├── falha ao buscar ....... fallback Products
│   └── falha ao renderizar ... fallback Products
└── /account
    ├── loading do import
    ├── falha ao importar ..... fallback Account
    ├── falha no mount ........ fallback Account
    └── saída da rota ......... unmount + cleanup
```

Frase humana para fixação:

> Import falhou significa “a encomenda nem chegou”. Render ou mount falhou significa “a caixa chegou, mas quebrou quando tentamos usar”.

### Retry que faz alguma coisa de verdade

Um botão que apenas troca `hasError` para `false` pode renderizar novamente, mas não garante nova busca de um módulo cujo erro ficou guardado. No laboratório:

```text
erro de renderização → limpar a Error Boundary e tentar renderizar de novo
erro de import → reload da rota e nova tentativa do runtime
```

Explicar que reload completo não é a única solução possível, mas é a mais transparente neste estágio. Uma solução granular exigiria APIs de runtime, invalidação de cache, limites de tentativa e métricas.

### O cache pode contar uma história atrasada

Registrar a descoberta real do laboratório: desligamos uma origem já acessada, mas a tela ainda conseguiu carregar porque manifest e chunks estavam em cache. Ao usar uma URL inédita, a falha apareceu.

```text
servidor desligado agora
  + recurso já guardado no navegador
  = a tela ainda pode funcionar por algum tempo
```

Isso prepara o capítulo futuro sobre CDN: manifest costuma precisar de revalidação curta; chunks com hash podem ter cache longo.

### O guarda da troca rápida

Usar uma ilustração temporal:

```text
t0 entra em /account → import começa
t1 sai para Home      → cleanup marca cancelled = true
t2 import termina     → vê cancelled e não chama mount
```

Sem essa verificação, Vue poderia tentar montar num container removido, atualizar estado de um adapter desmontado ou deixar recursos órfãos.

### A configuração também precisa ser observável

O painel revelou um bug: o Shell mostrava sempre os fallbacks 3001/3002 mesmo quando a variável era passada pelo terminal. A precedência correta ficou:

```text
process.env → arquivo .env → fallback localhost
```

Usar isso para ensinar que observabilidade não é somente registrar erros; também é conseguir responder “qual URL este build está realmente usando?”.

Frase para entrevista:

> Eu isolo loading, falha de import e falha de renderização ou montagem na fronteira de cada remote. O fallback pertence ao host, o cleanup respeita o lifecycle do framework remoto, e Retry, cache e logs são tratados como decisões operacionais, não apenas visuais.
