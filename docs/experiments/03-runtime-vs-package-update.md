# Experimento 03 — Atualização runtime versus pacote npm

## Objetivo

Comparar, em condições controladas, como uma mudança chega ao usuário quando o artefato é uma biblioteca npm de build time e quando é um remote de Module Federation carregado em runtime.

## Fotografia inicial

Antes da alteração, Shell e Products pediam e tinham instalado:

```text
@mfe-lab/ui-react@1.0.0
```

Products mostrava:

```text
Remote version: products-v2
```

O Shell foi buildado uma única vez. Sua fotografia foi registrada antes de atualizar Products:

```text
apps/shell-react/dist/index.html
SHA256 E86A9953038B1A5632A48DD38A40772D03431D6C002DB0868544874B4D428E71

apps/shell-react/dist/static/js/index.218454167a.js
SHA256 68EBB32B8805C3E19CC92E08F807FFA7B452091D5061EF8EC8A74AE7ABF355DB

LastWriteTimeUtc do index.html: 2026-09-14 19:14:33Z
```

## Parte A — pacote npm

Foi adicionada ao `LabButton` uma prop opcional e retrocompatível:

```tsx
<LabButton size="compact">Adicionar</LabButton>
```

Sua superfície é:

```ts
size?: 'default' | 'compact';
```

Como a API anterior continua válida, `@mfe-lab/ui-react` passou de `1.0.0` para `1.1.0`, um incremento minor.

Depois de buildar, inspecionar e publicar `1.1.0`, os comandos abaixo ainda mostraram `1.0.0` nos dois apps:

```powershell
pnpm --filter @mfe-lab/shell-react why @mfe-lab/ui-react
pnpm --filter @mfe-lab/products-react why @mfe-lab/ui-react
```

Publicar apenas adicionou outra versão ao catálogo do Verdaccio. Nenhum `package.json` ou lockfile consumidor foi alterado automaticamente.

Somente Products foi atualizado:

```json
"@mfe-lab/ui-react": "1.1.0"
```

Depois da instalação dirigida ao app:

```text
Products → @mfe-lab/ui-react@1.1.0
Shell    → @mfe-lab/ui-react@1.0.0
```

Os junctions confirmaram destinos diferentes dentro do store `.pnpm`, ambos vindos dos respectivos tarballs publicados.

## Parte B — remote

O texto público de Products mudou de `products-v2` para `products-v3`. Somente Products foi typechecked e rebuildado. Seu novo `remoteEntry.js` teve:

```text
SHA256 9820E688E1AECEEE04AED5102F99DE9CFE55C03159791E9F13C729950A0F3DDA
```

O preview do build antigo do Shell foi servido sem executar `build:shell` novamente. Ao recarregar `http://localhost:3000/products`, o navegador mostrou simultaneamente:

```text
Shell:    UI React: 1.0.0
Products: UI React: 1.1.0
Products: Remote version: products-v3
```

O botão `Adicionar` do remote apresentou o padding compacto calculado de `4px 8px`. Os hashes e o horário do Shell permaneceram iguais aos da fotografia inicial.

## Comparação observada

| Artefato alterado | Versão/endereço | Consumidor recompilado? | Consumidor redeployado? | Quando a mudança apareceu | Risco de incompatibilidade |
| --- | --- | --- | --- | --- | --- |
| `@mfe-lab/ui-react` | Verdaccio: `1.1.0` | Products: sim; Shell: não | Products: necessário; Shell: não | Somente depois de Products declarar, instalar e buildar `1.1.0` | Controlado pela versão adotada e pelo build do consumidor |
| `products/ProductApp` | Mesmo `http://localhost:3001/mf-manifest.json`, agora `products-v3` | Shell: não; Products: sim | Somente Products | No reload do Shell já buildado | Contrato incompatível ou indisponibilidade pode quebrar a rota em runtime |

## Como repetir

1. Consulte as versões instaladas com os dois comandos `pnpm why`.
2. Execute `pnpm run build:shell` uma única vez e registre seus hashes.
3. Altere apenas a versão visível e a implementação de Products de maneira retrocompatível.
4. Execute `pnpm run typecheck:products` e `pnpm run build:products`.
5. Inicie `pnpm run preview:products` e `pnpm run preview:shell` em terminais separados.
6. Abra `http://localhost:3000/products` e observe as duas versões de UI e `products-v3`.
7. Repita os hashes do Shell e confirme que não mudaram.

## Resultado

O pacote npm ofereceu adoção e rollback explícitos por consumidor, mas exigiu instalação e build. O remote entregou a nova implementação ao Shell sem rebuild do host, mas criou uma dependência operacional em runtime entre a página e a URL estável de Products.
