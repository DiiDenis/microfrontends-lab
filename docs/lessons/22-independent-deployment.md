# Etapa 22 — Containers e deploy independente

## O que foi criado

Shell, Products e Account agora possuem Dockerfiles multi-stage independentes. Cada build gera uma imagem Nginx própria, e o Compose executa três containers distintos:

```text
localhost:8080 → microfrontends-lab-shell
localhost:8081 → microfrontends-lab-products
localhost:8082 → microfrontends-lab-account
```

Também foram adicionados:

- um template Nginx comum para fallback SPA, CORS e cache;
- configuração Compose que inclui Verdaccio sob o profile `registry`;
- variáveis explícitas para URLs públicas dos remotes;
- um smoke test HTTP e Chromium;
- um experimento de rebuild seletivo de Products.

Products ficou visivelmente em `products-v4` após a prova de atualização.

## Por que foi criado

Até a etapa anterior existiam builds independentes, mas todos eram executados principalmente por servidores de desenvolvimento. Esta etapa aproxima o laboratório da entrega real: o Rsbuild gera arquivos estáticos e um servidor web pequeno os entrega.

O objetivo não é colocar o laboratório na Hostinger ou em uma nuvem. Os containers representam localmente a mesma separação que poderia existir em três serviços, buckets ou CDNs de produção.

## Cinco conceitos que não são a mesma coisa

### Código-fonte

É o TypeScript, TSX, Vue e CSS mantido no repositório.

### Build artifact

É a pasta `dist` gerada pelo Rsbuild. Ela contém HTML, manifest, `remoteEntry.js`, CSS e JavaScript já preparados para o navegador.

### Imagem

É um pacote imutável usado como molde. Neste laboratório, cada imagem final contém Nginx, a configuração de entrega e somente o `dist` de um app.

### Container

É um processo em execução criado a partir da imagem. Recriar o container de Products não exige recriar o processo do Shell.

### Deploy

É colocar uma nova versão do artefato ou imagem em execução num endereço público. Aqui isso é simulado por buildar a imagem e recriar o container local.

## Fluxo de build de cada app

```text
Dockerfile
  ├─ estágio build: Node + pnpm + dependências + Rsbuild
  │                                   ↓
  │                                  dist
  │                                   ↓
  └─ estágio runtime: Nginx + configuração + dist
                                      ↓
                                    imagem
                                      ↓
                                   container
```

O segundo `FROM` inicia uma imagem limpa. Por isso Node, pnpm e `node_modules` usados para compilar não seguem automaticamente para a imagem final.

## URLs: quem precisa enxergar qual endereço

Existem duas redes mentais diferentes:

```text
durante o build:
container de build → host.docker.internal:4873 → Verdaccio no host

durante o uso:
navegador → localhost:8080 → Shell
          → localhost:8081 → manifest/chunks de Products
          → localhost:8082 → manifest/chunks de Account
```

O Compose oferece DNS interno entre containers. Um container poderia resolver `products:80`, mas o JavaScript federado roda no navegador do usuário, fora dessa rede. Por isso gravar `http://products:80/mf-manifest.json` no Shell quebraria: para o navegador, `products` não é um domínio conhecido.

Em produção, `localhost` seria substituído por endereços reais, como `https://products.exemplo.com/mf-manifest.json`.

## Variáveis de build e de runtime

As URLs de manifests e os `assetPrefix` participam do bundle e do manifest gerados pelo Rsbuild. Elas precisam existir no build:

- `PRODUCTS_REMOTE_URL` e `ACCOUNT_REMOTE_URL`: dizem ao Shell onde buscar cada manifest;
- `PRODUCTS_ASSET_PREFIX` e `ACCOUNT_ASSET_PREFIX`: dizem aos remotes qual é sua própria origem pública;
- `MFE_REGISTRY_URL`: permite ao pnpm do estágio de build instalar os pacotes locais.

`MFE_ALLOWED_ORIGIN` é diferente: o entrypoint oficial do Nginx preenche o template ao iniciar o container. Ela controla o header CORS em runtime, sem recompilar JavaScript.

O Shell desativa somente o download de tipos remotos dentro do build Docker com `MF_CONSUME_REMOTE_TYPES=false`. Os tipos continuam sendo validados no fluxo normal antes do empacotamento; o build da imagem não precisa que os servidores dos remotes já estejam online.

## Manifest estável e chunks com hash

O navegador começa pelo endereço estável:

```text
http://localhost:8081/mf-manifest.json
```

O manifest atual aponta para arquivos como:

```text
static/js/async/__federation_expose_ProductApp.613ccc5cd6.js
```

Quando Products muda e recebe novo build, o conteúdo muda e normalmente o hash também muda. A regra de cache é:

```text
manifest estável       → cache curto ou nenhum cache
remoteEntry sem hash   → revalidar
chunk com hash         → cache longo e immutable
```

Assim, o navegador consulta metadados recentes, descobre o novo nome com hash e pode manter chunks antigos em cache sem confundi-los com a nova versão.

## Por que CORS é necessário

A página principal veio de `localhost:8080`, enquanto os remotes vieram de `8081` e `8082`. Portas diferentes formam origens diferentes. Products e Account autorizam explicitamente a origem do Shell a buscar seus arquivos.

CORS não compõe o micro frontend e não substitui Module Federation. Ele apenas permite que o navegador aceite a requisição entre origens.

## Monorepo e deploy independente podem coexistir

Monorepo descreve onde o código é organizado. Deploy independente descreve como cada artefato é construído e colocado em execução.

