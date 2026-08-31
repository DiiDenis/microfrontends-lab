# Antes do Module Federation

Cada endereço abre uma aplicação completa e independente. Não existe seta entre os apps porque nenhum carrega código produzido pelo outro.

```mermaid
flowchart LR
  subgraph browserShell["Navegador / aba 1"]
    shell["Shell React<br/>localhost:3000<br/>Home + placeholders locais"]
  end

  subgraph browserProducts["Navegador / aba 2"]
    products["Products React<br/>localhost:3001<br/>Catálogo standalone"]
  end

  subgraph browserAccount["Navegador / aba 3"]
    account["Account Vue<br/>localhost:3002<br/>Conta standalone"]
  end
```

Os três processos podem ser iniciados pelo mesmo comando do workspace, mas essa conveniência operacional não cria composição em runtime.

