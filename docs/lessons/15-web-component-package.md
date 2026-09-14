# Etapa 15 — Web Component compartilhado entre React e Vue

## O que foi criado

Foi criado `packages/ui-web`, pacote privado `@mfe-lab/ui-web`, com exatamente um Custom Element nativo:

```html
<lab-status-chip label="UI Web: 1.0.0-lab" status="success"></lab-status-chip>
```

O pacote também exporta:

- `registerLabStatusChip`, para registro explícito e idempotente;
- `LabStatusChipElement`, classe do elemento;
- `LabStatus`, união `neutral | success | warning`;
- `UI_WEB_VERSION = '1.0.0-lab'`;
- uma entrada opcional `@mfe-lab/ui-web/react` para tipar o elemento no JSX.

O shell React usa o chip com status `success`. Account Vue usa o mesmo elemento com status `warning`. Products não foi alterado.

## Por que foi criado

`ui-react` mostrou reutilização entre aplicações React, mas não atravessa naturalmente a fronteira do Vue. Um Custom Element pertence à plataforma web: depois de registrado, o navegador reconhece sua tag, instancia a classe e executa seus callbacks.

React e Vue apenas colocam a tag no DOM. Nenhum framework precisa interpretar o componente interno do outro.

## Fluxo de execução

```text
packages/ui-web/src
├── LabStatusChip.ts ── Custom Element + Shadow DOM
├── index.ts ────────── API neutra e versão
└── react.ts ────────── tipagem opcional para JSX
          │
          ▼ Rslib build
dist/index.js + index.d.ts + react.js + react.d.ts
          │
          ▼ workspace:* / build dos consumidores
┌──────────────────────┬──────────────────────┐
│ shell-react          │ account-vue          │
│ JSX cria a tag       │ template cria a tag  │
└──────────┬───────────┴──────────┬───────────┘
           └──────────┬───────────┘
                      ▼
       navegador instancia <lab-status-chip>
                      ▼
        elemento controla seu Shadow DOM
```

1. O consumidor importa `registerLabStatusChip`.
2. O consumidor chama a função antes de renderizar a tag.
3. A função consulta `customElements.get('lab-status-chip')`.
4. Se ainda não existe definição, chama `customElements.define`.
5. React ou Vue insere `<lab-status-chip>` no documento.
6. O navegador cria `LabStatusChipElement` e chama `connectedCallback`.
7. Alterações em `label` ou `status` acionam `attributeChangedCallback`.
8. O elemento atualiza apenas o conteúdo dentro de seu Shadow DOM.

## Por que Web Components atravessam frameworks

Custom Elements, atributos, propriedades e Shadow DOM são APIs do navegador. A superfície pública não retorna React Elements nem VNodes do Vue:

```text
React ── escreve uma tag HTML ──┐
                               ├── navegador controla o Custom Element
Vue ──── escreve uma tag HTML ──┘
```

No React, a entrada `@mfe-lab/ui-web/react` amplia `React.JSX.IntrinsicElements` com tipos específicos para `label` e `status`. Ela não instala nem executa React dentro do Web Component.

No Vue, `isCustomElement` informa ao compilador que `lab-status-chip` é uma tag nativa personalizada, e não um componente Vue ausente. O mapa global `HTMLElementTagNameMap` mantém a classe do elemento conhecida pelo TypeScript.

Nenhuma tipagem usa `any`.

## Atributos e propriedades

O elemento possui a mesma superfície nos dois formatos:

```ts
chip.label = 'Publicação saudável';
chip.status = 'success';
```

```html
<lab-status-chip
  label="Publicação saudável"
  status="success"
></lab-status-chip>
```

Os setters de propriedade refletem os valores para os atributos. Um `status` desconhecido é apresentado como `neutral`, preservando um fallback previsível.

O texto é aplicado com `textContent`, sem interpretar HTML recebido em `label`.

## Registro explícito e idempotente

O navegador não permite definir duas vezes o mesmo nome no `CustomElementRegistry`. Como shell e Account podem levar o pacote em bundles diferentes para a mesma página, o registro consulta primeiro:

```ts
if (!customElements.get('lab-status-chip')) {
  customElements.define('lab-status-chip', LabStatusChipElement);
}
```

Assim, chamar `registerLabStatusChip()` novamente não causa uma exceção. A função é explícita: apenas importar o pacote não altera automaticamente o registry global.

## Shadow DOM e CSS variables

O componente cria um Shadow DOM aberto. Seletores externos como `.chip` não entram nele, e o seletor interno `.chip` não encontra elementos fora da fronteira.

```text
documento
└── <lab-status-chip>               ← recebe variáveis por herança
    └── #shadow-root
        ├── <style>                 ← seletores isolados
        └── <span class="chip">
```

Shadow DOM não bloqueia a herança de CSS Custom Properties. Por isso o estilo interno pode usar:

```css
color: var(--mfe-color-text, #0f172a);
```

O primeiro valor vem de `@mfe-lab/design-tokens`, carregado pelo consumidor. O segundo mantém o componente legível quando a variável não existe. O pacote não importa o CSS global automaticamente.

Shadow DOM reduz conflitos de seletores, mas não cria isolamento absoluto. Propriedades herdáveis, variáveis CSS, eventos compostos, fontes e APIs globais ainda atravessam ou influenciam a fronteira.

## Limites de DX, eventos, formulários e SSR

