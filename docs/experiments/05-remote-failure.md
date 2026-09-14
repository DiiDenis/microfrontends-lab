# Experimento 05 — Falhas de remotes em runtime

## Objetivo

Comprovar que Products e Account possuem fronteiras de falha independentes e que a indisponibilidade de um ou dos dois não remove o header, a Home nem a navegação do Shell.

## Preparação

Use três terminais separados na raiz do repositório. Isso permite parar somente o processo desejado com `Ctrl+C`.

```powershell
pnpm run dev:shell
pnpm run dev:products
pnpm run dev:account
```

Antes de cada cenário, faça uma recarga da rota. O navegador e o runtime podem manter manifests e módulos já carregados em cache; quando precisar provar uma primeira falha de rede, use uma nova aba ou desabilite temporariamente o cache no DevTools.

## Cenário 1 — Products desligado e Account ligado

1. Mantenha Shell e Account ligados.
2. Pare apenas Products com `Ctrl+C` em seu terminal.
3. Abra `http://localhost:3000/products` e recarregue.
4. Confirme `Products indisponível` e `Não foi possível carregar o remote Products`.
5. Use os links Home e Account.

Resultado esperado: o fallback cita Products, e Home, header e Account continuam funcionando.

Resultado observado: comportamento confirmado. Account montou normalmente e atualizou o usuário no header enquanto Products permaneceu indisponível.

## Cenário 2 — Account desligado e Products ligado

1. Reinicie Products com `pnpm run dev:products`.
2. Pare apenas Account.
3. Abra `http://localhost:3000/account` e recarregue.
4. Confirme `Account indisponível` e `Não foi possível importar o remote Account`.
5. Navegue para Products.

Resultado esperado: o fallback cita Account; Products, Home e header permanecem disponíveis.

Resultado observado: comportamento confirmado. Products exibiu `products-v3` e seus dois produtos sem depender de Account.

## Cenário 3 — Ambos desligados

1. Mantenha somente o Shell ligado.
2. Recarregue `/products` e `/account` separadamente.
3. Volte para `/` depois de cada falha.

Resultado esperado: cada rota apresenta seu próprio fallback. A Home e os três links continuam renderizados.

Resultado observado: os dois fallbacks apareceram independentemente; a Home continuou exibindo `Esta página pertence ao shell`.

## Cenário 4 — O remote volta e Retry funciona

1. Com Products desligado, recarregue `/products` até aparecer o fallback.
2. Sem sair da página, reinicie Products:

```powershell
pnpm run dev:products
```

3. Clique em `Tentar novamente`.

Resultado esperado: a página é recarregada, uma nova instância do runtime tenta consultar o manifest e Products volta a aparecer.

Resultado observado: o fallback foi substituído por `Produtos`, `Remote version: products-v3` e os dois produtos. O botão não apenas limpou o erro visual: houve uma nova navegação e uma nova tentativa.

## Cenário 5 — Troca rápida durante o carregamento

1. No DevTools, selecione temporariamente uma rede lenta, como `Slow 3G`.
2. Entre em `/account`.
3. Antes de o import terminar, clique em Home.
4. Aguarde a requisição anterior terminar ou falhar.
5. Restaure a configuração normal de rede.

Resultado esperado: a Home permanece visível; Account não monta atrasado, não atualiza estado desmontado e não deixa conteúdo dentro de container órfão.

Resultado observado: a navegação terminou na Home sem fallback tardio e sem DOM de Account. O sinal `cancelled` fez o resultado atrasado ser ignorado, e o cleanup esvaziou o container.

## Falha de renderização controlada

Para observar a fronteira que vem depois do download, adicione temporariamente `throw new Error('falha controlada')` no início de `ProductApp`, recarregue `/products`, confirme `O remote Products falhou durante a renderização` e desfaça a alteração.

Esse teste é propositalmente manual: a falha não deve permanecer no código. Durante a validação da etapa, a mesma fronteira foi exercitada por uma incompatibilidade temporária entre builds dev/preview e manteve o Shell funcional.

## Evidência sobre cache

Durante a validação, desligar um servidor recém-acessado ainda permitiu uma recarga bem-sucedida porque manifest e chunks estavam em cache. Ao apontar o Shell para uma origem inédita e realmente indisponível, o fallback apareceu. Isso demonstra que “processo desligado” e “recurso impossível de obter neste navegador” podem não ser observados no mesmo instante.

## Encerramento

Ao terminar, mantenha novamente os três apps disponíveis:

```powershell
pnpm run dev
```

