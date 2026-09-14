# Etapa 16 — Publicação real em registry npm local

## O que foi criado

O laboratório agora possui um registry npm Verdaccio `6.10.3`, executado pelo Docker Compose apenas em `127.0.0.1:4873`. Os quatro pacotes compartilhados foram preparados e publicados como versões reais `1.0.0`:

- `@mfe-lab/contracts`;
- `@mfe-lab/design-tokens`;
- `@mfe-lab/ui-react`;
- `@mfe-lab/ui-web`.

Os três apps deixaram de declarar `workspace:*` e passaram a pedir versões exatas. `linkWorkspacePackages: false` impede o pnpm de substituir silenciosamente uma versão comum por uma fonte local de mesmo nome.

## Por que foi criado

Até a etapa 15, pacote e consumidor moravam no mesmo workspace e o pnpm criava uma ligação direta:

```text
shell/node_modules/@mfe-lab/ui-react
                  └── link → packages/ui-react
```

Esse fluxo é útil em monorepos, mas não ensina a fronteira que aparece quando bibliotecas e consumidores têm ciclos separados. Agora o caminho é:

```text
fonte do pacote
  → build em dist
  → tarball versionado
  → publish no Verdaccio
  → install pelo app
  → conteúdo versionado no store do pnpm
  → build do app
```

## Registry

Um registry npm é um catálogo e servidor de artefatos versionados. O `package.json` informa nome, versão, exports e dependências; o registry guarda metadata e o tarball correspondente.

O Verdaccio representa um registry privado de empresa sem tocar no npm público. A escolha é didática, mas o fluxo é real: empresas também usam Verdaccio, GitHub Packages, GitLab Package Registry, Artifactory, Nexus, Azure Artifacts ou serviços equivalentes.

O serviço local possui três proteções simples:

1. a porta é ligada a `127.0.0.1`, e não a todas as interfaces;
2. somente `@mfe-lab/*` aceita publicação anônima local;
3. `.npmrc` mantém o registry público como padrão e roteia apenas `@mfe-lab` para `127.0.0.1:4873`.

Nenhuma credencial real é versionada.

## Tarball

O artefato efetivamente publicado é um arquivo `.tgz`, não a pasta `src` inteira. Para `ui-react@1.0.0`, o registry fornece algo equivalente a:

```text
@mfe-lab/ui-react/-/ui-react-1.0.0.tgz
```

O tarball contém o `package.json` publicado e somente os arquivos permitidos por `files`, neste caso a saída `dist`. Os campos `exports`, `types`, `main` e `module` apontam para essa saída.

`pnpm pack --dry-run` funciona como uma inspeção da mala antes do envio: mostra exatamente o que entraria no pacote, sem publicar.

## Versionamento e imutabilidade

Os apps pedem `1.0.0` de modo exato. Uma versão publicada funciona como uma fotografia identificável do contrato e do artefato. O script de publicação consulta o Verdaccio e pula versões já existentes, porque editar e sobrescrever a mesma versão tornaria instalações imprevisíveis.

Uma mudança posterior deve receber outra versão. O próximo experimento comparará essa adoção explícita com a atualização runtime de um remote.

## Publicação versus instalação

São operações opostas:

```text
maintainer do pacote                 app consumidor
build → pack → publish ──registry──> install → build
```

Publicar envia uma versão ao registry. Instalar resolve nome e versão, baixa o tarball e o coloca na árvore de dependências do consumidor.

Estar no mesmo repositório não altera essa semântica. As fontes continuam disponíveis para edição, mas os apps não as recebem automaticamente. Para uma mudança chegar ao consumidor, é preciso buildar, versionar, publicar, atualizar quando necessário, instalar e então rebuildar o app.

## Dependências internas e `workspace:*`

`ui-react` ainda escreve isto dentro de seu próprio projeto:

```json
{
  "dependencies": {
    "@mfe-lab/design-tokens": "workspace:*"
  }
}
```

Durante desenvolvimento do pacote, isso garante que existe um pacote correspondente no workspace. Durante o pack/publish, o pnpm converte a declaração para a versão publicável:

```json
{
  "dependencies": {
    "@mfe-lab/design-tokens": "1.0.0"
  }
}
```

Assim, quem instala o tarball não precisa conhecer o monorepo.

## Lockfile

O lockfile é a prova reproduzível da decisão do instalador. Antes, um importer continha:

```yaml
specifier: workspace:*
version: link:../../packages/ui-react
```

Agora contém:

```yaml
specifier: 1.0.0
version: 1.0.0
```

A seção de pacotes registra também integridade criptográfica, peers e snapshots. Ela prova qual versão e conteúdo foram resolvidos, embora o pnpm possa representar a URL do registry de forma implícita quando ela corresponde à configuração de escopo. O metadata do Verdaccio e o destino `.pnpm/@mfe-lab+...@1.0.0` completam a evidência da origem publicada.

## Fluxo de execução

```text
Docker Compose
  └── microfrontends-lab-verdaccio :4873
        ▲
        │ publish em ordem
contracts@1.0.0
design-tokens@1.0.0
ui-react@1.0.0
ui-web@1.0.0
        │
        └── install exato ──> Shell / Products / Account
```

