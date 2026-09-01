# Etapa 06 — Products como producer

## O que foi criado

Products passou a ser um producer de Module Federation 2 sem perder seu modo standalone. O container federado se chama `products`, expõe `./ProductApp`, emite o manifest e o remote entry e gera os tipos do módulo exposto. React e ReactDOM foram declarados no share scope como singletons.

## Por que foi criado

Esta é a primeira fronteira de entrega em runtime do laboratório. Até a etapa anterior, Products só entregava uma página completa. Agora seu build também descreve e disponibiliza um módulo que outro app poderá resolver sem importar o código-fonte nem navegar para outro documento.

## Fluxo de execução

### Standalone

1. O navegador abre `http://localhost:3001/`.
2. O entrypoint `index.tsx` cria uma fronteira assíncrona com `import('./bootstrap')`.
3. O runtime inicializa o share scope antes de o bootstrap consumir React.
4. `bootstrap.tsx` cria a raiz React e renderiza `ProductApp`.

### Producer

1. O build registra o container `products`.
2. `exposes` associa a chave pública `./ProductApp` ao arquivo `src/ProductApp.tsx`.
3. O plugin separa o módulo e seus assets em chunks consumíveis.
4. `mf-manifest.json` publica metadados estáveis sobre container, remote entry, exposes e shared.
5. O remote entry contém o protocolo executável usado pelo runtime para inicializar o container e solicitar o módulo exposto.

## Conceitos

### Producer

Producer é o build que oferece módulos para outros builds. Essa função nasce de `exposes`, não do fato de a aplicação estar em outra porta. Products agora é producer mesmo sem existir consumer configurado.

### `exposes`

`exposes` forma a superfície pública do remote. A chave `./ProductApp` vira o identificador que um consumer usará junto ao nome `products`; o valor aponta para a implementação local. Arquivos não listados continuam internos ao producer.

### Manifest

`mf-manifest.json` é um catálogo orientado ao runtime. Ele informa quem é o container, onde está o remote entry, quais módulos existem e quais assets e dependências compartilhadas participam de cada um. O consumer receberá esses metadados, não HTML pronto.

### Remote entry

`remoteEntry.js` é a entrada executável do container. Enquanto o manifest descreve os recursos, o remote entry implementa a negociação e fornece ao runtime acesso aos factories dos módulos solicitados.

### Share scope

O share scope é o espaço de negociação de dependências em runtime. React e ReactDOM usam `singleton: true` e exigem `19.2.8` porque hooks e reconciliação dependem de uma única instância compatível na árvore composta. A versão coincide com a dependência exata dos dois apps React. `shared` permite reutilizar dependências; não publica `ProductApp` e não substitui `exposes`.

### Por que o bootstrap não é exposto

O bootstrap pressupõe uma página standalone, procura `#root` e chama `createRoot`. Se o shell o consumisse, Products tentaria criar outra raiz e controlar um elemento que pertence ao host. O shell precisa do componente `ProductApp`, que pode entrar na árvore React já existente, e não da decisão standalone de montagem.

### Standalone e remote ao mesmo tempo

Os dois modos reutilizam o mesmo componente por caminhos diferentes. A página standalone chega por `index.tsx` e `bootstrap.tsx`; o consumer futuro solicitará diretamente `products/ProductApp`. Assim, Products pode ser desenvolvido isoladamente e também composto em outra experiência.

## Tipos federados

O plugin gera automaticamente `@mf-types.zip` e a API de tipos a partir de `ProductApp`. Não foi criada declaração manual de módulo e nenhum `any` foi usado. Na etapa de consumer, o plugin poderá buscar e descompactar esses tipos.

## Arquivos importantes

- `rsbuild.config.ts`: nome, exposes, manifest, shared e geração de tipos.
- `src/ProductApp.tsx`: módulo público do producer.
- `src/index.tsx`: entrada assíncrona standalone.
- `src/bootstrap.tsx`: montagem exclusiva do modo standalone.
- `dist/mf-manifest.json`: catálogo federado gerado.
- `dist/remoteEntry.js`: entrada executável do container.

## Comandos

```powershell
pnpm install
pnpm run typecheck:products
pnpm run build:products
pnpm run dev:products
```

## Como validar

Abra `http://localhost:3001/` e confirme que a SPA mostra `Remote version: products-v1`. Depois abra `http://localhost:3001/mf-manifest.json` e confira `name: products`, o expose `ProductApp` e o endereço do remote entry. No build, verifique também `dist/remoteEntry.js`, `dist/@mf-types.zip` e o chunk associado ao módulo exposto.

## Erros comuns

- Expor `bootstrap.tsx` e permitir que o consumer crie uma segunda raiz React.
- Confundir `shared` com a superfície pública definida por `exposes`.
- Usar entrada síncrona e consumir React antes da inicialização do share scope.
- Configurar React singleton sem alinhar a faixa de versão entre producer e consumer.
- Considerar o manifest como o código da interface; ele contém metadados para localizar os assets.

## Perguntas de revisão

1. Qual URL entrega os metadados do remote e qual artefato implementa o container?
2. Por que `ProductApp` é exposto, mas `bootstrap.tsx` não?
3. Qual é a diferença entre compartilhar React e expor um componente React?

## Exercício manual

Com Products rodando, abra o manifest e encontre a entrada de `./ProductApp`. Compare os arquivos listados ali com o conteúdo de `dist` após o build, sem alterar a configuração.

## Explicação de entrevista em até 90 segundos

Products é simultaneamente uma SPA standalone e um producer federado. `exposes` publica `ProductApp` como superfície modular, enquanto o bootstrap permanece privado porque cria a raiz exclusiva da página standalone. O manifest oferece metadados estáveis e aponta para o remote entry, que implementa o container carregável em runtime. React e ReactDOM são singletons no share scope para evitar runtimes incompatíveis na futura árvore comum. A entrada standalone é assíncrona para que essa negociação seja inicializada antes do consumo de React. O consumer receberá um módulo JavaScript tipado e seus assets, não HTML pronto.

