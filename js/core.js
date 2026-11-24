/* Frostpeak Frontier: core.js
   Small helpers: maths, seeded noise, safe local storage, device checks.
   Loaded as a plain script; files share one global scope and load in the order listed in index.html. */
'use strict';

/* ================= basics ================= */
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
const wrapA = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hsh(i, j) { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; }
function vnoise(x, y) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hsh(i, j), hsh(i + 1, j), u), lerp(hsh(i, j + 1), hsh(i + 1, j + 1), u), v) * 2 - 1;
}
function fbm(x, y) { return vnoise(x, y) * 0.6 + vnoise(x * 2.1 + 5.3, y * 2.1 - 1.7) * 0.3 + vnoise(x * 4.3 - 2, y * 4.3 + 3) * 0.1; }
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const LOW = isTouch && Math.min(screen.width, screen.height) < 900;
