# Pacotes históricos para um registry vazio

O Shell permanece propositalmente em `@mfe-lab/ui-react@1.0.0`, enquanto o
código-fonte atual do pacote está em `1.1.0`. Um registry real preserva versões
já publicadas; um Verdaccio efêmero da CI começa vazio.

`ui-react-1.0.0` é o snapshot imutável do pacote que foi publicado na etapa 16.
Ele permite reproduzir esse histórico sem cachear ou versionar o storage mutável
do Verdaccio. A pasta não pertence ao workspace e não deve ser editada como se
fosse a versão atual da biblioteca.