### Experiência de desenvolvimento

Frameworks oferecem props avançadas, slots, ferramentas de desenvolvimento e padrões próprios. Custom Elements exigem adapters de tipos e atenção à diferença entre atributo string e propriedade JavaScript.

### Eventos

Para publicar eventos próprios, o elemento precisa emitir `CustomEvent` com decisões explícitas sobre `bubbles` e `composed`. Eventos dentro do Shadow DOM não atravessam automaticamente todas as fronteiras.

### Formulários

Um Custom Element não se comporta automaticamente como `input`, `button` de submit ou controle validável. Integração completa com formulários exige APIs adicionais, como form-associated custom elements.

### SSR

Servidores não possuem necessariamente `window`, `document`, `HTMLElement` ou `customElements`. Um pacote mais amplo precisaria definir estratégia de import, hidratação e renderização no servidor. Este laboratório é composto por SPAs executadas no navegador.

## Quando preferir wrappers específicos por framework

Um wrapper React ou Vue costuma ser melhor quando o componente precisa de:

- integração idiomática com eventos e formulários;
- props complexas que não cabem bem em atributos;
- slots ou children com semântica do framework;
- Context, provide/inject ou outras APIs do ecossistema;
- experiência de tipagem e ferramentas mais natural para a equipe.

Uma base Web Component pode continuar existindo, com wrappers finos oferecendo a ergonomia de cada framework.

## Por que ainda é um pacote de build time

Ser independente de framework não torna `ui-web` um remote:

```text
ui-web muda
  ↓
consumidor instala ou resolve a mudança
  ↓
consumidor faz novo build
  ↓
novo deploy do consumidor
```

O pacote não possui servidor, manifest ou remote entry. Seu código entra no bundle do shell e de Account. Um app já compilado não recebe `UI_WEB_VERSION` nova apenas ao recarregar a página.

## Arquivos importantes

- `packages/ui-web/src/LabStatusChip.ts`: classe, Shadow DOM, atributos, propriedades e registro.
- `packages/ui-web/src/index.ts`: API neutra e versão.
- `packages/ui-web/src/react.ts`: contrato opcional para JSX React.
- `packages/ui-web/rslib.config.ts`: build web com entradas neutra e React.
- `apps/shell-react/src/App.tsx`: uso em JSX.
- `apps/account-vue/src/AccountApp.vue`: uso no template Vue.
- `apps/account-vue/rsbuild.config.ts`: reconhecimento da tag pelo compilador Vue.

## Comandos

```powershell
pnpm install
pnpm run build:ui-web
pnpm run typecheck:ui-web
pnpm run typecheck
pnpm run build
pnpm run check
pnpm run dev
```

## Como validar

1. Execute `pnpm run build:ui-web`.
2. Confirme `dist/index.js`, `index.d.ts`, `react.js` e `react.d.ts`.
3. Execute `pnpm run check`.
4. Inicie os apps com `pnpm run dev`.
5. Abra o shell em `http://localhost:3000` e procure `UI Web: 1.0.0-lab`.
6. Acesse `/account` e confirme outro chip com a mesma versão dentro do remote Vue.
7. Abra Account standalone em `http://localhost:3002` e confirme o mesmo elemento.
8. No DevTools, inspecione `lab-status-chip` e abra seu `#shadow-root`.
9. Altere temporariamente uma variável `--mfe-*` no host e observe o estilo interno reagir.

## Erros comuns

- Executar `customElements.define` duas vezes sem consultar o registry.
- Acreditar que Shadow DOM bloqueia CSS variables herdadas.
- Usar `innerHTML` para renderizar o texto fornecido pelo consumidor.
- Fazer o pacote neutro executar React ou Vue em runtime.
- Esquecer de configurar o Vue para reconhecer a tag personalizada.
- Declarar a tag JSX com `any` ou aceitar qualquer status string.
- Confundir um componente multiplataforma de build time com um remote.
- Presumir que elementos personalizados funcionam em SSR sem estratégia adicional.

## Perguntas de revisão

1. O Web Component é renderizado por React ou pelo navegador?
2. Por que ele funciona em Vue?
3. Shadow DOM impede o uso de CSS variables externas?

Pergunta adicional do experimento: uma nova versão aparece sem rebuild do app consumidor?

## Exercício manual

Abra o shell e altere no DevTools a variável `--mfe-color-accent` no elemento `html`. Observe o ponto e a borda do chip `success` mudarem dentro do Shadow DOM. Depois remova a variável e confirme que o fallback mantém o componente legível.

## Explicação de entrevista em até 90 segundos

Criamos um Web Component nativo chamado `lab-status-chip`, distribuído como pacote de build time. React e Vue conseguem usá-lo porque ambos apenas inserem uma tag personalizada, enquanto o navegador instancia a classe registrada. O registro é explícito e idempotente para evitar erro quando bundles diferentes tentam definir a mesma tag. O componente observa `label` e `status`, mantém atributos e propriedades alinhados e controla seu DOM interno com Shadow DOM. Os seletores ficam isolados, mas CSS variables continuam atravessando a fronteira por herança, permitindo usar design tokens com fallbacks. Fornecemos uma ampliação de tipos específica para JSX e configuramos o compilador Vue sem usar `any`. Ainda não é um micro frontend nem um remote: uma atualização exige que os consumidores adotem o pacote, façam build e deploy novamente.