```text
um repositório
  ├─ apps/shell-react      → imagem Shell      → deploy A
  ├─ apps/products-react   → imagem Products   → deploy B
  └─ apps/account-vue      → imagem Account    → deploy C
```

Estar na mesma árvore Git não obriga os apps a compartilhar bundle, container ou janela de deploy. A independência também não é absoluta: o Shell ainda depende do contrato público e da disponibilidade dos remotes.

## Fluxo de execução

1. Verdaccio fica disponível para o estágio de build instalar os pacotes `@mfe-lab`.
2. Cada Dockerfile compila somente seu app e gera uma imagem Nginx própria.
3. O navegador abre o Shell em `localhost:8080`.
4. Ao acessar `/products`, o runtime consulta `localhost:8081/mf-manifest.json`.
5. O manifest aponta para os chunks de Products também em `localhost:8081`.
6. Ao acessar `/account`, o mesmo processo ocorre em `localhost:8082`.
7. Se Account estiver parado, somente sua fronteira mostra fallback.
8. Um rebuild de Products recria somente Products; o Shell descobre os novos chunks pelo manifest.

## Arquivos importantes

- `docker-compose.yml`: imagens, builds, portas e URLs públicas locais.
- `apps/*/Dockerfile`: build e imagem final individual de cada app.
- `infra/nginx/default.conf.template`: SPA fallback, CORS e cache.
- `infra/verdaccio/docker-compose.yml`: registry opcional, sob profile.
- `scripts/smoke-containers.mjs`: valida HTTP, manifests, headers, exposes e composição no Chromium.
- `docs/experiments/07-independent-containers.md`: roteiro manual reproduzível.

## Comandos

```powershell
pnpm run registry:up
pnpm run containers:build
pnpm run containers:up
pnpm run containers:smoke
pnpm run containers:rebuild:products
pnpm run containers:down
pnpm run registry:down
```

## Como validar

1. Confirme três imagens com `docker image ls microfrontends-lab-*`.
2. Confirme três containers healthy com `docker compose ps`.
3. Abra `http://localhost:8080/products` e veja Products dentro do Shell.
4. Abra `http://localhost:8081/mf-manifest.json` e confira `publicPath` e `./ProductApp`.
5. Execute `pnpm run containers:smoke`.
6. Rebuild apenas Products e confira que Shell e Account mantêm seus IDs.
7. Desligue Account e confirme o fallback isolado.
8. Desligue Verdaccio depois dos builds e confirme que o runtime continua funcionando.

## Resultado observado

Em 14 de setembro de 2026:

- Shell, Products e Account foram construídos em imagens independentes de aproximadamente 26 MB;
- os três healthchecks passaram;
- o smoke executou no Chromium e encontrou os dois remotes dentro do Shell;
- o manifest respondeu `no-store` e os chunks com hash responderam cache `immutable`;
- Account desligado produziu o fallback esperado;
- Products foi de `products-v3` para `products-v4`, trocando somente seus IDs;
- o mesmo Shell exibiu a nova versão sem rebuild;
- as imagens finais não continham Node nem `node_modules`.

## Erros comuns

- usar `products:80` numa URL que será executada pelo navegador;
- colocar os três `dist` na mesma imagem e chamar isso de deploy independente;
- enviar todo o monorepo e `node_modules` para a imagem final;
- aplicar cache longo ao manifest estável;
- esquecer CORS entre portas ou domínios diferentes;
- achar que mudar `environment` do container altera uma URL já embutida no JavaScript;
- manter tipos remotos obrigando os producers a estarem online durante todo build do host;
- confundir o Verdaccio de build com um servidor necessário ao navegador.

## Perguntas de revisão

1. Por que o navegador usa `localhost:8081` e não `products:80`?
2. Qual é a diferença entre a pasta `dist`, uma imagem e um container?
3. Por que o manifest recebe cache curto e um chunk com hash recebe cache longo?

## Exercício manual

Altere `PRODUCTS_REMOTE_VERSION` para a próxima versão, anote os IDs dos três containers, execute `pnpm run containers:rebuild:products` e recarregue `/products`. Confirme que somente Products mudou no Docker e que o Shell mostrou a nova etiqueta.

## Explicação de entrevista em até 90 segundos

Organizei três apps no mesmo monorepo, mas cada um gera seu próprio build, imagem Nginx e container. O Shell é servido em uma origem e consulta os manifests públicos dos remotes em outras duas. As URLs usadas no JavaScript precisam ser resolvidas pelo navegador, por isso uso endereços públicos como `localhost:8081`, e não o DNS interno `products:80` do Compose. O manifest tem cache curto porque precisa apontar para a versão atual; chunks com hash podem ter cache longo e imutável. Os Dockerfiles são multi-stage: Node e pnpm compilam no primeiro estágio, enquanto a imagem final contém somente Nginx e `dist`. Rebuildando Products, apenas sua imagem e seu container mudam, e o Shell já buildado descobre os novos chunks pelo mesmo manifest. Monorepo organiza o código; não impede pipelines e deploys independentes.

## Referências oficiais consultadas

- [Docker — Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker — Build best practices](https://docs.docker.com/build/building/best-practices/)
- [Docker Compose — Include](https://docs.docker.com/reference/compose-file/include/)
- [Docker Compose — Profiles](https://docs.docker.com/compose/how-tos/profiles/)
- [Docker Compose — Networking](https://docs.docker.com/compose/how-tos/networking/)
- [Nginx — ngx_http_headers_module](https://nginx.org/en/docs/http/ngx_http_headers_module.html)
- [Nginx — try_files](https://nginx.org/en/docs/http/ngx_http_core_module.html)
- [Rsbuild — Configuração](https://rsbuild.dev/guide/configuration/rsbuild)
