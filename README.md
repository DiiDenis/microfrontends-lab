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
| `@mfe-lab/contracts` | Verdaccio, `1.0.0` | Tipos e nomes de eventos framework-agnostic |
| `@mfe-lab/design-tokens` | Verdaccio, `1.0.0` | Variáveis CSS e versão da base visual compartilhada |
| `@mfe-lab/ui-react` | Verdaccio, Shell `1.0.0` / Products `1.1.0` | `LabButton` e `AppBoundaryLabel` para os consumidores React |
| `@mfe-lab/ui-web` | Verdaccio, `1.0.0` | `<lab-status-chip>` nativo para consumidores React e Vue |

Os quatro pacotes são publicados no registry npm local e resolvidos durante instalação e build; nenhum deles é um remote de Module Federation. `contracts` não contém estado nem depende de React, Vue ou DOM. `design-tokens` contém valores visuais globais, `ui-react` contém somente componentes React e `ui-web` demonstra um Custom Element controlado pelo navegador. Account Vue continua sem consumir `ui-react`, mas pode usar o componente neutro de `ui-web`.

O Verdaccio possui `ui-react@1.0.0` e `ui-react@1.1.0`. Products adotou `1.1.0` e usa o botão compacto; o shell permanece propositalmente em `1.0.0` para demonstrar que publicar uma biblioteca não atualiza consumidores automaticamente. Products também está em `products-v3`, carregado pelo shell em runtime sem rebuild do host.

## Registry npm local

O Verdaccio fica disponível apenas em `http://127.0.0.1:4873` e o container tem o nome didático `microfrontends-lab-verdaccio`. A configuração `.npmrc` envia somente pacotes `@mfe-lab` para ele; dependências públicas continuam usando `https://registry.npmjs.org/`.

Em uma máquina ou clone limpo, o comando oficial é:

```powershell
pnpm run bootstrap:local
```

Ele sobe o registry, instala e compila o toolchain dos pacotes, verifica os tarballs, publica na ordem correta e só então instala os apps. Depois disso, use os comandos gerais normalmente.

```powershell
pnpm run registry:up
pnpm run registry:down
pnpm run packages:pack:check
pnpm run packages:publish:local
pnpm run apps:install:local-registry
```

Um `pnpm install` global feito antes do bootstrap tentará resolver as versões `1.0.0` dos apps em um registry ainda vazio. Por isso a ordem é parte do contrato de inicialização do laboratório.

## Comandos gerais

```powershell
pnpm run dev
pnpm run typecheck
pnpm run build
pnpm run check
```

`pnpm run dev` inicia os três apps em paralelo. Os demais comandos executam as tarefas correspondentes em todos os apps existentes.

Os scripts da raiz ainda compilam as fontes dos quatro pacotes para permitir evolução e publicação. Os apps, porém, resolvem as versões publicadas pelo Verdaccio; editar `packages/*/src` não altera silenciosamente o código já instalado nos apps.

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

Em desenvolvimento, o Shell mostra um painel recolhível `Diagnóstico técnico dos micro frontends`. Ele importa módulos públicos pequenos dos dois remotes e apresenta versões de frameworks, remotes, `ui-react`, os endereços efetivos dos manifests e se Products reutiliza a mesma instância de React observada pelo Shell. O painel não lê globals internos do Module Federation e não é incluído na interface de produção.
