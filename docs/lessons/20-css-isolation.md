# Etapa 20 — Isolamento de CSS

## O que foi criado

As três aplicações passaram a usar deliberadamente a mesma classe-fonte `.title` por mecanismos locais diferentes:

- Shell e Products usam CSS Modules;
- Account usa `<style scoped>` do Vue;
- `ui-web` continua usando Shadow DOM;
- as raízes possuem `data-mfe-owner` estável para inspeção no DevTools;
- Products e Account deixaram de definir `font-family` e passaram a herdar a fonte do Shell;
- o experimento registra uma colisão global real e sua restauração.

Não foi deixado nenhum seletor global genérico nos remotes.

## Por que foi criado

Module Federation resolve descoberta, carregamento e compartilhamento de módulos JavaScript. Ele não cria uma barreira CSS entre host e remotes. Como todos participam do mesmo documento, uma regra global carregada por qualquer um pode encontrar elementos dos demais.

A documentação oficial de Module Federation confirma que host e remotes compartilham um único escopo CSS global e recomenda escolher o isolamento no producer, por exemplo CSS Modules, prefixos, Vue scoped ou Shadow DOM.

## Fluxo de execução

```text
Shell carrega seu CSS
  ↓
usuário entra em /products
  ↓
runtime baixa JavaScript e CSS de Products
  ↓
navegador adiciona a folha ao mesmo documento
  ├── seletor global genérico → pode encontrar Shell e outros remotes
  └── seletor transformado/local → encontra somente sua fronteira planejada
```

Trocar de rota via React Router não recarrega a página. Uma folha carregada pode permanecer no documento, portanto não se deve depender da saída da rota para desfazer poluição global.

## Escopo CSS global da página

CSS comum é avaliado pelo navegador contra o documento inteiro. A origem do arquivo — Shell, Products ou Account — não limita o alcance do seletor.

```css
.title {
  color: red;
}
```

Essa regra não significa “títulos de Products”. Significa “qualquer elemento da página atual que possua a classe literal `title`”. Ordem de carregamento, especificidade e `!important` decidem qual declaração vence.

No laboratório, o escopo global intencional contém:

- o pequeno reset de `body` pertencente ao Shell;
- os design tokens em `:root`;
- classes prefixadas da biblioteca compartilhada `ui-react`.

A última é uma exceção controlada: seus seletores começam com `mfe-lab-ui-`, não usam nomes genéricos e pertencem ao contrato público da biblioteca.

## CSS Modules

Shell e Products podem escrever o mesmo nome local:

```css
.title {
  margin-bottom: var(--mfe-space-2);
}
```

Cada build transforma esse identificador em um nome diferente e o objeto importado entrega a correspondência ao componente:

```tsx
<h1 className={styles.title}>...</h1>
```

CSS Modules reduz colisões de classes, mas não isola tudo:

- seletores declarados explicitamente como globais continuam globais;
- `body`, `:root`, tags e regras importadas fora do module continuam compartilhados;
- herança, variáveis CSS, fontes, animações e nomes globais ainda precisam de política;
- a classe gerada é detalhe de build, não contrato para outro app consultar.

## Vue `scoped`

O compilador Vue mantém a classe legível e acrescenta um atributo ao elemento e ao seletor:

```text
<h1 class="title" data-v-5293e359>

.title[data-v-5293e359] { ... }
```

Isso limita a regra ao componente, mas não cria outra árvore DOM. Uma regra global externa como `h1`, `.title` ou `[data-algo]` ainda pode encontrar esse elemento. Herança e custom properties também continuam atravessando a fronteira. Seletores `:deep()` e `:global()` podem ampliar deliberadamente o alcance.

O hash `data-v-...` pode mudar; o Shell não deve depender dele.

## Shadow DOM

O Web Component `lab-status-chip` cria uma árvore separada:

```text
<lab-status-chip>
  #shadow-root
    <style>...</style>
    <span class="chip">...</span>
```

Seletores globais do documento não entram normalmente para encontrar `.chip`, e seletores internos não escapam para a página. Isso é uma barreira estrutural mais forte do que reescrever seletores.

Mesmo assim, Shadow DOM não é isolamento absoluto:

- propriedades herdáveis e CSS Custom Properties podem atravessar pelo host;
- o próprio `<lab-status-chip>` pode ser estilizado externamente;
- eventos, slots, fontes e APIs globais exigem decisões explícitas;
- bibliotecas e formulários podem precisar de adapters;
- debugging e theming ficam mais sofisticados.

O laboratório usa justamente as custom properties dos design tokens para permitir tema controlado dentro do chip.

## Prefixos e namespaces

Quando uma classe precisa ser global, um prefixo reduz a chance de colisão:

```css
.mfe-lab-ui-button { ... }
.mfe-lab-ui-boundary-label { ... }
```

Isso é usado por `ui-react`. Prefixos são convenção, não barreira técnica. Eles dependem de disciplina, podem ser esquecidos e não impedem seletores globais de tags ou herança.

