# Laboratório de Micro Frontends

Este repositório é um laboratório didático para compreender composição, isolamento, comunicação e entrega independente de micro frontends.

## Sobre este projeto

Este projeto público foi desenvolvido por [Denis](https://github.com/DiiDenis) em colaboração com inteligência artificial, usada como parceira de ensino, implementação e revisão. O trabalho foi dividido em etapas pequenas: cada conceito foi estudado, implementado, validado e documentado antes do próximo avanço.

A IA auxiliou na explicação e na construção, mas o objetivo do repositório não é apresentar código gerado sem contexto. As decisões, experimentos, perguntas de revisão e lições registram uma trilha prática para consolidar entendimento intermediário de micro frontends e Module Federation.

O repositório permanece público para que outras pessoas possam executar os mesmos experimentos, consultar as decisões e aprender progressivamente com uma aplicação React que consome remotes React e Vue.

## Trilha progressiva de aprendizado

| Etapa | Tema estudado |
| --- | --- |
| 01 | Estrutura do monorepo, workspace e contrato de trabalho |
| 02 | Shell React standalone com Rsbuild e React Router |
| 03 | Aplicação Products React independente e estado local |
| 04 | Aplicação Account Vue independente e lifecycle inicial |
| 05 | Execução simultânea de três SPAs ainda não compostas |
| 06 | Products como producer de Module Federation |
| 07 | Shell consumindo um remote React em runtime |
| 08 | Deploy independente, manifest, chunks e hashes |
| 09 | Remote Vue expondo contrato neutro de `mount` e `unmount` |
| 10 | Host React montando e desmontando o remote Vue |
| 11 | Contratos TypeScript compartilhados em build time |
| 12 | Comunicação desacoplada com Custom Events do navegador |
| 13 | Design tokens compartilhados entre aplicações |
| 14 | Biblioteca de componentes específica para React |
| 15 | Web Component reutilizável por React e Vue |
| 16 | Publicação de pacotes internos em Verdaccio |
| 17 | Diferença entre atualização federada e atualização de pacote npm |
| 18 | Diagnóstico de dependências compartilhadas e singletons |
| 19 | Loading, retry, Error Boundary e resiliência dos remotes |
| 20 | Ownership e isolamento de CSS entre micro frontends |
| 21 | Testes unitários e E2E da composição com Playwright |
| 22 | Containers independentes, Nginx e simulação de produção local |
| 23 | Integração contínua, artifacts, registry efêmero e ownership |

Cada etapa possui uma lição em `docs/lessons`, e os fluxos mais importantes possuem diagramas em `docs/diagrams`. O laboratório não realiza deploy público nem publica pacotes no npm público.

## Estrutura

```text
apps/          aplicações independentes e remotes
packages/      contratos, tokens e bibliotecas compartilhadas
docs/          lições, decisões, diagramas e experimentos
infra/         Verdaccio e configurações de Nginx
scripts/       automações locais e verificações
.github/       integração contínua
```

## Pré-requisitos

- Node.js `24.18.0`;
- pnpm `11.21.0`;
- Docker Desktop em execução para Verdaccio e experimentos com containers.

Para estudar na ordem planejada, comece por `docs/lessons/01-esqueleto-contrato-trabalho.md` e avance numericamente. Para preparar um clone limpo, execute `pnpm run bootstrap:local` antes dos comandos gerais.

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

O Verdaccio possui `ui-react@1.0.0` e `ui-react@1.1.0`. Products adotou `1.1.0` e usa o botão compacto; o shell permanece propositalmente em `1.0.0` para demonstrar que publicar uma biblioteca não atualiza consumidores automaticamente. Products também está em `products-v4`, carregado pelo shell em runtime sem rebuild do host.

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

## Containers locais de produção

Cada app possui seu próprio Dockerfile multi-stage e sua própria imagem final com Nginx. As imagens não são publicadas e servem apenas para simular produção nesta máquina.

| App | URL no navegador | Imagem local |
| --- | --- | --- |
| Shell | `http://localhost:8080` | `microfrontends-lab-shell:local` |
| Products | `http://localhost:8081` | `microfrontends-lab-products:local` |
| Account | `http://localhost:8082` | `microfrontends-lab-account:local` |

Use:

```powershell
pnpm run registry:up
pnpm run containers:build
pnpm run containers:up
pnpm run containers:smoke
pnpm run containers:rebuild:products
pnpm run containers:down
pnpm run registry:down
```

O Verdaccio é necessário durante a instalação dos pacotes `@mfe-lab` no estágio de build, mas não serve os apps em runtime. Depois de construir as imagens, ele pode ser desligado sem interromper os três containers.

### URLs configuráveis

| Variável | Momento | Uso |
| --- | --- | --- |
| `MFE_REGISTRY_URL` | build Docker | registry usado pelo pnpm dentro do estágio de build |
| `PRODUCTS_REMOTE_URL` | build do Shell | URL pública do manifest de Products embutida no bundle |
| `ACCOUNT_REMOTE_URL` | build do Shell | URL pública do manifest de Account embutida no bundle |
| `PRODUCTS_ASSET_PREFIX` | build de Products | origem pública gravada no manifest para seus assets |
| `ACCOUNT_ASSET_PREFIX` | build de Account | origem pública gravada no manifest para seus assets |
| `MFE_ALLOWED_ORIGIN` | runtime do Nginx | origem autorizada pelo CORS dos containers |

`host.docker.internal` aparece somente na comunicação do build com o Verdaccio executado no host. As URLs que o JavaScript entrega ao navegador usam `localhost`, pois o navegador não participa da rede interna do Compose e não consegue resolver nomes como `products:80`.

## Integração contínua

O workflow `.github/workflows/ci.yml` é executado em `push`, `pull_request` ou manualmente pela aba Actions. Ele apenas valida o laboratório; não publica pacotes ou imagens fora do Verdaccio efêmero de cada job e não realiza deploy.

```text
Packages and local registry
            ↓
      ┌─────┴─────┐
   Products     Account
      └─────┬─────┘
          Shell
            ↓
     Integrated E2E
```

Os jobs aparecem com nomes separados para que uma falha de Products ou Account seja identificada diretamente. Cada job recebe um runner limpo e executa `bootstrap:local`; o cache guarda somente downloads do store do pnpm, nunca o storage mutável do Verdaccio.

O Shell consome o arquivo de tipos produzido no job Products como um artifact da própria execução. Isso preserva o contrato gerado pelo producer sem exigir que o servidor Products esteja no ar durante o build isolado do Shell.

Para validar localmente a origem dos pacotes instalados:

```powershell
pnpm run bootstrap:local
pnpm run packages:verify:registry
```

O seed em `infra/verdaccio/seed/ui-react-1.0.0` representa a versão histórica que o Shell ainda consome. Um registry de empresa preservaria essa versão; o seed permite reconstruir o mesmo estado quando o Verdaccio efêmero começa vazio.
