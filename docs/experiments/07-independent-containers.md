# Experimento 07 — Containers independentes

## Objetivo

Provar localmente que Shell, Products e Account podem ter imagens, processos e atualizações separados, embora o código permaneça no mesmo monorepo.

Nenhuma imagem é enviada à internet. O Docker Desktop executa tudo nesta máquina.

## Pré-requisitos

- Docker Desktop aberto;
- dependências públicas já disponíveis para o build;
- pacotes `@mfe-lab` publicados no Verdaccio local pelo fluxo da etapa 16.

## 1. Subir o registry para o build

```powershell
pnpm run registry:up
```

O build acessa o Verdaccio por `http://host.docker.internal:4873/`. Esse endereço pertence à comunicação entre o container de build e a máquina host; ele não é gravado como URL de remote no navegador.

## 2. Construir e subir os três apps

```powershell
pnpm run containers:build
pnpm run containers:up
docker compose ps
```

Resultado esperado:

| Serviço | URL pública local | Estado |
| --- | --- | --- |
| Shell | `http://localhost:8080` | healthy |
| Products | `http://localhost:8081` | healthy |
| Account | `http://localhost:8082` | healthy |

Cada Dockerfile usa Node e pnpm no estágio `build`. A imagem final começa novamente a partir de Nginx e recebe apenas `dist`, portanto não carrega o `node_modules` de desenvolvimento.

## 3. Verificar manifests, cache, CORS e composição

```powershell
curl.exe -I http://localhost:8081/mf-manifest.json
curl.exe -I http://localhost:8081/remoteEntry.js
curl.exe http://localhost:8081/mf-manifest.json
pnpm run containers:smoke
```

Resultado esperado:

- manifest com `Cache-Control: no-store`;
- `remoteEntry.js` com `no-cache, must-revalidate`;
- chunks sob `/static/` com nome contendo hash e cache `immutable`;
- CORS autorizando `http://localhost:8080`;
- `publicPath` de Products igual a `http://localhost:8081/`;
- `publicPath` de Account igual a `http://localhost:8082/`;
- Products e Account visíveis dentro das rotas do Shell.

## 4. Rebuildar somente Products

Antes do rebuild, altere de forma visível e manual a constante `PRODUCTS_REMOTE_VERSION` em `apps/products-react/src/technicalInfo.ts`. Por exemplo, avance `products-v4` para `products-v5`.

```powershell
docker inspect microfrontends-lab-shell microfrontends-lab-products microfrontends-lab-account --format "{{.Name}} container={{.Id}} image={{.Image}}"
pnpm run containers:rebuild:products
docker compose up -d --wait products
docker inspect microfrontends-lab-shell microfrontends-lab-products microfrontends-lab-account --format "{{.Name}} container={{.Id}} image={{.Image}}"
$env:EXPECTED_PRODUCTS_VERSION = 'products-v5'
pnpm run containers:smoke
Remove-Item Env:EXPECTED_PRODUCTS_VERSION
```

Somente os IDs da imagem e do container de Products devem mudar. Shell e Account continuam os mesmos. Ao recarregar `/products` em `localhost:8080`, o Shell já buildado busca o manifest estável e encontra os novos chunks de Products.

## 5. Derrubar somente Account e validar o fallback

```powershell
docker compose stop account
$env:EXPECT_ACCOUNT_UNAVAILABLE = 'true'
pnpm run containers:smoke
Remove-Item Env:EXPECT_ACCOUNT_UNAVAILABLE
docker compose up -d --wait account
```

O resultado esperado é `Account: fallback isolado visível`. Shell e Products continuam funcionando.

## 6. Provar que Verdaccio não participa do runtime

```powershell
pnpm run registry:down
pnpm run containers:smoke
```

O smoke deve continuar passando. Os pacotes do registry já foram incorporados durante o build; o navegador não os baixa do Verdaccio.

## Resultado observado em 14 de setembro de 2026

- as três imagens foram construídas separadamente e os três containers ficaram healthy;
- o smoke abriu um Chromium e compôs Products e Account no Shell;
- Account foi desligado sozinho e o Shell mostrou `Account indisponível`;
- Products mudou de `products-v3` para `products-v4`;
- somente a imagem e o container de Products receberam novos IDs;
- o mesmo container do Shell exibiu `products-v4` sem rebuild;
- Node e `node_modules` não estavam presentes nas imagens finais;
- cache, CORS, manifests, exposes e `publicPath` passaram no smoke.

## Encerrar o laboratório

```powershell
pnpm run containers:down
pnpm run registry:down
```