O comando oficial para uma máquina limpa é:

```powershell
pnpm run bootstrap:local
```

Ele sobe o registry, instala apenas o toolchain dos pacotes, gera e inspeciona os artefatos, publica e só então instala os apps. Essa ordem evita o problema circular de pedir aos apps versões que ainda não existem em um registry vazio.

`verifyDepsBeforeRun: false` também é necessário neste fluxo: o pnpm 11 normalmente tenta sincronizar todo o workspace antes de executar um script. Aqui isso inverteria a ordem e tentaria instalar os apps antes de o próprio `bootstrap:local` popular o registry. O bootstrap assume explicitamente a responsabilidade por instalar cada grupo no momento correto.

## Arquivos importantes

- `infra/verdaccio/docker-compose.yml`: imagem fixa, porta local, volume e healthcheck.
- `infra/verdaccio/config.yaml`: storage, uplink público e política do escopo.
- `.npmrc`: roteamento por escopo.
- `scripts/publish-local-packages.mjs`: ordem e publicação idempotente.
- `pnpm-workspace.yaml`: desativa link implícito para versões comuns.
- `packages/*/package.json`: versão, arquivos, exports, peers e destino de publicação.
- `apps/*/package.json`: versões exatas consumidas.
- `pnpm-lock.yaml`: resolução reproduzível.

## Comandos

```powershell
pnpm run registry:up
pnpm run packages:install
pnpm run packages:build
pnpm run packages:pack:check
pnpm run packages:publish:local
pnpm run apps:install:local-registry
pnpm run bootstrap:local
pnpm run check
pnpm run registry:down
```

## Como validar

1. Execute `pnpm run bootstrap:local`.
2. Abra `http://127.0.0.1:4873` e confirme os quatro pacotes `1.0.0`.
3. Rode `pnpm view @mfe-lab/ui-react@1.0.0 --registry http://127.0.0.1:4873`.
4. Confira que a dependência publicada de design tokens é `1.0.0`.
5. Procure nos importers dos apps em `pnpm-lock.yaml` por versões exatas e ausência de `link:../../packages`.
6. Rode `pnpm --filter @mfe-lab/shell-react why @mfe-lab/ui-react`.
7. Confirme que o junction do app termina em `.pnpm/@mfe-lab+ui-react@1.0.0...`, não em `packages/ui-react`.
8. Execute `pnpm run check`.

## Erros comuns

- Executar instalação global antes de popular um registry novo.
- Definir Verdaccio como registry padrão e encaminhar desnecessariamente toda dependência pública.
- Expor `0.0.0.0:4873` quando o laboratório deve ser apenas local.
- Gravar token real no repositório.
- Manter `workspace:*` nos apps e acreditar que eles testam o tarball publicado.
- Usar versão comum sem desativar o link automático do workspace.
- Publicar `ui-react` antes de sua dependência interna.
- Publicar `src`, testes e arquivos locais por falta de `files`.
- Sobrescrever semanticamente uma versão já publicada.
- Confundir pacote npm de build time com remote de runtime.

## Perguntas de revisão

1. De onde o shell recebe `@mfe-lab/ui-react` agora?
2. Qual é a diferença entre publicar e instalar?
3. O que o lockfile prova e o que ele não substitui?

## Exercício manual

Altere temporariamente `UI_REACT_VERSION` apenas em `packages/ui-react/src/index.ts`, execute o build do pacote e recarregue o shell sem republicar ou reinstalar. A versão do shell deve continuar igual, pois ele usa o tarball `1.0.0` instalado. Reverta a edição ao terminar.

## Explicação de entrevista em até 90 segundos

Criamos um Verdaccio local para simular a distribuição real de quatro bibliotecas privadas sem publicar no npm público. Cada pacote é compilado para `dist`, inspecionado como tarball e publicado na versão `1.0.0`. O `.npmrc` direciona apenas o escopo `@mfe-lab` ao registry local e mantém dependências públicas no npmjs. Nos apps, trocamos `workspace:*` por versões exatas e desativamos links implícitos, então as fontes locais não são usadas automaticamente. O lockfile registra versão e integridade, o store do pnpm contém o artefato publicado, e `pnpm why` mostra quem o consome. Isso continua sendo compartilhamento em build time: uma nova versão da biblioteca só chega ao app após adoção, instalação, build e deploy, diferentemente de um remote carregado em runtime.

## Referências oficiais consultadas

- [Verdaccio: Docker](https://www.verdaccio.org/docs/docker/)
- [Verdaccio: configuração](https://www.verdaccio.org/docs/configuration/)
- [Verdaccio: pacotes e acesso](https://www.verdaccio.org/docs/packages/)
- [pnpm: workspaces e protocolo workspace](https://pnpm.io/workspaces)
- [pnpm: `linkWorkspacePackages`](https://pnpm.io/settings#linkworkspacepackages)
- [npm: arquivos `.npmrc`](https://docs.npmjs.com/cli/v11/configuring-npm/npmrc/)
