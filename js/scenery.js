/* Frostpeak Frontier: scenery.js
   Forests and props generated per tile, moguls, buildings, Lowpine Village, gondolas, each mountain's set pieces.
   Loaded as a plain script; files share one global scope and load in the order listed in index.html. */
'use strict';

/* ================= trees, rocks ================= */
function birchGeo(variant, lvl) { // white-barked tree with round, clumpy leaf clusters and a dusting of snow on top
  const rnd = mulberry32(300 + variant * 31), lv = SNOW_LV[lvl], parts = [];
  parts.push({ geo: T(new THREE.CylinderGeometry(0.16, 0.24, 6.2, 7), 0, 3.1, 0), col: (c, x, y, z) => c.set(hsh(Math.round(y * 4), Math.round(Math.atan2(z, x) * 3)) < 0.22 ? '#3b3532' : '#ece8e0') });
  for (const [a, l, yy] of [[0.6, 2.2, 3.6], [2.6, 1.8, 4.4], [4.4, 1.6, 5.0]]) { const g = new THREE.CylinderGeometry(0.05, 0.08, l, 5); g.rotateZ(1.0); g.rotateY(a); T(g, Math.cos(a) * l * 0.35, yy, -Math.sin(a) * l * 0.35); parts.push({ geo: g, col: '#e6e1d8' }); }
  const greens = [['#4f8a3e', '#7cb34e', '#a8d066'], ['#3f7a47', '#68a35a', '#97c470']][variant];
  const blobs = variant ? 6 : 7;
  for (let i = 0; i < blobs; i++) {
    const a = i / blobs * TAU + rnd(), rr = i ? 1.3 + rnd() * 0.9 : 0, sz = 1.5 + rnd() * 0.8, g = new THREE.IcosahedronGeometry(sz, 1), P = g.attributes.position;
    for (let k = 0; k < P.count; k++) { const j = 0.85 + hsh(k * 7 + i, variant) * 0.3; P.setXYZ(k, P.getX(k) * j, P.getY(k) * j * 0.85, P.getZ(k) * j); }
    g.computeVertexNormals(); T(g, Math.cos(a) * rr, 6.4 + (i ? rnd() * 1.6 : 2.2), Math.sin(a) * rr);
    parts.push({ geo: g, col: (c, x, y, z, nx, ny) => { c.set(greens[0]).lerp(C(greens[1]), clamp(ny * 0.6 + 0.5, 0, 1)).lerp(C(greens[2]), clamp(ny - 0.4, 0, 1) * 0.8); if (ny > 0.55 && lv > 0) c.lerp(C('#eef2f8'), lv * 0.85); } });
  }
  return merge(parts);
}
const TREE_GEOS = []; for (let v = 0; v < 3; v++) for (let l = 0; l < SNOW_LV.length; l++) TREE_GEOS.push(treeGeo(v, l)); // pines: index v * 4 + level
for (let v = 0; v < 2; v++) for (let l = 0; l < SNOW_LV.length; l++) TREE_GEOS.push(birchGeo(v, l)); // birches: index (3 + v) * 4 + level
function rockGeoC(seed, cols) { const g = new THREE.DodecahedronGeometry(1, 1), p = g.attributes.position, r = mulberry32(seed); for (let i = 0; i < p.count; i++) { const k = 0.8 + r() * 0.35; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.75, p.getZ(i) * k); } g.computeVertexNormals(); return merge([{ geo: g, col: (c, x, y, z, nx, ny) => c.set(ny > 0.75 ? cols[0] : ny > 0.1 ? cols[1] : cols[2]) }]); }
const SAND_ROCK = rockGeoC(8, ['#e4c08a', '#c98a55', '#a8673d']);
const MARK_GEO = merge([{ geo: T(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 5), 0, 0.9, 0), col: '#ffffff' }, { geo: T(new THREE.CylinderGeometry(0.07, 0.07, 0.45, 5), 0, 1.6, 0), col: '#ffffff' }]);
const LAMP_POST = new THREE.CylinderGeometry(0.06, 0.07, 2.2, 5), LAMP_BULB = new THREE.SphereGeometry(0.18, 8, 6), LAMP_MAT = new THREE.MeshBasicMaterial({ color: 0xffcf7a, toneMapped: false });
const COVER_GEOS = { // little things on the ground, drawn only close to you
  tuft: merge([0, 1, 2, 3, 4, 5].map(i => { const g = new THREE.ConeGeometry(0.05, 0.55 + (i % 3) * 0.18, 3); g.rotateZ((i - 2.5) * 0.18); g.rotateY(i * 1.1); return { geo: T(g, Math.cos(i * 2) * 0.12, 0.28, Math.sin(i * 2) * 0.12), col: (c, x, y, z, nx, ny, nz, f) => c.set('#3f7a22').lerp(C('#a8c84a'), f) }; })),
  heath: merge([0, 1, 2, 3, 4].map(i => ({ geo: T(new THREE.IcosahedronGeometry(0.16 + (i % 2) * 0.05, 0), Math.cos(i * 1.3) * 0.22, 0.12, Math.sin(i * 1.3) * 0.22), col: i % 2 ? '#d98fb8' : '#a678c4' }))),
  pebble: merge([{ geo: (() => { const g = new THREE.DodecahedronGeometry(0.22, 0); g.scale(1, 0.55, 0.8); return g; })(), col: (c, x, y, z, nx, ny) => c.set(ny > 0.6 ? '#b5b1ad' : '#7e7f86') }]),
  mound: merge([{ geo: (() => { const g = new THREE.SphereGeometry(0.7, 8, 5, 0, TAU, 0, Math.PI / 2); g.scale(1, 0.4, 0.8); return g; })(), col: '#eef2f8' }]),
  bush: merge([[0, 0.45, 0, 0.75], [0.55, 0.35, 0.2, 0.55], [-0.45, 0.32, -0.25, 0.5]].map(([x, y, z, r]) => ({ geo: T(new THREE.IcosahedronGeometry(r, 1), x, y, z), col: (c, a, b, d, nx, ny) => c.set(ny > 0.45 ? '#eef2f8' : '#2f4a37').lerp(C('#46684a'), ny > 0.45 ? 0 : 0.4 * (ny + 0.5)) }))),
  log: merge([{ geo: (() => { const g = new THREE.CylinderGeometry(0.32, 0.36, 4.4, 8); g.rotateZ(Math.PI / 2); return T(g, 0, 0.32, 0); })(), col: (c, x, y, z, nx, ny) => c.set(Math.abs(nx) > 0.9 ? '#c9a27a' : ny > 0.55 ? '#eef2f8' : '#6b4a35') }]),
  stump: merge([{ geo: T(new THREE.CylinderGeometry(0.38, 0.46, 0.7, 8), 0, 0.35, 0), col: (c, x, y, z, nx, ny) => c.set(ny > 0.9 ? '#eef2f8' : '#6b4a35') }]),
  drygrass: merge([0, 1, 2, 3, 4, 5, 6].map(i => { const g = new THREE.ConeGeometry(0.04, 0.7 + (i % 3) * 0.22, 3); g.rotateZ((i - 3) * 0.2); g.rotateY(i * 0.9); return { geo: T(g, Math.cos(i * 2) * 0.14, 0.35, Math.sin(i * 2) * 0.14), col: (c, x, y, z, nx, ny, nz, f) => c.set('#9c7a3c').lerp(C('#e8cf86'), f) }; })),
  deadtree: merge([{ geo: T(new THREE.CylinderGeometry(0.12, 0.22, 4, 6), 0, 2, 0), col: '#5a4636' }].concat([0.5, 2.2, 3.9, 5.3].map((a, i) => { const g = new THREE.CylinderGeometry(0.04, 0.08, 1.6 - i * 0.2, 4); g.rotateZ(0.9); g.rotateY(a); return { geo: T(g, Math.cos(a) * 0.5, 2.4 + i * 0.45, -Math.sin(a) * 0.5), col: '#5a4636' }; }))),
  lavarock: merge([{ geo: (() => { const g = new THREE.DodecahedronGeometry(0.55, 0); g.scale(1, 0.7, 0.9); return T(g, 0, 0.25, 0); })(), col: (c, x, y, z, nx, ny, nz) => c.set(hsh(Math.round(nx * 9), Math.round(nz * 9)) < 0.18 ? '#ff7a2a' : '#2e2a2b') }]),
  shard: merge([{ geo: (() => { const g = new THREE.OctahedronGeometry(0.4, 0); g.scale(0.6, 2.2, 0.6); g.rotateZ(0.25); return T(g, 0, 0.7, 0); })(), col: (c, x, y, z, nx, ny) => c.set(ny > 0.3 ? '#dff4fc' : '#8fd0ec') }]),
  cactus: merge([{ geo: T(new THREE.CylinderGeometry(0.22, 0.26, 3.2, 8), 0, 1.6, 0), col: '#4f8a4a' }, { geo: T(new THREE.SphereGeometry(0.22, 8, 6), 0, 3.2, 0), col: '#5d9a55' },
    { geo: (() => { const g = new THREE.CylinderGeometry(0.15, 0.16, 1.1, 7); return T(g, 0.55, 2.1, 0); })(), col: '#4f8a4a' }, { geo: T(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 7).rotateZ(Math.PI / 2), 0.32, 1.6, 0), col: '#4f8a4a' },
    { geo: (() => { const g = new THREE.CylinderGeometry(0.14, 0.15, 0.8, 7); return T(g, -0.5, 1.9, 0); })(), col: '#4f8a4a' }, { geo: T(new THREE.CylinderGeometry(0.14, 0.14, 0.45, 7).rotateZ(Math.PI / 2), -0.3, 1.5, 0), col: '#4f8a4a' }]),
  sulphur: merge([{ geo: (() => { const g = new THREE.CircleGeometry(0.55, 9); g.rotateX(-Math.PI / 2); return T(g, 0, 0.06, 0); })(), col: '#e8d03a' }, { geo: T(new THREE.IcosahedronGeometry(0.22, 0), 0.3, 0.12, 0.2), col: '#f2e05a' }]),
  fern: merge([0, 1, 2, 3, 4, 5].map(i => { const g = new THREE.ConeGeometry(0.12, 0.9, 3); g.scale(1, 1, 0.25); g.rotateZ(0.9); g.rotateY(i * 1.05); return { geo: T(g, Math.cos(i * 1.05) * 0.3, 0.3, -Math.sin(i * 1.05) * 0.3), col: (c, x, y, z, nx, ny, nz, f) => c.set('#3f6b2e').lerp(C('#7fae4a'), f) }; })),
  mossrock: merge([{ geo: (() => { const g = new THREE.DodecahedronGeometry(0.9, 1); g.scale(1.2, 0.7, 1); return T(g, 0, 0.35, 0); })(), col: (c, x, y, z, nx, ny) => c.set(ny > 0.5 ? '#5e7f3d' : '#6d7180') }]),
  scree: merge([0, 1, 2, 3].map(i => ({ geo: (() => { const g = new THREE.DodecahedronGeometry(0.18 + (i % 2) * 0.12, 0); g.scale(1, 0.6, 0.9); return T(g, Math.cos(i * 1.7) * 0.4, 0.08, Math.sin(i * 1.7) * 0.4); })(), col: i % 2 ? '#8e8f97' : '#6e7079' })))
};
const tileBuckets = new Map();
function tileBucket(x, z) { const k = Math.floor((x - TX0) / TILE) + Math.floor((z - TZ0) / TILE) * NTX; if (!tileBuckets.has(k)) tileBuckets.set(k, []); return tileBuckets.get(k); }
const ROCK_GEOS = [rockGeo(1), rockGeo(2), rockGeo(3)];
const LIFT_X = -470;
/* one gondola per mountain, each running straight up the fall line */
const LIFTS = [{ id: 'frost', xa: LIFT_X, za: -648, xb: LIFT_X, zb: 664, top: 'summit', base: 'base' }];
REGIONS.forEach(r => { if (r.id === 'frost') return; const [xa, za] = toWorld(r, 70, r.vS), [xb, zb] = toWorld(r, r.topU + 26, r.vS); LIFTS.push({ id: r.id, xa, za, xb, zb, top: r.id + '_top', base: r.id + '_base' }); });
LIFTS.forEach(L => { L.len = Math.hypot(L.xb - L.xa, L.zb - L.za); L.ux = (L.xb - L.xa) / L.len; L.uz = (L.zb - L.za) / L.len; L.rot = Math.atan2(L.ux, L.uz); L.x = (L.xa + L.xb) / 2; L.z = (L.za + L.zb) / 2; });
function nearLift(x, z, d) { for (const L of LIFTS) { const t = (x - L.xa) * L.ux + (z - L.za) * L.uz; if (t < -12 || t > L.len + 12) continue; if (Math.abs((x - L.xa) * L.uz - (z - L.za) * L.ux) < d) return true; } return false; }
const reserved = []; // circles kept free of trees
function reserve(x, z, r) { reserved.push([x, z, r]); }
POIS.forEach(p => reserve(p.x, p.z, p.id === 'lake' ? 0 : Math.min(p.r * 0.8, 40)));
reserve(-300, -728, 112); reserve(-160, -738, 34); // Lowpine Village
function isReserved(x, z) { for (const [a, b, r] of reserved) if ((x - a) * (x - a) + (z - b) * (z - b) < r * r) return true; return false; }
const crystalSpots = [];
function* genTreesGen(t) {
  const r = mulberry32(1000 + t.i * 97 + t.j * 7919), T = TREE_GEOS.map(() => []), R = [[], [], []];
  for (let z = t.z0; z < t.z0 + TILE; z += 8.5) { yield; for (let x = t.x0; x < t.x0 + TILE; x += 8.5) {
    const px = x + (r() - .5) * 7, pz = z + (r() - .5) * 7;
    if (px < WORLD.x0 + 30 || px > WORLD.x1 - 30 || pz < WORLD.z0 + 30 || pz > WORLD.z1 - 30) continue;
    const h = Hm(px, pz), dens = treeChance(px, pz, h);
    if (r() > sstep(0.36, 0.62, dens) * 0.85) continue; // trees gather in groves instead of a thin random sprinkle
    if (creekD(px, pz) < 26) continue; // not in the creek gorge
    if (nearLift(px, pz, 14) || onPiste(px, pz, 9)) continue;
    if (Math.hypot((px - LAKE.x) / LAKE.rx, (pz - LAKE.z) / LAKE.rz) < 1.15) continue;
    if (inMoguls(px, pz) || isReserved(px, pz)) continue;
    if (slopeAt(px, pz) > 0.62) continue; // nothing grows on cliffs
    const reg = regionAt(px, pz), s = (0.85 + r() * 0.75) * (reg && reg.id === 'pine' ? 1.15 : 1);
    const birch = h < 300 && r() < (reg && reg.id === 'aurora' ? 0.1 : reg && reg.id === 'pine' ? 0.25 : 0.45) * (1 - sstep(120, 300, h));
    const v = birch ? (r() < 0.5 ? 3 : 4) : reg && reg.id === 'pine' ? (r() < 0.6 ? 1 : 0) : r() < 0.12 ? 2 : r() < 0.5 ? 1 : 0;
    const lvl = clamp(Math.round(((h - 20) / 300 + (r() - 0.5) * 0.3) * 3), 0, SNOW_LV.length - 1); // lower down, less snow
    T[v * SNOW_LV.length + lvl].push(px, h - 0.3, pz, s, r() * TAU);
    addObs(px, pz, 0.9 * s, 'tree');
  } }
  yield;
  for (let i = 0; i < 520; i++) { // rocks: on steep ground, and far more on the Crags
    const px = t.x0 + r() * TILE, pz = t.z0 + r() * TILE, reg = regionAt(px, pz), sl = slopeAt(px, pz);
    if (r() > (reg && reg.id === 'crags' ? 0.9 : 0.25)) continue;
    if (!(sl > 0.55 || r() < 0.18)) continue;
    if (px < WORLD.x0 + 30 || px > WORLD.x1 - 30 || pz < WORLD.z0 + 30 || pz > WORLD.z1 - 30) continue;
    if (onPiste(px, pz, reg && reg.id === 'crags' ? 12 : 4) || isReserved(px, pz) || inMoguls(px, pz) || nearLift(px, pz, 12)) continue;
    if (Math.hypot((px - LAKE.x) / LAKE.rx, (pz - LAKE.z) / LAKE.rz) < 1.1) continue;
    if (!clearOf(px, pz, 2)) continue;
    const s = 0.8 + r() * (sl > 0.55 ? 2.2 : 1.2);
    R[(r() * 3) | 0].push(px, Hm(px, pz) - s * 0.25, pz, s, r() * TAU); if (i % 100 === 99) yield;
    addObs(px, pz, s * 0.85, 'rock');
  }
  // lots of small things: tufts and heather on the thawed patches; bushes, logs, stumps and drifts in the snow; sand, ash and ice props on their mountains
  yield;
  const CV = {}; for (const k in COVER_GEOS) CV[k] = [];
  const nC = LOW ? 2200 : 4600;
  for (let i = 0; i < nC; i++) {
    if (i % 400 === 399) yield;
    const px = t.x0 + r() * TILE, pz = t.z0 + r() * TILE; if (px < WORLD.x0 + 30 || px > WORLD.x1 - 30 || pz < WORLD.z0 + 30 || pz > WORLD.z1 - 30) continue;
    if (Math.hypot((px + 230) / 360, (pz + 715) / 120) < 1 || onPiste(px, pz, 1.5)) continue;
    const h = Hm(px, pz), reg = regionAt(px, pz), id = reg ? reg.id : 'valley', q = r();
    if (h > 1000 && q > 0.25) continue;
    let kind = null;
    const th = thawAt(px, pz, Hraw(px, pz));
    const gk = snowType(px, pz, 0.3);
    if (id === 'dunes') kind = q < 0.1 ? 'drygrass' : q < 0.112 ? 'deadtree' : q < 0.14 ? 'scree' : q < 0.152 ? 'cactus' : null;
    else if (id === 'ember') kind = q < 0.09 ? 'lavarock' : q < 0.15 ? 'scree' : q < 0.16 ? 'deadtree' : q < 0.19 ? 'sulphur' : null;
    else if (gk === 'forest') kind = q < 0.22 ? 'fern' : q < 0.28 ? 'mossrock' : q < 0.31 ? 'stump' : q < 0.33 ? 'log' : null;
    else if (gk === 'rock') kind = q < 0.25 ? 'scree' : q < 0.29 ? 'mossrock' : null;
    else if (th > 0.45) kind = q < 0.55 ? 'tuft' : q < 0.7 ? 'heath' : q < 0.8 ? 'pebble' : q < 0.88 ? 'bush' : null;
    else {
      const dens = treeDensity(px, pz), woods = id === 'pine' ? 2 : 1;
      kind = q < 0.035 ? 'pebble' : q < 0.07 + dens * 0.06 * woods ? 'bush' : q < 0.15 + dens * 0.012 * woods ? (q < 0.145 ? null : 'stump') : null;
      if (!kind && dens > 0.35 && q > 0.985 - 0.006 * woods) kind = 'log';
      if (!kind && id === 'crags' && q > 0.8) kind = 'scree';
    }
    if (!kind) continue;
    if ((kind === 'log' || kind === 'deadtree' || kind === 'cactus') && (onPiste(px, pz, 6) || isReserved(px, pz) || !clearOf(px, pz, 1.5))) continue;
    CV[kind].push(px, h - 0.05, pz, 0.7 + r() * 0.8, r() * TAU);
    if (kind === 'log') addObs(px, pz, 1.2, 'log'); else if (kind === 'deadtree' || kind === 'cactus') addObs(px, pz, 0.5, 'tree');
  }
  yield;
  // rock outcrops in the valley and on the lower slopes, some carrying grass, some snow
  const OUT = [];
  for (let i = 0; i < 10; i++) {
    const px = t.x0 + r() * TILE, pz = t.z0 + r() * TILE, h = Hm(px, pz);
    if (h > 220 || px < WORLD.x0 + 40 || px > WORLD.x1 - 40 || pz < WORLD.z0 + 40 || pz > WORLD.z1 - 40) continue;
    if (onPiste(px, pz, 12) || isReserved(px, pz) || nearLift(px, pz, 20) || !clearOf(px, pz, 6) || r() > 0.45) continue;
    const rgO = regionAt(px, pz); if (rgO && (rgO.id === 'dunes' || rgO.id === 'ember')) continue;
    OUT.push([px, h, pz, 4 + r() * 5, r() * TAU, thawAt(px, pz, h) > 0.3]);
  }
  t.trees = [];
  for (const [px, h, pz, s, rot, grassy] of OUT) {
    const m = new THREE.Mesh(ROCK_GEOS[(s * 7 | 0) % 3], toonV); m.scale.set(s, s * 0.75, s * 0.9); m.position.set(px, h - s * 0.15, pz); m.rotation.y = rot; m.castShadow = true; scene.add(m); t.trees.push(m);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6, 0, TAU, 0, Math.PI / 2), toon(grassy ? '#6f9c4c' : '#eef2f8')); cap.scale.set(s * 0.78, s * 0.22, s * 0.7); cap.position.set(px, h + s * 0.48, pz); cap.rotation.y = rot; scene.add(cap); t.trees.push(cap);
    addObs(px, pz, s * 0.9, 'rock');
  }
  t.cover = [];
  for (const k in CV) { const arr = CV[k], n = arr.length / 5; if (!n) continue;
    const m = new THREE.InstancedMesh(COVER_GEOS[k], toonV, n);
    for (let i = 0; i < n; i++) { dummy.position.set(arr[i * 5], arr[i * 5 + 1], arr[i * 5 + 2]); dummy.rotation.set(0, arr[i * 5 + 4], 0); const sc = arr[i * 5 + 3]; dummy.scale.set(sc, sc, sc); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); }
    m.instanceMatrix.needsUpdate = true; m.frustumCulled = false; scene.add(m); t.cover.push(m); }
  const add = (arr, geo) => {
    const n = arr.length / 5; if (!n) return;
    const m = new THREE.InstancedMesh(geo, toonV, n);
    for (let i = 0; i < n; i++) { dummy.position.set(arr[i * 5], arr[i * 5 + 1], arr[i * 5 + 2]); dummy.rotation.set(0, arr[i * 5 + 4], 0); const s = arr[i * 5 + 3]; dummy.scale.set(s, s * (0.9 + (i % 5) * 0.05), s); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); }
    m.instanceMatrix.needsUpdate = true; m.frustumCulled = false; m.castShadow = false; m.receiveShadow = true;
    scene.add(m); t.trees.push(m);
  };
  T.forEach((arr, v) => add(arr, TREE_GEOS[v])); R.forEach((arr, v) => add(arr, ROCK_GEOS[v]));
  // trail markers and Aurora's lanterns for the runs that cross this tile
  const B = tileBuckets.get(t.i + t.j * NTX) || [], mk = B.filter(b => !b[3]), lp = B.filter(b => b[3]);
  if (mk.length) { const m = new THREE.InstancedMesh(MARK_GEO, toonV, mk.length), cc = new THREE.Color();
    mk.forEach(([x, z, c], i) => { dummy.position.set(x, Hm(x, z), z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); m.setColorAt(i, cc.set(c === '#1d2230' ? '#3a3f55' : c)); });
    m.instanceColor.needsUpdate = true; m.frustumCulled = false; scene.add(m); t.trees.push(m); }
  if (lp.length) { const pm = new THREE.InstancedMesh(LAMP_POST, toon('#2b3142'), lp.length), bm = new THREE.InstancedMesh(LAMP_BULB, LAMP_MAT, lp.length);
    lp.forEach(([x, z], i) => { const y = Hm(x, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.position.set(x, y + 1.1, z); dummy.updateMatrix(); pm.setMatrixAt(i, dummy.matrix); dummy.position.set(x, y + 2.3, z); dummy.updateMatrix(); bm.setMatrixAt(i, dummy.matrix); });
    pm.frustumCulled = bm.frustumCulled = false; scene.add(pm, bm); t.trees.push(pm, bm); }
}
const dummy = new THREE.Object3D();

