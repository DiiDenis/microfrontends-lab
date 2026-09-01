# Experimento 01 — Atualização independente do remote

## Objetivo

Comprovar que um shell já buildado pode carregar uma nova implementação compatível de Products pela mesma URL de manifest, sem HMR e sem rebuild do shell.

## Pré-condições

- Execute os comandos a partir da raiz `microfrontends-lab`.
- Deixe livres as portas 3000 e 3001; o preview não deve escolher outra porta.
- Confirme que `PRODUCTS_REMOTE_URL` aponta para `http://localhost:3001/mf-manifest.json` ou use o fallback local.
- Para iniciar o experimento do zero, altere manualmente em `apps/products-react/src/ProductApp.tsx` o texto para `Remote version: products-v1`.
- Não use `pnpm run dev`; este experimento usa somente build e preview de produção.

## Comandos exatos — estado v1

O consumer baixa os tipos publicados pelo producer durante seu build. Por isso, primeiro disponibilize o build v1 de Products; a regra que será provada é que o shell será buildado apenas uma vez e não mudará entre a observação de v1 e a de v2.

No terminal de Products:

```powershell
pnpm run typecheck:products
pnpm run build:products
pnpm run preview:products
```

Mantenha esse terminal aberto. Em outro terminal:

```powershell
$env:PRODUCTS_REMOTE_URL = 'http://localhost:3001/mf-manifest.json'
pnpm run build:shell
pnpm run preview:shell
```

Esse é o único `build:shell` do experimento. Abra:

```text
http://localhost:3000/products
```

### Resultado esperado v1

```text
Remote version: products-v1
```

### Registro do shell antes da atualização

Em um terceiro terminal:

```powershell
Get-FileHash apps/shell-react/dist/index.html -Algorithm SHA256
Get-ChildItem apps/shell-react/dist/static/js/index.*.js |
  Get-FileHash -Algorithm SHA256
Get-Item apps/shell-react/dist/index.html |
  Select-Object LastWriteTimeUtc
```

## Alteração manual para v2

Pare somente `preview:products` com `Ctrl+C`. Não pare `preview:shell` e não execute `build:shell` novamente.

Altere claramente a linha de `ProductApp.tsx`:

```tsx
<p>Remote version: products-v2</p>
```

No terminal de Products:

```powershell
pnpm run typecheck:products
pnpm run build:products
pnpm run preview:products
```

Recarregue a aba já aberta em `http://localhost:3000/products`.

### Resultado esperado v2

```text
Remote version: products-v2
```

Repita os três comandos de hash e horário do shell. Os resultados devem ser idênticos aos anteriores.

## Resultado observado em 1º de setembro de 2026

- O preview do shell permaneceu ativo na porta 3000 durante toda a troca v1 → v2.
- `products-v1` apareceu inicialmente dentro da rota do shell.
- Somente `ProductApp.tsx` foi alterado para v2.
- Somente Products foi rebuildado e seu preview reiniciado.
- A mesma aba do shell foi recarregada e passou a mostrar `products-v2`.
- O arquivo principal de Products mudou de hash, como esperado.
- O shell preservou os mesmos arquivos, hashes e horário:

```text
dist/index.html
SHA256 19F9D6058070B603E0D9FBCA0768CCB841D2A200484FFD45BC4AC435B02940B2

dist/static/js/index.a7daeb04b2.js
SHA256 7661C20E74EC6E281D56BBD0E55D969110DAA3B7CF281CACFAAC56BF95330710

LastWriteTimeUtc do index.html: 2026-09-01 16:40:59Z
```

## Ajuste descoberto durante o experimento

O primeiro preview de produção encontrou `RUNTIME-008`: o manifest apontava `remoteEntry.js` como `/remoteEntry.js`, levando o navegador a tentar baixá-lo da porta 3000. Foi necessário configurar no producer:

```ts
output: {
  assetPrefix: 'http://localhost:3001/',
},
```

Assim, manifest, remote entry e chunks usam a origem pública de Products. Em uma infraestrutura real, esse prefixo corresponderia ao domínio publicado pelo deploy do remote.

## Explicação

O build do shell guarda a URL estável `http://localhost:3001/mf-manifest.json`, não o conteúdo de `ProductApp`. O build v2 de Products substitui o manifest e publica chunks com novos hashes nessa mesma origem. Ao recarregar a rota, uma nova instância do runtime consulta o manifest atual, encontra os assets v2 e os renderiza. Como o identificador `products/ProductApp` e seu contrato permaneceram compatíveis, o shell não precisou mudar.

## Cache

O preview local permitiu observar v2 após um reload comum. Em produção, um navegador ou CDN pode manter uma cópia antiga do manifest ou do remote entry. Se isso acontecer durante a repetição manual, confirme primeiro que Products realmente serve o manifest novo e faça uma recarga forçada ou desative temporariamente o cache no DevTools. Este laboratório não adiciona uma estratégia complexa de cache busting.

## Encerramento

Pare os dois previews com `Ctrl+C` e remova a variável temporária, se desejar:

```powershell
Remove-Item Env:PRODUCTS_REMOTE_URL
```

O código versionado ao final do experimento deve permanecer em `products-v2`.
