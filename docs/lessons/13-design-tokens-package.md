# Etapa 13 — Pacote compartilhado de design tokens

## O que foi criado

Foi criado `packages/design-tokens`, publicado internamente no workspace como `@mfe-lab/design-tokens`. O pacote gera:

- `dist/tokens.css`, com variáveis de cor, espaçamento, raio e fonte;
- `dist/index.js`, com `DESIGN_TOKENS_VERSION = '1.0.0-lab'`;
- declarações TypeScript para a constante pública.

Shell, Products e Account consomem o pacote com `workspace:*`. Os três exibem a versão didática e usam a mesma base de valores, mas continuam responsáveis por seus próprios seletores e layouts.

## Por que foi criado

Antes desta etapa, os apps repetiam valores como `system-ui`, `#cbd5e1`, `1rem` e `1.5rem`. Eles pareciam relacionados visualmente apenas porque copiamos números e cores.

Design tokens dão nomes semânticos a essas decisões:

```css
border-color: var(--mfe-color-border);
padding: var(--mfe-space-3);
font-family: var(--mfe-font-family);
```

O contrato visual fica compartilhado, enquanto cada MFE continua definindo onde e como aplicar os valores.

## Fluxo de execução

```text
packages/design-tokens/src
├── tokens.css ────── Rslib ──────► dist/tokens.css
└── index.ts ──────── Rslib ──────► dist/index.js + index.d.ts
                                          │
                         pnpm workspace:* │
                 ┌────────────────────────┼───────────────────────┐
                 ▼                        ▼                       ▼
           shell-react              products-react           account-vue
           CSS Module               CSS Module               scoped CSS
```

1. O pnpm liga os três apps ao pacote local.
2. A raiz builda `design-tokens` antes dos consumidores.
3. Cada app importa `@mfe-lab/design-tokens/tokens.css` durante seu próprio build.
4. Rsbuild incorpora esse CSS ao artefato do app ou remote consumidor.
5. No navegador, `:root` disponibiliza as propriedades `--mfe-*`.
6. CSS Module e `scoped` continuam aplicando seletores locais que leem essas propriedades.

## Por que React e Vue podem consumir o mesmo CSS

Variáveis CSS pertencem à plataforma web, não ao React ou Vue. Depois que o navegador recebe:

```css
:root {
  --mfe-color-accent: #2563eb;
}
```

qualquer regra CSS no mesmo documento pode usar `var(--mfe-color-accent)`. React e Vue apenas ajudam a construir o DOM; quem interpreta a variável é o navegador.

O pacote não exporta hooks, componentes, diretivas ou plugins. Sua única dependência conceitual é CSS padrão, portanto ele é framework-agnostic.

## Por que isso não exige Module Federation

`@mfe-lab/design-tokens` é uma dependência de build time:

```text
pnpm install → workspace link → build do pacote → build do app
```

Não existe `mf-manifest.json`, `remoteEntry.js`, container, `exposes` ou busca dinâmica do pacote no navegador. Cada app inclui a versão de tokens que conhecia quando foi compilado.

Module Federation continua sendo usado para carregar `ProductApp` e `account/mount` em runtime. Compartilhar um pacote npm/workspace e carregar um remote são decisões diferentes.

## Build time versus runtime

```text
DESIGN TOKENS
fonte muda → pacote builda → consumidor builda → novo artefato é implantado

REMOTE FEDERADO
remote muda → remote builda e é implantado → shell pode carregá-lo sem rebuild
```

Mudar um token publicado não atualiza automaticamente um remote já compilado. Products e Account precisam instalar ou resolver a nova versão, rebuildar e fazer deploy.

Se somente Products adotar outra versão, seu CSS remoto poderá declarar valores `:root` diferentes dos usados pelo shell. Como tokens são globais, ordem de carregamento e cascata podem fazer uma versão sobrescrever outra. Esse é um motivo para evoluir tokens com compatibilidade e coordenação.

## Tokens versus componentes

Tokens são valores e decisões básicas:

- cor de destaque;
- tamanho de espaçamento;
- raio de borda;
- família tipográfica.

Um componente contém estrutura e comportamento, como um botão React com props e eventos. Nesta etapa não criamos componentes compartilhados.

```text
Token:      --mfe-radius-medium: 0.5rem
Componente: <ProductCard produto={produto} />
```

O pacote pode ser usado por React e Vue porque não decide a marcação HTML nem o lifecycle de nenhum framework.

## CSS global e isolamento local

O pacote possui somente `:root` e propriedades customizadas. Ele não contém seletores como `button`, `.card` ou `h1`; esses continuam nos apps.

- Shell e Products mantêm CSS Modules.
- Account mantém `<style scoped>`.
- Os tokens são globais por intenção, pois formam o vocabulário visual comum.
- As regras dos componentes permanecem locais para reduzir conflitos.

`scoped` e CSS Modules não isolam o valor de uma variável global. Um novo valor em `:root` ainda pode afetar todos os consumidores que usam o mesmo nome.

## Versão didática

Os três apps usam e exibem `DESIGN_TOKENS_VERSION`. Isso dá uso real ao módulo TypeScript sem criar um objeto JavaScript duplicando todas as variáveis CSS.

