# Etapa 17 — Module Federation versus pacote npm

## O que foi criado

`@mfe-lab/ui-react` ganhou a prop opcional `size`, com os valores `default` e `compact`, e foi publicado como `1.1.0`. Apenas Products adotou a nova versão e passou a usar o botão compacto. O Shell continua deliberadamente em `1.0.0`.

Products também passou de `products-v2` para `products-v3`. Seu remote foi rebuildado e carregado pelo build já existente do Shell, sem recompilar o host.

## Por que foi criado

Uma biblioteca npm e um remote podem compartilhar código entre aplicações, mas fazem isso em momentos diferentes. Esta etapa transforma a diferença abstrata em evidência observável na mesma tela:

```text
SHELL · UI React 1.0.0
└── PRODUCTS · UI React 1.1.0 · products-v3
```

## Fluxo da atualização do pacote npm

```text
ui-react/src muda
  ↓
versão 1.0.0 → 1.1.0
  ↓ build + pack
ui-react-1.1.0.tgz
  ↓ publish
Verdaccio conhece 1.0.0 e 1.1.0
  ↓ nenhuma atualização automática
Products altera package.json
  ↓ install
lockfile resolve 1.1.0 para Products
  ↓ build/deploy de Products
usuário recebe a biblioteca nova dentro do bundle de Products
```

Publicação e adoção são decisões distintas. Criar `1.1.0` no registry não modifica consumidores fixados em `1.0.0`.

## Fluxo da atualização do remote

```text
ProductApp muda para products-v3
  ↓ build/deploy somente de Products
mesma URL de mf-manifest.json
  ↓ reload da rota
Shell consulta o manifest atual
  ↓
baixa remote entry/chunks novos
  ↓
renderiza products-v3 sem rebuild próprio
```

O Shell conhece o endereço e o nome público `products/ProductApp`; ele não possui uma cópia fixa da implementação de Products em seu bundle.

## O contraste essencial

| Pergunta | Pacote npm | Module Federation |
| --- | --- | --- |
| Quando é resolvido? | Install/build | Runtime no navegador |
| O consumidor fixa uma versão? | Sim, pelo manifest e lockfile | Normalmente fixa uma URL e um contrato |
| Nova publicação aparece sozinha? | Não | Pode aparecer no próximo carregamento |
| Exige rebuild do consumidor? | Sim | Não, se o contrato continuar compatível |
| Rollback mais explícito | Voltar a versão do pacote e rebuildar | Republicar/apontar a origem remota anterior |
| Principal acoplamento | Build e versionamento | Disponibilidade e compatibilidade em runtime |

## Por que `1.1.0` é uma versão minor

A nova prop é opcional e possui fallback:

```ts
size?: 'default' | 'compact';
```

Todo uso anterior continua válido. Uma correção interna seria patch (`1.0.1`); remover ou tornar uma prop obrigatória exigiria major (`2.0.0`).

## Rollback por versão

Para o pacote, o consumidor pode voltar explicitamente:

```json
"@mfe-lab/ui-react": "1.0.0"
```

Depois instala, builda e faz deploy novamente. É um rollback mais lento, mas a versão e a integridade ficam registradas no lockfile.

No remote, o time pode voltar a servir artefatos anteriores na URL conhecida ou mudar a URL configurada. O host não precisa necessariamente ser recompilado quando a origem estável volta a apontar para uma versão compatível, mas esse rollback depende da infraestrutura de deploy e cache.

## Acoplamento operacional em runtime

Module Federation reduz o acoplamento de release: Products pode evoluir sem uma release do Shell. Em troca, aumenta o acoplamento operacional:

```text
usuário abre /products
  ↓
Products precisa estar disponível e compatível naquele momento
```

Com uma biblioteca npm, o bundle de Products já contém a versão adotada. Uma queda do Verdaccio depois do deploy não afeta o navegador. O registry é necessário durante instalação/build, não durante a visita do usuário.

## Compatibilidade

Nenhuma das abordagens cria compatibilidade automaticamente. Uma versão npm pode compilar e ainda mudar comportamento de forma inadequada. Um remote pode manter o mesmo nome exposto e alterar props, eventos ou lifecycle de forma incompatível.

