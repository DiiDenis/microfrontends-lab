# Etapa 21 — Testes de integração

## O que foi criado

Foi adicionada uma suíte pequena com duas camadas:

- Vitest verifica os nomes públicos dos Custom Events e os formatos tipados usados em seus payloads;
- Playwright abre o Shell em um Chromium real e atravessa as fronteiras de Products e Account.

O Playwright inicia os três servidores quando eles não estão disponíveis e pode reutilizar processos locais durante o desenvolvimento. A execução é serial para manter previsíveis os eventos, a navegação e a simulação de falha de rede.

## Por que foi criado

Um teste isolado de `ProductApp` provaria somente que o componente funciona. Ele não provaria que o Shell consegue resolver o manifest, carregar o módulo exposto, negociar dependências, renderizá-lo na rota e receber seu evento.

O E2E é importante porque Module Federation desloca parte da integração para runtime. O navegador precisa encontrar três servidores e executar contratos que pertencem a builds diferentes. A suíte testa a experiência pela mesma porta que o usuário acessa: `http://localhost:3000`.

## Fluxo de execução

### Unitário

```text
Vitest
  ↓
importa o contrato fonte
  ↓
confere nomes estáveis e distintos
  ↓
cria Custom Events com payloads aceitos pelo TypeScript
```

### E2E de Products

```text
Playwright abre o Shell
  ↓
clica em Products
  ↓
Shell busca o manifest e o módulo na porta 3001
  ↓
Products aparece dentro da rota
  ↓
clique em Adicionar dispara mfe-lab:cart-updated
  ↓
header do Shell mostra Carrinho: 1
```

### E2E de Account

```text
Playwright entra em Account
  ↓
Shell importa account/mount e fornece um container
  ↓
Vue monta uma única raiz e publica o papel
  ↓
Shell atualiza o header
  ↓
saída da rota remove a raiz
  ↓
nova entrada cria exatamente uma raiz nova
```

### Remote indisponível

O teste intercepta no navegador as requisições para `localhost:3001` e as encerra como conexão recusada. Isso simula indisponibilidade sem matar processos de forma frágil. Products apresenta seu fallback local; em seguida, Home continua navegável.

## Unitário, contrato e E2E

Um teste unitário verifica uma unidade com poucas dependências e localiza falhas rapidamente. Nesta etapa ele protege os valores runtime que conectam publishers e subscribers.

Um contract test verifica se producer e consumer concordam sobre uma superfície pública, por exemplo nome do expose, export, props, evento e payload. O teste unitário atual protege somente a parte runtime dos eventos; os builds e o TypeScript continuam protegendo parte dos contratos de módulo.

Um E2E observa o sistema montado pela interface pública. Ele é mais lento e localiza a causa com menos precisão, mas comprova relações que um unitário não enxerga: rede, manifest, chunk remoto, rota, lifecycle e comunicação entre aplicações.

## Por que não foi criado um unitário do SFC Vue

Testar `mount.ts` diretamente exigiria ensinar ao runner como compilar `.vue` ou alterar a implementação para injetar uma fábrica apenas para o teste. Isso adicionaria outro plugin de compilação e acoplamento excessivo nesta etapa.

O comportamento de lifecycle que oferece maior risco arquitetural foi testado pelo caminho real: entrar, sair e entrar novamente na rota Account. O teste confere que a raiz desaparece no cleanup e volta com contagem exatamente igual a um. Um unitário específico poderá existir quando houver lógica de lifecycle pura que justifique essa configuração.

## Como evitar testes frágeis entre equipes

- selecionar por papel, nome acessível e texto público;
- usar `data-testid` somente quando não existe semântica estável;
- afirmar contratos e resultados, não classes geradas ou estrutura interna;
- não consultar hooks, refs, estado React ou refs Vue;
- não depender de tempo fixo com `sleep`;
- limitar cada cenário a um comportamento arquitetural claro;
- manter falhas simuladas sob controle do próprio contexto do navegador.

`data-mfe-owner` é usado somente para contar as raízes públicas. Os testes não consultam hashes de CSS Modules nem atributos `data-v` gerados pelo Vue.

## Riscos ainda não cobertos

