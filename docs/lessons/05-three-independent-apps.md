# Etapa 05 — Três aplicações independentes

## O que foi criado

A raiz ganhou comandos para iniciar, verificar e construir todos os apps. O README agora registra responsabilidades, portas e status de integração. O shell passou a informar explicitamente que seus placeholders não incorporam Products nem Account. Também foi registrada uma fotografia arquitetural anterior ao Module Federation.

## Por que foi criado

Precisamos observar o estado pré-composição sem ambiguidade. Três aplicações podem ter código, processos, builds e futuros deploys independentes, mas isso não significa que formem uma única experiência em runtime.

O comando compartilhado é somente orquestração de desenvolvimento: o pnpm inicia três processos em paralelo. Ele não transforma a raiz em servidor e não cria comunicação entre os apps.

## Fluxo de execução

1. `pnpm run dev` seleciona todos os workspaces em `apps/*`.
2. O pnpm executa o script `dev` de cada app em paralelo.
3. Cada Rsbuild inicia seu servidor próprio: shell em 3000, Products em 3001 e Account em 3002.
4. Cada endereço entrega seu HTML e seus bundles de forma independente.
5. O shell continua renderizando componentes locais de placeholder nas rotas `/products` e `/account`.

## Três deploys não significam composição

Deploy independente descreve como um artefato pode ser construído e entregue. Composição descreve como partes independentes participam da mesma experiência apresentada ao usuário. Neste momento temos um monorepo com três SPAs standalone que são candidatas a micro frontends por suas fronteiras de responsabilidade, mas ainda não temos uma aplicação composta por micro frontends.

Abrir outra URL é navegação entre sites ou aplicações: o navegador abandona ou troca a experiência atual e carrega outro documento completo. Carregar um remote significa o shell permanecer ativo e resolver em runtime um módulo produzido por outro deploy para renderizá-lo dentro de sua própria página.

## O problema da próxima etapa

A próxima etapa deverá criar a primeira ligação de runtime. Products será inicialmente o producer, porque produzirá e exporá um módulo. O shell será o consumer, porque conhecerá o endereço do remote e carregará esse módulo. Isso substituirá um placeholder local por código fornecido pelo processo da porta 3001 sem usar iframe ou simples navegação externa.

## Arquivos importantes

- `package.json`: scripts gerais baseados em filtros do pnpm.
- `README.md`: inventário dos apps e status de integração.
- `apps/shell-react/src/App.tsx`: placeholders locais explicitamente identificados.
- `docs/diagrams/05-before-federation.md`: fotografia sem relações de composição.
- `docs/progress.md`: acompanhamento das etapas concluídas.

## Comandos

```powershell
pnpm run dev
pnpm run typecheck
pnpm run build
pnpm run check
```

## Como validar

Execute `pnpm run dev` e abra as portas 3000, 3001 e 3002 em abas separadas. Confirme que Products e Account funcionam sozinhos e que as rotas equivalentes do shell continuam exibindo apenas os textos locais. Encerre o comando com `Ctrl+C` e execute `pnpm run check`.

## Erros comuns

- Chamar três SPAs separadas de experiência composta apenas porque iniciam juntas.
- Tratar o script raiz como um servidor adicional.
- Usar links externos ou iframe para esconder a ausência de integração.
- Duplicar uma dependência como `concurrently` quando o pnpm já executa scripts em paralelo.
- Confundir navegar para outro documento com carregar código remoto no documento atual.

## Perguntas de revisão

1. Quais características de micro frontends já existem e qual característica central ainda falta?
2. Por que o comando raiz `dev` não cria comunicação entre os três processos?
3. Na primeira integração, quem será producer e quem será consumer?

## Exercício manual

Com os três apps rodando, pare apenas Products e recarregue `/products` no shell. Observe que o placeholder continua funcionando, pois ainda não existe dependência de runtime. Depois reinicie Products.

## Explicação de entrevista em até 90 segundos

O repositório contém um monorepo com três SPAs de responsabilidades e builds distintos. Elas podem ser iniciadas em paralelo pelo pnpm, mas continuam entregando três documentos independentes. Isso demonstra independência operacional, não composição de micro frontends. Navegar para outra URL substitui a aplicação atual; composição mantém o shell e carrega uma parte produzida por outro deploy dentro da mesma experiência. A próxima etapa transformará Products em producer e o shell em consumer, criando a primeira resolução de módulo em runtime e substituindo o placeholder local sem iframe.

