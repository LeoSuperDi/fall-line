/* Frostpeak Frontier: world.js
   The resort map: six mountains, the valley, height of the ground anywhere, places, trails, snow types.
   Loaded as a plain script; files share one global scope and load in the order listed in index.html. */
'use strict';

/* ================= the world =================
   One connected map. A valley runs east-west (z about -780 to -1100) with Lowpine Village on its north edge.
   Three mountains rise north of it (downhill is -z) and three rise south of it (downhill is +z).
   x: east(+)/west(-), y: up. Frostpeak, the original mountain, is centred on x = 0. */
const WORLD = { x0: -3600, x1: 3600, z0: -3540, z1: 1680 };
const PG = new Map(), PC = 32;
const MTN_L = 1440, MTN_W = 1120;
const REGIONS = [
  { id: 'frost', name: 'Frostpeak', row: 1, cx: 0, peak: 760, kind: 'frost', treeMul: 1, treeline: 450, rockSl: 0.85, uS: 1465, vS: -420, rvN: 520, rvP: 1060, back: 300, exp: 1.2 },
  { id: 'pine', name: 'Pine Ridge', row: 1, cx: -2400, peak: 700, kind: 'pine', treeMul: 1.75, treeline: 600, rockSl: 0.95, exp: 1.02, rvN: 700, rvP: 700, uS: 1900, vS: 0, back: 480 },
  { id: 'ember', name: 'Ember Peak', row: 1, cx: 2400, peak: 980, kind: 'volcano', treeMul: 0.18, treeline: 240, rockSl: 0.6, exp: 1.12 },
  { id: 'dunes', name: 'Sunset Dunes', row: -1, cx: -2400, peak: 600, kind: 'dunes', treeMul: 0.03, treeline: 120, rockSl: 0.9, exp: 1.0 },
  { id: 'crags', name: 'Windswept Crags', row: -1, cx: 0, peak: 1050, kind: 'crags', treeMul: 0.45, treeline: 380, rockSl: 0.55, exp: 1.22 },
  { id: 'aurora', name: 'Aurora Peak', row: -1, cx: 2400, peak: 880, kind: 'aurora', treeMul: 0.6, treeline: 420, rockSl: 0.85, exp: 1.45 }
];
REGIONS.forEach(r => { if (r.uS) return; Object.assign(r, { uS: 1900, vS: 0, rvN: 1100, rvP: 1100, back: 480 }); });
const REGIONS_BY_ROW = { 1: [], '-1': [] }; // the mountains in each row, west to east
REGIONS.forEach(r => REGIONS_BY_ROW[r.row].push(r)); REGIONS_BY_ROW[1].sort((a, b) => a.cx - b.cx); REGIONS_BY_ROW[-1].sort((a, b) => a.cx - b.cx);
REGIONS.forEach(r => { r.topU = r.kind === 'volcano' ? r.uS - 250 : r.uS - 54; r.rimH = r.peak * Math.pow(0.9, r.exp); });
const REG = {}; REGIONS.forEach(r => { REG[r.id] = r; r.zb = r.row > 0 ? -760 : -1100; });
// local mountain coordinates: u = metres up the fall line from the valley, v = metres across
function toLocal(r, x, z) { return r.row > 0 ? [z - r.zb, x - r.cx] : [r.zb - z, r.cx - x]; }
function toWorld(r, u, v) { return r.row > 0 ? [r.cx + v, r.zb + u] : [r.cx - v, r.zb - u]; }
function regionAt(x, z) {
  const row = z > -930 ? 1 : -1; let best = null, bd = 1e9;
  for (const r of REGIONS) if (r.row === row) { const d = Math.abs(x - r.cx); if (d < bd) { bd = d; best = r; } }
  if (bd > 1200) return null;
  return toLocal(best, x, z)[0] > -30 ? best : null;
}
function regionMix(x, z) { // nearest mountain, its neighbour, how far toward the neighbour (0..0.5), and how much valley
  const row = z > -930 ? 1 : -1, list = REGIONS.filter(r => r.row === row).sort((a, b) => Math.abs(x - a.cx) - Math.abs(x - b.cx));
  const a = list[0], b = list[1], w = 0.5 * sstep(900, 1200, Math.abs(x - a.cx)), u = toLocal(a, x, z)[0];
  return [a, b, w, 1 - sstep(-90, 30, u)];
}
function mixNum(x, z, key, valleyVal) { const [a, b, w, vw] = regionMix(x, z); return lerp(lerp(a[key], b[key], w), valleyVal, vw); }
const VALLEY_TREES = 0.32; // open valley floor so the peaks stay in view
// the Frontier's outer range: big jagged peaks that ring the resort and rise from its edges
const RIM = { x0: WORLD.x0 + 70, x1: WORLD.x1 - 70, z0: WORLD.z0 + 70, z1: WORLD.z1 - 70 };
function outerH(x, z) {
  const dx = Math.max(RIM.x0 - x, x - RIM.x1, 0), dz = Math.max(RIM.z0 - z, z - RIM.z1, 0); if (dx === 0 && dz === 0) return 0;
  const d = Math.hypot(dx, dz), rn = 1 - Math.abs(vnoise(x * 0.0011 + 7, z * 0.0011 - 3)), rn2 = 1 - Math.abs(vnoise(x * 0.004 - 1, z * 0.004 + 5));
  return Math.min(d * d * 0.012, 160) + sstep(60, 1500, d) * (600 + 1400 * rn * rn + 260 * rn2) + 40 * fbm(x * 0.01, z * 0.01) * sstep(0, 300, d);
}
function valleyH(x, z) {
  let h = -3 + 2.5 * fbm(x * 0.004 + 9, z * 0.004 + 2) - 2.5 * Math.exp(-Math.pow((z + 935) / 45, 2)); // a frozen creek down the middle
  return h + outerH(x, z);
}
function mountainH(r, x, z, u, v) { // one standalone peak: slopes fall away from the summit on every side down to the valley
  const du = u - r.uS, dv = v - r.vS;
  const ru = du < 0 ? du / r.uS : du / r.back, rv = dv < 0 ? dv / r.rvN : dv / r.rvP;
  const ang = Math.atan2(rv, ru);
  let q0 = Math.hypot(ru, rv);
  if (r.kind === 'pine') q0 = Math.hypot(ru, rv * 0.62); // a long ridge rather than a cone
  if (r.kind === 'aurora') q0 = lerp(q0, (Math.abs(ru) + Math.abs(rv)) * 0.8, 0.7); // a four-faced horn with sharp edges
  const q = q0 * (1 + 0.07 * Math.sin(ang * 6 + r.cx * 0.01) + 0.05 * vnoise(ang * 3, r.peak)); // spurs and gullies
  if (q >= 1) return 0;
  const t = 1 - q, k = sstep(0, 0.12, t);
  let h = r.kind === 'dunes' ? r.peak * sstep(0, 0.6, t) * (0.72 + 0.28 * t) : r.peak * Math.pow(t, r.exp); // the dunes sit on a flat-topped mesa
  if (r.kind === 'pine') h *= 0.8 + 0.2 * Math.pow(Math.cos(dv * 0.0085), 2); // several rounded tops along the ridge
  if (r.kind === 'crags') for (const [su, sv, sk] of [[-260, -360, 0.72], [-300, 380, 0.66], [-520, 40, 0.55], [-120, 620, 0.48]]) { // a crown of spikes around the summit
    const ds = Math.hypot(du - su, dv - sv) / 320; if (ds < 1) h = Math.max(h, r.peak * sk * Math.pow(1 - ds, 1.5) + r.peak * 0.25 * Math.pow(t, 1.2)); }
  if (r.kind === 'frost') {
    h += k * t * (16 * fbm(x * 0.0045, z * 0.0045) + 3.5 * fbm(x * 0.03 + 7, z * 0.03) + 5 * Math.sin(x * 0.013 + Math.sin(z * 0.0035) * 2.2));
    const wx = sstep(80, 360, x) * (1 - sstep(500, 580, x));
    h += k * wx * 52 * sstep(-170, 110, z) * (1 - sstep(110, 640, z)); // The Wall's shoulder on the east flank
  }
  else if (r.kind === 'pine') h += k * t * (14 * fbm(x * 0.006 + 3, z * 0.006) + 6 * Math.sin(x * 0.02 + Math.sin(z * 0.01) * 2) + 6 * fbm(x * 0.02, z * 0.02));
  else if (r.kind === 'bowl') h += k * (5 * t * fbm(x * 0.008, z * 0.008) - r.peak * 0.2 * Math.exp(-Math.pow((dv - 320) / 380, 2)) * sstep(0.2, 0.55, t) * (1 - sstep(0.78, 0.95, t)));
  else if (r.kind === 'glacier') h += k * t * (6 * fbm(x * 0.005, z * 0.005) + 4 * Math.sin(v * 0.012));
  else if (r.kind === 'crags') { const rn = 1 - Math.abs(vnoise(x * 0.006 + 4, z * 0.006 - 2)); h += k * t * (60 * rn * rn + 18 * fbm(x * 0.015, z * 0.015)); }
  else if (r.kind === 'aurora') h += k * t * (9 * fbm(x * 0.007, z * 0.007) + 4 * Math.sin(v * 0.012));
  else if (r.kind === 'volcano') { // a cone with a crater on top, and gullies of old lava down its sides
    h += k * t * 22 * Math.abs(vnoise(x * 0.01, z * 0.01));
    const dc = Math.hypot(du, dv) / 190;
    if (dc < 1.35) { h = lerp(h, r.rimH - 70, 1 - sstep(0.5, 0.92, dc)); h += 16 * Math.exp(-Math.pow((dc - 1) / 0.22, 2)); }
  }
  else if (r.kind === 'dunes') { // broad wind-shaped ridges of sand
    const sd = u * 0.021 + 1.7 * Math.sin(v * 0.0042 + 1) + 1.2 * vnoise(x * 0.003, z * 0.003);
    h += k * (0.35 + 0.65 * t) * 19 * Math.pow(0.5 + 0.5 * Math.sin(sd), 2.2);
  }
  return Math.max(0, h);
}
function shoulderH(r, u, v) { // each mountain's low outer shoulders; where two neighbours' shoulders meet they form a saddle ridge
  const du = u - r.uS, dv = v - r.vS, q = Math.hypot(du < 0 ? du / r.uS : du / r.back, dv / 1100) / 1.75;
  return q >= 1 ? 0 : r.peak * 0.36 * Math.pow(1 - q, 1.3);
}
function Hraw(x, z) {
  const base = valleyH(x, z); let m = 0;
  for (const row of [1, -1]) {
    if (row > 0 ? z < -800 : z > -1060) continue;
    let prev = null;
    for (const r of REGIONS_BY_ROW[row]) {
      const dx = Math.abs(x - r.cx); if (dx > 2300) { prev = null; continue; }
      const [u, v] = toLocal(r, x, z), sh = shoulderH(r, u, v);
      if (dx < 1450) m = Math.max(m, mountainH(r, x, z, u, v));
      if (prev !== null) m = Math.max(m, Math.min(prev, sh) * (0.85 + 0.15 * fbm(x * 0.004, z * 0.004))); // saddle between neighbours
      prev = sh;
    }
  }
  return base + m;
}
const LAKE = { x: -380, z: -120, rx: 72, rz: 52, h: 0 };
LAKE.h = Hraw(LAKE.x, LAKE.z) - 3;
const POIS = [
  { id: 'summit', name: 'Summit Station', x: -430, z: 668, r: 46, camp: true, flat: 30 },
  { id: 'base', name: 'Base Lodge', x: -280, z: -672, r: 60, camp: true, flat: 0 },
  { id: 'ranger', name: 'Ranger Camp', x: 480, z: -120, r: 42, camp: true, flat: 26 },
  { id: 'hermit', name: "Hermit's Cabin", x: -505, z: 240, r: 36, camp: true, flat: 22 },
  { id: 'lake', name: 'Frozen Lake', x: -380, z: -120, r: 85 },
  { id: 'shrine', name: 'Old Shrine', x: -90, z: 210, r: 34, flat: 16 },
  { id: 'lookout', name: 'Lookout Tower', x: 470, z: 560, r: 36, flat: 16 },
  { id: 'icefalls', name: 'Ice Falls', x: 505, z: 300, r: 46 },
  { id: 'grotto', name: 'Crystal Grotto', x: 420, z: -470, r: 40, flat: 18 },
  { id: 'spring', name: 'Hot Spring', x: -480, z: -430, r: 36, flat: 20 },
  { id: 'village', name: 'Lowpine Village', x: -300, z: -712, r: 40 }
];
const LANDMARK = { pine: ['sawmill', 'Old Sawmill', 880, 420], ember: ['crater', 'The Crater', 1690, 0], dunes: ['arch', 'Sandstone Arch', 1000, 440], crags: ['cairn', 'Stone Cairn', 1360, 380], aurora: ['stargazer', 'Stargazer Hut', 1240, 400] };
REGIONS.forEach(r => {
  if (r.id === 'frost') return;
  const [tx, tz] = toWorld(r, r.topU, 22), [bx, bz] = toWorld(r, 88, 40), lm = LANDMARK[r.id], [lx, lz] = toWorld(r, lm[2], lm[3]);
  POIS.push({ id: r.id + '_top', name: r.name + ' summit', x: tx, z: tz, r: 46, camp: true, flat: 40 },
            { id: r.id + '_base', name: r.name + ' base', x: bx, z: bz, r: 50, camp: true, flat: 24 },
            { id: lm[0], name: lm[1], x: lx, z: lz, r: 40, camp: r.id === 'aurora', flat: r.id === 'ember' ? 0 : 16 });
});
const POI = {}; POIS.forEach(p => POI[p.id] = p);
const FLATS = POIS.filter(p => p.flat).map(p => ({ x: p.x, z: p.z, r: p.flat, h: Hraw(p.x, p.z) }));
const SNOW_D = 0.5; // depth of the snow layer that sits on top of the ground
function Hm(x, z) {
  const h0 = Hraw(x, z); let h = h0 + SNOW_D * (1 - sstep(0.15, 0.75, thawAt(x, z, h0)));
  if (PG.size) { const pn = pisteNear(x, z); if (pn.run >= 0) { const hw = RUNS[pn.run].w / 2; if (pn.d < hw + 16) {
    // only smooth out small bumps across the trail; never cut into the mountain or build it up
    const w = (1 - sstep(hw - 2, hw + 12, pn.d)) * (1 - sstep(1.5, 7, Math.abs(h - pn.hc)));
    h = lerp(h, pn.hc + SNOW_D, w);
    h += -0.35 * (1 - sstep(hw - 2, hw + 1, pn.d)) + 0.6 * Math.exp(-Math.pow((pn.d - hw - 3) / 3.5, 2)); // packed trail, soft snowbanks along its edges
  } } }
  for (const f of FLATS) { const dx = x - f.x, dz = z - f.z; if (dx * dx + dz * dz < f.r * f.r) h = lerp(h, f.h, 1 - sstep(f.r * 0.5, f.r, Math.sqrt(dx * dx + dz * dz))); }
  const dl = Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz);
  if (dl < 1.7) h = lerp(h, LAKE.h, 1 - sstep(1.0, 1.7, dl));
  return h;
}
/* moguls: a real field of bumps on Fox Run */
const MOG = { cx: 125, cz: 110, rx: 55, rz: 125, sx: 6.4, sz: 5.6 };
MOG.x0 = MOG.cx - MOG.rx; MOG.z0 = MOG.cz - MOG.rz;
MOG.ni = Math.ceil(MOG.rx * 2 / MOG.sx) + 2; MOG.nj = Math.ceil(MOG.rz * 2 / MOG.sz) + 2;
MOG.amp = new Float32Array(MOG.ni * MOG.nj);
{
  const r = mulberry32(99);
  for (let j = 0; j < MOG.nj; j++) for (let i = 0; i < MOG.ni; i++) {
    const x = MOG.x0 + i * MOG.sx + (j % 2) * MOG.sx / 2, z = MOG.z0 + j * MOG.sz;
    const e = Math.hypot((x - MOG.cx) / MOG.rx, (z - MOG.cz) / MOG.rz);
    MOG.amp[j * MOG.ni + i] = e < 0.92 ? 0.55 + r() * 0.3 : 0;
  }
}
const MOG_R = 2.9;
function mogulH(x, z) {
  if (x < MOG.x0 - 4 || x > MOG.cx + MOG.rx + 4 || z < MOG.z0 - 4 || z > MOG.cz + MOG.rz + 4) return 0;
  const j0 = Math.round((z - MOG.z0) / MOG.sz); let h = 0;
  for (let j = j0 - 1; j <= j0 + 1; j++) {
    if (j < 0 || j >= MOG.nj) continue;
    const off = (j % 2) * MOG.sx / 2, i0 = Math.round((x - MOG.x0 - off) / MOG.sx);
    for (let i = i0 - 1; i <= i0 + 1; i++) {
      if (i < 0 || i >= MOG.ni) continue;
      const a = MOG.amp[j * MOG.ni + i]; if (!a) continue;
      const dx = x - (MOG.x0 + i * MOG.sx + off), dz = z - (MOG.z0 + j * MOG.sz), q = 1 - (dx * dx + dz * dz) / (MOG_R * MOG_R);
      if (q > 0) h = Math.max(h, a * q);
    }
  }
  return h;
}
function inMoguls(x, z) { return Math.hypot((x - MOG.cx) / MOG.rx, (z - MOG.cz) / MOG.rz) < 0.95; }
function H(x, z) { return Hm(x, z) + mogulH(x, z); }

