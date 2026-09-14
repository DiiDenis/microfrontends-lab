# Etapa 19 — Resiliência em runtime

## O que foi criado

As duas rotas remotas do Shell agora distinguem seus estados e falhas:

- Products possui loading, erro de import, erro de renderização e Retry;
- Account possui loading, erro de import, erro de `mount`, Retry e cleanup defensivo;
- mensagens para o usuário citam o remote, mas não exibem stack trace;
- logs técnicos são emitidos pela aplicação somente em desenvolvimento;
- Home, header e navegação ficam fora das fronteiras de falha;
- a leitura das URLs remotas passou a respeitar tanto arquivos `.env` quanto variáveis fornecidas pelo terminal.

O `mount` de Account também passou a limpar o container e o registro mesmo quando montagem ou desmontagem falham.

## Por que foi criado

Antes, Products usava uma única Error Boundary para qualquer falha. O usuário sabia que a rota estava indisponível, mas não havia distinção entre não baixar o módulo e o componente quebrar depois de carregado. O botão de retry também não existia nessa rota.

Account capturava import e montagem no mesmo `catch`. Seu cleanup de sucesso já chamava `unmount`, mas uma montagem incompleta precisava de uma limpeza mais defensiva.

Micro frontends reduzem o acoplamento de release, mas criam uma dependência operacional no navegador: quando alguém visita a rota, o remote e seus artefatos precisam estar disponíveis e compatíveis naquele momento.

## Fluxo de execução

### Products

```text
usuário entra em /products
  ↓
Shell mostra loading
  ↓
import('products/ProductApp')
  ├── rejeita → fallback de carregamento + Retry
  └── resolve → Error Boundary de renderização
                  ├── renderiza → ProductApp visível
                  └── lança erro → fallback de renderização + Retry local
```

O import é controlado por estado no adapter. Assim, uma rejeição da Promise é classificada como falha de carregamento antes de React tentar renderizar o componente. A Error Boundary interna recebe apenas um módulo que já foi resolvido; portanto, um erro capturado ali pertence à renderização.

### Account

```text
usuário entra em /account
  ↓
Shell cria container e mostra loading
  ↓
import('account/mount')
  ├── rejeita → fallback de import
  └── resolve → mount(container, options)
                  ├── lança erro → cleanup + fallback de montagem
                  └── retorna handle → mounted
                                         ↓ saída da rota
                                      unmount + limpeza
```

O resultado assíncrono consulta `cancelled` antes da montagem. Na saída da rota, o cleanup marca a execução como cancelada, tenta desmontar o handle existente e esvazia o container em `finally`. Assim, uma troca rápida não permite que um import atrasado monte Vue numa rota que já desapareceu.

## Acoplamento operacional

Deploy independente não significa independência absoluta:

```text
Shell pode ser publicado sem Products
≠
Shell consegue mostrar Products quando Products está fora do ar
```

Com pacote npm, o código adotado já está dentro do bundle após o build. Com Module Federation, o navegador precisa alcançar manifest, remote entry e chunks durante o uso. A autonomia de release troca parte do acoplamento de build por disponibilidade, compatibilidade e observabilidade em runtime.

## Falha de import versus falha de renderização ou montagem

Falha de import acontece antes de obter a superfície pública. Exemplos:

- servidor ou DNS indisponível;
- manifest ausente ou inválido;
- remote entry/chunk não encontrado;
- expose renomeado;
- bloqueio de CORS.

Falha de renderização acontece depois que `products/ProductApp` foi obtido e React começou a executá-lo. Uma exceção no corpo do componente, num filho ou num lifecycle pertence a essa categoria.

No Vue, `account/mount` pode ser importado corretamente e ainda lançar durante `mount`. Isso é diferente de não conseguir baixar `account/mount`: a rede e o contrato de descoberta funcionaram, mas a inicialização da aplicação falhou.

## Fallback

Fallback é uma interface local do Shell que ocupa somente a área da feature indisponível. Ela informa qual remote falhou e oferece uma ação possível, sem revelar stack trace ou detalhes internos.

O fallback não tenta reproduzir Products ou Account. Fazer isso duplicaria regra de negócio no host. O Shell preserva apenas sua própria responsabilidade: layout, navegação e uma mensagem segura.

## Retry

Existem dois retries diferentes:

- erro de renderização: a Error Boundary limpa seu estado e tenta renderizar novamente o componente já carregado;
- erro de import: o botão recarrega a URL atual, criando outra instância da página e do runtime federado.

Repetir somente o mesmo `import()` pode devolver uma rejeição guardada pelo navegador, bundler ou runtime. O reload é uma decisão simples e previsível para este laboratório. Em uma aplicação real, uma API de runtime pode invalidar cache e repetir apenas o remote, mas isso exige política, limites e observabilidade adicionais.

Retry não deve acontecer infinitamente nem esconder uma falha persistente. A pessoa decide quando tentar novamente depois que o serviço pode ter voltado.

## Timeout

Timeout define quanto tempo a experiência aceita permanecer em loading antes de apresentar uma alternativa. Ele não cancela automaticamente um `import()` nem uma requisição já iniciada.

