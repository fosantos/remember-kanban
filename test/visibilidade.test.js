'use strict';
// Garante que o atributo hidden realmente esconde as faixas, mesmo com
// regras display do proprio CSS (que vencem o estilo padrao do navegador).
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'docs', 'styles.css'), 'utf8');

function temRegraHidden(seletor) {
  const esc = seletor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(esc + '\\[hidden\\][^{]*\\{[^}]*display\\s*:\\s*none', 's');
  return re.test(css);
}

describe('visibilidade', () => {
  it('faixa de dependencia respeita hidden', () => {
    assert.equal(temRegraHidden('.chip-ligacao'), true);
  });

  it('faixa do modo ligacao respeita hidden', () => {
    assert.equal(temRegraHidden('.barra-ligacao'), true);
  });

  it('modal respeita hidden', () => {
    assert.equal(temRegraHidden('.modal'), true);
  });
});
