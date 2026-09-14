# Experimento 06 — Colisão de CSS entre Shell e remote

## Objetivo

Demonstrar que o CSS carregado por um remote participa da mesma página do Shell e que um seletor global genérico pode continuar afetando a aplicação mesmo depois de sair da rota remota.

O nome escolhido foi `.title`, comum o bastante para ser criado independentemente por equipes diferentes.

## Estado inicial

No estado correto, Shell e Products possuem uma classe `.title` em arquivos diferentes de CSS Module:

```text
apps/shell-react/src/App.module.css
apps/products-react/src/ProductApp.module.css
```

Account também usa `.title`, mas dentro de `<style scoped>`. Essas três classes-fonte iguais não colidem porque recebem mecanismos locais durante o build.

## Demonstração controlada

As alterações abaixo são temporárias e não devem ser commitadas.

### 1. Tornar o título do Shell globalmente encontrável

Adicione temporariamente a classe literal `title` junto da classe do CSS Module:

```tsx
<h1 className={`${styles.title} title`}>Home</h1>
```

### 2. Criar uma regra global no remote Products

Crie temporariamente `apps/products-react/src/collision-demo.css`:

```css
.title {
  color: #b91c1c !important;
  font-size: 3rem !important;
}
```

Importe o arquivo em `ProductApp.tsx`:

```ts
import './collision-demo.css';
```

### 3. Observar a poluição

1. Abra `http://localhost:3000/` antes de entrar em Products.
2. Observe o título Home.
3. Entre em `/products` para carregar o remote e seu CSS.
4. Volte para Home sem recarregar o documento.
5. Inspecione novamente o título.

## Resultado observado

Antes de Products:

```text
Home
color: rgb(15, 23, 42)
font-size: 32px
```

Depois de carregar Products e voltar:

```text
Home
color: rgb(185, 28, 28)
font-size: 48px
```

O React Router trocou a rota, mas não criou outro documento. A folha global carregada pelo remote continuou no `<head>` e sua `.title` encontrou a classe literal do Shell.

## Restauração obrigatória

1. Remova o import de `collision-demo.css`.
2. Exclua `collision-demo.css`.
3. Volte o título para somente `className={styles.title}`.
4. Recarregue a página e confirme a cor e o tamanho originais.
5. Execute `pnpm run check`.

O repositório foi deixado nesse estado corrigido; a colisão existe somente nesta receita documental.

## Estado final observado

Os nomes abaixo são exemplos gerados no ambiente da etapa e podem mudar em outro build:

```text
Shell .title    → src-App-module__title-WmlAic
Products .title → src-ProductApp-module__title-mo0K76
Account .title  → title + data-v-5293e359
```

Também foi confirmado:

- `data-mfe-owner="shell-react"` na raiz do Shell;
- `data-mfe-owner="products-react"` na raiz de Products;
- `data-mfe-owner="account-vue"` na raiz de Account;
- Products e Account herdam a fonte do `body` do Shell;
- `<lab-status-chip>` preserva seu `shadowRoot`;
- nenhuma regra global `.title` permanece no código.

## Auditoria rápida

```powershell
rg -n "\.title|body|:root" apps packages -g "*.css" -g "*.vue"
pnpm run check
```

