# Etapa 08 — Deploy independente do remote

## O que foi criado

Foram adicionados previews locais de produção para shell e Products, uma origem pública explícita para os assets federados de Products e um experimento manual que troca `products-v1` por `products-v2` reconstruindo somente o remote. O código terminou em v2.

## Por que foi criado

O servidor de desenvolvimento poderia atualizar a tela com HMR e criar uma falsa impressão de independência. Usar arquivos de `dist` e previews separados demonstra o comportamento relevante para deploy: o host permanece byte a byte igual enquanto o producer publica uma nova implementação compatível.

## Fluxo de execução

1. Products v1 produz seu manifest, remote entry, chunks e tipos.
2. O shell é buildado uma única vez apontando para a URL estável do manifest.
3. Os dois builds são servidos em previews separados nas portas 3000 e 3001.
4. A rota `/products` consulta o manifest e renderiza v1.
5. Apenas `ProductApp.tsx` muda para v2.
6. Apenas Products é buildado e reiniciado.
7. Um reload do shell consulta novamente a mesma URL e encontra os assets v2.
8. Hashes e horário dos arquivos do shell confirmam que o host não foi reconstruído.

## HMR

Hot Module Replacement pertence ao desenvolvimento. O dev server detecta uma alteração, recompila a parte afetada e envia uma atualização para uma página já conectada. Isso é rápido para programar, mas não representa publicação de artefatos de produção.

O experimento não executa `rsbuild dev`. Os previews apenas servem arquivos previamente gerados em `dist`; portanto, editar o fonte sem executar outro build de Products não modifica a tela.

## Rebuild do remote

O rebuild de Products transforma sua nova implementação em novos chunks e atualiza o manifest. O texto mudou, então o chunk associado a `ProductApp` recebeu outro hash. Reiniciar `preview:products` simula disponibilizar esses novos artefatos no mesmo endereço público.

## Rebuild do host

Um rebuild do shell seria necessário se sua própria configuração, rotas ou código mudassem. Não foi necessário para uma alteração interna compatível de Products porque o host já possuía duas informações suficientes: a URL do manifest e o identificador `products/ProductApp`.

O shell não guarda o nome definitivo do chunk de ProductApp. Ele consulta o manifest, que pode apontar para hashes diferentes após cada deploy.

## URL estável e `assetPrefix`

Manter `http://localhost:3001/mf-manifest.json` estável fornece um ponto de descoberta. O conteúdo encontrado nessa URL pode mudar de v1 para v2 e passar a listar outros arquivos, sem exigir que a referência compilada no host seja alterada.

O manifest também precisa informar corretamente a origem de seus assets. `output.assetPrefix` define `http://localhost:3001/` como origem pública local de `remoteEntry.js`, chunks e CSS. Sem isso, o caminho `/remoteEntry.js` seria interpretado relativamente à origem do shell, a porta 3000.

## Cache do navegador e da CDN

Independência de deploy não ignora cache. Se o manifest for armazenado por muito tempo, o navegador poderá continuar descobrindo assets v1. Chunks com hash são bons candidatos a cache longo porque uma mudança gera outro nome; manifest e remote entry geralmente precisam de uma política que permita revalidação mais rápida.

Este laboratório prova a composição local sem CDN e sem adicionar cache busting complexo. Uma arquitetura real deve definir cabeçalhos e invalidação de cache conscientemente.

## Compatibilidade de contrato

O shell importa `products/ProductApp` e espera encontrar o export nomeado `ProductApp` com um formato renderizável pelo React compatível. Products pôde mudar o texto sem quebrar esse contrato.

O shell ainda poderia quebrar sem rebuild se o novo remote:

- removesse ou renomeasse `./ProductApp`;
- trocasse o export `ProductApp`;
- exigisse props novas e obrigatórias;
- publicasse JavaScript ou URLs inválidas;
- mudasse para uma versão incompatível de React compartilhado;
- introduzisse um erro de execução;
- publicasse manifest e chunks de versões diferentes;
- fosse bloqueado por CORS, rede ou cache incorreto.

Tipos ajudam a detectar incompatibilidades durante integração, mas um deploy independente ainda precisa respeitar o contrato aceito pelo consumer.

## Deploy independente versus independência absoluta

Deploy independente significa que Products pode publicar uma mudança compatível sem reconstruir e republicar o shell. Não significa ausência de relações. Os dois lados continuam ligados por nomes federados, tipos, props, dependências compartilhadas, comportamento, disponibilidade de rede e políticas de cache.

Independência absoluta seria não existir qualquer contrato ou efeito entre os sistemas; isso não descreve uma composição. Micro frontends procuram autonomia com contratos explícitos, não isolamento total sem colaboração.

## Arquivos importantes

- `apps/products-react/src/ProductApp.tsx`: versão visível v2.
- `apps/products-react/rsbuild.config.ts`: origem pública dos assets federados.
- `apps/products-react/package.json`: script de preview do producer.
- `apps/shell-react/package.json`: script de preview do consumer.
- `package.json`: atalhos de preview na raiz.
- `docs/experiments/01-remote-independent-update.md`: roteiro e evidências observadas.

## Comandos

```powershell
pnpm run typecheck:products
pnpm run build:products
pnpm run preview:products
pnpm run build:shell
pnpm run preview:shell
```

## Como validar

Siga o roteiro do experimento. Confirme primeiro v1, mantenha o preview do shell ativo, publique somente Products v2 e recarregue `/products`. Compare os hashes do shell antes e depois. O resultado válido combina v2 visível com hashes idênticos do host.

## Erros comuns

- Usar HMR como evidência de deploy independente.
- Rebuildar todos os apps por hábito e perder a prova de autonomia.
- Alterar a URL do manifest junto com a versão sem atualizar o host.
- Publicar assets do remote com caminhos relativos à origem errada.
- Confundir URL estável com conteúdo imutável.
- Ignorar caches intermediários ao investigar uma versão antiga.
- Alterar o contrato público e esperar compatibilidade automática.

## Perguntas de revisão

1. Por que o nome com hash do chunk pode mudar sem alterar o build do shell?
2. Qual evidência separa este experimento de uma atualização por HMR?
3. Quais contratos ainda conectam shell e remote apesar do deploy independente?

## Exercício manual

Repita a troca mudando apenas o preço de um produto. Antes de recarregar, confirme que o preview do shell continua sendo o mesmo processo. Compare novamente os hashes do host e identifique no build de Products qual chunk recebeu um novo nome.

## Explicação de entrevista em até 90 segundos

Deploy independente significa que um remote pode publicar uma mudança compatível sem exigir rebuild do host. No experimento, o shell foi buildado uma vez com a URL estável do manifest. Products v1 foi carregado, depois somente Products mudou para v2, gerou novos chunks e reiniciou seu preview. Ao recarregar, o mesmo shell consultou o manifest atualizado e mostrou v2; seus hashes permaneceram idênticos. Isso não foi HMR porque usamos previews de `dist`. A autonomia não é absoluta: o remote ainda precisa preservar o expose, exports, props, shared dependencies, URLs e disponibilidade. Cache também precisa ser tratado para que o manifest novo seja descoberto.
