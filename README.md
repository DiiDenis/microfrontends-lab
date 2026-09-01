# Laboratório de Micro Frontends

Este repositório é um laboratório didático para compreender composição, isolamento, comunicação e entrega independente de micro frontends.

## Estrutura

A estrutura será preenchida gradualmente nas próximas etapas.

## Aplicações

| App | Framework | Porta | Responsabilidade | Status de integração |
| --- | --- | --- | --- | --- |
| `shell-react` | React 19 | 3000 | Layout, navegação e rotas globais | Standalone; contém placeholders locais |
| `products-react` | React 19 | 3001 | Catálogo e estado local de produtos | Standalone; não conectado ao shell |
| `account-vue` | Vue 3 | 3002 | Conta e papel local do usuário | Standalone; não conectado ao shell |

Os três apps possuem servidores e builds próprios, mas ainda não existe composição entre eles.

## Comandos gerais

```powershell
pnpm run dev
pnpm run typecheck
pnpm run build
pnpm run check
```

`pnpm run dev` inicia os três apps em paralelo. Os demais comandos executam as tarefas correspondentes em todos os apps existentes.

## Primeiro producer

| Item | Valor |
| --- | --- |
| App standalone | `http://localhost:3001/` |
| Manifest federado | `http://localhost:3001/mf-manifest.json` |
| Nome do container | `products` |
| Módulo exposto | `./ProductApp` |

Products continua abrindo como SPA independente e também produz os artefatos que permitirão a um consumer carregar `products/ProductApp` em runtime.