O pacote permite detectar muitos problemas no build do consumidor. O remote exige contratos estáveis, observabilidade, fallbacks e disciplina de deploy porque parte dos problemas aparece somente durante integração runtime.

## Arquivos importantes

- `packages/ui-react/src/LabButton.tsx`: contrato opcional de tamanho.
- `packages/ui-react/src/styles.css`: variante compacta.
- `packages/ui-react/package.json`: versão publicável `1.1.0`.
- `apps/products-react/package.json`: adoção explícita de `1.1.0`.
- `apps/products-react/src/ProductApp.tsx`: uso compacto e `products-v3`.
- `pnpm-lock.yaml`: Shell em `1.0.0` e Products em `1.1.0`.
- `docs/experiments/03-runtime-vs-package-update.md`: evidências e hashes.

## Comandos

```powershell
pnpm run build:ui-react
pnpm run typecheck:ui-react
pnpm --dir packages/ui-react pack --dry-run --json
pnpm run packages:publish:local
pnpm install --filter @mfe-lab/products-react
pnpm --filter @mfe-lab/products-react why @mfe-lab/ui-react
pnpm --filter @mfe-lab/shell-react why @mfe-lab/ui-react
pnpm run typecheck:products
pnpm run build:products
pnpm run preview:products
pnpm run preview:shell
pnpm run check
```

## Como validar

1. Confirme no Verdaccio que `ui-react` possui `1.0.0` e `1.1.0`.
2. Execute `pnpm why` nos dois consumidores.
3. Confirme Products em `1.1.0` e Shell em `1.0.0`.
4. Inicie os dois previews sem rebuildar o Shell.
5. Abra `/products` e veja as duas versões na mesma página.
6. Confirme `Remote version: products-v3`.
7. Inspecione o botão e veja a variante compacta.
8. Compare os hashes do Shell com a fotografia anterior.
9. Execute o check completo.

## Erros comuns

- Acreditar que publicar `1.1.0` atualiza automaticamente quem usa `1.0.0`.
- Alterar o código de uma biblioteca sem aumentar sua versão.
- Atualizar todos os consumidores e perder a evidência de adoção independente.
- Confundir o tarball da biblioteca com os chunks do remote.
- Rebuildar o Shell durante o experimento runtime e invalidar a prova.
- Achar que a mesma URL garante compatibilidade do contrato.
- Tratar deploy independente como independência absoluta.
- Colocar `ui-react` em `shared` apenas para tentar torná-la um remote.

## Perguntas de revisão

1. Por que Products recebeu `ui-react@1.1.0` somente depois de atualizar, instalar e rebuildar?
2. Por que o Shell viu `products-v3` sem rebuild?
3. Qual abordagem aumenta a dependência de disponibilidade no momento em que o usuário acessa a página?

## Exercício manual

Abra o código do Shell e de Products lado a lado. Localize a versão de `ui-react` em cada `package.json`, confirme as duas resoluções com `pnpm why` e encontre as duas versões no `pnpm-lock.yaml`. Não altere nem sincronize as versões: a diferença é parte do experimento.

## Explicação de entrevista em até 90 segundos (formato de até 2 minutos)

No laboratório, comparamos uma biblioteca npm com um remote de Module Federation. Publicamos `ui-react@1.1.0` no Verdaccio adicionando uma prop opcional ao botão. Mesmo assim, Shell e Products continuaram usando `1.0.0`, porque publicação não significa adoção. Só Products alterou seu `package.json`, instalou e fez novo build; por isso a tela passou a mostrar Products em `1.1.0` e Shell ainda em `1.0.0`. Esse modelo oferece versões e rollback explícitos no lockfile, mas exige rebuild e deploy do consumidor. Depois mudamos o remote para `products-v3` e rebuildamos somente Products. O Shell já compilado consultou a mesma URL de manifest e carregou os chunks novos no próximo acesso, sem rebuild próprio. Isso oferece release independente do host, mas aumenta o acoplamento operacional: o remote e seu contrato precisam estar disponíveis e compatíveis em runtime. Em resumo, pacote npm distribui código no install/build; Module Federation distribui a feature no navegador em runtime.