/* ================= ski runs ================= */
const RUNS = [
  { id: 'green', name: 'Meadow Way', col: '#2fa463', w: 44, pts: [[-390, 650], [-320, 500], [-230, 340], [-290, 170], [-200, 0], [-250, -190], [-170, -370], [-230, -520], [-260, -640]] },
  { id: 'blue', name: 'Fox Run', col: '#3d73d9', w: 34, pts: [[-330, 662], [-250, 540], [-150, 420], [-20, 290], [90, 175], [125, 100], [60, -90], [120, -280], [20, -450], [-120, -600], [-190, -650]] },
  { id: 'black', name: 'The Wall', col: '#1d2230', w: 28, pts: [[-282, 672], [-185, 572], [-45, 474], [120, 392], [262, 300], [340, 200], [300, -20], [360, -240], [250, -430], [60, -580], [-110, -655]] }
];
// ten trails per mountain: they leave the summit pad together, fan out across the face, and gather again at the base
const runV = (r, f, u) => r.vS + f * (60 + 0.75 * (f < 0 ? r.rvN : r.rvP) * (1 - u / r.uS));
const GREEN = '#2fa463', BLUE = '#3d73d9', BLACK = '#1d2230';
const DIFF = { g: [GREEN, 44, 'circle'], b: [BLUE, 36, 'square'], k: [BLACK, 30, 'diamond'], d: [BLACK, 24, 'double'] };
const RUN_NAMES = {
  frost: ['Snowdrift Lane', 'Lantern Line', 'Hare Hollow', 'Summit Express', 'Corkscrew', 'Ridge Runner', 'Last Light'],
  pine: ['Timber Trail', 'Sawmill Glade', 'Needle Chute', 'Woodsmoke', 'Birch Bend', "Logger's Run", 'Owl Hollow', 'Pinecone Alley', 'Bark Trail', 'The Thicket'],
  ember: ['Cinder Trail', 'Ash Run', 'Lava Lane', 'Magma Chute', 'Smoke Signal', 'Basalt Way', 'Fire Line', 'Obsidian', 'Hot Shot', 'The Caldera'],
  dunes: ['Sandpiper', 'Dune Rider', 'Mirage', 'Camel Back', 'Sirocco', 'Golden Hour', 'Dust Devil', 'Oasis Run', 'Ripple Road', 'Sandstorm'],
  crags: ['Gale Traverse', 'Shattered Spur', 'Windward', 'Stonefall', 'Granite Way', 'Howler', "Eagle's Drop", 'Scree Run', 'Broken Arrow', 'The Knife'],
  aurora: ['Starlight', 'Northern Lights', 'Midnight Drop', 'Moonbeam', 'Comet Tail', 'Night Owl', 'Lantern Glide', 'Polaris', 'Stardust', 'Twilight']
};
REGIONS.forEach((r, ri) => {
  const names = RUN_NAMES[r.id], n = names.length;
  const lanes = r.id === 'frost' ? [-0.85, -0.45, 0.25, 0.42, 0.6, 0.78, 0.95] : [-0.95, -0.72, -0.5, -0.3, -0.12, 0.12, 0.3, 0.5, 0.72, 0.95];
  const diffs = r.id === 'frost' ? ['g', 'b', 'k', 'g', 'b', 'k', 'd'] : ['g', 'b', 'k', 'g', 'b', 'k', 'g', 'b', 'k', 'd'];
  for (let k = 0; k < n; k++) {
    const lane = lanes[(k * 3 + ri) % n], [col, w, shape] = DIFF[diffs[k]], seed = ri * 7.3 + k * 2.1, top = r.topU - 6, pts = [];
    for (let i = 0; i <= 10; i++) {
      const f = i / 10, u = lerp(top, 95, f);
      const fr = i === 0 ? Math.sign(lane) * 0.03 : lane * sstep(0, 0.3, f) * (1 - 0.55 * sstep(0.75, 1, f)) + (i < 10 ? 0.09 * Math.sin(i * 1.9 + seed) : 0);
      pts.push(toWorld(r, u, runV(r, clamp(fr, -1, 1), u)));
    }
    RUNS.push({ id: r.id + k, name: names[k], col, w, shape, region: r.id, lamps: r.id === 'aurora', pts });
  }
});
function sampleRun(pts) {
  const raw = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let t = 0; t < 1; t += 0.01) {
      const t2 = t * t, t3 = t2 * t;
      const f = k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      raw.push([f(0), f(1)]);
    }
  }
  raw.push(pts[pts.length - 1].slice());
  const out = [{ x: raw[0][0], z: raw[0][1], s: 0 }]; let acc = 0;
  for (let i = 1; i < raw.length; i++) {
    const a = out[out.length - 1], d = Math.hypot(raw[i][0] - a.x, raw[i][1] - a.z);
    acc += d; if (acc >= 4 || i === raw.length - 1) { out.push({ x: raw[i][0], z: raw[i][1], s: a.s + Math.hypot(raw[i][0] - a.x, raw[i][1] - a.z) }); acc = 0; }
  }
  for (let i = 0; i < out.length; i++) {
    const a = out[Math.max(0, i - 1)], b = out[Math.min(out.length - 1, i + 1)], l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    out[i].tx = (b.x - a.x) / l; out[i].tz = (b.z - a.z) / l;
  }
  return out;
}
RUNS.forEach(r => {
  r.path = sampleRun(r.pts); r.len = r.path[r.path.length - 1].s;
  const raw = r.path.map(p => Hraw(p.x, p.z)); // the trail's height is the ground's own height, smoothed along its length
  r.path.forEach((p, i) => { let s = 0, n = 0; for (let k = Math.max(0, i - 5); k <= Math.min(raw.length - 1, i + 5); k++) { s += raw[k]; n++; } p.hc = s / n; });
});
function runAt(run, f) { const p = run.path, s = f * run.len; let i = 0; while (i < p.length - 1 && p[i + 1].s < s) i++; return p[i]; }
const PN = { d: 0, run: -1, hc: 0 };
function pisteNear(x, z) { // nearest point on any run centreline (projected on segments), with the run's graded height there
  const ci = Math.floor(x / PC), cj = Math.floor(z / PC); let best = 1e18, run = -1, hc = 0;
  for (let a = ci - 1; a <= ci + 1; a++) for (let b = cj - 1; b <= cj + 1; b++) {
    const L = PG.get(a * 4096 + b); if (!L) continue;
    for (let i = 0; i < L.length; i += 2) {
      const path = RUNS[L[i]].path, k = L[i + 1];
      for (const k2 of [k - 1, k + 1]) {
        if (k2 < 0 || k2 >= path.length) continue;
        const p = path[k], q = path[k2], vx = q.x - p.x, vz = q.z - p.z, l2 = vx * vx + vz * vz || 1;
        const t = clamp(((x - p.x) * vx + (z - p.z) * vz) / l2, 0, 1), px = p.x + vx * t, pz = p.z + vz * t, d = (x - px) * (x - px) + (z - pz) * (z - pz);
        if (d < best) { best = d; run = L[i]; hc = p.hc + (q.hc - p.hc) * t; }
      }
    }
  }
  PN.d = Math.sqrt(best); PN.run = run; PN.hc = hc; return PN;
}
RUNS.forEach((r, ri) => r.path.forEach((p, k) => { const key = Math.floor(p.x / PC) * 4096 + Math.floor(p.z / PC); if (!PG.has(key)) PG.set(key, []); PG.get(key).push(ri, k); }));
function pisteInfo(x, z) { const p = pisteNear(x, z); return { d: p.d, run: p.run }; }
function onPiste(x, z, pad) { const p = pisteInfo(x, z); return p.run >= 0 && p.d < RUNS[p.run].w / 2 + (pad || 0); }
function slopeAt(x, z) { const e = 1.5; return Math.hypot(Hm(x + e, z) - Hm(x - e, z), Hm(x, z + e) - Hm(x, z - e)) / (2 * e); }
function thawAt(x, z, h) { // 0 = full snow cover, 1 = bare grass and earth; only on the lower slopes and the valley
  const low = 1 - sstep(20, 150, h); if (low <= 0) return 0;
  const rg = regionAt(x, z); if (rg && (rg.id === 'ember' || rg.id === 'dunes' || rg.id === 'aurora' || rg.id === 'crags')) return 0;
  const n = fbm(x * 0.0075 + 3, z * 0.0075 - 5) * 0.75 + vnoise(x * 0.03, z * 0.03) * 0.25; // broad meadows, soft edges
  return sstep(-0.02, 0.2, n + low * 0.36 - 0.45);
}
function snowType(x, z, sl) {
  if (Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz) < 1) return 'ice';
  if (Math.hypot(x - POI.icefalls.x, z - POI.icefalls.z) < 40) return 'ice';
  if (inMoguls(x, z)) return 'moguls';
  if (onPiste(x, z)) return 'groomed';
  if (!(Math.hypot((x + 230) / 360, (z + 715) / 120) < 1) && thawAt(x, z, Hraw(x, z)) > 0.5) return 'thin';
  const r = regionAt(x, z);
  if (!r) return 'powder';
  if (r.id === 'ember') return 'ash';
  if (r.id === 'dunes') return vnoise(x * 0.006 + 2, z * 0.006) > 0.45 ? 'powder' : 'sand';
  if (r.id === 'aurora') return sl < 0.45 && fbm(x * 0.004 + 5, z * 0.004) > 0.22 ? 'blueice' : 'powder'; // broad glacier tongues on the gentler ground, not speckles
  if (r.id === 'crags') return 'windpack';
  return 'powder';
}