Esta etapa não adiciona um timeout artificial: navegador e runtime continuam responsáveis pelo término da busca, enquanto o sinal de cancelamento impede efeitos atrasados depois da saída da rota. Em produção, o valor de timeout deveria vir de métricas reais e ser combinado com retry limitado, telemetria e tratamento de resultados tardios.

## Cache

Manifest, remote entry e chunks podem existir no cache do navegador ou CDN. Por isso, desligar um processo não garante falha imediata para quem já carregou aqueles recursos.

Uma política comum trata o manifest como descoberta frequentemente revalidada e chunks com hash como artefatos imutáveis de cache longo. Configuração incorreta pode manter versão velha, misturar manifest novo com asset removido ou mascarar temporariamente uma queda.

O experimento observou esse efeito: uma origem já acessada continuou funcionando após o processo parar; uma URL inédita mostrou a falha real.

## Observabilidade

O usuário recebe uma mensagem curta. A equipe precisa de detalhes técnicos para investigar:

- remote e fase da falha;
- URL/ambiente;
- versão do host e do remote quando conhecida;
- erro original, duração e número de tentativas.

Neste laboratório, `console.error` existe apenas sob `import.meta.env.DEV`. Em produção, uma solução de observabilidade enviaria eventos estruturados a uma plataforma apropriada, sem exibir stack trace na interface nem registrar dados sensíveis.

## Variáveis de ambiente corrigidas

O painel técnico revelou que valores passados pelo terminal não substituíam os fallbacks. A configuração consultava apenas `loadEnv().parsed`, destinado aos arquivos `.env` carregados, e ignorava `process.env`.

Agora a precedência é:

```text
variável do processo
  → valor de arquivo .env
    → fallback localhost
```

Isso permite apontar um build ou servidor do Shell para outra origem de remote e tornou os cenários de indisponibilidade reproduzíveis.

## Arquivos importantes

- `apps/shell-react/src/ProductsRemoteRoute.tsx`: import, estados, fallbacks e Error Boundary de Products.
- `apps/shell-react/src/VueRemoteRoute.tsx`: fases de Account, cancelamento e cleanup.
- `apps/shell-react/src/App.tsx`: mantém as fronteiras limitadas às respectivas rotas.
- `apps/shell-react/rsbuild.config.ts`: precedência correta das URLs remotas.
- `apps/account-vue/src/mount.ts`: montagem transacional e desmontagem defensiva.
- `docs/experiments/05-remote-failure.md`: matriz manual de falhas.

## Comandos

```powershell
pnpm run typecheck:shell
pnpm run typecheck:account
pnpm run check
pnpm run dev:shell
pnpm run dev:products
pnpm run dev:account
```

## Como validar

1. Com os três apps ligados, visite Home, Products e Account.
2. Pare somente Products, recarregue `/products` e confira o fallback.
3. Confirme que Account e Home continuam funcionando.
4. Reinicie Products e clique em Retry.
5. Repita o isolamento desligando somente Account.
6. Desligue ambos e confirme que o Shell permanece navegável.
7. Troque rapidamente de Account para Home durante o loading e verifique que não surge DOM atrasado.
8. Execute `pnpm run check`.

## Erros comuns

- Colocar uma única Error Boundary ao redor de todo o Shell.
- Tratar rejeição de import e exceção de renderização como a mesma fase.
- Fazer Retry apenas esconder o fallback sem repetir nenhuma operação.
- Criar um loop automático infinito de tentativas.
- Exibir stack trace, URL interna ou detalhes sensíveis para o usuário.
- Registrar `console.error` da aplicação em produção sem política de observabilidade.
- Remover o container de Account sem chamar `unmount` quando existe handle.
- Montar Account quando o import termina depois da saída da rota.
- Acreditar que servidor desligado implica cache vazio.
- Copiar uma versão local da feature para usar como fallback.

## Perguntas de revisão

1. Por que deploy independente aumenta a dependência de disponibilidade durante a visita do usuário?
2. Em qual fase diferenciamos erro de import de erro de renderização ou montagem?
3. Por que o Retry de import recarrega a página neste laboratório?

## Exercício manual

Abra três terminais, desligue apenas Products e confirme o fallback. Sem sair da rota, religue Products e clique em `Tentar novamente`. Explique em voz alta por que o Shell não precisou de rebuild, mas precisou que o remote voltasse a estar disponível.

## Explicação de entrevista em até 90 segundos

Module Federation permite deploy independente, mas o host passa a depender dos remotes durante o uso. Por isso limitei cada falha à rota correspondente. Products controla o import explicitamente: rejeição de manifest ou chunk vira erro de carregamento; depois que o módulo resolve, uma Error Boundary separada captura erro de renderização. Account diferencia import de `mount`, guarda o handle e sempre tenta `unmount` no cleanup; um sinal de cancelamento impede montagem atrasada após troca de rota. O usuário recebe fallback curto com Retry e continua usando Home e header. Logs técnicos aparecem apenas em desenvolvimento. Para falha de import, o Retry recarrega a página porque caches do navegador e do runtime podem preservar uma Promise rejeitada. É uma solução simples; produção exige métricas, política de cache, timeout e tentativas limitadas.

