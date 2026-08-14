# Etapa 01 — Esqueleto e contrato de trabalho

## O que foi criado

Foi criada a raiz do workspace, suas pastas reservadas, a configuração comum de TypeScript, os arquivos básicos do pnpm e as regras permanentes do laboratório.

## Por que foi criado

O esqueleto oferece um lugar previsível para aplicações, pacotes, infraestrutura e documentação. O `AGENTS.md` limita cada evolução a uma etapa pequena e revisável.

## Fluxo de execução

Nesta etapa não há aplicação executável. O pnpm lê o manifesto da raiz e identifica como membros do workspace os futuros diretórios em `apps/*` e `packages/*`.

## Arquivos importantes

- `AGENTS.md`: contrato de trabalho das próximas etapas.
- `package.json`: identifica a raiz privada e fixa pnpm e Node.js.
- `pnpm-workspace.yaml`: define onde existirão os projetos do workspace.
- `tsconfig.base.json`: base estrita que os futuros projetos poderão estender.
- `docs/environment.md`: registra o ambiente usado para reproduzir o laboratório.

## Comandos

```powershell
node --version
pnpm.cmd --version
pnpm.cmd list --depth -1
```

## Como validar

Confirme que os arquivos JSON podem ser analisados, que o pnpm reconhece o workspace e que o TypeScript aceita a configuração base sem emitir arquivos.

## Erros comuns

- Usar `latest` no manifesto e perder a reprodutibilidade.
- Incluir aplicações antes da etapa que define sua arquitetura.
- Confundir a organização do monorepo com composição de micro frontends em runtime.
- No Windows, a política do PowerShell pode bloquear `pnpm.ps1`; `pnpm.cmd` executa o mesmo gerenciador sem mudar essa política.

## Perguntas de revisão

1. O que o `pnpm-workspace.yaml` define e o que ele ainda não cria?
2. Por que a raiz do workspace precisa ser privada?
3. Qual é a vantagem de os projetos futuros estenderem uma configuração TypeScript comum?

## Exercício manual

Adicione temporariamente `examples/*` ao `pnpm-workspace.yaml`, execute a validação, observe o resultado e desfaça a alteração.

## Explicação de entrevista em até 90 segundos

O repositório começa como um workspace pnpm privado, separado em áreas para aplicações e pacotes. Isso organiza o desenvolvimento local, mas ainda não implementa um micro frontend nem garante deploy independente. A versão do gerenciador e o intervalo de Node são fixados para tornar o ambiente reproduzível. Uma configuração TypeScript estrita será herdada pelos projetos, mantendo critérios comuns sem antecipar código. O `AGENTS.md` funciona como contrato de evolução: cada etapa deve ser pequena, validada, documentada e não pode introduzir antecipadamente ferramentas ou abstrações futuras.

