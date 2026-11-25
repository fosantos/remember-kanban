# Remember — Kanban traço à mão

O Remember é um quadro Kanban com o estilo gráfico do Excalidraw: traço
escuro levemente tremido, cantos irregulares e fonte manuscrita. Ele serve
para organizar tarefas em colunas (por padrão "A fazer", "Em progresso" e
"Feito"), com dois recursos além do arrastar-e-soltar básico:

- **Dependências visuais**: um cartão pode depender de outro ("esta tarefa
  só anda depois daquela"). Uma seta desenhada à mão liga os dois cartões,
  apontando para o pré-requisito. Clique na seta para ver e remover a
  dependência, ou gerencie tudo na edição do cartão.
- **Zoom**: aproxime com os botões `−`/`+`, `Ctrl +`/`Ctrl -`/`Ctrl 0` ou
  `Ctrl + scroll` para alternar entre o detalhe e a visão geral do quadro.

Tudo fica guardado no próprio navegador (localStorage): sem conta, sem banco
de dados, sem rastreamento. O projeto não tem dependências externas — é HTML,
CSS e JavaScript puro, mais um servidor local mínimo para desenvolvimento.

## Estrutura

- `docs/` — o aplicativo (a mesma pasta servida localmente e publicada).
- `server.js` — servidor estático local, sem dependências.
- `test/` — testes automatizados (rodam com o próprio Node).

## Rodar localmente

Precisa do Node 18+ instalado (só o runtime):

```sh
node server.js
```

Abra [http://localhost:5174](http://localhost:5174) no navegador.
Outra porta: `PORT=8080 node server.js`.

## Testes

```sh
node --test test/storage.test.js test/server.test.js test/visibilidade.test.js test/setas.test.js
```

## Publicação

Versão online: [https://fosantos.github.io/remember-kanban/](https://fosantos.github.io/remember-kanban/)

A pasta `docs/` é servida pelo GitHub Pages (branch `main`, pasta `/docs`).

## Uso

- Arraste cartões entre colunas para mudar o estado.
- Clique em **ligar** num cartão e depois no destino para registar
  "este cartão depende daquele"; a seta aponta para o pré-requisito.
- Clique numa seta para selecionar e remover a dependência.
- Duplo clique abre a edição (título, descrição, cor, dependências).
- Colunas podem ser criadas, renomeadas e excluídas.
- O nível de zoom é lembrado entre visitas.
