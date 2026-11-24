/* Frostpeak Frontier: models.js
   Shape builders: pines, birches, rocks, ground-cover props, and the obstacle grid used for collisions.
   Loaded as a plain script; files share one global scope and load in the order listed in index.html. */
'use strict';

/* ================= helpers to build stylized meshes ================= */
function merge(parts) { // parts: [{geo, col: color | fn(x,y,z,nx,ny,nz,frac)}]
  let total = 0; const list = parts.map(p => { const g = p.geo.index ? p.geo.toNonIndexed() : p.geo; total += g.attributes.position.count; return { g, col: p.col }; });
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3); let o = 0; const tc = new THREE.Color();
  for (const { g, col: cf } of list) {
    const P = g.attributes.position, N = g.attributes.normal, cnt = P.count;
    g.computeBoundingBox(); const bb = g.boundingBox;
    for (let i = 0; i < cnt; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      pos[(o + i) * 3] = x; pos[(o + i) * 3 + 1] = y; pos[(o + i) * 3 + 2] = z;
      nor[(o + i) * 3] = N.getX(i); nor[(o + i) * 3 + 1] = N.getY(i); nor[(o + i) * 3 + 2] = N.getZ(i);
      if (typeof cf === 'function') cf(tc, x, y, z, N.getX(i), N.getY(i), N.getZ(i), (y - bb.min.y) / Math.max(1e-6, bb.max.y - bb.min.y)); else tc.set(cf);
      col[(o + i) * 3] = tc.r; col[(o + i) * 3 + 1] = tc.g; col[(o + i) * 3 + 2] = tc.b;
    }
    o += cnt;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere(); return out;
}
const T = (g, x, y, z) => { g.translate(x, y, z); return g; };

/* trees: layered pines with drooping boughs, shaded needles and lumpy snow caps */
const SNOW_LV = [0, 0.35, 0.7, 1]; // tree snow levels: bare low down, heavy up high
function treeGeo(variant, lvl) {
  const lv = SNOW_LV[lvl];
  const rnd = mulberry32(40 + variant * 13);
  const parts = [{ geo: T(new THREE.CylinderGeometry(0.16, 0.3, 2.6, 7), 0, 1.3, 0), col: (c, x, y) => c.set('#5a3e2e').lerp(C('#7a5640'), clamp(y / 2.6, 0, 1)) }];
  const pal = [['#173d3a', '#2c6553', '#4b8a6a'], ['#14363a', '#24584f', '#3f7c66'], ['#21483d', '#356b52', '#5a9472']][variant];
  const dark = C(pal[0]), mid = C(pal[1]), lite = C(pal[2]), snowC = C('#e6ecf6'), snowS = C('#c8d4ea');
  const tiers = variant === 1 ? [[2.5, 3.0, 2.6], [2.05, 2.8, 4.1], [1.6, 2.5, 5.5], [1.15, 2.2, 6.8], [0.7, 1.8, 8.0], [0.35, 1.3, 9.0]]
                              : [[2.8, 3.4, 2.8], [2.2, 3.1, 4.5], [1.6, 2.7, 6.1], [1.0, 2.2, 7.5], [0.5, 1.6, 8.7]];
  const snowAmt = (variant === 2 ? 0.5 : 0.36) * (0.55 + 0.45 * lv);
  tiers.forEach(([r, h, y], ti) => {
    const seg = 11, g = new THREE.ConeGeometry(r, h, seg, 2, false);
    const pos = g.attributes.position, ph = rnd() * TAU;
    for (let i = 0; i < pos.count; i++) { // ragged, drooping bough tips at the rim
      const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i), rr = Math.hypot(px, pz);
      if (rr > r * 0.55) { const a = Math.atan2(pz, px), k = 1 + 0.16 * Math.sin(a * 5 + ph) + 0.08 * Math.sin(a * 11 + ph * 2); pos.setXYZ(i, px * k, py - (k - 1) * 0.9 - 0.12 * r, pz * k); }
    }
    g.computeVertexNormals(); T(g, 0, y, 0);
    parts.push({ geo: g, col: (c, x, yy, z, nx, ny, nz, f) => {
      const rr = Math.hypot(x, z) / r, a = Math.atan2(z, x);
      c.copy(dark).lerp(mid, clamp(f * 1.3, 0, 1)).lerp(lite, clamp((f - 0.55) * 1.6, 0, 0.6) * (0.5 + 0.5 * Math.max(0, nx * 0.6 + nz * 0.4)));
      if (rr > 0.85 && f < 0.25) c.lerp(dark, 0.5); // shadowed underside of each tier
    } });
    // separate snow band on the exposed shoulder of this tier (above it, the next tier hides the cone), crisp drippy lower edge
    const apex = y + h / 2, rim = y - h / 2, nt = tiers[ti + 1], top = nt ? Math.min(apex - 0.05, nt[2] - nt[1] / 2 + 0.25) : apex;
    const band = (top - rim) * snowAmt * 1.25, bot = top - band, rAt = Y => r * (apex - Y) / h * 1.08;
    const cph = rnd() * TAU;
    if (lv === 0 || ti < Math.floor(tiers.length * (1 - lv))) return; // less snow: only the upper tiers keep a cap
    const cg = new THREE.CylinderGeometry(nt ? rAt(top) : 0.001, rAt(bot), band, seg, 1, true), cp = cg.attributes.position;
    for (let i = 0; i < cp.count; i++) {
      const px = cp.getX(i), py = cp.getY(i), pz = cp.getZ(i);
      if (py < 0) { const a = Math.atan2(pz, px), drip = 0.5 + 0.5 * Math.sin(a * 6 + cph); const k = 1 + drip * 0.35 * band / h; cp.setXYZ(i, px * k, py - drip * band * 0.35, pz * k); }
    }
    cg.computeVertexNormals(); T(cg, 0, (top + bot) / 2 + 0.03, 0);
    parts.push({ geo: cg, col: (c, x, yy, z, nx) => c.copy(snowC).lerp(snowS, clamp(0.45 - 0.55 * nx, 0, 0.7)) });
  });
  return merge(parts);
}
function rockGeo(seed) {
  const g = new THREE.DodecahedronGeometry(1, 1), p = g.attributes.position, r = mulberry32(seed);
  for (let i = 0; i < p.count; i++) { const k = 0.8 + r() * 0.35; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.75, p.getZ(i) * k); }
  g.computeVertexNormals();
  return merge([{ geo: g, col: (c, x, y, z, nx, ny) => c.set(ny > 0.55 ? '#e4e9f3' : ny > 0.1 ? '#8e97ad' : '#6f7891') }]);
}

/* ================= obstacles grid ================= */
const OG = new Map(), OC = 12;
function addObs(x, z, r, kind) { const k = Math.floor(x / OC) * 4096 + Math.floor(z / OC); if (!OG.has(k)) OG.set(k, []); OG.get(k).push({ x, z, r, kind }); }
function nearObs(x, z, cb) {
  const ci = Math.floor(x / OC), cj = Math.floor(z / OC);
  for (let a = ci - 1; a <= ci + 1; a++) for (let b = cj - 1; b <= cj + 1; b++) { const L = OG.get(a * 4096 + b); if (L) for (const o of L) if (cb(o)) return o; }
  return null;
}
function clearOf(x, z, r) { return !nearObs(x, z, o => Math.hypot(o.x - x, o.z - z) < o.r + r); }
