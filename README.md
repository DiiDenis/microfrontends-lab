# Laboratório de Micro Frontends

Este repositório é um laboratório didático para compreender composição, isolamento, comunicação e entrega independente de micro frontends.

## Estrutura

A estrutura será preenchida gradualmente nas próximas etapas.

## Aplicações

| App | Framework | Porta | Responsabilidade | Status de integração |
| --- | --- | --- | --- | --- |
| `shell-react` | React 19 | 3000 | Layout, navegação e rotas globais | Consumer de `products/ProductApp` |
| `products-react` | React 19 | 3001 | Catálogo e estado local de produtos | Standalone e producer consumido pelo shell |
| `account-vue` | Vue 3 | 3002 | Conta e papel local do usuário | Standalone e producer consumido pelo shell |

Os três apps possuem servidores e builds próprios. Products é composto como componente React na rota `/products`; Account é montado por lifecycle Vue na rota `/account`.

## Pacotes compartilhados

| Pacote | Resolução atual | Responsabilidade |
| --- | --- | --- |
| `@mfe-lab/contracts` | `workspace:*` | Tipos e nomes de eventos framework-agnostic |

`contracts` é resolvido durante instalação e build. Ele não é um remote de Module Federation, não contém estado e não depende de React, Vue ou DOM.

## Comandos gerais

```powershell
pnpm run dev
pnpm run typecheck
pnpm run build
pnpm run check
```

`pnpm run dev` inicia os três apps em paralelo. Os demais comandos executam as tarefas correspondentes em todos os apps existentes.

Antes de iniciar, tipar ou buildar os apps, os scripts da raiz compilam `@mfe-lab/contracts`, garantindo que `dist/index.js` e `dist/index.d.ts` estejam disponíveis aos consumidores.

Para servir os builds de produção usados no experimento de deploy independente:

```powershell
pnpm run build:products
pnpm run build:shell
pnpm run preview:products
pnpm run preview:shell
```

Os dois previews devem ficar em terminais separados. Products usa a porta 3001 e o shell usa a porta 3000.

## Primeiro producer

| Item | Valor |
| --- | --- |
| App standalone | `http://localhost:3001/` |
| Manifest federado | `http://localhost:3001/mf-manifest.json` |
| Nome do container | `products` |
| Módulo exposto | `./ProductApp` |

Products continua abrindo como SPA independente e também produz os artefatos que permitirão a um consumer carregar `products/ProductApp` em runtime.

## Producer Vue com lifecycle

| Item | Valor |
| --- | --- |
| App standalone | `http://localhost:3002/` |
| Manifest federado | `http://localhost:3002/mf-manifest.json` |
| Nome do container | `account` |
| Módulo exposto | `./mount` |

Account continua abrindo como SPA independente e publica um contrato neutro de `mount`/`unmount`, consumido pelo adapter React da rota `/account`.

## Primeiro consumer

O shell registra `products` pelo manifest `http://localhost:3001/mf-manifest.json` e carrega `products/ProductApp` somente ao acessar `/products`. Para apontar um build a outro ambiente, defina `PRODUCTS_REMOTE_URL`; sem essa variável, o fallback local permanece explícito.

O shell também registra `account` pelo manifest `http://localhost:3002/mf-manifest.json`. `ACCOUNT_REMOTE_URL` permite configurar outra origem; o fallback local permanece explícito. Como Account é Vue, o shell não renderiza seu componente diretamente: cria um container e chama `account/mount`.