/* ================= moguls ================= */
{
  const list = [];
  for (const F of MOGS) for (let j = 0; j < F.nj; j++) for (let i = 0; i < F.ni; i++) { const a = F.amp[j * F.ni + i]; if (a) list.push([F.x0 + i * F.sx + (j % 2) * F.sx / 2, F.z0 + j * F.sz, a]); }
  const g = new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2), cc = new THREE.Color();
  const m = new THREE.InstancedMesh(g, new THREE.MeshToonMaterial({ gradientMap: gradMap }), list.length);
  list.forEach(([x, z, a], i) => { dummy.position.set(x, Hm(x, z) - 0.05, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(MOG_R, a, MOG_R * 0.95); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
    const rg = regionAt(x, z); m.setColorAt(i, cc.set(rg && rg.id === 'dunes' ? '#f0c27a' : rg && rg.id === 'ember' ? '#5a4545' : '#f4f6fc')); });
  if (m.instanceColor) m.instanceColor.needsUpdate = true; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m);
}

/* ================= buildings & landmarks ================= */
function box(w, h, d, c, x, y, z, par) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(c)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (par || scene).add(m); return m; }
function cyl(r1, r2, h, c, x, y, z, par, seg) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 8), toon(c)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (par || scene).add(m); return m; }
function roof(w, d, h, c, x, y, z, par, rotY) {
  const g = new THREE.CylinderGeometry(0.01, w / 2 * 1.42, h, 4, 1); g.rotateY(Math.PI / 4); g.scale(1, 1, d / w);
  const m = new THREE.Mesh(g, toon(c)); m.position.set(x, y, z); if (rotY) m.rotation.y = rotY; m.castShadow = true; (par || scene).add(m); return m;
}
function house(x, z, w, d, hgt, wall, rot, opts) {
  const g = new THREE.Group(); const y = Hm(x, z); g.position.set(x, y, z); g.rotation.y = rot || 0; scene.add(g);
  box(w, hgt, d, wall, 0, hgt / 2, 0, g);
  // stone footing, timber corners and a mid-height beam so walls read as built, not as blocks
  box(w + 0.3, 0.7, d + 0.3, '#8b8f9c', 0, 0.35, 0, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.32, hgt, 0.32, '#4f3528', sx * (w / 2), hgt / 2 + 0.2, sz * (d / 2), g);
  box(w + 0.08, 0.22, 0.12, '#4f3528', 0, hgt * 0.62, d / 2 + 0.06, g); box(w + 0.08, 0.22, 0.12, '#4f3528', 0, hgt * 0.62, -d / 2 - 0.06, g);
  roof(w * 1.12, d * 1.15, hgt * 0.75, '#5e3a33', 0, hgt + hgt * 0.37, 0, g);
  roof(w * 1.16, d * 1.18, hgt * 0.62, '#e8eef7', 0, hgt + hgt * 0.42, 0, g);
  const win = new THREE.MeshBasicMaterial({ color: 0xffcf7a, toneMapped: false }), ww = Math.min(1.3, w * 0.16), wh = Math.min(1.5, hgt * 0.28);
  const addWin = (x, z, ry) => { const f = new THREE.Group(); f.position.set(x, hgt * 0.36, z); f.rotation.y = ry; g.add(f);
    box(ww + 0.3, wh + 0.3, 0.1, '#3d2a21', 0, 0, 0, f); const m = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), win); m.position.z = 0.06; f.add(m);
    box(0.08, wh, 0.04, '#3d2a21', 0, 0, 0.08, f); box(ww + 0.5, 0.12, 0.3, '#e8eef7', 0, -wh / 2 - 0.16, 0.12, f);
    for (const sx of [-1, 1]) box(0.32, wh + 0.2, 0.06, '#2f5e8c', sx * (ww / 2 + 0.3), 0, 0.05, f); };
  for (const sx of [-w * 0.28, w * 0.28]) addWin(sx, d / 2 + 0.02, 0);
  addWin(w / 2 + 0.02, 0, Math.PI / 2); addWin(-w / 2 - 0.02, 0, -Math.PI / 2);
  box(w * 0.16, hgt * 0.52, 0.12, '#5b3a2c', 0, 0.7 + hgt * 0.24, d / 2 + 0.06, g);
  roof(w * 0.3, 1.2, 0.5, '#e8eef7', 0, 0.9 + hgt * 0.5, d / 2 + 0.5, g);
  if (opts && opts.chimney) { box(0.8, 2.2, 0.8, '#8b7d78', w * 0.28, hgt * 1.35, -d * 0.1, g); smokes.push({ x: x + Math.cos(rot || 0) * w * 0.28, y: y + hgt * 1.6, z: z - Math.sin(rot || 0) * w * 0.28 }); }
  addObs(x, z, Math.max(w, d) * 0.62, 'house');
  return g;
}
const smokes = [];
function buildLandmarks() {
  buildVillage();
  // Base village
  house(-280, -688, 22, 12, 7, '#c98d5f', 0, { chimney: true });
  house(-330, -665, 8, 7, 4.5, '#b0785a', 0.3, { chimney: true });
  house(-215, -690, 9, 7, 4.5, '#9fb0c9', -0.2);
  // Summit hut
  house(-405, 682, 9, 7, 4.2, '#b57c5b', 0.2, { chimney: true });
  // Hermit cabin
  house(-515, 250, 7, 6, 3.8, '#8a6247', 0.6, { chimney: true });
  // Ranger camp: tents, fire, flag
  for (const [tx, tz, c] of [[470, -128, '#d98b3a'], [494, -116, '#4f8a6a']]) { const m = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.8, 4), toon(c)); m.position.set(tx, Hm(tx, tz) + 1.4, tz); m.rotation.y = 0.5; m.castShadow = true; scene.add(m); addObs(tx, tz, 2.2, 'tent'); }
  const fire = new THREE.PointLight(0xffa64d, 1.6, 22, 2); fire.position.set(482, Hm(482, -108) + 1.2, -108); scene.add(fire);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.2, 6), new THREE.MeshBasicMaterial({ color: 0xffa13d })); flame.position.set(482, Hm(482, -108) + 0.6, -108); scene.add(flame);
  campfire = { light: fire, flame };
  cyl(0.06, 0.06, 6, '#5b4636', 488, Hm(488, -98) + 3, -98);
  box(1.8, 1.1, 0.05, '#3f7d5a', 488.9, Hm(488, -98) + 5.3, -98);
  // Lookout tower
  { const y = Hm(470, 560); for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) cyl(0.18, 0.22, 9, '#7a5a44', 470 + dx, y + 4.5, 560 + dz);
    box(5.6, 0.4, 5.6, '#8a6a52', 470, y + 9, 560); roof(6.4, 6.4, 2.6, '#7a4f45', 470, y + 11.6, 560); roof(6.6, 6.6, 2.2, '#f4f6fb', 470, y + 11.9, 560); addObs(470, 560, 3.4, 'tower'); }
  // Old shrine: standing stones around a glowing crystal
  { const y = Hm(-90, 210);
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, x = -90 + Math.cos(a) * 8, z = 210 + Math.sin(a) * 8; const m = box(1.2, 3.4 + (i % 3) * 0.7, 0.9, '#8f97ae', x, Hm(x, z) + 1.6, z); m.rotation.y = a; m.rotation.z = (i % 2 ? 0.06 : -0.05); box(1.25, 0.25, 0.95, '#f4f6fb', x, Hm(x, z) + 3.4 + (i % 3) * 0.7, z).rotation.y = a; addObs(x, z, 0.9, 'stone'); }
    const cr = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), new THREE.MeshBasicMaterial({ color: 0x9fe8ff })); cr.position.set(-90, y + 2.2, 210); scene.add(cr); shrineCrystal = cr;
    cyl(1.4, 1.7, 1, '#8f97ae', -90, y + 0.5, 210); addObs(-90, 210, 1.6, 'stone'); }
  // Ice falls: a frozen cascade on a cliff
  { const y = Hm(520, 310);
    for (let i = 0; i < 9; i++) { const x = 505 + i * 4 - 16, z = 330 + (i % 2) * 2; const hgt = 10 + (i % 3) * 5; const m = new THREE.Mesh(new THREE.CylinderGeometry(0.9 + (i % 2) * 0.5, 1.6, hgt, 7), toon('#aee0f5', { transparent: true, opacity: 0.92 })); m.position.set(x, Hm(x, z) + hgt / 2, z); m.castShadow = true; scene.add(m); addObs(x, z, 1.6, 'ice'); }
    for (let i = 0; i < 6; i++) { const x = 488 + i * 7, z = 340; const s = 4 + (i % 2) * 2; dummy.position.set(x, Hm(x, z), z); const m = new THREE.Mesh(ROCK_GEOS[i % 3], toonV); m.position.copy(dummy.position); m.scale.set(s, s * 1.6, s); m.castShadow = true; scene.add(m); addObs(x, z, s * 0.8, 'rock'); } }
  // Crystal grotto: rock arch and crystal clusters
  { const y = Hm(420, -470);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(7, 2.2, 6, 12, Math.PI), toon('#8c95ad')); arch.position.set(420, y - 0.5, -480); arch.castShadow = true; scene.add(arch);
    addObs(413, -480, 2.6, 'rock'); addObs(427, -480, 2.6, 'rock');
    const cm = new THREE.MeshBasicMaterial({ color: 0xb6a4ff });
    for (let i = 0; i < 12; i++) { const a = i * 2.4, x = 420 + Math.cos(a) * (6 + i % 3 * 3), z = -468 + Math.sin(a) * 6; const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.6 + (i % 3) * 0.35, 0), cm); m.scale.y = 2; m.position.set(x, Hm(x, z) + 0.8, z); m.rotation.z = (i % 2 ? .3 : -.3); scene.add(m); } }
  // Hot spring: steaming pool
  { const y = Hm(-480, -430); const pool = new THREE.Mesh(new THREE.CircleGeometry(8, 24), new THREE.MeshToonMaterial({ color: 0x7fd3d8, gradientMap: gradMap })); pool.rotation.x = -Math.PI / 2; pool.position.set(-480, y + 0.15, -430); scene.add(pool);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; const x = -480 + Math.cos(a) * 8.6, z = -430 + Math.sin(a) * 8.6; const m = new THREE.Mesh(ROCK_GEOS[i % 3], toonV); m.position.set(x, Hm(x, z) - 0.2, z); m.scale.setScalar(1 + (i % 3) * 0.3); scene.add(m); }
    for (let i = 0; i < 4; i++) smokes.push({ x: -480 + (i - 1.5) * 3, y: y + 0.5, z: -430 + (i % 2) * 3, steam: true }); }
  LIFTS.forEach(buildLift);
  buildRegions();
  buildLinks();
  // run markers + signs
  { const n = []; RUNS.forEach((run, ri) => { for (let i = 6; i < run.path.length - 4; i += 8) { const p = run.path[i]; if (p.mode) continue; for (const sd of [-1, 1]) { const x = p.x - p.tz * sd * (run.w / 2 + 1.5), z = p.z + p.tx * sd * (run.w / 2 + 1.5); n.push([x, z, run.col]); } } });
    n.forEach(([x, z, c]) => tileBucket(x, z).push([x, z, c, false]));
    RUNS.forEach(run => { if (!run.lamps) return; for (let i = 3; i < run.path.length - 2; i += 10) { const p = run.path[i], sd = (i / 10) % 2 ? 1 : -1, x = p.x - p.tz * sd * (run.w / 2 + 2), z = p.z + p.tx * sd * (run.w / 2 + 2); tileBucket(x, z).push([x, z, null, true]); } });
    RUNS.forEach((run, ri) => { const p = run.path[4]; const x = p.x - p.tz * (run.w / 2 + 4), z = p.z + p.tx * (run.w / 2 + 4); runSign(x, z, run, ri); });
  }
}
let campfire = null, shrineCrystal = null, emberLava = null;
const cabG = merge([{ geo: T(new THREE.BoxGeometry(1.8, 1.8, 2), 0, -2.2, 0), col: (c, x, y, z, nx, ny) => c.set(Math.abs(y + 1.9) < 0.35 && Math.abs(ny) < 0.5 ? '#cfe6f7' : '#e0573f') }, { geo: T(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 4), 0, -0.7, 0), col: '#3a4256' }]);
function buildLift(L) { // towers up the fall line, two cables, cabins, and a station at each end
  const px = L.uz, pz = -L.ux; L.line = [];
  for (let k = 0; k <= 12; k++) { const t = L.len * k / 12, x = L.xa + L.ux * t, z = L.za + L.uz * t, y = Hm(x, z); L.line.push([x, z, y + 15]);
    cyl(0.45, 0.7, 15, '#6f7a8e', x, y + 7.5, z); const arm = box(8, 0.5, 0.6, '#6f7a8e', x, y + 15, z); arm.rotation.y = L.rot; addObs(x, z, 1.2, 'tower'); }
  const cm = new THREE.LineBasicMaterial({ color: 0x3a4256 });
  for (const sd of [1, -1]) scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(L.line.map(([x, z, y]) => new THREE.Vector3(x + px * 3 * sd, y, z + pz * 3 * sd))), cm));
  L.cabins = new THREE.InstancedMesh(cabG, toonV, 22); L.cabins.frustumCulled = false; scene.add(L.cabins);
  for (const [t, rot] of [[4, L.rot], [L.len - 4, L.rot + Math.PI]]) { const X = L.xa + L.ux * t, Z = L.za + L.uz * t, g = new THREE.Group(); g.position.set(X, Hm(X, Z), Z); g.rotation.y = rot; scene.add(g);
    box(12, 0.6, 14, '#8b7d78', 0, 7, 0, g); roof(13, 15, 3, '#4f6688', 0, 9, 0, g); roof(13.4, 15.4, 2.6, '#f4f6fb', 0, 9.3, 0, g);
    for (const sx of [-5.5, 5.5]) for (const sz of [-6, 6]) { cyl(0.35, 0.35, 7, '#6f7a8e', sx, 3.5, sz, g); addObs(X + sx * Math.cos(rot) + sz * Math.sin(rot), Z - sx * Math.sin(rot) + sz * Math.cos(rot), 0.6, 'post'); } }
}
function buildLinks() {
  for (const R of RUNS) { if (!R.link) continue; const P = R.path; let i = 0;
    while (i < P.length) { const m = P[i].mode; if (!m) { i++; continue; } let j = i; while (j + 1 < P.length && P[j + 1].mode === m) j++;
      const a = Math.max(0, i - 1), b = Math.min(P.length - 1, j + 1); (m === 'bridge' ? buildBridge : buildTunnel)(R, a, b); i = j + 1; } }
}
const seg = (P, k, y) => { const p = P[k], q = P[k + 1], a = new THREE.Vector3(p.x, y(p), p.z), b = new THREE.Vector3(q.x, y(q), q.z); return [a, b, a.distanceTo(b)]; };
function place(m, a, b, yOff) { m.position.set((a.x + b.x) / 2, (a.y + b.y) / 2 + (yOff || 0), (a.z + b.z) / 2); m.lookAt(b.x, b.y + (yOff || 0), b.z); scene.add(m); return m; }
function buildBridge(R, i0, i1) { // a timber deck with rails, on stone piers down to the ground
  const P = R.path, hw = R.w / 2, top = p => p.hc + SNOW_D - 0.1, wood = toon('#8a6447'), dark = toon('#5b4030'), stone = toon('#8b8f9c'), snow = toon('#eef2f8');
  for (let k = i0; k < i1; k++) {
    const [a, b, L] = seg(P, k, top);
    place(new THREE.Mesh(new THREE.BoxGeometry(R.w, 0.7, L + 0.3), wood), a, b, -0.35).receiveShadow = true;
    place(new THREE.Mesh(new THREE.BoxGeometry(R.w - 0.6, 0.14, L + 0.8), snow), a, b, 0.04);
    for (const sd of [-1, 1]) { const g = new THREE.Group(); place(g, a, b, 0);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, L + 0.3), dark); rail.position.set(sd * (hw - 0.2), 1.1, 0); g.add(rail);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.2, 0.22), dark); post.position.set(sd * (hw - 0.2), 0.55, -L / 2); g.add(post);
      for (let t = 0; t <= L; t += 2) { const f = t / L; addObs(lerp(a.x, b.x, f) + P[k].tz * -sd * (hw - 0.2) * -1, lerp(a.z, b.z, f) + P[k].tx * sd * (hw - 0.2) * -1, 0.35, 'rail', lerp(a.y, b.y, f)); } }
    if ((k - i0) % 3 === 1) { const p = P[k], gy = Hraw(p.x, p.z), hgt = top(p) - 0.7 - gy; if (hgt > 1) { const pier = new THREE.Mesh(new THREE.BoxGeometry(R.w * 0.55, hgt + 2, 1.6), stone); pier.position.set(p.x, gy - 1 + (hgt + 2) / 2, p.z); pier.rotation.y = Math.atan2(p.tx, p.tz); pier.castShadow = true; scene.add(pier); } }
  }
}
function buildTunnel(R, i0, i1) { // a rock tube with a snowy floor, lamps and a stone arch at each mouth
  const P = R.path, hw = R.w / 2, rad = hw + 1.5, floor = p => p.hc + SNOW_D - 0.2, mid = P[(i0 + i1) >> 1], rg = regionAt(mid.x, mid.z);
  const icy = rg && (rg.id === 'aurora' || rg.id === 'crags'), wall = toon(icy ? '#3f5878' : '#4c4a52', { side: THREE.DoubleSide }), rim = toon(icy ? '#9cc6e4' : '#7b7680'), snow = toon('#dfe6f1');
  const lamp = new THREE.MeshBasicMaterial({ color: icy ? 0x9be7ff : 0xffcf7a, toneMapped: false });
  for (let k = i0; k < i1; k++) {
    const [a, b, L] = seg(P, k, floor);
    const g = new THREE.CylinderGeometry(rad, rad, L + 0.4, 16, 1, true, Math.PI / 2, Math.PI); g.rotateX(Math.PI / 2);
    place(new THREE.Mesh(g, wall), a, b, 0);
    place(new THREE.Mesh(new THREE.BoxGeometry(R.w + 2, 0.5, L + 0.4), snow), a, b, -0.25);
    if ((k - i0) % 4 === 2) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), lamp); s.position.set((a.x + b.x) / 2, (a.y + b.y) / 2 + rad - 0.6, (a.z + b.z) / 2); scene.add(s);
      if (icy) for (const sd of [-1, 1]) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), lamp); c.scale.y = 2.4; c.position.set(a.x - P[k].tz * sd * (hw - 0.5), a.y + 1.2, a.z + P[k].tx * sd * (hw - 0.5)); c.rotation.z = sd * 0.3; scene.add(c); } }
    for (let t = 0; t <= L; t += 2) { const f = t / L; for (const sd of [-1, 1]) addObs(lerp(a.x, b.x, f) - P[k].tz * sd * (hw + 0.4), lerp(a.z, b.z, f) + P[k].tx * sd * (hw + 0.4), 0.5, 'rail', lerp(a.y, b.y, f)); }
  }
  for (const k of [i0, i1 - 1]) { const [a, b] = seg(P, k, floor), arch = new THREE.Mesh(new THREE.TorusGeometry(rad + 0.6, 1.3, 8, 18, Math.PI), rim); place(arch, k === i0 ? a : b, k === i0 ? b : a, 0); arch.position.copy(k === i0 ? a : b); arch.castShadow = true; }
}
function signBoard(x, z, rot, text, w) { // a painted trail-sign board on two posts
  const tex = new THREE.CanvasTexture(mkCanvas(512, 128, g => { g.fillStyle = '#1d3a33'; g.fillRect(0, 0, 512, 128); g.strokeStyle = 'rgba(238,243,248,.45)'; g.lineWidth = 6; g.strokeRect(10, 10, 492, 108); g.fillStyle = '#eef3f8'; g.font = '800 64px "Barlow Condensed", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 68); }));
  const y = Hm(x, z), gr = new THREE.Group(); gr.position.set(x, y, z); gr.rotation.y = rot; scene.add(gr);
  for (const sx of [-w * 0.42, w * 0.42]) cyl(0.12, 0.14, 3.6, '#5a3e2e', sx, 1.8, 0, gr);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })); m.position.y = 3.2; gr.add(m);
  addObs(x, z, w * 0.45, 'sign');
}
/* valley snowcats: ride between Lowpine and the foot of every mountain */
const CATS = [{ x: -232, z: -790, to: 'village', name: 'Lowpine Village' }];
REGIONS.forEach(r => { if (r.id === 'frost') return; const [x, z] = toWorld(r, 34, -140); CATS.push({ x, z, to: r.id + '_base', name: r.name }); });
function buildCat(c) {
  const g = new THREE.Group(), y = Hm(c.x, c.z); g.position.set(c.x, y, c.z); g.rotation.y = 0.3; scene.add(g);
  for (const sx of [-1.25, 1.25]) box(0.9, 0.9, 5, '#2b3142', sx, 0.45, 0, g);
  box(2.8, 1.1, 4.4, '#d9442b', 0, 1.35, 0.1, g); box(2.4, 1.3, 2.2, '#d9442b', 0, 2.55, 0.6, g);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.8), new THREE.MeshBasicMaterial({ color: 0xbfe0f2 })); gl.position.set(0, 2.7, -0.52); gl.rotation.y = Math.PI; g.add(gl);
  box(3.4, 0.25, 0.9, '#c9ced8', 0, 0.6, -3, g); box(0.3, 0.2, 0.2, '#ffd27a', 0.8, 3.25, 0.6, g);
  addObs(c.x, c.z, 3, 'cat');
}
function buildRegions() {
  CATS.forEach(buildCat);
  for (const r of REGIONS) {
    if (r.id === 'frost') continue;
    const [sx, sz] = toWorld(r, 100, -110); signBoard(sx, sz, r.dh, r.name, 7);
    const [hx, hz] = toWorld(r, r.topU + 6, 88); house(hx, hz, 8, 7, 4.2, '#b57c5b', r.dh + 0.2, { chimney: true });
    const lm = LANDMARK[r.id], [lx, lz] = toWorld(r, lm[2], lm[3]), ly = Hm(lx, lz);
    if (r.id === 'pine') { house(lx, lz, 12, 8, 5, '#8a6247', 0.4, { chimney: true }); for (let i = 0; i < 4; i++) for (let k = 0; k < 6; k++) { const c = cyl(0.35, 0.35, 6, '#7a5640', lx + 10 + (k % 3) * 0.75, ly + 0.4 + Math.floor(k / 3) * 0.65 + i * 0, lz - 8 + i * 3, null, 8); c.rotation.z = Math.PI / 2; } addObs(lx + 10, lz - 3, 4, 'logs'); }
    if (r.id === 'ember') { // the crater: a glowing lava lake, steam rising from the rim and flanks
      const [cx, cz] = toWorld(r, r.uS, 0), fy = Hm(cx, cz);
      const lava = new THREE.Mesh(new THREE.CircleGeometry(70, 32), new THREE.MeshBasicMaterial({ color: 0xff6a1f, toneMapped: false })); lava.rotation.x = -Math.PI / 2; lava.position.set(cx, fy + 1.2, cz); scene.add(lava);
      const crust = new THREE.Mesh(new THREE.RingGeometry(48, 72, 32), new THREE.MeshBasicMaterial({ color: 0xffb347, toneMapped: false, transparent: true, opacity: 0.55 })); crust.rotation.x = -Math.PI / 2; crust.position.set(cx, fy + 1.3, cz); scene.add(crust);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff7a2a, transparent: true, depthWrite: false, opacity: 0.7, toneMapped: false })); glow.scale.setScalar(260); glow.position.set(cx, fy + 40, cz); scene.add(glow);
      emberLava = lava; reserve(cx, cz, 120);
      const rr = mulberry32(55);
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, x = cx + Math.cos(a) * 150, z = cz + Math.sin(a) * 150; smokes.push({ x, y: Hm(x, z) + 1, z, steam: true }); }
      for (let i = 0; i < 14; i++) { const [vx, vz] = toWorld(r, 300 + rr() * 1200, (rr() - 0.5) * 1500); if (onPiste(vx, vz, 10)) continue; smokes.push({ x: vx, y: Hm(vx, vz) + 0.5, z: vz, steam: true }); }
      for (let i = 0; i < 30; i++) { const [sx, sz] = toWorld(r, 400 + rr() * 1250, (rr() - 0.5) * 1700); if (onPiste(sx, sz, 12) || isReserved(sx, sz)) continue; // obsidian spires
        const sc = 2 + rr() * 2.5, m = new THREE.Mesh(ROCK_GEOS[i % 3], toon('#2a2427')); m.scale.set(sc, sc * (2 + rr() * 2.5), sc); m.position.set(sx, Hm(sx, sz) - 1, sz); m.rotation.y = rr() * 6; m.castShadow = true; scene.add(m); addObs(sx, sz, sc * 0.85, 'rock'); reserve(sx, sz, sc + 3); }
    }
    if (r.id === 'dunes') {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(14, 3.6, 8, 18, Math.PI), toon('#c98a55')); arch.position.set(lx, ly - 1, lz); arch.rotation.y = 0.6; arch.castShadow = true; scene.add(arch);
      addObs(lx + Math.cos(0.6) * 14, lz - Math.sin(0.6) * 14, 4, 'rock'); addObs(lx - Math.cos(0.6) * 14, lz + Math.sin(0.6) * 14, 4, 'rock');
      const rr = mulberry32(91);
      for (let i = 0; i < 26; i++) { const [sx, sz] = toWorld(r, 250 + rr() * 1500, (rr() - 0.5) * 1800); if (onPiste(sx, sz, 14) || isReserved(sx, sz)) continue; // sandstone pillars
        const sc = 3 + rr() * 3, m = new THREE.Mesh(SAND_ROCK, toonV); m.scale.set(sc, sc * (1.6 + rr() * 2), sc); m.position.set(sx, Hm(sx, sz) - 1, sz); m.rotation.y = rr() * 6; m.castShadow = true; scene.add(m); addObs(sx, sz, sc * 0.85, 'rock'); reserve(sx, sz, sc + 3); }
    }
    if (r.id === 'aurora') { // the night glacier: crevasses and leaning towers of ice
      const rr = mulberry32(77);
      for (let i = 0; i < 18; i++) {
        const u = (250 + rr() * 1050) * r.uS / 1400, v = (-260 + rr() * 720) * r.rvP / 760, [cx, cz] = toWorld(r, u, v); if (onPiste(cx, cz, 18) || isReserved(cx, cz)) continue;
        const len = 14 + rr() * 16, rot = (rr() - 0.5) * 0.5, cy = Hm(cx, cz), m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.6, 1.8), new THREE.MeshBasicMaterial({ color: 0x1f3f66 })); m.position.set(cx, cy - 0.15, cz); m.rotation.y = rot; scene.add(m);
        const lip = new THREE.Mesh(new THREE.BoxGeometry(len + 1, 0.4, 0.5), toon('#dff1fb')); lip.position.set(cx - Math.sin(rot) * 1.1, cy + 0.1, cz - Math.cos(rot) * 1.1); lip.rotation.y = rot; scene.add(lip);
        for (let k = -len / 2; k <= len / 2; k += 2) addObs(cx + Math.cos(rot) * k, cz - Math.sin(rot) * k, 1.1, 'crevasse');
        reserve(cx, cz, len / 2 + 4);
      }
      for (let i = 0; i < 34; i++) {
        const u = (200 + rr() * 1150) * r.uS / 1400, v = (-300 + rr() * 760) * r.rvP / 760, [cx, cz] = toWorld(r, u, v); if (onPiste(cx, cz, 10) || isReserved(cx, cz)) continue;
        const w = 2.5 + rr() * 3, h = 4 + rr() * 7, m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * 0.8), toon(rr() < 0.5 ? '#a9dcf2' : '#c7ebf8')); m.position.set(cx, Hm(cx, cz) + h / 2 - 0.5, cz); m.rotation.set((rr() - .5) * 0.25, rr() * 3, (rr() - .5) * 0.25); m.castShadow = true; scene.add(m);
        addObs(cx, cz, w * 0.6, 'serac'); reserve(cx, cz, w + 3);
      }
    }
    { const [hx2, hz2] = toWorld(r, r.uS * 0.5, 260); house(hx2, hz2, 7, 6, 4, ['#b9563f', '#6f8fa6', '#d8b26a', '#7d9a7a', '#3d5a80'][REGIONS.indexOf(r) % 5], r.dh + 0.4, { chimney: true }); } // a halfway hut on every mountain
    if (r.id === 'crags') {
      const rr = mulberry32(31);
      for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(ROCK_GEOS[k % 3], toonV); m.position.set(lx + (k % 2) * 0.2, ly + 0.6 + k * 1.05, lz); m.scale.set(1.5 - k * 0.15, 0.9, 1.4 - k * 0.15); m.rotation.y = k; m.castShadow = true; scene.add(m); }
      addObs(lx, lz, 1.8, 'cairn');
      for (let i = 0; i < 46; i++) { // rock spires
        const u = (300 + rr() * 1080) * r.uS / 1400, v = (-470 + rr() * 940) * r.rvP / 760, [cx, cz] = toWorld(r, u, v); if (onPiste(cx, cz, 12) || isReserved(cx, cz) || nearLift(cx, cz, 16)) continue;
        const s = 2 + rr() * 2.5, m = new THREE.Mesh(ROCK_GEOS[i % 3], toonV); m.scale.set(s, s * (3 + rr() * 3), s); m.position.set(cx, Hm(cx, cz) - 1, cz); m.rotation.y = rr() * 6; m.castShadow = true; scene.add(m);
        addObs(cx, cz, s * 0.85, 'rock'); reserve(cx, cz, s + 3);
      }
    }
    if (r.id === 'aurora') {
      house(lx, lz, 7, 6, 4, '#3d5a80', 0.3, { chimney: true });
      const tg = new THREE.Group(); tg.position.set(lx + 6, ly, lz + 3); scene.add(tg); cyl(0.08, 0.1, 1.6, '#2b3142', 0, 0.8, 0, tg); const tube = cyl(0.25, 0.32, 2.4, '#c9ced8', 0, 1.9, 0, tg); tube.rotation.x = -0.9; addObs(lx + 6, lz + 3, 0.8, 'scope');
    }
  }
}
/* Lowpine Village: houses round a little square below the lodge, a shop, lamps, fences, a snowman or two */
const LANTERNS = [{ x: -300, z: -700 }, { x: -270, z: -728 }, { x: -340, z: -722 }, { x: -210, z: -703 }, { x: -392, z: -700 }];
const lampMat = { off: new THREE.MeshBasicMaterial({ color: 0x4a4f5c }), on: new THREE.MeshBasicMaterial({ color: 0xffd27a, toneMapped: false }) };
const lampObjs = [];
function buildVillage() {
  const VH = [ // x, z, w, d, h, wall, rot, chimney
    [-372, -738, 9, 7, 4.6, '#b9563f', 0.1, true], [-318, -748, 10, 8, 5.2, '#d8b26a', -0.05, true], [-262, -752, 8, 7, 4.4, '#6f8fa6', 0.08, false],
    [-214, -738, 9, 7, 4.8, '#c98d5f', -0.12, true], [-176, -716, 7, 6, 4.0, '#e4ddd0', 0.25, false], [-420, -718, 8, 7, 4.4, '#7d9a7a', 0.3, true],
    [-150, -742, 8, 6, 4.2, '#a2524a', -0.2, true], [-332, -694, 7, 6, 4.2, '#c9b38a', 0.55, true], [-236, -736, 8, 6, 4.2, '#9c6b5a', -0.3, false],
    [-398, -748, 8, 7, 4.6, '#6f8fa6', 0.15, true], [-284, -742, 7, 6, 4.0, '#d9cbb0', 0.05, false]
  ];
  VH.forEach(([x, z, w, d, h, c, r, ch]) => house(x, z, w, d, h, c, r, { chimney: ch }));
  // the shop: a wider house with a striped awning and a hanging sign
  const shop = house(-352, -728, 11, 8, 5, '#e7c98f', 0, { chimney: true });
  const aw = new THREE.Group(); aw.position.set(0, 3.1, 4.4); aw.rotation.x = 0.45; shop.add(aw);
  for (let i = 0; i < 8; i++) box(11.4 / 8, 0.08, 2.2, i % 2 ? '#f4efe6' : '#2f5e8c', -5.7 + 11.4 / 16 + i * 11.4 / 8, 0, 0, aw);
  const signTex = new THREE.CanvasTexture(mkCanvas(256, 96, g => { g.fillStyle = '#1d3a33'; g.fillRect(0, 0, 256, 96); g.strokeStyle = 'rgba(238,243,248,.5)'; g.lineWidth = 4; g.strokeRect(8, 8, 240, 80); g.fillStyle = '#eef3f8'; g.font = '800 50px "Barlow Condensed", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText("Hanne's", 128, 50); }));
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1), new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })); sg.position.set(0, 4.6, 4.05); shop.add(sg);
  // market stall and crates in the square
  { const g = new THREE.Group(); g.position.set(-282, Hm(-282, -708), -708); g.rotation.y = 0.4; scene.add(g);
    box(3.4, 1, 1.6, '#8a6a52', 0, 0.5, 0, g); for (const sx of [-1.6, 1.6]) cyl(0.07, 0.07, 2.6, '#5b4636', sx, 1.3, -0.6, g);
    for (let i = 0; i < 6; i++) box(3.6 / 6, 0.06, 1.9, i % 2 ? '#f4efe6' : '#b9563f', -1.8 + 0.3 + i * 0.6, 2.55, -0.1, g).rotation.x = 0.25;
    for (let i = 0; i < 4; i++) cyl(0.22, 0.22, 0.3, ['#e9a23b', '#b9563f', '#7d9a7a', '#d8b26a'][i], -1.1 + i * 0.7, 1.15, 0.2, g);
    addObs(-282, -708, 2, 'stall'); }
  for (const [x, z] of [[-330, -705], [-326, -707], [-228, -722]]) box(1, 0.8, 1, '#8a6a52', x, Hm(x, z) + 0.4, z).rotation.y = x;
  // village tree in the square with string lights
  { const x = -300, z = -716, y = Hm(x, z); const t = new THREE.Mesh(TREE_GEOS[0], toonV); t.position.set(x, y - 0.3, z); t.scale.setScalar(1.35); t.castShadow = true; scene.add(t); addObs(x, z, 1.6, 'tree');
    const bulbG = new THREE.SphereGeometry(0.11, 6, 4), cols = [0xffd27a, 0xf2661c, 0x7fd0e8, 0xffffff];
    for (let i = 0; i < 46; i++) { const f = i / 46, a = f * TAU * 5, r = 3.6 * (1 - f) + 0.3, m = new THREE.Mesh(bulbG, new THREE.MeshBasicMaterial({ color: cols[i % 4], toneMapped: false })); m.position.set(x + Math.cos(a) * r, y + 2.2 + f * 9.5, z + Math.sin(a) * r); scene.add(m); } }
  // lamps (lit by the quest, and they stay lit)
  LANTERNS.forEach((l, i) => {
    const g = new THREE.Group(), y = Hm(l.x, l.z); g.position.set(l.x, y, l.z); scene.add(g);
    cyl(0.09, 0.12, 3.4, '#2b3142', 0, 1.7, 0, g); box(0.9, 0.08, 0.08, '#2b3142', 0.4, 3.3, 0, g);
    const cage = box(0.42, 0.55, 0.42, '#2b3142', 0.8, 2.95, 0, g); cage.material = toon('#2b3142');
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), lampMat.off); bulb.position.set(0.8, 2.95, 0); g.add(bulb);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc46b, transparent: true, depthWrite: false, opacity: 0, toneMapped: false })); glow.scale.setScalar(3.2); glow.position.set(0.8, 2.95, 0); g.add(glow);
    addObs(l.x, l.z, 0.35, 'lamp'); lampObjs.push({ bulb, glow });
  });
  // snowmen
  for (const [x, z, s] of [[-246, -706, 1], [-398, -728, 0.8]]) { const y = Hm(x, z);
    for (const [r, h] of [[0.75, 0.6], [0.55, 1.6], [0.38, 2.4]]) { const m = new THREE.Mesh(new THREE.SphereGeometry(r * s, 14, 10), toon('#eef2f8')); m.position.set(x, y + h * s, z); m.castShadow = true; scene.add(m); }
    const n = new THREE.Mesh(new THREE.ConeGeometry(0.07 * s, 0.4 * s, 6), toon('#f2661c')); n.rotation.x = Math.PI / 2; n.position.set(x, y + 2.45 * s, z + 0.42 * s); scene.add(n);
    box(0.5 * s, 0.35 * s, 0.5 * s, '#2b3142', x, y + 2.85 * s, z); addObs(x, z, 0.8 * s, 'snowman'); }
  // split-rail fence along the bottom of the village
  { const pts = []; for (let x = -440; x <= -130; x += 3.2) pts.push([x, -762 + Math.sin(x * 0.05) * 3]);
    const postG = new THREE.CylinderGeometry(0.07, 0.08, 1.3, 5), posts = new THREE.InstancedMesh(postG, toon('#6a4a36'), pts.length);
    pts.forEach(([x, z], i) => { dummy.position.set(x, Hm(x, z) + 0.55, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); posts.setMatrixAt(i, dummy.matrix); });
    scene.add(posts);
    for (let i = 0; i < pts.length - 1; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], y0 = Hm(x0, z0), y1 = Hm(x1, z1), L = Math.hypot(x1 - x0, z1 - z0, y1 - y0);
      for (const hh of [0.55, 1.0]) { const r = new THREE.Mesh(new THREE.BoxGeometry(L, 0.07, 0.06), toon('#7a5640')); r.position.set((x0 + x1) / 2, (y0 + y1) / 2 + hh, (z0 + z1) / 2); r.rotation.y = -Math.atan2(z1 - z0, x1 - x0); r.rotation.z = Math.atan2(y1 - y0, Math.hypot(x1 - x0, z1 - z0)); scene.add(r); } } }
  // two warm lights in the square; only two, so the rest of the mountain stays cheap to draw
  for (const [x, z] of [[-300, -712], [-352, -722]]) { const l = new THREE.PointLight(0xffc27a, 0.9, 30, 2); l.position.set(x, Hm(x, z) + 4, z); scene.add(l); }
  // firewood stacks and benches
  for (const [x, z, r] of [[-360, -735, 0], [-205, -730, 0.3]]) { const g = new THREE.Group(); g.position.set(x, Hm(x, z), z); g.rotation.y = r; scene.add(g);
    for (let i = 0; i < 9; i++) { const c = cyl(0.16, 0.16, 1.6, i % 2 ? '#8a6a52' : '#7a5640', -0.6 + (i % 4) * 0.34, 0.18 + Math.floor(i / 4) * 0.3, 0, g, 7); c.rotation.x = Math.PI / 2; } }
  for (const [x, z, r] of [[-312, -704, 0], [-288, -724, Math.PI]]) { const g = new THREE.Group(); g.position.set(x, Hm(x, z), z); g.rotation.y = r; scene.add(g);
    box(1.8, 0.1, 0.45, '#8a6a52', 0, 0.48, 0, g); box(1.8, 0.4, 0.08, '#8a6a52', 0, 0.8, 0.22, g); for (const sx of [-0.75, 0.75]) box(0.08, 0.48, 0.4, '#2b3142', sx, 0.24, 0, g); }
}
function syncLamps() { lampObjs.forEach((o, i) => { const on = save.lit.includes(i); o.bulb.material = on ? lampMat.on : lampMat.off; o.glow.material.opacity = on ? 0.85 : 0; }); }
function runSign(x, z, run, ri) {
  const tex = new THREE.CanvasTexture(mkCanvas(256, 128, (g) => {
    g.fillStyle = '#fbf8f1'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#5b4636'; g.lineWidth = 8; g.strokeRect(4, 4, 248, 120);
    g.fillStyle = run.col; g.beginPath();
    const shp = run.shape || ['circle', 'square', 'diamond'][ri];
    if (shp === 'circle') g.arc(48, 64, 26, 0, TAU); else if (shp === 'square') g.rect(22, 38, 52, 52); else if (shp === 'double') { g.moveTo(30, 34); g.lineTo(52, 64); g.lineTo(30, 94); g.lineTo(8, 64); g.closePath(); g.moveTo(66, 34); g.lineTo(88, 64); g.lineTo(66, 94); g.lineTo(44, 64); g.closePath(); } else { g.moveTo(48, 30); g.lineTo(80, 64); g.lineTo(48, 98); g.lineTo(16, 64); g.closePath(); }
    g.fill(); g.fillStyle = '#26304a'; g.font = '700 34px "Barlow Condensed", system-ui, sans-serif'; g.textBaseline = 'middle'; g.fillText(run.name, 92, 66);
  }));
  const y = Hm(x, z), g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
  cyl(0.1, 0.1, 2.6, '#5b4636', -1, 1.3, 0, g); cyl(0.1, 0.1, 2.6, '#5b4636', 1, 1.3, 0, g);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })); m.position.y = 2.4; g.add(m);
  g.rotation.y = Math.atan2(-run.path[4].tx, -run.path[4].tz);
  addObs(x, z, 1.4, 'sign');
}
