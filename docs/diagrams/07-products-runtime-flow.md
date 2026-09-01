# Fluxo de Products em runtime

O shell conhece o identificador público do módulo, mas a implementação continua sendo entregue pelo servidor de Products.

```mermaid
sequenceDiagram
  actor Usuario as Usuário
  participant Router as Router do shell
  participant Shell as Shell React :3000
  participant Manifest as mf-manifest.json :3001
  participant Remote as Products assets :3001
  participant Share as Share scope

  Usuario->>Router: 1. Acessa /products
  Router->>Shell: 2. Seleciona ProductsRemoteRoute
  Shell->>Manifest: 3. Resolve products/ProductApp
  Manifest-->>Shell: Metadados do módulo e assets
  Shell->>Remote: 4. Busca remote entry e chunks
  Remote-->>Shell: Factory de ProductApp
  Shell->>Share: 5. Negocia React e ReactDOM singletons
  Share-->>Shell: Instâncias compatíveis
  Shell-->>Usuario: 6. React renderiza ProductApp
```

Se o manifest ou os assets falharem, a Error Boundary troca apenas o conteúdo da rota por uma mensagem. O header, Home e Account pertencem ao shell e continuam utilizáveis.
