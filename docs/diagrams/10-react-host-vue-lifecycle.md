# Lifecycle do Vue dentro do host React

```mermaid
sequenceDiagram
  actor Usuario as Usuário
  participant Router as React Router
  participant Adapter as VueRemoteRoute
  participant DOM as Container HTML
  participant Runtime as Module Federation
  participant Vue as Remote account/mount

  Usuario->>Router: Entra em /account
  Router->>Adapter: Renderiza o adapter React
  Adapter->>DOM: React cria uma div e preenche o ref
  Adapter->>Runtime: import('account/mount')
  Runtime->>Vue: Resolve manifest, remote entry e módulo
  Vue-->>Adapter: Entrega mount
  Adapter->>Vue: mount(container, options)
  Vue->>DOM: Vue assume os filhos do container
  Vue-->>Adapter: Retorna handle com unmount

  Usuario->>Router: Sai de /account
  Router->>Adapter: Desmonta o adapter
  Adapter->>Vue: cleanup chama unmount()
  Vue->>DOM: Encerra a aplicação e limpa seu DOM
  Adapter->>DOM: React remove o container
```

Se o import terminar depois que o adapter já tiver sido desmontado, o sinal de cancelamento impede a chamada de `mount`. React continua dono do container, e Vue continua dono apenas do conteúdo interno durante sua montagem.
