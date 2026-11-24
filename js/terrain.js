/* Frostpeak Frontier: terrain.js
   Ground colours and the 400 m terrain tiles that load in as you travel.
   Loaded as a plain script; files share one global scope and load in the order listed in index.html. */
'use strict';

/* ================= terrain: tiles that load in as you travel =================
   Every 400 m tile has a coarse mesh that is built at start, so all six mountains are visible from anywhere.
   Tiles near the camera swap to a detailed mesh, built one per frame, and get their trees and rocks then. */
const treeDensity = (x, z) => clamp((0.42 + 0.6 * fbm(x * 0.006 + 11, z * 0.006 - 4)) * mixNum(x, z, 'treeMul', VALLEY_TREES), 0, 1);
function treeChance(x, z, h) { // the same odds the forest generator uses, so distant slopes can be tinted to match
  const tl = mixNum(x, z, 'treeline', 300); let d = treeDensity(x, z);
  if (h > tl) d *= clamp(1 - (h - tl) / 70, 0, 1);
  if (Math.hypot((x + 230) / 360, (z + 715) / 120) < 1) d *= 0.08; // around the lodge and village
  return d;
}
const TILE = 400, TX0 = -3600, TZ0 = -3600, NTX = 18, NTZ = 14;
const HI_R = LOW ? 520 : 720, HI_SEG = LOW ? 40 : 60, LO_SEG = 24, TREE_VIS = (LOW ? 520 : 720) + 170; // trees always cover every detailed tile, so no bare ring in the distance
const terrainMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradMap, map: paintTex });
const TC = { grass: C('#4e9426'), grass2: C('#2f7a2c'), earth: C('#8a4a30'), heath: C('#86569a'), creek: C('#5fb6b2'), snow: C('#e8eef8'), shade: C('#bccbe8'), rock: C('#7a8299'), piste: C('#eef1f6'), ice: C('#b4cee6'), lake: C('#9fcbe0'), forest: C('#d8deec'), village: C('#e9e2d8'), edge: C('#dce2ee'), pine: C('#2c4d43'), blue: C('#6aa6d0'), crust: C('#d3d9e3') };
const REG_TINT = { pine: C('#ebeee9'), ember: C('#d9d8dc'), dunes: C('#e2bd84'), crags: C('#d8dde6'), aurora: C('#dfe8f6') };
const TC2 = { ash: C('#7d797e'), basalt: C('#3a3436'), crater: C('#2b2426'), sand: C('#d9a865'), sand2: C('#bf8550'), sandPiste: C('#f0d7aa'), ashPiste: C('#e4e4e8') };
const tmpG = new THREE.Color();
function terrainColor(out, x, z, h, ny, far) {
  const sl = Math.sqrt(Math.max(0, 1 - ny * ny)) / Math.max(ny, 0.05), r = regionAt(x, z);
  { const [a, b, w, vw] = regionMix(x, z); out.copy(REG_TINT[a.id] || TC.snow).lerp(REG_TINT[b.id] || TC.snow, w).lerp(TC.snow, vw); }
  const pi = pisteInfo(x, z), onP = pi.run >= 0 && pi.d < RUNS[pi.run].w / 2, td = treeDensity(x, z);
  if (onP) out.copy(TC.piste);
  else if (pi.run >= 0 && pi.d < RUNS[pi.run].w / 2 + 3) out.copy(TC.edge);
  else out.lerp(TC.forest, td * 0.7);
  out.lerp(TC.shade, clamp((sl - 0.25) * 1.2, 0, 0.6));
  const st = snowType(x, z, sl);
  if (st === 'ice') out.lerp(Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz) < 1 ? TC.lake : TC.ice, 0.85);
  else if (st === 'blueice') out.lerp(TC.blue, 0.82 * sstep(0.1, 0.3, vnoise(x * 0.012 + 5, z * 0.012)) + 0.25);
  else if (st === 'windpack') out.lerp(TC.crust, 0.55);
  else if (st === 'ash') out.lerp(TC2.ash, 0.5 + 0.3 * vnoise(x * 0.02, z * 0.02));
  { const [a, b, w, vw] = regionMix(x, z), sk = (a.id === 'dunes' ? 1 - w : b.id === 'dunes' ? w : 0) * (1 - vw); // sand fades in across the dunes' edge instead of stopping at a line
    if (sk > 0.01 && !onP) { tmpG.copy(TC2.sand).lerp(TC2.sand2, 0.5 + 0.5 * vnoise(x * 0.02 + 4, z * 0.02)).lerp(TC.shade, clamp((sl - 0.2) * 0.8, 0, 0.3)); if (st === 'powder') tmpG.lerp(TC.snow, 0.7); out.lerp(tmpG, sstep(0.05, 0.6, sk)); } }
  if (onP && r && r.id === 'dunes') out.copy(TC2.sandPiste); else if (onP && r && r.id === 'ember') out.copy(TC2.ashPiste);
  if (r && r.id === 'ember') { const [u, v] = toLocal(r, x, z), dc = Math.hypot(u - r.uS, v) / 190; if (dc < 1) out.lerp(TC2.crater, 0.85 * (1 - sstep(0.75, 1, dc))); }
  const rk = mixNum(x, z, 'rockSl', 0.9); if (sl > rk) out.lerp(r && r.id === 'ember' ? TC2.basalt : r && r.id === 'dunes' ? TC2.sand2 : TC.rock, clamp((sl - rk) * 2, 0, 0.9));
  if (z < -600 && z > -840 && x > -560 && x < 160) out.lerp(TC.village, clamp((-600 - z) / 60, 0, 0.6));
  if (!onP && !(Math.hypot((x + 230) / 360, (z + 715) / 120) < 1)) { // patches of meadow and red earth where the snow has thinned
    const th = thawAt(x, z, h);
    if (th > 0) { const e = vnoise(x * 0.03 + 9, z * 0.03 - 2); tmpG.copy(TC.grass).lerp(TC.grass2, 0.5 + 0.5 * vnoise(x * 0.05, z * 0.05)); if (e > 0.5) tmpG.lerp(TC.earth, 0.7 * sstep(0.5, 0.7, e)); else if (e < -0.6) tmpG.lerp(TC.heath, 0.45); out.lerp(tmpG, (far ? 0.6 : 0.95) * sstep(0.3, 0.55, th)); } // crisp meadow edges, like grass meeting a path
  }
  if (!r) out.lerp(TC.creek, 0.9 * sstep(0.55, 0.85, Math.exp(-Math.pow((z + 935) / 16, 2)))); // the frozen creek
  if (far && !onP) out.lerp(TC.pine, clamp((treeChance(x, z, h) - 0.3) * 1.3, 0, 0.6)); // forests read as dark patches from afar
  const nv = vnoise(x * 0.05, z * 0.05) * 0.03, cw = fbm(x * 0.012 + 3, z * 0.012 - 7) * 0.035;
  out.r = clamp(out.r + nv + cw * 0.6, 0, 1); out.g = clamp(out.g + nv + cw * 0.2, 0, 1); out.b = clamp(out.b + nv * 0.5 - cw * 0.4, 0, 1);
}
const tiles = [];
for (let j = 0; j < NTZ; j++) for (let i = 0; i < NTX; i++) tiles.push({ i, j, x0: TX0 + i * TILE, z0: TZ0 + j * TILE, cx: TX0 + (i + 0.5) * TILE, cz: TZ0 + (j + 0.5) * TILE, lo: null, hi: null, trees: null });
function* buildTileGen(t, seg, far) { // yields every few rows so building never freezes a frame
  const n = seg + 1, st = TILE / seg, W = n + 2, hs = new Float32Array(W * W);
  let mn = 1e9, mx = -1e9;
  for (let b = 0; b < W; b++) { for (let a = 0; a < W; a++) { const v = Hm(t.x0 + (a - 1) * st, t.z0 + (b - 1) * st); hs[b * W + a] = v; if (v < mn) mn = v; if (v > mx) mx = v; } if (b % 6 === 5) yield; }
  if (t.minY === undefined) { t.minY = mn; t.maxY = mx; t.box = new THREE.Box3(new THREE.Vector3(t.x0, mn - 15, t.z0), new THREE.Vector3(t.x0 + TILE, mx + 45, t.z0 + TILE)); }
  const vc = n * n + 4 * n, pos = new Float32Array(vc * 3), nor = new Float32Array(vc * 3), col = new Float32Array(vc * 3), uv = new Float32Array(vc * 2), idx = [], c = new THREE.Color();
  for (let b = 0; b < n; b++) { for (let a = 0; a < n; a++) {
    const k = b * n + a, x = t.x0 + a * st, z = t.z0 + b * st, h = hs[(b + 1) * W + a + 1];
    let nx = -(hs[(b + 1) * W + a + 2] - hs[(b + 1) * W + a]), ny = 2 * st, nz = -(hs[(b + 2) * W + a + 1] - hs[b * W + a + 1]); const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z; nor[k * 3] = nx; nor[k * 3 + 1] = ny; nor[k * 3 + 2] = nz; uv[k * 2] = x / 30; uv[k * 2 + 1] = z / 30;
    terrainColor(c, x, z, h, ny, far); col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    if (b < seg && a < seg) idx.push(k, k + n, k + 1, k + 1, k + n, k + n + 1);
  } if (b % 4 === 3) yield; }
  // skirts: a short curtain hanging from each edge so detailed and coarse tiles never show a crack between them
  const edges = [[...Array(n).keys()], [...Array(n).keys()].map(a => a * n + seg), [...Array(n).keys()].map(a => seg * n + a), [...Array(n).keys()].map(a => a * n)];
  let o = n * n;
  for (const e of edges) {
    e.forEach((k, q) => { pos[(o + q) * 3] = pos[k * 3]; pos[(o + q) * 3 + 1] = pos[k * 3 + 1] - 14; pos[(o + q) * 3 + 2] = pos[k * 3 + 2]; for (let m = 0; m < 3; m++) { nor[(o + q) * 3 + m] = nor[k * 3 + m]; col[(o + q) * 3 + m] = col[k * 3 + m]; } uv[(o + q) * 2] = uv[k * 2]; uv[(o + q) * 2 + 1] = uv[k * 2 + 1]; });
    for (let q = 0; q < n - 1; q++) { const a0 = e[q], a1 = e[q + 1], d0 = o + q, d1 = o + q + 1; idx.push(a0, d0, a1, a1, d0, d1, a0, a1, d0, a1, d1, d0); }
    o += n;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeBoundingSphere();
  const m = new THREE.Mesh(g, terrainMat); m.receiveShadow = !far; if (far) m.position.y = -0.6; scene.add(m); return m;
}
function drain(it) { let r; while (!(r = it.next()).done); return r.value; }
const buildTileMesh = (t, seg, far) => drain(buildTileGen(t, seg, far));
function buildBorder() { // four wide, coarse strips beyond the tiles so the outer range continues to the horizon
  const ST = 60, X0 = TX0, X1 = TX0 + NTX * TILE, Z0 = TZ0, Z1 = TZ0 + NTZ * TILE, OUT = 3600, c = new THREE.Color();
  for (const [ax, bx, az, bz] of [[X0 - OUT, X0 + 40, Z0 - OUT, Z1 + OUT], [X1 - 40, X1 + OUT, Z0 - OUT, Z1 + OUT], [X0, X1, Z1 - 40, Z1 + OUT], [X0, X1, Z0 - OUT, Z0 + 40]]) {
    const nx = Math.round((bx - ax) / ST), nz = Math.round((bz - az) / ST), n = (nx + 1) * (nz + 1), pos = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [];
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const k = j * (nx + 1) + i, x = ax + i * ST, z = az + j * ST, h = Hraw(x, z);
      pos[k * 3] = x; pos[k * 3 + 1] = h - 0.8; pos[k * 3 + 2] = z; uv[k * 2] = x / 30; uv[k * 2 + 1] = z / 30;
      const sl = Math.hypot(Hraw(x + ST, z) - h, Hraw(x, z + ST) - h) / ST;
      c.copy(TC.snow).lerp(TC.shade, clamp((sl - 0.3) * 0.9, 0, 0.55)).lerp(TC.rock, clamp((sl - 0.75) * 1.6, 0, 0.75)).lerp(TC.pine, clamp(0.5 - h / 500, 0, 0.45) * sstep(0.3, 0.7, vnoise(x * 0.004, z * 0.004) + 0.5));
      col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
      if (i < nx && j < nz) idx.push(k, k + nx + 1, k + 1, k + 1, k + nx + 1, k + nx + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
    scene.add(new THREE.Mesh(g, terrainMat));
  }
}
function tileDist(t, x, z) { return Math.max(0, Math.hypot(t.cx - x, t.cz - z) - TILE * 0.7); }
const frustum = new THREE.Frustum(), projM = new THREE.Matrix4();
let job = null; const loQueue = new Set(); // far tiles finish loading in the background after start-up
function updateTiles(x, z, sync) {
  camera.updateMatrixWorld(); projM.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); frustum.setFromProjectionMatrix(projM);
  let next = null, nd = 1e9;
  for (const t of tiles) {
    const d = tileDist(t, x, z);
    if (!t.lo) { if (sync && d <= 2400) t.lo = buildTileMesh(t, LO_SEG, true); else { loQueue.add(t); continue; } }
    const want = d < HI_R + (t.hi && t.hi.visible ? 140 : 0);
    if (want && (!t.hi || !t.trees)) { if (sync) { if (!t.hi) t.hi = buildTileMesh(t, HI_SEG, false); if (!t.trees) drain(genTreesGen(t)); } else if (d < nd && !(job && job.t === t)) { nd = d; next = t; } }
    if (t.hi) t.hi.visible = want;
    t.lo.visible = !(t.hi && t.hi.visible);
    const seen = !t.box || frustum.intersectsBox(t.box) || d < 30; // skip everything on tiles behind you or off to the side
    if (t.trees) { const vis = seen && d < TREE_VIS, sh = d < 40; for (const m of t.trees) { m.visible = vis; if (m.isInstancedMesh) m.castShadow = sh; } }
    if (t.cover) { const cv = seen && d < (LOW ? 150 : 240); for (const m of t.cover) m.visible = cv; }
  }
  if (sync) { job = null; return; }
  if (!job && !next && loQueue.size) { const t = loQueue.values().next().value; loQueue.delete(t); job = { t, it: buildTileGen(t, LO_SEG, true), done: m => { t.lo = m; } }; }
  if (!job && next) { const t = next; job = !t.hi ? { t, it: buildTileGen(t, HI_SEG, false), done: m => { t.hi = m; m.visible = false; } } : { t, it: genTreesGen(t), done: () => { } }; }
  const t0 = performance.now(), budget = LOW ? 4 : 6;
  while (job && performance.now() - t0 < budget) { const r = job.it.next(); if (r.done) { job.done(r.value); job = null; } }
}
