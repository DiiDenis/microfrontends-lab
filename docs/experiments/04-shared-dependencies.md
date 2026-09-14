# Experimento 04 — Dependências compartilhadas

## Objetivo

Observar a configuração correta de dependências compartilhadas e entender, por uma alteração manual temporária, por que React e ReactDOM possuem requisito de singleton.

Este experimento é propositalmente manual. Não deixe a configuração alterada na linha principal do repositório.

## Estado correto

Inicie os três apps:

```powershell
pnpm run dev
```

Abra `http://localhost:3000`, expanda `Diagnóstico técnico dos micro frontends` e confirme:

```text
React do Shell:              19.2.8
React informado por Products: 19.2.8
Products reutiliza React do Shell: sim
Vue informado por Account:    3.5.42
Remote Products:              products-v3
Remote Account:               account-v1
UI React do Shell:            1.0.0
UI React de Products:         1.1.0
```

Os manifests devem registrar `singleton: true` e `requiredVersion` para:

```text
react
react/jsx-runtime
react-dom
react-dom/client
```

Account registra Vue `3.5.42` no share scope padrão. Como o Shell não usa Vue, Account é o fornecedor dessa dependência para seus módulos remotos.

## Criar uma área segura para o teste

Faça o teste em uma branch descartável ou cópia do repositório:

```powershell
git switch -c experimento/sem-react-singleton
```

Não publique nem faça merge dessa alteração.

## Alteração manual

Em `apps/shell-react/rsbuild.config.ts` e `apps/products-react/rsbuild.config.ts`, altere temporariamente `singleton: true` para `singleton: false` nas entradas React e ReactDOM.

Execute novamente:

```powershell
pnpm run build:products
pnpm run build:shell
pnpm run dev
```

## O que observar

A duplicação pode não produzir erro imediato porque as versões são iguais e o runtime ainda pode escolher/reutilizar uma cópia. Procure por:

- mais de um asset relacionado a React/ReactDOM;
- warnings de negociação no console;
- Context criado por uma cópia e lido por outra sem o valor esperado;
- erros de Hooks quando componente e renderer usam instâncias diferentes;
- comportamento diferente ao introduzir versões incompatíveis apenas na cópia experimental.

Não force versões incompatíveis no lockfile da linha principal. A finalidade é entender o risco, não fabricar um repositório quebrado.

`singleton` reduz a possibilidade de duas instâncias no mesmo share scope; não comprova que APIs e comportamentos de versões diferentes sejam semanticamente compatíveis.

## Restaurar

Se o teste foi feito em branch e não possui trabalho que precise ser preservado, volte para a branch principal e apague a branch apenas quando tiver certeza de que ela é descartável:

```powershell
git switch main
git branch -d experimento/sem-react-singleton
```

Alternativamente, reverta manualmente todas as entradas para `singleton: true` e execute `pnpm run check`.

## Resultado observado no estado correto

- O painel foi exibido somente no servidor de desenvolvimento.
- Shell e Products informaram React `19.2.8`.
- A comparação de uma função exportada pelo React confirmou que Products reutilizou a mesma instância observada pelo Shell.
- Account informou Vue `3.5.42`.
- Os dois remotes e as versões diferentes de `ui-react` ficaram visíveis.
- As URLs mostradas coincidiram com as usadas pela configuração do consumer.
- Os manifests gerados marcaram pacotes e subpaths React como singletons com `requiredVersion: 19.2.8`.
- O build de produção não apresentou o texto do painel em seus artefatos.