Os atributos de ownership ajudam a localizar fronteiras sem virar seletor de estilo compartilhado:

```html
<div data-mfe-owner="shell-react">
<main data-mfe-owner="products-react">
<main data-mfe-owner="account-vue">
```

Eles são úteis para debug, automação e observação do DOM, mas não isolam CSS sozinhos.

## Fonte e `body`

Quando os remotes estão compostos, o Shell é dono do documento e do `body`. Products e Account não redefinem `body` nem `font-family`; herdam a fonte do ambiente no qual foram montados.

Em modo standalone, continuam legíveis com o padrão do navegador e com seus tokens. Um remote que redefine globalmente `body` poderia alterar fundo, margem e tipografia do Shell inteiro assim que fosse carregado.

## Design tokens globais

Tokens ficam em `:root` por intenção. Eles formam um vocabulário comum:

```css
--mfe-color-accent
--mfe-space-3
--mfe-font-family
```

CSS Modules, Vue scoped e Shadow DOM podem consumir esses valores. Essa abertura também é um risco: duas versões do pacote podem declarar o mesmo token, e a cascata decidirá qual valor vence. Nomes, compatibilidade e ordem de carregamento continuam importantes.

## Arquivos importantes

- `apps/shell-react/src/App.module.css`: estilos locais do Shell e `.title` transformada.
- `apps/shell-react/src/global.css`: reset mínimo e propriedade do `body`.
- `apps/products-react/src/ProductApp.module.css`: estilos locais do remote React.
- `apps/account-vue/src/AccountApp.vue`: estilos scoped do remote Vue.
- `packages/design-tokens/src/tokens.css`: contrato global intencional.
- `packages/ui-react/src/styles.css`: namespace global controlado da biblioteca.
- `packages/ui-web/src/LabStatusChip.ts`: estilos dentro do Shadow DOM.
- `docs/experiments/06-css-collision.md`: reprodução e restauração da colisão.

## Comandos

```powershell
pnpm run typecheck
pnpm run build
pnpm run check
pnpm run dev
rg -n "\.title|body|:root" apps packages -g "*.css" -g "*.vue"
```

## Como validar

1. Abra Home, Products e Account no Shell.
2. Confirme as três marcas de ownership.
3. Inspecione as raízes e encontre os três valores `data-mfe-owner`.
4. Compare as classes geradas para `.title` no Shell e Products.
5. Em Account, encontre a classe `title` acompanhada de `data-v-...`.
6. Confirme que Products e Account calculam a mesma fonte herdada do `body`.
7. Abra o `shadowRoot` de `lab-status-chip`.
8. Execute o roteiro controlado de colisão e restaure o código.
9. Execute `pnpm run check`.

## Erros comuns

- Acreditar que Module Federation isola automaticamente folhas CSS.
- Criar classes globais genéricas como `.title`, `.button` ou `.card` num remote.
- Fazer um remote redefinir `body`, `html` ou fontes globais.
- Tratar CSS Modules como isolamento de herança e custom properties.
- Tratar Vue scoped como Shadow DOM real.
- Acreditar que Shadow DOM bloqueia tokens CSS herdáveis.
- Consultar hashes de classes ou `data-v-...` como contrato público.
- Usar `!important` para disputar especificidade entre equipes.
- Transformar `data-mfe-owner` em desculpa para escrever seletores globais profundos.
- Publicar versões incompatíveis dos mesmos tokens globais.

## Perguntas de revisão

1. Por que uma folha carregada por Products consegue alterar um elemento do Shell?
2. Qual diferença estrutural existe entre Vue scoped e Shadow DOM?
3. Quais estilos permanecem globais intencionalmente no laboratório?

## Exercício manual

Abra as três rotas e inspecione os títulos. Encontre o hash da classe no Shell, o hash diferente em Products e o atributo `data-v-...` em Account. Depois explique por que os três fontes usam `.title` sem criar a colisão demonstrada no experimento.

## Explicação de entrevista em até 90 segundos

Module Federation não isola CSS: host e remotes compartilham o mesmo documento, então uma regra global de Products pode alterar o Shell e continuar ativa após a troca de rota. No laboratório, Shell e Products usam CSS Modules, que geram classes diferentes por build. Account usa Vue scoped, que combina o seletor com um atributo `data-v`, mas continua na mesma árvore e ainda recebe regras globais e herança. O Web Component usa Shadow DOM, uma barreira estrutural mais forte, embora tokens e propriedades herdáveis ainda atravessem pelo host. Deixamos global apenas o reset do Shell, design tokens e uma biblioteca com namespace explícito. As raízes têm `data-mfe-owner` para debug. Assim, cada producer trata seus estilos localmente sem supor que Module Federation fará isso.

## Referências oficiais consultadas

- [Module Federation: Style Isolation](https://module-federation.io/guide/basic/css-isolate.html)
- [Vue: SFC CSS Features](https://vuejs.org/api/sfc-css-features)
- [MDN: Using shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)

