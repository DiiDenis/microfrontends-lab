# Etapa 02 — Shell React standalone

## O que foi criado

Foi criada uma SPA React independente em `apps/shell-react`, construída com Rsbuild e executada na porta 3000. Ela possui navegação client-side entre Home e dois placeholders.

## Por que foi criado

O shell será o ponto de entrada da experiência completa. Antes de conectar remotes, precisamos enxergar claramente o que ele consegue executar sozinho e quais responsabilidades já lhe pertencem.

Ainda não existe um micro frontend composto: há somente uma aplicação, um processo de build e um bundle. Os placeholders são componentes locais e nenhum código é carregado de outra aplicação em runtime.

## Fluxo de execução

1. Rsbuild lê `rsbuild.config.ts` e inicia o servidor na porta 3000.
2. O entrypoint `src/index.tsx` cria a raiz React e instala o `BrowserRouter`.
3. `src/App.tsx` renderiza o layout do shell e escolhe uma página conforme a URL.
4. A navegação por `NavLink` atualiza o histórico do navegador sem recarregar a página.

No futuro, o shell continuará dono da navegação global e substituirá os placeholders pelos pontos de integração dos remotes. Centralizar inicialmente as rotas evita que aplicações ainda inexistentes disputem a URL e deixa o ownership explícito.

## Arquivos importantes

- `package.json`: scripts e dependências exclusivas do shell.
- `rsbuild.config.ts`: plugin React, porta e HTML da aplicação.
- `tsconfig.json`: herda as regras estritas da raiz e habilita JSX.
- `src/index.tsx`: bootstrap mínimo de React.
- `src/App.tsx`: layout, navegação e rotas.
- `src/App.module.css`: estilos isolados do layout.
- `src/global.css`: pequeno reset global do `body`.

O bootstrap mínimo é formado pela configuração do Rsbuild, o entrypoint que cria a raiz React e o componente de aplicação renderizado nessa raiz.

## Comandos

```powershell
pnpm.cmd install
pnpm.cmd dev:shell
pnpm.cmd typecheck:shell
pnpm.cmd build:shell
```

## Como validar

Abra `http://localhost:3000`, use os três links e confirme que a URL e o conteúdo mudam sem recarregar a página. Depois execute typecheck e build a partir da raiz.

## Erros comuns

- Confundir os placeholders locais com remotes federados.
- Usar links HTML comuns e provocar recarregamentos completos.
- Criar um roteador separado para cada placeholder.
- Adicionar entrada assíncrona antes de existir uma necessidade técnica.
- Inserir estilos globais que deveriam permanecer isolados no CSS Module.

## Perguntas de revisão

1. Por que este shell ainda não representa uma composição de micro frontends?
2. Qual responsabilidade o `BrowserRouter` exerce nesta etapa?
3. Quais arquivos participam do bootstrap mínimo da aplicação?

## Exercício manual

Altere o texto da Home, execute o shell e confirme que somente a rota `/` mudou. Depois desfaça a alteração.

## Explicação de entrevista em até 90 segundos

Nesta etapa existe uma SPA React standalone construída com Rsbuild. O shell já controla o layout global e o roteamento client-side, mas ainda não compõe micro frontends: Products e Account são apenas componentes locais com texto. O Rsbuild fornece o servidor e o build; `index.tsx` cria a raiz React e instala o BrowserRouter; `App.tsx` define navegação e rotas. Manter o roteamento no shell cria uma URL global coerente e prepara pontos de integração futuros. Só haverá composição quando o shell carregar código produzido e entregue por aplicações independentes, algo que ainda não foi configurado.

