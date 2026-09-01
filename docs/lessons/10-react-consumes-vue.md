# Etapa 10 — React consome o remote Vue

## O que foi criado

O shell React passou a registrar o producer `account` pelo manifest da porta 3002 e a montar `account/mount` na rota `/account`. O placeholder foi substituído pelo adapter React `VueRemoteRoute`, com loading, erro isolado, retry, proteção contra import atrasado e cleanup por `unmount()`.

A URL aceita `ACCOUNT_REMOTE_URL` e usa `http://localhost:3002/mf-manifest.json` como fallback local explícito. Uma declaração pequena no consumer descreve apenas o contrato `account/mount`; ela será extraída em uma etapa posterior.

## Por que foi criado

Esta é a primeira composição entre frameworks do laboratório. React e Vue não compartilham o formato de seus componentes, mas ambos podem concordar sobre uma fronteira do navegador: um `HTMLElement`, dados simples e operações de lifecycle.

O adapter concentra essa tradução para que o restante do shell continue pensando em rotas React e o remote continue pensando em uma aplicação Vue.

## Fluxo de execução

1. O usuário entra em `/account`.
2. React Router renderiza `VueRemoteRoute`.
3. React cria a `<div>` do adapter e `useRef` recebe seu elemento.
4. `useEffect` executa `import('account/mount')`.
5. O runtime consulta o manifest e carrega o remote entry e os chunks de Account.
6. O adapter chama `mount(container, { source: 'shell-react', initialUserName: 'Denis' })`.
7. Vue monta Account dentro do container e devolve um handle.
8. Ao sair da rota, o cleanup do efeito chama `handle.unmount()` antes que React descarte o adapter.

## Fronteira de framework

React não renderiza `AccountApp.vue`. Ele renderiza somente `VueRemoteRoute` e a `<div>` que servirá de fronteira. O adapter também não importa `vue` nem chama `createApp`; essas decisões pertencem ao producer.

Esse desenho evita ensinar ao shell detalhes internos de Vue. Se a implementação do remote mudar e preservar o contrato `mount`/`unmount`, a integração pode continuar igual.

## Ownership do DOM

O shell decide em qual rota e posição o container existe. Portanto, React é dono do elemento contêiner. Depois de `mount`, Vue é dono dos elementos internos que criou.

O adapter deixa a `<div>` vazia do ponto de vista de JSX. Colocar loading ou outros filhos React dentro do mesmo elemento entregue ao Vue criaria dois renderizadores tentando controlar a mesma região. Loading e erro ficam como elementos irmãos.

## Lifecycle e cleanup da rota

O efeito guarda o handle devolvido pelo remote. Quando `/account` deixa de ser a rota ativa, React executa o cleanup, que chama `unmount()`. Isso permite ao Vue encerrar componentes, efeitos reativos, listeners e remover seu DOM antes que o container desapareça.

O cleanup também é importante no `StrictMode` de desenvolvimento, onde React pode executar uma sequência extra de setup e cleanup para revelar efeitos incorretos. A proteção do remote e o cleanup do adapter evitam montagens sobrepostas.

## Corrida do import assíncrono

O usuário pode entrar em `/account` e sair antes que a rede termine de entregar `account/mount`. A Promise não é cancelada automaticamente. Sem proteção, seu callback poderia tentar montar Vue usando um container removido ou atualizar estado de um componente desmontado.

Cada execução do efeito mantém um booleano `cancelled`. O cleanup muda esse valor para `true`. Quando o import termina, o adapter verifica o sinal antes de ler o ref ou chamar `mount`; um resultado atrasado é simplesmente ignorado.

## Loading, erro e retry

Enquanto o módulo é resolvido, o adapter mostra `Carregando Account...`. Falhas de import ou montagem são capturadas e substituídas por `Account indisponível`, com um botão `Tentar novamente`.

O erro permanece limitado à rota Account; Home, Products, navegação e header continuam sob controle do shell.

O runtime de Module Federation pode manter em memória uma falha anterior do manifest. Repetir somente o mesmo `import()` dentro da mesma página não garante uma nova busca. Por isso, o retry simples desta etapa recarrega a URL atual: a nova página cria outra instância do runtime e tenta carregar Account novamente. Uma retentativa sem reload exigiria controlar explicitamente o cache pela API de runtime ou adicionar uma política própria de retry, o que está fora do escopo desta etapa.

