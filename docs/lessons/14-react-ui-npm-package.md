# Etapa 14 — Biblioteca de UI React em build time

## O que foi criado

Foi criado `packages/ui-react`, pacote privado `@mfe-lab/ui-react` consumido por `shell-react` e `products-react` com `workspace:*`.

A superfície pública contém somente:

- `LabButton`;
- `AppBoundaryLabel`;
- tipos das props;
- `UI_REACT_VERSION = '1.0.0-lab'`.

Products substituiu os botões `Adicionar` e sua marca de ownership. O shell substituiu a marca `SHELL · REACT` e o botão de retry do Account. O app Vue não foi alterado e não depende da biblioteca React.

## Por que foi criado

Design tokens compartilharam valores visuais, mas cada app React ainda repetia a estrutura e as regras do botão e da etiqueta de fronteira. A biblioteca mostra outro nível de reutilização: componentes React pequenos, tipados e distribuídos como pacote de build time.

Isso não transforma a biblioteca em micro frontend. Ela não possui aplicação própria, responsabilidade de negócio, servidor, manifest ou deploy independente.

## Fluxo de execução

```text
packages/ui-react/src
├── LabButton.tsx
├── AppBoundaryLabel.tsx
├── styles.css ── usa design tokens
└── index.ts
       │
       ▼ Rslib build
dist/index.js + index.d.ts + index.css
       │
       ▼ pnpm workspace:*
┌──────────────────────┐
│ shell-react          │
│ products-react       │
└──────────────────────┘
       │
       ▼ build de cada consumidor
componentes entram nos bundles dos apps
```

1. `pnpm install` liga os consumidores ao pacote local.
2. A raiz builda design tokens e depois `ui-react`.
3. Rslib compila TSX, gera DTS e extrai o CSS.
4. React e ReactDOM permanecem externos ao artefato.
5. Shell e Products importam os componentes e o CSS público.
6. O build de cada app inclui o código da biblioteca que ele usa.

## `dependencies`, `devDependencies` e `peerDependencies`

### `dependencies`

São dependências que fazem parte do funcionamento publicado do pacote. `ui-react` declara `@mfe-lab/design-tokens` porque seus estilos usam a superfície CSS desse pacote.

### `devDependencies`

São ferramentas e pacotes usados para desenvolver, tipar e construir a biblioteca: Rslib, plugin React, TypeScript, tipos e versões locais de React/ReactDOM. Dependências de desenvolvimento do pacote não são a promessa de runtime feita ao consumidor.

React aparece também em `devDependencies` para que a própria biblioteca consiga fazer typecheck e build isoladamente.

### `peerDependencies`

São requisitos que o consumidor deve fornecer no ambiente final. A biblioteca declara React e ReactDOM compatíveis com a linha 19:

```json
{
  "react": ">=19.0.0 <20",
  "react-dom": ">=19.0.0 <20"
}
```

Isso diz: “eu fui construída para esta família de React, mas usarei a instância que existe no app consumidor”.

## Por que React não deve ser duplicado

Se a biblioteca embutisse uma cópia própria, o app poderia carregar duas instâncias:

```text
Shell ───────────── React A
ui-react embutida ─ React B
```

Isso aumenta o bundle e pode separar Contexts, identidade de elementos e execução de Hooks. Em cenários reais, duplicação pode produzir erros como chamada inválida de Hook.

Rslib externaliza `react`, `react-dom` e seus subpaths. O build final de `ui-react` mantém um import de `react/jsx-runtime`; não contém a implementação do React.

Essa decisão de pacote é diferente do `shared` de Module Federation. `peerDependencies` descreve instalação e compatibilidade da biblioteca; `shared` negocia módulos entre containers federados em runtime.

## Props e acessibilidade

`LabButton` mantém uma superfície pequena:

- `children` obrigatório fornece conteúdo e nome acessível;
- `type` aceita apenas tipos nativos e assume `button`, evitando submit acidental;
- `disabled` usa o comportamento nativo;
- `onClick` recebe o tipo correto de evento React;
- `className` permite extensão controlada pelo consumidor.

O componente renderiza um `<button>` real e possui foco visível. Não imita botão com `div`, portanto preserva teclado, semântica e estado disabled do navegador.

`AppBoundaryLabel` recebe apenas `label` e `className` opcional. Ele serve para evidenciar ownership, sem incorporar regra de negócio.

## Por que Vue não consome naturalmente o componente React

Um componente React retorna elementos entendidos pelo reconciliador React. Um template Vue produz VNodes e é controlado pelo lifecycle Vue. Apesar de ambos criarem DOM, seus componentes não são intercambiáveis diretamente.

Para usar `LabButton` no Vue seria necessário montar uma árvore React dentro de um container, criar um wrapper específico ou distribuir a interface por um padrão neutro como Web Component. Nenhuma dessas adaptações foi feita nesta etapa.

## Atualização da biblioteca

`ui-react` entra nos consumidores durante o build:

