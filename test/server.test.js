'use strict';
// Testa o roteador do servidor sem TCP (a sandbox intercepta ate loopback).
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { handle } = require('../server.js');

function req(url) { return { url }; }

function call(url) {
  return new Promise((resolve) => {
    const res = {
      status: 0,
      type: '',
      writeHead(code, headers) { this.status = code; this.type = headers['Content-Type']; },
      end(body) { resolve({ status: this.status, type: this.type, body: String(body) }); }
    };
    handle(req(url), res);
  });
}

describe('server', () => {
  it('serve a pagina inicial em /', async () => {
    const r = await call('/');
    assert.equal(r.status, 200);
    assert.match(r.type, /text\/html/);
    assert.match(r.body, /Remember/);
    assert.match(r.body, /id="mesa"/);
    assert.match(r.body, /setas\.js/);
    assert.match(r.body, /btn-zoom-in/);
    assert.match(r.body, /btn-zoom-out/);
    assert.match(r.body, /btn-zoom-nivel/);
  });

  it('serve css e js com content-type certo', async () => {
    const css = await call('/styles.css');
    assert.equal(css.status, 200);
    assert.match(css.type, /text\/css/);
    const js = await call('/app.js');
    assert.equal(js.status, 200);
    assert.match(js.type, /text\/javascript/);
    const st = await call('/storage.js');
    assert.equal(st.status, 200);
    const sa = await call('/setas.js');
    assert.equal(sa.status, 200);
    assert.match(sa.type, /text\/javascript/);
  });

  it('responde 404 para arquivo inexistente', async () => {
    const r = await call('/nao-existe-xyz');
    assert.equal(r.status, 404);
  });

  it('bloqueia fuga do diretorio docs', async () => {
    const r = await call('/..%2Fserver.js');
    assert.notEqual(r.status, 200);
    assert.doesNotMatch(r.body, /createServer/);
  });
});
