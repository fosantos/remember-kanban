// Persistencia do quadro (UMD: funciona no navegador e no Node para testes).
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.RememberStorage = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var KEY = 'remember-kanban-v1';

  function defaultState() {
    return {
      version: 1,
      columns: [
        { id: 'col-todo', title: 'A fazer', cardIds: ['card-1', 'card-2'] },
        { id: 'col-doing', title: 'Em progresso', cardIds: ['card-3'] },
        { id: 'col-done', title: 'Feito', cardIds: [] }
      ],
      cards: {
        'card-1': { id: 'card-1', title: 'Desenhar o quadro', desc: 'Criar colunas e cartoes de exemplo.', color: 'amarelo' },
        'card-2': { id: 'card-2', title: 'Ligar dependencias', desc: 'Use o botao "ligar" num cartao e clique no destino.', color: 'azul' },
        'card-3': { id: 'card-3', title: 'Arrastar cartoes', desc: 'Arraste entre colunas para mudar o estado.', color: 'verde' }
      },
      // from depende de to (a seta aponta para o pre-requisito)
      links: [{ id: 'link-1', from: 'card-2', to: 'card-1' }]
    };
  }

  // Remove cartoes fantasmas, ligacoes penduradas e duplicadas. Retorna null se invalido.
  function sanitize(state) {
    if (!state || typeof state !== 'object') return null;
    if (!Array.isArray(state.columns)) return null;
    if (!state.cards || typeof state.cards !== 'object') return null;
    if (!Array.isArray(state.links)) state.links = [];
    var cards = state.cards;
    state.columns.forEach(function (col) {
      if (!col || typeof col !== 'object') return;
      if (!Array.isArray(col.cardIds)) col.cardIds = [];
      col.cardIds = col.cardIds.filter(function (id) { return !!cards[id]; });
    });
    state.columns = state.columns.filter(function (c) { return c && typeof c === 'object' && c.id; });
    var seen = {};
    state.links = state.links.filter(function (l) {
      if (!l || !cards[l.from] || !cards[l.to] || l.from === l.to) return false;
      var k = l.from + '>' + l.to;
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    });
    return state;
  }

  function loadState(storage) {
    try {
      var raw = storage.getItem(KEY);
      if (!raw) return { ok: true, state: defaultState(), seeded: true };
      var clean = sanitize(JSON.parse(raw));
      if (!clean) return { ok: true, state: defaultState(), seeded: true };
      return { ok: true, state: clean, seeded: false };
    } catch (err) {
      return { ok: true, state: defaultState(), seeded: true };
    }
  }

  // Nunca lanca: falha de escrita vira { ok: false } para a UI avisar.
  function saveState(storage, state) {
    try {
      storage.setItem(KEY, JSON.stringify(state));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String((err && err.message) || err) };
    }
  }

  var ZOOM_KEY = 'remember-kanban-zoom';
  var ZOOM_MIN = 0.3;
  var ZOOM_MAX = 2;

  function loadZoom(storage) {
    try {
      var raw = storage.getItem(ZOOM_KEY);
      if (raw === null || raw === undefined || raw === '') return 1;
      var z = Number(raw);
      if (!isFinite(z)) return 1;
      return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
    } catch (err) {
      return 1;
    }
  }

  function saveZoom(storage, zoom) {
    try {
      storage.setItem(ZOOM_KEY, String(zoom));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String((err && err.message) || err) };
    }
  }

  return {
    KEY: KEY, defaultState: defaultState, sanitize: sanitize,
    loadState: loadState, saveState: saveState,
    ZOOM_MIN: ZOOM_MIN, ZOOM_MAX: ZOOM_MAX,
    loadZoom: loadZoom, saveZoom: saveZoom
  };
});
