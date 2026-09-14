# Etapa 18 — Dependências compartilhadas visíveis

## O que foi criado

O Shell ganhou um painel técnico pequeno e recolhível, renderizado somente em desenvolvimento. Ele apresenta:

- React usado pelo Shell;
- React informado pelo remote Products;
- confirmação por identidade de que Products reutiliza o React do Shell;
- Vue informado pelo remote Account;
- versões públicas de Products e Account;
- `ui-react` usado por Shell e Products;
- URLs efetivas dos manifests.

Products e Account agora expõem `./technicalInfo`, módulos públicos pequenos e tipados. As versões visíveis dos componentes também reutilizam as mesmas constantes, evitando duas fontes de verdade.

## Por que foi criado

`shared` acontece no runtime do Module Federation e costuma ficar invisível durante o uso normal da interface. O painel transforma versões e origens relevantes em informação observável sem acessar objetos globais ou estruturas internas instáveis do runtime.

Ele não tenta reproduzir um DevTools: mostra apenas dados que cada aplicação decidiu publicar como contrato técnico.

## Fluxo de execução

```text
Shell em desenvolvimento
├── React.version local
├── UI_REACT_VERSION local
├── PRODUCTS_REMOTE_URL definido no build
├── ACCOUNT_REMOTE_URL definido no build
├── import products/technicalInfo
│   └── React.version + products-v3 + UI React 1.1.0
└── import account/technicalInfo
    └── Vue.version + account-v1
             ↓
       painel <details>
```

Os imports técnicos podem consultar os remotes antes de suas rotas durante desenvolvimento. A interface de produção não monta o painel porque `import.meta.env.DEV` é falso no build final.

## Provider e consumer da dependência

No compartilhamento, um container registra uma versão disponível e outro solicita uma versão compatível. Um mesmo container pode ser provider e consumer conforme o módulo.

Shell e Products possuem React `19.2.8` instalado e ambos podem registrá-lo. Quando o módulo remoto é carregado, o runtime negocia uma instância no share scope.

Account registra Vue `3.5.42`. O Shell não importa nem instala Vue, então ele não fornece essa dependência. Os módulos remotos de Account usam a versão oferecida pelo próprio container Vue.

## Share scope

O share scope é um catálogo runtime de dependências compartilháveis. A configuração usa implicitamente o escopo `default`:

```text
share scope default
├── react 19.2.8
├── react/jsx-runtime 19.2.8
├── react-dom 19.2.8
├── react-dom/client 19.2.8
└── vue 3.5.42, fornecido por Account
```

Somente containers participantes do mesmo escopo negociam entre si.

## Singleton

`singleton: true` pede ao runtime uma única versão/instância daquele identificador dentro do share scope. Isso é importante para React porque renderer, Hooks e Context dependem de identidade coerente.

Também tornamos explícitos os subpaths realmente importados:

```text
react/jsx-runtime
react-dom/client
```

Compartilhar somente `react-dom` não intercepta automaticamente `import 'react-dom/client'` na semântica documentada de prefixos. As entradas `react/` e `react-dom/` fazem os subpaths participarem da negociação; os manifests confirmam os nomes finais.

## Required version

`requiredVersion: '19.2.8'` informa qual versão o consumidor espera para React e ReactDOM. Account exige Vue `3.5.42`.

O runtime usa esse dado na seleção e pode emitir warning quando ofertas não satisfazem o requisito. O laboratório usa versões exatas para manter o experimento determinístico.

`requiredVersion` não testa o comportamento da aplicação. Duas versões podem satisfazer uma faixa e ainda existir uma mudança semântica inadequada para o contrato da equipe.

## `singleton` não garante compatibilidade semântica

Singleton responde principalmente:

> Quantas instâncias desse módulo devem participar deste share scope?

Ele não responde:

> Esta versão funciona corretamente com todo o código de todos os remotes?

Se versões incompatíveis forem negociadas, ter apenas uma cópia pode trocar duplicidade por quebra funcional. Compatibilidade exige política de versões, testes integrados e observabilidade.

## Evitar duplicidade não é distribuir feature code

Compartilhar React evita repetir uma infraestrutura comum necessária para renderização. Expor `products/ProductApp` distribui código de domínio.

```text
shared react
→ negocia uma dependência técnica

exposes ProductApp
→ entrega uma feature remota
```

`shared` não transforma React em uma feature exposta, e `exposes` não torna automaticamente as dependências internas singletons.

## Por que `ui-react` não entrou em `shared`

Shell usa `ui-react@1.0.0` e Products usa `1.1.0` de propósito. Cada biblioteca já está embutida no bundle de seu consumidor em build time.

Colocá-la em `shared` somente para reduzir alguns bytes mudaria o modelo:

- criaria negociação de versão em runtime;
- poderia fazer um app receber implementação diferente da testada no próprio build;
- reduziria a clareza do experimento de adoção independente;
- aumentaria o acoplamento entre releases das equipes.

Pacotes devem entrar em `shared` por necessidade de identidade, tamanho ou comportamento runtime claramente avaliado, não como regra automática.

