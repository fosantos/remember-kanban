'use strict';
// Geometria das setas: segmento reto de borda a borda, sem atravessar cartoes.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const setas = require('../docs/setas.js');

function noBorda(p, box, eps) {
  const pertoX = Math.abs(p.x - box.left) < eps || Math.abs(p.x - box.right) < eps;
  const pertoY = Math.abs(p.y - box.top) < eps || Math.abs(p.y - box.bottom) < eps;
  const dentroX = p.x >= box.left - eps && p.x <= box.right + eps;
  const dentroY = p.y >= box.top - eps && p.y <= box.bottom + eps;
  return (pertoX || pertoY) && dentroX && dentroY;
}

function fora(p, box) {
  return p.x < box.left || p.x > box.right || p.y < box.top || p.y > box.bottom;
}

// O miolo do segmento nunca entra em nenhum dos dois retangulos.
function mioloFora(casos) {
  casos.forEach(([a, b]) => {
    const s = setas.segmento(a, b);
    assert.ok(s, 'segmento existe');
    assert.ok(noBorda({ x: s.ax, y: s.ay }, a, 1e-6), 'origem na borda');
    assert.ok(noBorda({ x: s.bx, y: s.by }, b, 1e-6), 'destino na borda');
    [0.25, 0.5, 0.75].forEach((t) => {
      const p = { x: s.ax + (s.bx - s.ax) * t, y: s.ay + (s.by - s.ay) * t };
      assert.ok(fora(p, a) && fora(p, b), 'miolo fora dos cartoes em t=' + t);
    });
  });
}

describe('setas', () => {
  it('lado a lado: sai da borda direita, chega na esquerda', () => {
    const s = setas.segmento(
      { left: 0, top: 0, right: 100, bottom: 60 },
      { left: 200, top: 0, right: 300, bottom: 60 }
    );
    assert.deepEqual(s, { ax: 100, ay: 30, bx: 200, by: 30 });
  });

  it('empilhados: sai de baixo, chega em cima', () => {
    const s = setas.segmento(
      { left: 0, top: 0, right: 100, bottom: 60 },
      { left: 0, top: 100, right: 100, bottom: 160 }
    );
    assert.deepEqual(s, { ax: 50, ay: 60, bx: 50, by: 100 });
  });

  it('destino a esquerda espelha a horizontal', () => {
    const s = setas.segmento(
      { left: 200, top: 0, right: 300, bottom: 60 },
      { left: 0, top: 0, right: 100, bottom: 60 }
    );
    assert.deepEqual(s, { ax: 200, ay: 30, bx: 100, by: 30 });
  });

  it('diagonais nao atravessam o interior', () => {
    mioloFora([
      [{ left: 0, top: 0, right: 100, bottom: 60 }, { left: 200, top: 150, right: 300, bottom: 210 }],
      [{ left: 200, top: 150, right: 300, bottom: 210 }, { left: 0, top: 0, right: 100, bottom: 60 }],
      [{ left: 0, top: 0, right: 100, bottom: 100 }, { left: 50, top: 200, right: 150, bottom: 300 }]
    ]);
  });

  it('caminho e reto (sem curva) com ponta no destino', () => {
    const a = { left: 0, top: 0, right: 100, bottom: 60 };
    const b = { left: 200, top: 150, right: 300, bottom: 210 };
    const d = setas.caminho(a, b);
    assert.ok(d.startsWith('M'));
    assert.ok(d.includes('L'));
    assert.ok(!d.includes('C'), 'sem comando de curva');
    const m = d.match(/L(-?[\d.]+) (-?[\d.]+)M/);
    assert.ok(m, 'ponta da seta no caminho');
    assert.ok(noBorda({ x: Number(m[1]), y: Number(m[2]) }, b, 0.2), 'ponta toca a borda do destino');
  });

  it('retangulos identicos nao geram seta', () => {
    const a = { left: 0, top: 0, right: 100, bottom: 60 };
    assert.equal(setas.segmento(a, a), null);
    assert.equal(setas.caminho(a, a), null);
  });

  it('relativo desconta o zoom do viewport', () => {
    const base = { left: 10, top: 20, right: 1010, bottom: 620 };
    const ret = { left: 160, top: 170, right: 310, bottom: 230 };
    assert.deepEqual(setas.relativo(ret, base, 1.5), {
      left: 100, top: 100, right: 200, bottom: 140, width: 100, height: 40
    });
  });

  it('relativo com zoom 1 mantem as diferencas', () => {
    const base = { left: 10, top: 20, right: 1010, bottom: 620 };
    const ret = { left: 110, top: 120, right: 210, bottom: 160 };
    assert.deepEqual(setas.relativo(ret, base, 1), {
      left: 100, top: 100, right: 200, bottom: 140, width: 100, height: 40
    });
  });

  it('relativo com zoom invalido trata como 1', () => {
    const base = { left: 10, top: 20, right: 1010, bottom: 620 };
    const ret = { left: 110, top: 120, right: 210, bottom: 160 };
    assert.deepEqual(setas.relativo(ret, base, 0), setas.relativo(ret, base, 1));
  });
});
