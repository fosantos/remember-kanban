'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const RememberStorage = require('../docs/storage.js');

function memStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); }
  };
}

describe('storage', () => {
  it('semeia estado inicial quando vazio', () => {
    const r = RememberStorage.loadState(memStorage());
    assert.equal(r.ok, true);
    assert.equal(r.seeded, true);
    assert.equal(r.state.columns.length, 3);
    assert.equal(r.state.links.length, 1);
  });

  it('recupera de JSON corrompido com seed', () => {
    const s = memStorage();
    s.setItem(RememberStorage.KEY, '{corrompido');
    const r = RememberStorage.loadState(s);
    assert.equal(r.seeded, true);
    assert.equal(r.state.columns.length, 3);
  });

  it('remove ligacoes penduradas e duplicadas', () => {
    const state = RememberStorage.defaultState();
    state.links.push({ id: 'x', from: 'card-1', to: 'fantasma' });
    state.links.push({ id: 'y', from: 'card-2', to: 'card-1' });
    state.columns[0].cardIds.push('fantasma');
    const clean = RememberStorage.sanitize(state);
    assert.equal(clean.links.length, 1);
    assert.ok(!clean.columns[0].cardIds.includes('fantasma'));
  });

  it('sinaliza falha de escrita em vez de lancar', () => {
    const throwing = {
      getItem: () => null,
      setItem: () => { throw new Error('quota excedida'); }
    };
    const r = RememberStorage.saveState(throwing, RememberStorage.defaultState());
    assert.equal(r.ok, false);
    assert.match(r.error, /quota/);
  });

  it('round-trip preserva dados', () => {
    const s = memStorage();
    const state = RememberStorage.defaultState();
    assert.equal(RememberStorage.saveState(s, state).ok, true);
    const r = RememberStorage.loadState(s);
    assert.equal(r.seeded, false);
    assert.deepEqual(Object.keys(r.state.cards).sort(), ['card-1', 'card-2', 'card-3']);
  });

  it('zoom carrega 1 quando ausente ou invalido', () => {
    assert.equal(RememberStorage.loadZoom(memStorage()), 1);
    const s = memStorage();
    s.setItem('remember-kanban-zoom', 'muito');
    assert.equal(RememberStorage.loadZoom(s), 1);
  });

  it('zoom limita ao intervalo permitido', () => {
    const s = memStorage();
    s.setItem('remember-kanban-zoom', '5');
    assert.equal(RememberStorage.loadZoom(s), RememberStorage.ZOOM_MAX);
    s.setItem('remember-kanban-zoom', '0.01');
    assert.equal(RememberStorage.loadZoom(s), RememberStorage.ZOOM_MIN);
  });

  it('zoom round-trip preserva valor', () => {
    const s = memStorage();
    assert.equal(RememberStorage.saveZoom(s, 1.5).ok, true);
    assert.equal(RememberStorage.loadZoom(s), 1.5);
  });

  it('zoom sinaliza falha de escrita em vez de lancar', () => {
    const throwing = {
      getItem: () => null,
      setItem: () => { throw new Error('negado'); }
    };
    const r = RememberStorage.saveZoom(throwing, 1.2);
    assert.equal(r.ok, false);
    assert.match(r.error, /negado/);
  });
});
