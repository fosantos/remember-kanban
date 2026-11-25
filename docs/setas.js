// Geometria das setas de dependencia (UMD: navegador e Node para testes).
// Segmento reto de borda a borda: nunca atravessa o interior dos cartoes.
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.RememberSetas = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function centro(box) {
    return { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 };
  }

  // Ponto onde o raio de (cx,cy) na direcao (dx,dy) cruza a borda do ret.
  function borda(cx, cy, dx, dy, box) {
    if (dx === 0 && dy === 0) return null;
    var tx = Infinity, ty = Infinity;
    if (dx > 0) tx = (box.right - cx) / dx;
    else if (dx < 0) tx = (box.left - cx) / dx;
    if (dy > 0) ty = (box.bottom - cy) / dy;
    else if (dy < 0) ty = (box.top - cy) / dy;
    var t = Math.min(tx, ty);
    if (!isFinite(t) || t < 0) return null;
    return { x: cx + dx * t, y: cy + dy * t };
  }

  // Segmento reto entre as bordas de dois rets. null se degenerado.
  function segmento(boxA, boxB) {
    var a = centro(boxA), b = centro(boxB);
    var dx = b.x - a.x, dy = b.y - a.y;
    if (dx === 0 && dy === 0) return null;
    var pa = borda(a.x, a.y, dx, dy, boxA);
    var pb = borda(b.x, b.y, -dx, -dy, boxB);
    if (!pa || !pb) return null;
    return { ax: pa.x, ay: pa.y, bx: pb.x, by: pb.y };
  }

  function r(n) { return Math.round(n * 10) / 10; }

  // Caminho SVG: linha reta + ponta da seta tocando a borda do destino.
  function caminho(boxA, boxB) {
    var s = segmento(boxA, boxB);
    if (!s) return null;
    var vx = s.bx - s.ax, vy = s.by - s.ay;
    var m = Math.sqrt(vx * vx + vy * vy);
    if (m === 0) return null;
    var base = Math.atan2(vy / m, vx / m);
    var len = 13, ang = Math.PI / 7;
    var x1 = s.bx - len * Math.cos(base - ang), y1 = s.by - len * Math.sin(base - ang);
    var x2 = s.bx - len * Math.cos(base + ang), y2 = s.by - len * Math.sin(base + ang);
    return 'M' + r(s.ax) + ' ' + r(s.ay) + 'L' + r(s.bx) + ' ' + r(s.by) +
      'M' + r(x1) + ' ' + r(y1) + 'L' + r(s.bx) + ' ' + r(s.by) + 'L' + r(x2) + ' ' + r(y2);
  }

  // Caixa em px de viewport para unidades do SVG (px de layout):
  // desconta o deslocamento da base e divide pelo zoom do quadro.
  function relativo(ret, base, z) {
    var s = (typeof z === 'number' && isFinite(z) && z > 0) ? z : 1;
    return {
      left: (ret.left - base.left) / s,
      top: (ret.top - base.top) / s,
      right: (ret.right - base.left) / s,
      bottom: (ret.bottom - base.top) / s,
      width: (ret.right - ret.left) / s,
      height: (ret.bottom - ret.top) / s
    };
  }

  return { centro: centro, borda: borda, segmento: segmento, caminho: caminho, relativo: relativo };
});