- outros navegadores além de Chromium;
- cache e CDN de produção;
- manifests e chunks publicados em versões incompatíveis;
- falha durante a renderização interna de Products ou durante o `mount` de Account;
- acessibilidade completa e comparação visual;
- performance, timeout e alta concorrência;
- containers e Nginx, que pertencem à próxima etapa;
- validação runtime do formato de payload recebido de código não confiável.

Não foi perseguida cobertura artificial de 100%. A suíte cobre os caminhos que provam a arquitetura atual.

## Arquivos importantes

- `vitest.config.mts`: limita os unitários a `tests/unit` e usa ambiente Node.
- `playwright.config.ts`: define Chromium, Shell como `baseURL` e os três servidores.
- `tests/unit/mfe-contracts.test.ts`: protege valores runtime dos contratos de eventos.
- `tests/e2e/microfrontends.spec.ts`: prova composição, comunicação, lifecycle e resiliência.
- `package.json`: oferece comandos únicos para testes e check completo.

## Comandos

```powershell
pnpm run test:unit
pnpm run test:e2e
pnpm run test
pnpm run check:all
```

Na primeira preparação da máquina, o Chromium do Playwright é instalado uma única vez:

```powershell
pnpm exec playwright install chromium
```

## Como validar

1. Execute `pnpm run test:unit` e confirme dois testes aprovados.
2. Execute `pnpm run test:e2e` sem iniciar manualmente os apps.
3. Confirme os quatro cenários aprovados no projeto `chromium`.
4. Verifique que o cenário de Products realmente parte da URL do Shell.
5. Execute `pnpm run check:all` para combinar typecheck, builds e testes.

## Resultado observado

Em 14 de setembro de 2026:

- o Vitest executou um arquivo, com dois testes aprovados;
- o Playwright executou quatro cenários no Chromium, todos aprovados;
- Products e Account responderam seus manifests durante os respectivos testes de composição;
- o cenário com a rede de Products bloqueada mostrou o fallback e preservou Home;
- `pnpm run check:all` concluiu typecheck, builds, unitários e E2E sem falhas.

O build manteve o aviso já conhecido de que o plugin adiciona CORS permissivo no servidor de desenvolvimento. A configuração explícita de CORS para entrega em produção pertence à etapa de Nginx e containers, não foi antecipada aqui.

## Erros comuns

- testar apenas `localhost:3001` e concluir que a federação funciona;
- usar esperas fixas em vez das expectativas automáticas do Playwright;
- selecionar hashes de CSS, posições ou detalhes privados de framework;
- desligar processos manualmente no meio da suíte e deixá-la não determinística;
- executar E2E em paralelo quando os cenários compartilham estado operacional;
- confundir tipagem TypeScript com validação runtime de dados externos;
- exigir 100% de cobertura sem relacionar testes a riscos reais.

## Perguntas de revisão

1. Qual teste prova que Products foi realmente composto no Shell?
2. Por que testar somente `ProductApp` isolado não valida Module Federation?
3. O que um contract test entre builds independentes poderia verificar além dos eventos atuais?

## Exercício manual

Troque temporariamente o nome do evento de carrinho somente em Products, execute o E2E e observe que o contador do próprio remote muda, mas o header do Shell não. Depois restaure o contrato e confirme que o teste volta a passar.

## Explicação de entrevista em até 90 segundos

Usei uma pirâmide pequena orientada aos riscos da arquitetura. Vitest protege os identificadores runtime dos Custom Events e seus payloads tipados. Playwright abre o Shell e prova a composição real: navegar para Products carrega a marca do remote, um clique cruza a fronteira e atualiza o header; Account monta Vue num container React, comunica o papel, desmonta ao sair e não duplica ao voltar. Outro cenário bloqueia a rede de Products e confirma fallback local sem derrubar Home. Os três servidores são gerenciados pela configuração do Playwright, então não há preparação manual confusa. Os testes usam papéis, nomes acessíveis e marcadores públicos, nunca hooks ou DOM interno dos frameworks. Não busquei 100% de cobertura; cobri rede, composição, comunicação, lifecycle e isolamento de falha.

## Referências oficiais consultadas

- [Vitest — Getting Started](https://vitest.dev/guide/)
- [Playwright — Web server](https://playwright.dev/docs/test-webserver)
- [Playwright — Test configuration](https://playwright.dev/docs/test-configuration)
