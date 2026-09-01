# Laboratório de Micro Frontends

Este repositório é um laboratório didático para compreender composição, isolamento, comunicação e entrega independente de micro frontends.

## Estrutura

A estrutura será preenchida gradualmente nas próximas etapas.

## Aplicações

| App | Framework | Porta | Responsabilidade | Status de integração |
| --- | --- | --- | --- | --- |
| `shell-react` | React 19 | 3000 | Layout, navegação e rotas globais | Consumer de `products/ProductApp` |
| `products-react` | React 19 | 3001 | Catálogo e estado local de produtos | Standalone e producer consumido pelo shell |
| `account-vue` | Vue 3 | 3002 | Conta e papel local do usuário | Standalone e producer; ainda não conectado ao shell |

Os três apps possuem servidores e builds próprios. Products agora também é composto em runtime na rota `/products` do shell; Account continua representado por um placeholder local.

## Comandos gerais

```powershell
pnpm run dev
pnpm run typecheck
pnpm run build
pnpm run check
```

`pnpm run dev` inicia os três apps em paralelo. Os demais comandos executam as tarefas correspondentes em todos os apps existentes.

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

Account continua abrindo como SPA independente e agora publica um contrato neutro de `mount`/`unmount`. O shell ainda não o consome nesta etapa.

## Primeiro consumer

O shell registra `products` pelo manifest `http://localhost:3001/mf-manifest.json` e carrega `products/ProductApp` somente ao acessar `/products`. Para apontar um build a outro ambiente, defina `PRODUCTS_REMOTE_URL`; sem essa variável, o fallback local permanece explícito.
