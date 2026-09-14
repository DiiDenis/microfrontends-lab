# Experimento 02 — Registry npm local

## Objetivo

Provar que Shell, Products e Account instalam artefatos `@mfe-lab/*@1.0.0` publicados no Verdaccio, em vez de usar links automáticos para as fontes em `packages/`.

## Segurança e escopo

- O serviço publica somente em `127.0.0.1:4873`, portanto não aceita conexões da rede externa.
- O container chama-se `microfrontends-lab-verdaccio`.
- Nenhum token do npm público é solicitado ou salvo.
- `.npmrc` direciona somente o escopo `@mfe-lab` ao Verdaccio.
- React, Vue, Rsbuild e demais dependências públicas continuam vindo de `https://registry.npmjs.org/`.
- A configuração aceita publicação anônima apenas no escopo didático local `@mfe-lab/*`.

## Fluxo reproduzível

Em um clone limpo, execute da raiz:

```powershell
pnpm run bootstrap:local
```

O script equivale a esta ordem explícita:

```powershell
pnpm run registry:up
pnpm run packages:install
pnpm run packages:build
pnpm run packages:pack:check
pnpm run packages:publish:local
pnpm run apps:install:local-registry
```

Não comece com um `pnpm install` global quando o volume do Verdaccio estiver vazio. Os manifests dos apps já pedem versões publicadas `1.0.0`, então o registry precisa ser populado antes da instalação deles.

## Ordem de publicação

```text
contracts ─────────┐
design-tokens ─────┼──> ui-react ──> apps React
ui-web ────────────┴───────────────> Shell e Account
```

`ui-react` depende de `design-tokens`, por isso tokens são publicados antes. O script consulta o registry e pula de modo seguro uma versão que já existe; não tenta sobrescrever `1.0.0`.

## Verificar o conteúdo antes de publicar

```powershell
pnpm run packages:pack:check
```

Cada resultado deve conter apenas `package.json` e os arquivos públicos de `dist`, incluindo JavaScript, declarações `.d.ts` e CSS quando aplicável. O modo `--dry-run` inspeciona sem criar ou publicar o tarball.

## Confirmar o registry e o artefato

Abra a interface local:

```text
http://127.0.0.1:4873
```

Consulte o pacote React:

```powershell
pnpm view @mfe-lab/ui-react@1.0.0 --registry http://127.0.0.1:4873
```

O metadata publicado aponta para um tarball semelhante a:

```text
http://127.0.0.1:4873/@mfe-lab/ui-react/-/ui-react-1.0.0.tgz
```

No pacote publicado, a dependência interna originalmente escrita como `workspace:*` foi convertida para `@mfe-lab/design-tokens: 1.0.0`.

## Provar a resolução dos apps

```powershell
pnpm --filter @mfe-lab/shell-react why @mfe-lab/ui-react
pnpm --filter @mfe-lab/account-vue why @mfe-lab/ui-web
pnpm --filter @mfe-lab/products-react why @mfe-lab/contracts
```

O resultado deve mostrar exatamente `1.0.0`. Em `pnpm-lock.yaml`, os importers dos apps também devem mostrar `specifier: 1.0.0` e `version: 1.0.0`, nunca `link:../../packages/...`.

O pnpm mantém seu próprio store e cria junctions em `node_modules`, mas o destino agora é uma pasta versionada como `.pnpm/@mfe-lab+ui-react@1.0.0...`, e não `packages/ui-react`.

## Resultado observado

- Verdaccio `6.10.3` iniciou saudável em `127.0.0.1:4873`.
- Os quatro pacotes `1.0.0` foram publicados na ordem esperada.
- O dry run de cada tarball mostrou somente a superfície publicável.
- O metadata de `ui-react` mostrou o tarball local, integridade e dependência interna convertida para `design-tokens@1.0.0`.
- A reinstalação forçada dos três apps baixou as versões publicadas.
- `pnpm why` encontrou uma única versão `1.0.0` em cada consumidor consultado.
- O lockfile deixou de registrar links locais nos importers dos apps.

## Limpeza

Para parar o serviço sem apagar o volume e os pacotes publicados:

```powershell
pnpm run registry:down
```

Não use `down -v` durante o fluxo normal: essa opção removeria o volume do registry e exigiria nova publicação.