```text
lib muda
  ↓
nova versão ou novo conteúdo workspace
  ↓
consumidor instala/resolve a mudança
  ↓
consumidor executa novo build
  ↓
consumidor faz deploy
```

Um shell já compilado não recebe `UI_REACT_VERSION` nova sozinho. O mesmo vale para Products: cada consumidor precisa adotar e recompilar a biblioteca.

## `ui-react` versus `ProductApp` remoto

| Característica | `@mfe-lab/ui-react` | `products/ProductApp` |
| --- | --- | --- |
| Distribuição atual | pacote `workspace:*` | Module Federation |
| Momento de resolução | install/build | runtime |
| Artefato de descoberta | `package.json`/`exports` | `mf-manifest.json` |
| Deploy independente | não | sim |
| Responsabilidade | peças visuais pequenas | domínio e interface de Products |
| Atualização no shell | exige rebuild do shell | pode exigir apenas deploy do remote |

## Estilos e design tokens

`ui-react` exporta `styles.css`, produzido pelo Rslib. Os seletores possuem prefixo `mfe-lab-ui-*` e usam somente os valores de `@mfe-lab/design-tokens`.

O botão possui cor, espaçamento, raio, estado disabled e foco visível. O label usa a cor de destaque compartilhada. Nenhuma dependência visual externa foi adicionada.

## Arquivos importantes

- `packages/ui-react/src/LabButton.tsx`: botão nativo e props tipadas.
- `packages/ui-react/src/AppBoundaryLabel.tsx`: label de ownership.
- `packages/ui-react/src/index.ts`: exports explícitos e versão.
- `packages/ui-react/src/styles.css`: estilos baseados em tokens.
- `packages/ui-react/package.json`: exports e categorias de dependência.
- `packages/ui-react/rslib.config.ts`: React plugin, alvo web e externals.
- `apps/products-react/src/ProductApp.tsx`: consumo dos dois componentes.
- `apps/shell-react/src/App.tsx`: consumo do label e da versão.
- `apps/shell-react/src/VueRemoteRoute.tsx`: consumo do botão de retry.

## Comandos

```powershell
pnpm install
pnpm run build:design-tokens
pnpm run build:ui-react
pnpm run typecheck:ui-react
pnpm run typecheck
pnpm run build
pnpm run check
```

## Como validar

1. Execute `pnpm run build:ui-react`.
2. Confirme `dist/index.js`, `dist/index.d.ts` e `dist/index.css`.
3. Abra `dist/index.js` e verifique que React aparece apenas como import externo.
4. Execute `pnpm run dev` e abra o shell em `http://localhost:3000`.
5. Confirme `UI React: 1.0.0-lab` no shell e em Products.
6. Clique em `Adicionar` e confirme que contador e evento continuam funcionando.
7. Abra Products standalone na porta 3001 e repita o clique.
8. Confirme que Account Vue não mostra versão de `ui-react` nem possui a dependência.
9. Execute `pnpm run check`.

## Erros comuns

- Colocar React em `dependencies` e empacotar outra cópia no artefato.
- Externalizar apenas `react` e esquecer `react/jsx-runtime`.
- Adicionar `ui-react` ao `shared` de Module Federation sem necessidade.
- Acreditar que o pacote possui deploy independente como um remote.
- Fazer Account Vue importar um componente React diretamente.
- Criar componentes adicionais antes de existir uso real.
- Usar uma `div` clicável no lugar de um botão nativo.
- Importar a biblioteca apenas no bootstrap standalone e quebrar o remote.

## Perguntas de revisão

1. Por que React está em `peerDependencies`?
2. Por que `ui-react` não é um micro frontend?
3. O que precisa acontecer para o shell receber uma nova versão da biblioteca?

## Exercício manual

Altere temporariamente `UI_REACT_VERSION` para `1.0.1-lab` e execute somente o build da biblioteca. Recarregue o shell já aberto e observe que seu bundle não muda automaticamente. Depois faça o build do shell e compare. Ao terminar, restaure `1.0.0-lab`.

## Explicação de entrevista em até 90 segundos

Criamos uma biblioteca React distribuída como pacote de build time, com apenas um botão e um label de ownership. React e ReactDOM são peer dependencies porque a biblioteca precisa usar a instância fornecida pelo consumidor, evitando duplicação, problemas de Hooks e Context e aumento do bundle. Rslib compila TSX, gera DTS e CSS, mas mantém React externo. Shell e Products adotam a biblioteca via workspace e precisam de novo build para receber atualizações. Isso é diferente de Products como remote: o remote tem manifest, domínio e deploy próprio e é carregado em runtime. Vue não consome naturalmente esses componentes porque seu sistema de VNodes e lifecycle não é o reconciliador React.

## Referências oficiais consultadas

- [Bibliotecas React com Rslib](https://rslib.rs/guide/solution/react)
- [Dependências de terceiros no Rslib](https://rslib.rs/guide/advanced/third-party-deps)