## Contrato TypeScript duplicado

O arquivo `account-remote.d.ts` declara somente `account/mount`, suas opções e o handle de cleanup, sem `any`. Essa declaração permite ao consumer verificar o uso do contrato, mas é uma duplicação: alterar apenas o producer não atualiza automaticamente este arquivo.

Ela não valida disponibilidade, manifest nem comportamento em runtime. A próxima etapa poderá extrair essa superfície para uma fonte compartilhada, mas nenhuma abstração foi antecipada aqui.

## Arquivos importantes

- `apps/shell-react/rsbuild.config.ts`: registro e URL configurável de Account.
- `apps/shell-react/.env.example`: exemplo de `ACCOUNT_REMOTE_URL`.
- `apps/shell-react/src/App.tsx`: rota `/account` usando o adapter.
- `apps/shell-react/src/VueRemoteRoute.tsx`: import, mount, loading, erro, retry, corrida e cleanup.
- `apps/shell-react/src/account-remote.d.ts`: contrato local estrito do consumer.
- `apps/account-vue/src/mount.ts`: implementação remota consumida sem alteração.
- `docs/diagrams/10-react-host-vue-lifecycle.md`: sequência de montagem e desmontagem.

## Comandos

```powershell
pnpm run dev
pnpm run typecheck
pnpm run build
pnpm run check
```

Para configurar outra origem no PowerShell:

```powershell
$env:ACCOUNT_REMOTE_URL = 'https://exemplo.local/mf-manifest.json'
pnpm run build:shell
```

## Como validar

Inicie os três apps com `pnpm run dev`. Abra `http://localhost:3000/` e confirme Home. Navegue para Products e verifique o remote React. Depois entre em Account e confirme `Remote version: account-v1`, `Origem: shell-react` e `Denis`.

Alterne o papel, volte para Home e entre novamente em Account. O papel deve voltar ao valor inicial porque a aplicação anterior foi destruída e outra instância foi montada. Repita a navegação várias vezes e confira que existe apenas uma interface Account.

Para testar isolamento e retry, pare Account, recarregue `/account` e confirme a mensagem de erro. Verifique que Home e Products permanecem funcionais. Volte à rota Account, reinicie o remote e clique em `Tentar novamente`; a página atual será recarregada e Account deverá montar.

## Erros comuns

- Importar `vue` ou `createApp` dentro do shell.
- Tentar usar `AccountApp.vue` como JSX React.
- Entregar ao Vue um elemento que ainda não existe.
- Renderizar filhos React dentro do container controlado pelo Vue.
- Esquecer de guardar e chamar o handle de `unmount()`.
- Atualizar estado ou montar após um import terminar para uma rota já desmontada.
- Colocar o tratamento de erro ao redor de todo o shell.
- Supor que repetir um import federado rejeitado sempre limpa o cache do runtime.
- Considerar a declaração TypeScript local uma validação de runtime.

## Perguntas de revisão

1. Por que `VueRemoteRoute` é um adapter e não uma conversão de Vue para React?
2. Quem controla o container e quem controla seus filhos durante a montagem?
3. Como o sinal de cancelamento evita uma montagem atrasada após a saída da rota?

## Exercício manual

Entre em `/account`, altere o papel para `Operador`, volte para Home e retorne a Account. Explique por que o papel volta para `Administrador` relacionando o resultado ao cleanup do `useEffect`, ao `unmount()` do remote e à criação de uma nova aplicação Vue.

## Explicação de entrevista em até 90 segundos

Para compor Vue em um host React, eu uso uma fronteira imperativa em vez de tentar renderizar um componente Vue como React. O adapter React cria um container por ref e, no efeito, importa `account/mount` em runtime. Quando o container existe, passa dados iniciais e guarda o handle retornado. Vue é dono do DOM interno; React é dono da posição e da vida do container. Ao sair da rota, o cleanup chama `unmount()`, evitando listeners, efeitos e instâncias antigas. Um sinal de cancelamento impede que um import lento monte depois que a rota desapareceu. Loading, falha e retry ficam restritos ao adapter, então os demais micro frontends e o shell continuam funcionando.
