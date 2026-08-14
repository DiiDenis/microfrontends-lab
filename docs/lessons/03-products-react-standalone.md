# Etapa 03 — Products React standalone

## O que foi criado

Foi criada em `apps/products-react` uma SPA React independente na porta 3001. Ela apresenta exatamente dois produtos mockados e mantém localmente a quantidade de itens adicionados.

## Por que foi criado

Products precisa primeiro funcionar como aplicação autônoma para deixar visível sua fronteira de código, build e execução antes da composição. Separar `ProductApp` do bootstrap evita misturar a interface principal com a decisão de onde montar React.

Essa separação será útil porque o modo standalone e uma integração futura poderão reutilizar `ProductApp`, enquanto cada contexto controla seu próprio bootstrap. Apesar disso, o componente ainda não foi exposto como módulo remoto.

## Fluxo de execução

1. Rsbuild inicia o app na porta 3001.
2. `src/index.tsx` encontra o elemento `#root` e cria a raiz React.
3. O bootstrap renderiza somente `ProductApp`.
4. `ProductApp` renderiza os dois produtos e mantém seu contador com `useState`.
5. Cada clique em `Adicionar` incrementa apenas o estado desta aplicação.

## App standalone versus módulo remoto

Um app standalone possui entrada HTML, bootstrap próprio e pode abrir diretamente no navegador. Um módulo remoto é uma parte explicitamente exposta para outro build resolver e carregar. Neste momento Products é apenas standalone: não existe manifesto federado, exposição de módulo nem configuração para o shell encontrá-lo.

O shell ainda não consegue usar este app porque não há contrato de integração, endereço de remote, módulo exposto ou carregamento em runtime. Estar em outro diretório e outra porta não realiza composição automaticamente.

## Arquivos importantes

- `package.json`: dependências e comandos exclusivos de Products.
- `rsbuild.config.ts`: plugin React e porta 3001.
- `src/index.tsx`: bootstrap exclusivamente standalone.
- `src/ProductApp.tsx`: interface e estado local da funcionalidade.
- `src/ProductApp.module.css`: estilos isolados do componente.

## Comandos

```powershell
pnpm install
pnpm run dev:products
pnpm run typecheck:products
pnpm run build:products
```

## Como validar

Abra `http://localhost:3001`, confirme a marca de ownership, os dois produtos e o contador iniciado em zero. Clique nos dois botões e verifique que cada clique incrementa o mesmo contador local.

## Erros comuns

- Importar `ProductApp` diretamente no shell e criar acoplamento de build.
- Configurar Module Federation antes da etapa dedicada.
- Colocar `createRoot` dentro de `ProductApp`.
- Guardar o contador no shell ou em estado global.
- Adicionar React Router sem existir mais de uma rota.

## Perguntas de revisão

1. Por que `ProductApp` não cria sua própria raiz React?
2. O que diferencia esta SPA de um módulo remoto federado?
3. O que seria necessário para o shell carregar Products em runtime?

## Exercício manual

Troque o nome de um dos dois produtos, execute o app e confirme que o contador continua sendo responsabilidade de `ProductApp`. Depois desfaça a alteração.

## Explicação de entrevista em até 90 segundos

Products agora é uma SPA React independente, com build, servidor e estado próprios. O bootstrap apenas cria a raiz React e renderiza `ProductApp`; essa separação mantém a interface desacoplada da forma de montagem e prepara uma futura integração. Ainda não existe Module Federation: o app não expõe módulos, não produz manifesto federado e o shell não conhece seu endereço. Outra pasta e outra porta criam independência de execução, mas não composição. Hoje Products abre sozinho; numa etapa futura ele poderá também fornecer sua interface ao shell por meio de um contrato explícito de runtime.