## Como o painel preserva contratos públicos

Products expõe:

```ts
PRODUCTS_TECHNICAL_INFO
```

Account expõe:

```ts
ACCOUNT_TECHNICAL_INFO
```

O Shell importa `products/technicalInfo` e `account/technicalInfo`. Não lê share scopes globais, caches privados ou nomes internos do plugin. Products gera tipos remotos automaticamente; Account mantém a pequena declaração de consumer já usada pela fronteira Vue.

Products também exporta uma referência pública à função `useState` recebida de React. O Shell compara essa referência com seu próprio `useState` usando `===`. Duas cópias separadas do pacote teriam funções com identidades diferentes; o resultado `sim` confirma que, nesta execução, o módulo remoto reutilizou a mesma instância observada pelo Shell.

As URLs dos manifests são injetadas no código de desenvolvimento pelos mesmos valores calculados em `rsbuild.config.ts`, portanto o painel não mantém fallbacks duplicados.

## Limites do painel

Mostrar `19.2.8` nos dois lados prova apenas igualdade de versão. A comparação pública de `useState` acrescenta a evidência de identidade da instância nesta execução, mas ainda não garante compatibilidade funcional futura. A configuração dos manifests, os testes e o comportamento integrado completam a observação.

O painel também não deve ser usado como API de monitoramento de produção. Observabilidade real teria métricas, logs e tracing adequados.

## Arquivos importantes

- `apps/shell-react/src/TechnicalPanel.tsx`: carregamento dos contratos e apresentação.
- `apps/shell-react/rsbuild.config.ts`: remotes, URLs definidas e regras shared.
- `apps/products-react/src/technicalInfo.ts`: contrato técnico React público.
- `apps/products-react/rsbuild.config.ts`: expose e compartilhamento React.
- `apps/account-vue/src/technicalInfo.ts`: contrato técnico Vue público.
- `apps/account-vue/rsbuild.config.ts`: expose e compartilhamento Vue.
- `apps/*/dist/mf-manifest.json`: evidência gerada de versões, singleton e módulos expostos.
- `docs/experiments/04-shared-dependencies.md`: exercício manual seguro.

## Comandos

```powershell
pnpm run build:products
pnpm run build:account
pnpm run build:shell
pnpm run typecheck
pnpm run dev
pnpm run check
```

## Como validar

1. Inicie os três apps com `pnpm run dev`.
2. Abra `http://localhost:3000`.
3. Expanda o painel técnico.
4. Confirme `Products reutiliza o React do Shell: sim`.
5. Confirme frameworks, remotes, versões de UI e manifests.
6. Navegue entre Home, Products e Account e confirme que o painel pertence ao Shell.
7. Inspecione os manifests dos remotes e encontre `singleton` e `requiredVersion`.
8. Execute um build de produção do Shell e confirme que o painel não aparece na interface final.
9. Execute `pnpm run check`.

## Erros comuns

- Acreditar que `singleton` valida compatibilidade semântica.
- Compartilhar o pacote raiz, mas esquecer subpaths realmente importados.
- Colocar todas as dependências em `shared` para tentar reduzir bundle.
- Compartilhar `ui-react` e eliminar sem perceber a autonomia de versões demonstrada.
- Ler globals internos do runtime para preencher uma interface de aplicação.
- Confundir a versão declarada no package.json com prova de comportamento integrado.
- Exibir painel técnico de laboratório em produção.
- Acreditar que o Shell fornece Vue mesmo sem importar Vue.

## Perguntas de revisão

1. Quem pode fornecer React em runtime e quem fornece Vue?
2. Por que `singleton` não garante compatibilidade semântica?
3. Por que `ui-react` não foi adicionada automaticamente a `shared`?

## Exercício manual

Abra o painel em `/products`, anote React e `ui-react` de cada aplicação e compare com os manifests gerados. Explique em voz alta por que React aparece igual, enquanto a biblioteca de UI aparece em duas versões.

## Explicação de entrevista em até 90 segundos

No laboratório, Shell e Products registram React e ReactDOM como dependências compartilhadas, singletons e com versão exigida `19.2.8`. Também cobrimos os subpaths `react/jsx-runtime` e `react-dom/client`, porque eles são imports reais e precisam participar do share scope. Account fornece Vue `3.5.42`; o Shell não importa Vue. Criamos módulos públicos de diagnóstico e comparamos uma referência de `useState`, confirmando que Products reutilizou a instância de React observada pelo Shell sem acessar internals. `singleton` protege identidade de Hooks, Context e renderer, mas não garante compatibilidade semântica. Não compartilhamos `ui-react`: Shell usa `1.0.0` e Products `1.1.0`, testadas em seus próprios builds. Compartilhar tudo reduziria autonomia e criaria negociação runtime sem necessidade real.

## Referências oficiais consultadas

- [Module Federation: configuração `shared`](https://module-federation.io/configure/shared)
- [Module Federation: campos do manifest](https://module-federation.io/guide/advanced/manifest-fields.html)
- [Module Federation: múltiplos share scopes](https://module-federation.io/guide/advanced/multiple-shared-scope)
