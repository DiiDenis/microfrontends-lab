# Etapa 07 — Shell consome Products em runtime

## O que foi criado

O shell passou a registrar o producer `products` pelo seu `mf-manifest.json` e a renderizar `products/ProductApp` na rota `/products`. O carregamento usa `React.lazy` e `Suspense`, e uma Error Boundary local impede que uma falha do remote derrube as demais rotas. A URL aceita `PRODUCTS_REMOTE_URL` e usa `http://localhost:3001/mf-manifest.json` como fallback explícito.

## Por que foi criado

Esta etapa cria a primeira composição real do laboratório. A página continua pertencendo ao shell, mas uma parte da árvore React é obtida em runtime de outro build. Isso mantém separado o código produzido por Products e permite que o shell decida quando e onde renderizá-lo.

## Fluxo de execução

1. O usuário entra em `/products` no shell.
2. O React Router escolhe `ProductsRemoteRoute`.
3. `React.lazy` executa `import('products/ProductApp')`, e o runtime resolve o remote registrado.
4. O shell busca o manifest, o remote entry e os chunks necessários na porta 3001.
5. Após a inicialização do módulo, React renderiza `ProductApp` dentro da árvore existente do shell.
6. React e ReactDOM participam do share scope como singletons compatíveis. Essa negociação acontece durante a resolução e precisa terminar antes da renderização bem-sucedida.

O código remoto é buscado quando a rota é visitada pela primeira vez, não durante o carregamento inicial de Home. Depois disso, o navegador e o runtime podem reutilizar os recursos já carregados.

## Loading e isolamento de falha

`Suspense` mostra um estado de carregamento enquanto as Promises do chunk local e do módulo remoto estão pendentes. `ProductsRemoteModule.tsx` mantém a referência federada fora do módulo inicial do shell; assim, até a resolução que pode falhar acontece dentro da fronteira lazy da rota. Se a porta 3001 estiver desligada, o manifest ou os chunks não poderão ser obtidos; a Error Boundary mostra `Products indisponível` somente no conteúdo da rota. O header permanece montado, então Home e Account continuam acessíveis.

Uma Error Boundary global esconderia uma área maior do shell. Colocá-la ao redor da rota remota torna a fronteira de falha igual à fronteira de integração.

## Tipos remotos

O consumer não possui uma declaração manual. Durante o build, o plugin baixa o pacote de tipos gerado pelo producer para `@mf-types`, e o `paths` do TypeScript resolve somente a família `products/*` nessa pasta gerada. `@mf-types` não é versionada porque é um cache derivado do contrato publicado pelo producer. Esses tipos validam o uso durante o desenvolvimento; não provam em runtime que o servidor está disponível ou que seus arquivos foram publicados corretamente.

## Bootstrap assíncrono e shared

O `index.tsx` agora abre uma fronteira assíncrona e `bootstrap.tsx` contém `createRoot`. Isso dá ao runtime federado a oportunidade de inicializar o share scope antes de a aplicação consumir React. Shell e Products exigem React e ReactDOM `19.2.8` como singletons: eles negociam uma instância compatível para a árvore composta. A estratégia `loaded-first` evita consultar todos os remotes antes de montar o shell; Products participa da negociação quando sua rota o carrega. Assim, sua indisponibilidade não bloqueia Home. `shared` não importa `ProductApp`; quem resolve esse módulo é `remotes` junto do `import('products/ProductApp')`.

## Variável de ambiente

O Rsbuild lê `PRODUCTS_REMOTE_URL` na criação da configuração. O arquivo `.env.example` documenta o formato sem criar uma configuração local obrigatória. Um ambiente futuro pode fornecer a URL de seu próprio manifest; sem valor definido, o laboratório usa a porta 3001.

## Arquivos importantes

- `apps/shell-react/rsbuild.config.ts`: remote, URL configurável, shared e consumo de tipos.
- `apps/shell-react/src/App.tsx`: importação lazy e rota de Products.
- `apps/shell-react/src/ProductsRemoteModule.tsx`: chunk local que resolve o módulo federado assincronamente.
- `apps/shell-react/src/RemoteRouteErrorBoundary.tsx`: isolamento da falha do remote.
- `apps/shell-react/src/index.tsx`: entrada assíncrona.
- `apps/shell-react/src/bootstrap.tsx`: montagem React do shell.
- `apps/shell-react/tsconfig.json`: resolução dos tipos federados gerados.
- `docs/diagrams/07-products-runtime-flow.md`: sequência da composição.

## Comandos

```powershell
pnpm install
pnpm run dev:products
pnpm run dev:shell
pnpm run typecheck:products
pnpm run typecheck:shell
pnpm run build:products
pnpm run build:shell
```

Para experimentar outra origem no PowerShell:

```powershell
$env:PRODUCTS_REMOTE_URL = 'https://exemplo.local/mf-manifest.json'
pnpm run build:shell
```

## Como validar

Inicie Products e Shell. Em `http://localhost:3000/`, confirme Home; em `/products`, observe o loading e depois os dois produtos, o contador e `Remote version: products-v1`; em `/account`, confirme o placeholder existente. Pare Products, recarregue `/products` e verifique a mensagem de indisponibilidade. Em seguida navegue para Home e Account para confirmar que o shell continua funcionando.

## Erros comuns

- Importar o arquivo-fonte de Products por caminho relativo e acoplar os dois builds.
- Importar o bootstrap remoto, que tentaria criar uma nova raiz React.
- Tornar o import remoto síncrono e perder a fronteira explícita de loading.
- Colocar a Error Boundary ao redor de toda a aplicação e ampliar a área afetada.
- Configurar versões incompatíveis de React nos dois share scopes.
- Confundir tipos baixados em build com garantia de disponibilidade em runtime.

## Perguntas de revisão

1. Em qual interação o navegador começa a buscar o código de Products?
2. O que o usuário ainda consegue usar quando a porta 3001 está desligada, e por quê?
3. Qual é a diferença entre registrar `products` em `remotes` e compartilhar React em `shared`?

## Exercício manual

Com os dois apps abertos, use a aba Network do navegador, limpe os registros e recarregue Home. Depois navegue para `/products` e identifique a busca do manifest e dos chunks. Desligue Products, recarregue a rota e teste os links Home e Account.

## Explicação de entrevista em até 90 segundos

O shell é o consumer e Products é o producer. O shell registra a URL do manifest, mas só executa o import federado quando o router entra em `/products`. O runtime consulta os metadados, baixa os assets do outro servidor e negocia React e ReactDOM como singletons antes de React renderizar o componente na árvore do shell. `Suspense` cobre o tempo de carregamento, e uma Error Boundary limitada à rota impede que a indisponibilidade do remote derrube Home ou Account. O código de Products não foi copiado nem entrou antecipadamente no bundle do shell; somente seu contrato de tipos foi baixado para desenvolvimento.
