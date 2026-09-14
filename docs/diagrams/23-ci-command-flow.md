# Etapa 23 — Fluxo da CI e seus comandos

## Dependência entre jobs

```mermaid
flowchart TD
  Trigger["git push, pull request ou Run workflow"] --> Packages

  Packages["Packages<br/>bootstrap:local<br/>packages:verify:registry<br/>typechecks<br/>test:unit"]
  Packages --> Products["Products<br/>bootstrap:local<br/>typecheck:products<br/>build:products"]
  Packages --> Account["Account<br/>bootstrap:local<br/>typecheck:account<br/>build:account"]

  Products --> Artifact["Artifact: @mf-types.zip"]
  Artifact --> Shell
  Products --> Shell
  Account --> Shell

  Shell["Shell<br/>bootstrap:local<br/>download e extração dos tipos<br/>typecheck:shell<br/>build:shell"]
  Shell --> E2E["Integrated E2E<br/>bootstrap:local<br/>instala Chromium<br/>test:e2e"]
  E2E --> Result["Resultado da CI"]
```

`needs` controla as setas de dependência. Somente o artifact transporta um arquivo entre os filesystems isolados de Products e Shell.

## Preparação repetida por job

```mermaid
flowchart LR
  Checkout["checkout"] --> Tools["pnpm + Node + cache"]
  Tools --> Registry["registry:up"]
  Registry --> PackageInstall["packages:install"]
  PackageInstall --> PackageBuild["packages:build"]
  PackageBuild --> PackCheck["packages:pack:check"]
  PackCheck --> Publish["packages:publish:local"]
  Publish --> WorkspaceInstall["workspace:install:local-registry"]
  WorkspaceInstall --> JobCommands["comandos específicos do job"]
  JobCommands --> Cleanup["registry:down com always()"]
```

Cada job recebe uma máquina limpa, portanto repete essa preparação. O cache pode economizar downloads, mas não compartilha `node_modules`, processos nem o storage do Verdaccio.

## Verificação dos pacotes instalados

```mermaid
flowchart TD
  Ping["Verdaccio respondeu ao ping?"] -->|não| Fail["Falha"]
  Ping -->|sim| Expectation["Seleciona app, pacote e versão esperada"]
  Expectation --> Manifest["Localiza package.json instalado"]
  Manifest --> Realpath["Resolve caminho real"]
  Realpath --> Version{"Versão correta?"}
  Version -->|não| Fail
  Version -->|sim| Store{"Está fora de packages/<br/>e dentro de .pnpm?"}
  Store -->|não| Fail
  Store -->|sim| Metadata["Consulta pacote no Verdaccio"]
  Metadata --> Published{"Versão publicada?"}
  Published -->|não| Fail
  Published -->|sim| Next["Repete para a próxima expectativa"]
  Next --> Success["Todas aprovadas"]
```
