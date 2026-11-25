# Remember — Kanban traço à mão

Quadro Kanban com estilo gráfico do Excalidraw (traço tremido, fonte manuscrita)
e ligações visuais de dependência entre cartões.

## Rodar

```sh
npm start
```

Abra [http://localhost:5174](http://localhost:5174) no navegador.
Porta alternativa: `PORT=8080 npm start`.

## Testes

```sh
npm test
```

## Publicação

Versão online: [https://fosantos.github.io/remember-kanban/](https://fosantos.github.io/remember-kanban/)

A pasta `docs/` contém o app estático servido pelo GitHub Pages
(branch `main`, pasta `/docs`); o `npm start` local serve a mesma pasta.

## Uso

- Arraste cartões entre colunas para mudar o estado.
- Clique em **ligar** num cartão e depois no destino para registar
  "este cartão depende daquele"; a seta aponta para o pré-requisito.
- Clique numa seta para selecionar e remover a dependência.
- Duplo clique abre a edição (título, descrição, cor, dependências).
- Zoom com os botões `−`/`+` no topo, `Ctrl +`/`Ctrl -`/`Ctrl 0`
  ou `Ctrl + scroll` sobre o quadro; o nível é lembrado.
- Tudo fica guardado no `localStorage` deste navegador.
