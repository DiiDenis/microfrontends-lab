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
- `docs/diagrams/05-before-federation.md`
- `docs/diagrams/07-products-runtime-flow.md`
- `docs/experiments/01-remote-independent-update.md`

## Orientação para continuar registrando

A cada nova etapa, acrescentar aqui somente os conceitos e dúvidas que melhorarem a futura narrativa. A implementação completa permanece na lição numerada. No encerramento do laboratório, transformar este caderno e as lições em capítulos progressivos, revisar exemplos contra o código final e gerar o e-book em um formato solicitado pelo aluno.
