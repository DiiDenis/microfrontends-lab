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
- O shell aponta para um manifest de endereço estável e não precisa conhecer nomes de chunks com hash, que podem mudar a cada build.

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
- `docs/diagrams/05-before-federation.md`
- `docs/diagrams/07-products-runtime-flow.md`

## Orientação para continuar registrando

A cada nova etapa, acrescentar aqui somente os conceitos e dúvidas que melhorarem a futura narrativa. A implementação completa permanece na lição numerada. No encerramento do laboratório, transformar este caderno e as lições em capítulos progressivos, revisar exemplos contra o código final e gerar o e-book em um formato solicitado pelo aluno.
