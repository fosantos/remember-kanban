'use strict';
/* Remember — Kanban: colunas, cartoes arrastaveis e setas de dependencia. */
(function () {
  var store = window.RememberStorage;
  var SVGNS = 'http://www.w3.org/2000/svg';

  var CORES = {
    branco: '#ffffff',
    amarelo: '#ffec99',
    verde: '#b2f2bb',
    azul: '#a5d8ff',
    rosa: '#ffc9c9',
    lilas: '#e5dbff',
    laranja: '#ffd8a8'
  };

  var estado = null;
  var modoLigacao = null; // id do cartao de origem enquanto mira o destino
  var ligacaoSel = null; // id da ligacao selecionada
  var modalCardId = null;
  var modalCor = 'branco';
  var zoom = 1;
  var zoomSaveTimer = null;

  function $(id) { return document.getElementById(id); }

  function nid(prefix) {
    return prefix + '-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  }

  function tituloDe(id) {
    var c = estado.cards[id];
    return c ? c.title : '(removido)';
  }

  function linksDoCartao(id) {
    var dep = [], bloq = [];
    estado.links.forEach(function (l) {
      if (l.from === id) dep.push(l);
      if (l.to === id) bloq.push(l);
    });
    return { dep: dep, bloq: bloq };
  }

  // ---------- persistencia ----------
  function salvar() {
    var res = store.saveState(window.localStorage, estado);
    var aviso = $('aviso-save');
    if (!res.ok) {
      aviso.textContent = 'Não consegui salvar neste navegador (' + res.error +
        '). Suas mudanças podem se perder — exporte ou libere espaço.';
      aviso.hidden = false;
    } else {
      aviso.hidden = true;
    }
    return res.ok;
  }

  // ---------- construcao de DOM ----------
  function criarColuna(col) {
    var sec = document.createElement('section');
    sec.className = 'coluna';
    sec.dataset.col = col.id;

    var topo = document.createElement('header');
    topo.className = 'coluna-topo';

    var input = document.createElement('input');
    input.className = 'coluna-titulo';
    input.value = col.title;
    input.setAttribute('aria-label', 'nome da coluna');
    input.maxLength = 60;
    input.addEventListener('change', function () {
      col.title = input.value.trim() || 'Sem nome';
      input.value = col.title;
      salvar();
    });

    var conta = document.createElement('span');
    conta.className = 'conta';
    conta.textContent = String(col.cardIds.length);

    var del = document.createElement('button');
    del.className = 'btn-mini';
    del.type = 'button';
    del.title = 'Excluir coluna';
    del.setAttribute('aria-label', 'Excluir coluna ' + col.title);
    del.textContent = '×';
    del.addEventListener('click', function () { excluirColuna(col.id); });

    topo.appendChild(input);
    topo.appendChild(conta);
    topo.appendChild(del);

    var lista = document.createElement('div');
    lista.className = 'cartao-lista';
    lista.dataset.col = col.id;

    var novo = document.createElement('button');
    novo.className = 'btn novo-cartao';
    novo.type = 'button';
    novo.textContent = '+ novo cartão';
    novo.addEventListener('click', function () { novoCartao(col.id); });

    sec.appendChild(topo);
    sec.appendChild(lista);
    sec.appendChild(novo);
    return sec;
  }

  function criarCartao(card) {
    var art = document.createElement('article');
    art.className = 'cartao';
    art.draggable = true;
    art.dataset.card = card.id;
    art.style.background = CORES[card.color] || '#ffffff';
    if (modoLigacao === card.id) art.classList.add('origem');

    var h = document.createElement('h3');
    h.textContent = card.title || 'Sem título';
    var p = document.createElement('p');
    p.textContent = card.desc || '';
    art.appendChild(h);
    art.appendChild(p);

    var links = linksDoCartao(card.id);
    if (links.dep.length > 0) {
      var s1 = document.createElement('span');
      s1.className = 'selo';
      s1.textContent = 'depende de ' + links.dep.length;
      art.appendChild(s1);
    }
    if (links.bloq.length > 0) {
      var s2 = document.createElement('span');
      s2.className = 'selo';
      s2.textContent = 'pré-requisito de ' + links.bloq.length;
      art.appendChild(s2);
    }

    var acoes = document.createElement('div');
    acoes.className = 'acoes';
    [['editar', 'editar'], ['ligar', 'ligar'], ['excluir', '×']].forEach(function (par) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.acao = par[0];
      b.textContent = par[1];
      if (par[0] === 'excluir') b.setAttribute('aria-label', 'Excluir cartão');
      acoes.appendChild(b);
    });
    art.appendChild(acoes);
    return art;
  }

  function renderMesa() {
    var mesa = $('mesa');
    mesa.innerHTML = '';
    estado.columns.forEach(function (col) {
      var sec = criarColuna(col);
      var lista = sec.querySelector('.cartao-lista');
      col.cardIds.forEach(function (id) {
        var card = estado.cards[id];
        if (card) lista.appendChild(criarCartao(card));
      });
      mesa.appendChild(sec);
    });
    desenharLigacoes();
  }

  // ---------- colunas e cartoes ----------
  function novaColuna() {
    cancelarLigacao();
    estado.columns.push({ id: nid('col'), title: 'Nova coluna', cardIds: [] });
    salvar();
    renderMesa();
    var titulos = document.querySelectorAll('.coluna-titulo');
    var ultimo = titulos[titulos.length - 1];
    if (ultimo) { ultimo.focus(); ultimo.select(); }
  }

  function excluirColuna(colId) {
    var col = null;
    estado.columns.forEach(function (c) { if (c.id === colId) col = c; });
    if (!col) return;
    if (col.cardIds.length > 0) {
      var ok = window.confirm('Excluir a coluna "' + col.title + '" e os ' +
        col.cardIds.length + ' cartões dela?');
      if (!ok) return;
    }
    col.cardIds.forEach(function (id) { delete estado.cards[id]; });
    estado.links = estado.links.filter(function (l) {
      return estado.cards[l.from] && estado.cards[l.to];
    });
    estado.columns = estado.columns.filter(function (c) { return c.id !== colId; });
    if (modoLigacao && !estado.cards[modoLigacao]) cancelarLigacao();
    ligacaoSel = null;
    atualizarChip();
    salvar();
    renderMesa();
  }

  function novoCartao(colId) {
    cancelarLigacao();
    var card = { id: nid('card'), title: 'Novo cartão', desc: '', color: 'branco' };
    estado.cards[card.id] = card;
    estado.columns.forEach(function (c) {
      if (c.id === colId) c.cardIds.push(card.id);
    });
    salvar();
    renderMesa();
    abrirModal(card.id);
  }

  function excluirCartao(cardId) {
    var card = estado.cards[cardId];
    if (!card) return;
    var links = linksDoCartao(cardId);
    var extra = links.dep.length + links.bloq.length > 0 ? ' e suas dependências' : '';
    if (!window.confirm('Excluir "' + (card.title || 'Sem título') + '"' + extra + '?')) return;
    delete estado.cards[cardId];
    estado.columns.forEach(function (c) {
      c.cardIds = c.cardIds.filter(function (id) { return id !== cardId; });
    });
    estado.links = estado.links.filter(function (l) {
      return l.from !== cardId && l.to !== cardId;
    });
    if (modoLigacao === cardId) cancelarLigacao();
    if (modalCardId === cardId) fecharModal();
    ligacaoSel = null;
    atualizarChip();
    salvar();
    renderMesa();
  }

  // ---------- modal ----------
  function abrirModal(cardId) {
    var card = estado.cards[cardId];
    if (!card) return;
    cancelarLigacao();
    modalCardId = cardId;
    modalCor = card.color || 'branco';
    $('f-titulo').value = card.title || '';
    $('f-desc').value = card.desc || '';
    renderCores();
    renderListasDep(cardId);
    $('modal').hidden = false;
    $('f-titulo').focus();
    $('f-titulo').select();
  }

  function fecharModal() {
    modalCardId = null;
    $('modal').hidden = true;
  }

  function renderCores() {
    var wrap = $('f-cores');
    wrap.innerHTML = '';
    Object.keys(CORES).forEach(function (nome) {
      var b = document.createElement('button');
      b.type = 'button';
      b.style.background = CORES[nome];
      b.title = nome;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', 'cor ' + nome);
      b.setAttribute('aria-checked', nome === modalCor ? 'true' : 'false');
      if (nome === modalCor) b.classList.add('atual');
      b.addEventListener('click', function () {
        modalCor = nome;
        renderCores();
      });
      wrap.appendChild(b);
    });
  }

  function renderListasDep(cardId) {
    var links = linksDoCartao(cardId);
    var ulDep = $('lista-dep');
    var ulBloq = $('lista-bloq');
    ulDep.innerHTML = '';
    ulBloq.innerHTML = '';
    if (links.dep.length === 0) {
      var v1 = document.createElement('li');
      v1.className = 'vazio';
      v1.textContent = 'nenhuma — use “ligar” no cartão';
      ulDep.appendChild(v1);
    }
    links.dep.forEach(function (l) {
      ulDep.appendChild(itemDep(l, tituloDe(l.to)));
    });
    if (links.bloq.length === 0) {
      var v2 = document.createElement('li');
      v2.className = 'vazio';
      v2.textContent = 'nenhum cartão depende deste';
      ulBloq.appendChild(v2);
    }
    links.bloq.forEach(function (l) {
      ulBloq.appendChild(itemDep(l, tituloDe(l.from)));
    });
  }

  function itemDep(link, rotulo) {
    var li = document.createElement('li');
    li.appendChild(document.createTextNode(rotulo + ' '));
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = '×';
    b.title = 'Remover dependência';
    b.setAttribute('aria-label', 'Remover dependência com ' + rotulo);
    b.addEventListener('click', function () {
      excluirLink(link.id);
      if (modalCardId) renderListasDep(modalCardId);
    });
    li.appendChild(b);
    return li;
  }

  function salvarModal() {
    var card = estado.cards[modalCardId];
    if (!card) { fecharModal(); return; }
    card.title = $('f-titulo').value.trim() || 'Sem título';
    card.desc = $('f-desc').value;
    card.color = modalCor;
    salvar();
    fecharModal();
    renderMesa();
  }

  // ---------- ligacoes (dependencias) ----------
  function entrarModoLigacao(cardId) {
    if (modoLigacao === cardId) { cancelarLigacao(); return; }
    modoLigacao = cardId;
    ligacaoSel = null;
    atualizarChip();
    document.body.classList.add('mirando');
    $('barra-ligacao-texto').textContent = '«' + tituloDe(cardId) +
      '» depende de… clique no cartão destino';
    $('barra-ligacao').hidden = false;
    document.querySelectorAll('.cartao').forEach(function (el) {
      el.classList.toggle('origem', el.dataset.card === cardId);
    });
  }

  function cancelarLigacao() {
    modoLigacao = null;
    document.body.classList.remove('mirando');
    $('barra-ligacao').hidden = true;
    document.querySelectorAll('.cartao.origem').forEach(function (el) {
      el.classList.remove('origem');
    });
  }

  function concluirLigacao(destId) {
    var from = modoLigacao;
    if (!from || !estado.cards[from] || !estado.cards[destId]) { cancelarLigacao(); return; }
    if (from === destId) {
      $('barra-ligacao-texto').textContent = 'Um cartão não pode depender dele mesmo — escolha outro destino.';
      return;
    }
    var existe = estado.links.some(function (l) {
      return (l.from === from && l.to === destId) || (l.from === destId && l.to === from);
    });
    if (existe) {
      $('barra-ligacao-texto').textContent = 'Esses dois cartões já estão ligados — escolha outro destino.';
      return;
    }
    estado.links.push({ id: nid('link'), from: from, to: destId });
    cancelarLigacao();
    salvar();
    renderMesa();
  }

  function excluirLink(linkId) {
    estado.links = estado.links.filter(function (l) { return l.id !== linkId; });
    if (ligacaoSel === linkId) ligacaoSel = null;
    atualizarChip();
    salvar();
    renderMesa();
  }

  function selecionarLink(linkId) {
    ligacaoSel = (ligacaoSel === linkId) ? null : linkId;
    atualizarChip();
    desenharLigacoes();
  }

  function atualizarChip() {
    var chip = $('chip-ligacao');
    var link = null;
    estado.links.forEach(function (l) { if (l.id === ligacaoSel) link = l; });
    if (!link) { chip.hidden = true; return; }
    $('chip-ligacao-texto').textContent = '«' + tituloDe(link.from) +
      '» depende de «' + tituloDe(link.to) + '»';
    chip.hidden = false;
  }

  function retRelativo(el, base) {
    return window.RememberSetas.relativo(el.getBoundingClientRect(), base, zoom);
  }

  function desenharLigacoes() {
    var camada = $('camada-ligacoes');
    var conteudo = $('conteudo');
    camada.innerHTML = '';
    var base = conteudo.getBoundingClientRect();
    estado.links.forEach(function (l) {
      var elA = document.querySelector('.cartao[data-card="' + l.from + '"]');
      var elB = document.querySelector('.cartao[data-card="' + l.to + '"]');
      if (!elA || !elB) return;
      var ra = retRelativo(elA, base);
      var rb = retRelativo(elB, base);
      var d = window.RememberSetas.caminho(ra, rb);
      if (!d) return;
      var vis = document.createElementNS(SVGNS, 'path');
      vis.setAttribute('d', d);
      vis.setAttribute('class', 'elo' + (l.id === ligacaoSel ? ' sel' : ''));
      var hit = document.createElementNS(SVGNS, 'path');
      hit.setAttribute('d', d);
      hit.setAttribute('class', 'elo-hit');
      hit.dataset.link = l.id;
      camada.appendChild(vis);
      camada.appendChild(hit);
    });
  }

  // ---------- arrastar e soltar ----------
  function depoisDe(lista, y) {
    var els = Array.prototype.filter.call(
      lista.querySelectorAll('.cartao:not(.arrastando)'),
      function () { return true; }
    );
    var melhor = null;
    var menor = Number.NEGATIVE_INFINITY;
    els.forEach(function (el) {
      var q = el.getBoundingClientRect();
      var off = y - q.top - q.height / 2;
      if (off < 0 && off > menor) { menor = off; melhor = el; }
    });
    return melhor;
  }

  function sincronizarOrdem() {
    document.querySelectorAll('.cartao-lista').forEach(function (lista) {
      var colId = lista.dataset.col;
      var ids = [];
      lista.querySelectorAll('.cartao').forEach(function (el) {
        ids.push(el.dataset.card);
      });
      estado.columns.forEach(function (c) {
        if (c.id === colId) c.cardIds = ids;
      });
    });
  }

  function ligarEventos() {
    var mesa = $('mesa');

    $('btn-coluna').addEventListener('click', novaColuna);
    $('btn-zoom-out').addEventListener('click', function () { mudarZoom(-0.1); });
    $('btn-zoom-in').addEventListener('click', function () { mudarZoom(0.1); });
    $('btn-zoom-nivel').addEventListener('click', function () { definirZoom(1); });
    $('barra-ligacao-cancelar').addEventListener('click', cancelarLigacao);
    $('chip-remover').addEventListener('click', function () {
      if (ligacaoSel) excluirLink(ligacaoSel);
    });
    $('chip-fechar').addEventListener('click', function () {
      ligacaoSel = null;
      atualizarChip();
      desenharLigacoes();
    });

    mesa.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-acao]');
      if (btn) {
        var cartaoEl = e.target.closest('.cartao');
        var id = cartaoEl ? cartaoEl.dataset.card : null;
        if (!id) return;
        if (btn.dataset.acao === 'editar') abrirModal(id);
        else if (btn.dataset.acao === 'ligar') entrarModoLigacao(id);
        else if (btn.dataset.acao === 'excluir') excluirCartao(id);
        return;
      }
      if (modoLigacao) {
        var alvo = e.target.closest('.cartao');
        if (alvo) concluirLigacao(alvo.dataset.card);
      }
    });

    mesa.addEventListener('dblclick', function (e) {
      if (e.target.closest('[data-acao]') || e.target.closest('.coluna-titulo')) return;
      var alvo = e.target.closest('.cartao');
      if (alvo && !modoLigacao) abrirModal(alvo.dataset.card);
    });

    $('camada-ligacoes').addEventListener('click', function (e) {
      var hit = e.target.closest('.elo-hit');
      if (hit && hit.dataset.link) selecionarLink(hit.dataset.link);
    });

    // Arrastar cartoes entre colunas.
    mesa.addEventListener('dragstart', function (e) {
      var c = e.target.closest('.cartao');
      if (!c) return;
      e.dataTransfer.setData('text/plain', c.dataset.card);
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(function () { c.classList.add('arrastando'); }, 0);
    });
    mesa.addEventListener('dragend', function () {
      document.querySelectorAll('.arrastando').forEach(function (el) {
        el.classList.remove('arrastando');
      });
      document.querySelectorAll('.cartao-lista.sobre').forEach(function (el) {
        el.classList.remove('sobre');
      });
      renderMesa(); // restaura a ordem do estado caso o drop falhe
    });
    mesa.addEventListener('dragover', function (e) {
      var lista = e.target.closest('.cartao-lista');
      if (!lista) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.cartao-lista.sobre').forEach(function (el) {
        if (el !== lista) el.classList.remove('sobre');
      });
      lista.classList.add('sobre');
      var arr = mesa.querySelector('.arrastando');
      if (!arr) return;
      var ref = depoisDe(lista, e.clientY);
      if (ref) lista.insertBefore(arr, ref);
      else lista.appendChild(arr);
    });
    mesa.addEventListener('drop', function (e) {
      var lista = e.target.closest('.cartao-lista');
      if (!lista) return;
      e.preventDefault();
      var id = e.dataTransfer.getData('text/plain');
      if (!id || !estado.cards[id]) return;
      sincronizarOrdem();
      salvar();
      renderMesa();
    });

    // Modal.
    $('btn-salvar').addEventListener('click', salvarModal);
    $('btn-excluir').addEventListener('click', function () {
      if (modalCardId) excluirCartao(modalCardId);
    });
    $('btn-fechar').addEventListener('click', fecharModal);
    $('modal').addEventListener('click', function (e) {
      if (e.target === $('modal')) salvarModal();
    });

    $('rolagem').addEventListener('wheel', function (e) {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      definirZoom(zoom * Math.exp(-e.deltaY * 0.0015));
    }, { passive: false });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '0')) {
        e.preventDefault();
        if (e.key === '0') definirZoom(1);
        else if (e.key === '-') mudarZoom(-0.1);
        else mudarZoom(0.1);
        return;
      }
      if (e.key === 'Escape') {
        if (!$('modal').hidden) salvarModal();
        else if (modoLigacao) cancelarLigacao();
        else if (ligacaoSel) {
          ligacaoSel = null;
          atualizarChip();
          desenharLigacoes();
        }
      } else if (e.key === 'Delete' && ligacaoSel && $('modal').hidden) {
        excluirLink(ligacaoSel);
      } else if (e.key === 'Enter' && e.target === $('f-titulo')) {
        salvarModal();
      }
    });

    window.addEventListener('resize', desenharLigacoes);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(desenharLigacoes);
    }
  }

  // ---------- zoom ----------
  function aplicarZoom() {
    $('conteudo').style.zoom = String(zoom);
    $('btn-zoom-nivel').textContent = Math.round(zoom * 100) + '%';
    desenharLigacoes();
  }

  function definirZoom(z) {
    zoom = Math.min(store.ZOOM_MAX, Math.max(store.ZOOM_MIN, Math.round(z * 100) / 100));
    aplicarZoom();
    if (zoomSaveTimer) clearTimeout(zoomSaveTimer);
    zoomSaveTimer = setTimeout(function () {
      store.saveZoom(window.localStorage, zoom);
    }, 300);
  }

  function mudarZoom(delta) { definirZoom(zoom + delta); }

  // ---------- inicio ----------
  function init() {
    var carregado = store.loadState(window.localStorage);
    estado = carregado.state;
    if (carregado.seeded) salvar();
    zoom = store.loadZoom(window.localStorage);
    ligarEventos();
    renderMesa();
    aplicarZoom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