Em um sistema real, a versão do pacote também existe no `package.json`; a constante visível é apenas um recurso do laboratório para tornar o compartilhamento fácil de observar.

## Detalhes do build do CSS

Rslib usa alvo `node` por padrão. Como esta biblioteca precisa processar CSS, configuramos `output.target: 'web'`. O import de CSS também foi marcado em `sideEffects` com `**/*.css`.

Sem essa marcação, o bundler eliminou o import porque o módulo TypeScript `tokens.ts` não exporta valores. Esse teste provou que CSS é um efeito colateral: sua finalidade é registrar regras no documento, não retornar uma função.

`styles.d.ts` declara apenas a existência dos módulos `.css`, exigência do TypeScript para o import lateral. Não usa `any` e não descreve classes, porque `tokens.css` não é um CSS Module.

## Vantagens e riscos de versionar tokens

Vantagens:

- consumidores adotam mudanças de maneira controlada;
- builds são reproduzíveis;
- rollback pode restaurar a versão anterior;
- mudanças visuais ganham histórico e revisão.

Riscos:

- versões diferentes podem gerar inconsistência visual;
- renomear ou remover uma variável quebra consumidores;
- alterações de contraste ou espaçamento podem afetar acessibilidade e layout;
- variáveis globais com o mesmo nome obedecem à cascata e à ordem de carregamento;
- uma mudança aparentemente pequena pode atingir muitos componentes.

## Arquivos importantes

- `packages/design-tokens/src/tokens.css`: fonte das propriedades `--mfe-*`.
- `packages/design-tokens/src/index.ts`: versão didática pública.
- `packages/design-tokens/src/tokens.ts`: entrada que leva o CSS ao build.
- `packages/design-tokens/src/styles.d.ts`: declaração do import CSS lateral.
- `packages/design-tokens/package.json`: exports, `workspace` package e efeitos colaterais.
- `packages/design-tokens/rslib.config.ts`: build ESM/DTS com alvo web.
- `apps/shell-react/src/App.module.css`: aplicação local no shell.
- `apps/products-react/src/ProductApp.module.css`: aplicação local em Products.
- `apps/account-vue/src/AccountApp.vue`: aplicação local no estilo `scoped`.
- `package.json`: build do pacote antes dos apps.

## Comandos

```powershell
pnpm install
pnpm run build:design-tokens
pnpm run typecheck:design-tokens
pnpm run typecheck
pnpm run build
pnpm run check
```

## Como validar

1. Execute `pnpm run build:design-tokens`.
2. Confirme a existência de `packages/design-tokens/dist/tokens.css` e `dist/index.d.ts`.
3. Execute `pnpm run dev` e abra o shell em `http://localhost:3000`.
4. Confirme `Design tokens: 1.0.0-lab` no shell, Products e Account.
5. Verifique que os três ownerships usam a mesma cor de destaque e que cards usam borda, raio e espaçamentos da base.
6. Abra Products e Account nas portas 3001 e 3002 e confirme que continuam estilizados em modo standalone.
7. Execute `pnpm run check`.

## Erros comuns

- Colocar seletores de componentes dentro do pacote de tokens.
- Criar um objeto TypeScript duplicando todas as variáveis sem uso real.
- Importar o CSS apenas no bootstrap standalone e esquecer que o componente remoto também precisa dele.
- Supor que alterar o pacote atualiza apps já compilados.
- Transformar tokens em remote de Module Federation sem necessidade.
- Remover uma variável global sem coordenar os consumidores.
- Esquecer que a cascata pode resolver duas versões do mesmo token pela ordem de carregamento.
- Marcar todo o pacote como livre de efeitos colaterais e permitir que o bundler elimine o CSS.

## Perguntas de revisão

1. Por que este pacote funciona nos dois frameworks?
2. Mudar um token publicado atualiza o remote automaticamente?
3. Qual parte continua específica de React ou Vue?

## Exercício manual

Altere temporariamente `--mfe-color-accent` em `packages/design-tokens/src/tokens.css`. Rebuild o pacote e os apps, observe Shell, Products e Account e depois restaure o valor. Identifique quais regras continuam específicas de cada app mesmo quando todos recebem a nova cor.

## Explicação de entrevista em até 90 segundos

Criamos um pacote framework-agnostic de design tokens consumido por `workspace:*`. Ele exporta propriedades CSS globais para cores, espaçamentos, raios e tipografia, além de uma constante de versão usada pelos três apps. Rslib gera o CSS e as declarações TypeScript antes dos builds consumidores. React e Vue conseguem usar a mesma base porque variáveis CSS pertencem ao navegador, enquanto os seletores permanecem locais em CSS Modules ou estilos `scoped`. Isso é compartilhamento em build time, não Module Federation: mudar o pacote não altera um remote já compilado. Versionar tokens melhora consistência e rollback, mas versões divergentes e a cascata global podem causar conflitos, então nomes e mudanças precisam de compatibilidade.

## Referências oficiais consultadas

- [CSS no Rslib](https://rslib.rs/guide/advanced/css)
- [Configuração de output do Rslib](https://rslib.rs/config/rsbuild/output)
