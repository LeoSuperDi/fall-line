/* Frostpeak Frontier: world.js
   The resort map: six mountains, the valley, height of the ground anywhere, places, trails, snow types.
   Loaded as a plain script; files share one global scope and load in the order listed in index.html. */
'use strict';

/* ================= the world =================
   One connected map: six mountains stand in a ring around a round central valley and face inward toward it.
   Neighbouring mountains overlap at their edges, so together they form one continuous range joined by saddles.
   x: east(+)/west(-), z: north(+)/south(-), y: up. Frostpeak, the original mountain, is the northern one; Lowpine Village sits at its foot. */
const RING = { cx: 0, cz: -1460, R0: 700 }; // the valley is a circle of radius R0 around (cx, cz)
const WORLD = { x0: RING.cx - 3500, x1: RING.cx + 3500, z0: RING.cz - 3500, z1: RING.cz + 3500 };
const PG = new Map(), PC = 32;
const REGIONS = [ // ang: compass bearing of the mountain from the valley centre, clockwise from north
  { id: 'frost', name: 'Frostpeak', ang: 0, peak: 760, kind: 'frost', treeMul: 1, treeline: 450, rockSl: 0.85, uS: 1465, vS: -420, rvN: 520, rvP: 1060, back: 300, exp: 1.2 },
  { id: 'ember', name: 'Ember Peak', ang: 60, peak: 980, kind: 'volcano', treeMul: 0.12, treeline: 240, rockSl: 0.6, exp: 1.12 },
  { id: 'aurora', name: 'Aurora Peak', ang: 120, peak: 880, kind: 'aurora', treeMul: 0.6, treeline: 420, rockSl: 0.85, exp: 1.45 },
  { id: 'crags', name: 'Windswept Crags', ang: 180, peak: 1050, kind: 'crags', treeMul: 0.4, treeline: 380, rockSl: 0.5, exp: 1.22 },
  { id: 'dunes', name: 'Sunset Dunes', ang: 240, peak: 600, kind: 'dunes', treeMul: 0.03, treeline: 120, rockSl: 0.9, exp: 1.0 },
  { id: 'pine', name: 'Pine Ridge', ang: 300, peak: 700, kind: 'pine', treeMul: 1.75, treeline: 600, rockSl: 0.95, exp: 1.02, rvN: 700, rvP: 700, uS: 1900, vS: 0, back: 480 }
];
REGIONS.forEach(r => { if (!r.uS) Object.assign(r, { uS: 1900, vS: 0, rvN: 1100, rvP: 1100, back: 480 }); });
REGIONS.forEach(r => { r.topU = r.kind === 'volcano' ? r.uS - 250 : r.uS - 54; r.rimH = r.peak * Math.pow(0.9, r.exp); });
const REG = {}; REGIONS.forEach((r, i) => { REG[r.id] = r; r.i = i; const a = r.ang * Math.PI / 180;
  r.dx = Math.sin(a); r.dz = Math.cos(a); r.fx = RING.cx + r.dx * RING.R0; r.fz = RING.cz + r.dz * RING.R0; // the foot of the mountain on the valley's edge
  r.cx = r.fx; r.dh = Math.atan2(-r.dx, r.dz); }); // dh: the heading that faces downhill, toward the valley
const NEXT = r => REGIONS[(r.i + 1) % REGIONS.length]; // clockwise neighbour
// local mountain coordinates: u = metres up the fall line from the valley's edge, v = metres across (positive toward the clockwise neighbour)
function toLocal(r, x, z) { const a = x - r.fx, b = z - r.fz; return [a * r.dx + b * r.dz, a * r.dz - b * r.dx]; }
function toWorld(r, u, v) { return [r.fx + r.dx * u + r.dz * v, r.fz + r.dz * u - r.dx * v]; }
function bearing(x, z) { let a = Math.atan2(x - RING.cx, z - RING.cz) * 180 / Math.PI; return a < 0 ? a + 360 : a; }
const angDiff = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
function regionAt(x, z) {
  if (Math.hypot(x - RING.cx, z - RING.cz) < RING.R0 - 30) return null; // the valley floor
  const b = bearing(x, z); let best = null, bd = 1e9;
  for (const r of REGIONS) { const d = angDiff(b, r.ang); if (d < bd) { bd = d; best = r; } }
  return best;
}
function regionMix(x, z) { // nearest mountain, its neighbour, how far toward the neighbour (0..0.5), and how much valley
  const b = bearing(x, z), list = REGIONS.slice().sort((p, q) => angDiff(b, p.ang) - angDiff(b, q.ang));
  const a = list[0], n = list[1], w = 0.5 * sstep(16, 30, angDiff(b, a.ang)), u = toLocal(a, x, z)[0];
  return [a, n, w, 1 - sstep(-90, 30, u)];
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
// the creek winds down the middle of the valley in a small gorge; trails cross it on bridges
function creekD(x, z) { return Math.max(0, Math.hypot(x - RING.cx, z - RING.cz) - 118); } // distance from the frozen tarn in the middle of the valley
function creekH(x, z) { const d = Math.hypot(x - RING.cx, z - RING.cz); return -3.5 * (1 - sstep(105, 140, d)); }
// landforms placed on purpose between neighbouring mountains, so each connector trail meets something: a ravine, ridges of rock
const FEATS = []; // filled in below, one landform in each gap between neighbouring mountains
function featH(x, z) {
  let s = 0;
  for (const f of FEATS) {
    const vx = f.b[0] - f.a[0], vz = f.b[1] - f.a[1], t = clamp(((x - f.a[0]) * vx + (z - f.a[1]) * vz) / (vx * vx + vz * vz), 0, 1);
    const d = Math.hypot(x - f.a[0] - vx * t, z - f.a[1] - vz * t); if (d > f.w * 1.6) continue;
    if (f.h < 0) s += f.h * (1 - sstep(f.w * 0.45, f.w * 1.3, d)) * sstep(0, 0.06, t) * sstep(0, 0.06, 1 - t);
    else s += f.h * Math.pow(1 - sstep(0, f.w, d), 1.3) * (1 + (f.rough || 0) * fbm(x * 0.02 + 3, z * 0.02)) * sstep(0, 0.08, t) * sstep(0, 0.08, 1 - t);
  }
  return s;
}
function valleyH(x, z) {
  let h = -3 + 2.5 * fbm(x * 0.004 + 9, z * 0.004 + 2);
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
  else if (r.kind === 'crags') { h += k * t * (44 * Math.pow(0.5 + 0.5 * vnoise(x * 0.006 + 4, z * 0.006 - 2), 2) + 10 * fbm(x * 0.01, z * 0.01)); }
  else if (r.kind === 'aurora') h += k * t * (9 * fbm(x * 0.007, z * 0.007) + 4 * Math.sin(v * 0.012));
  else if (r.kind === 'volcano') { // a cone with a crater on top, and gullies of old lava down its sides
    h += k * t * 18 * Math.pow(vnoise(x * 0.01, z * 0.01), 2);
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
  const du = u - r.uS, dv = v - r.vS, q = Math.hypot(du < 0 ? du / r.uS : du / r.back, dv / 1300) / 1.6;
  return q >= 1 ? 0 : r.peak * 0.62 * Math.pow(1 - q, 1.15); // high shoulders: neighbours meet in a raised ridge, not a deep pocket
}
function Hraw(x, z) { return Hbase(x, z) + creekH(x, z) + featH(x, z); }
function Hbase(x, z) { // the land without the tarn or the placed landforms: connector trails are graded to this
  const base = valleyH(x, z); let m = 0; const sh = [];
  for (const r of REGIONS) {
    const [u, v] = toLocal(r, x, z);
    if (u < -120 || u > r.uS + r.back + 40 || Math.abs(v) > 2100) { sh.push(0); continue; }
    m = Math.max(m, mountainH(r, x, z, u, v)); sh.push(shoulderH(r, u, v));
  }
  for (let i = 0; i < sh.length; i++) { const j = (i + 1) % sh.length; if (sh[i] && sh[j]) m = Math.max(m, Math.min(sh[i], sh[j]) * (0.85 + 0.15 * fbm(x * 0.004, z * 0.004))); } // saddle ridges join neighbours
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
// Each surface is a real layer at its own height: a thick snow cover with a visible edge, rock pushing up in outcrops,
// wind ripples in the sand, lumpy ash, and grass and forest floor lowest of all.
function surfLift(x, z, h0) {
  const r = regionAt(x, z), bn = fbm(x * 0.006 + 7, z * 0.006 - 3);
  const snow = 1.1 * (1 - sstep(0.3, 0.5, thawAt(x, z, h0))); // the snow layer, ending in a short bank where the ground shows through
  if (!r) return snow;
  if (r.id === 'dunes') { const [u, v] = toLocal(r, x, z); return 0.7 + 0.6 * Math.sin(u * 0.09 + 1.5 * vnoise(x * 0.004, z * 0.004) + v * 0.02); }
  if (r.id === 'ember') return 0.3 + 0.9 * Math.max(0, vnoise(x * 0.06 + 2, z * 0.06));
  const rockOut = 0.6 + 1.4 * Math.max(0, vnoise(x * 0.045 + 9, z * 0.045 - 4)); // knobbly rock standing proud of the snow
  if (r.id === 'crags') return lerp(rockOut, snow + 0.4, sstep(-12, 12, h0 - (300 + bn * 160)));
  if (r.id === 'pine') return lerp(0.15 * vnoise(x * 0.08, z * 0.08), snow, sstep(-15, 15, h0 - (r.peak * 0.5 + bn * 140)));
  return snow;
}
const SNOW_D = 0.5; // depth of the snow layer that sits on top of the ground
function Hm(x, z) {
  const h0 = Hraw(x, z); let h = h0 + surfLift(x, z, h0);
  if (PG.size) { const pn = pisteNear(x, z); if (pn.run >= 0) { const R = RUNS[pn.run], hw = R.w / 2;
    if (!R.link) h -= 0.3 * (1 - sstep(hw - 3, hw + 2, pn.d)); // ordinary trails follow the ground, just packed a little lower
    else { // connectors: cut a canyon or build an embankment to their grade; past those limits a tunnel or bridge takes over
      const tgt = pn.hc + SNOW_D - 0.2, diff = h - tgt;
      const md = R.path[pn.k].mode;
      if (diff >= 0 && md !== 'tunnel') h = lerp(h, tgt, 1 - sstep(hw, hw + clamp(diff * 1.1, 4, 18), pn.d));
      else if (diff < 0 && md !== 'bridge') h = lerp(h, tgt, 1 - sstep(hw, hw + clamp(-diff * 2.2, 4, 18), pn.d));
    } } }
  for (const f of FLATS) { const dx = x - f.x, dz = z - f.z; if (dx * dx + dz * dz < f.r * f.r) h = lerp(h, f.h, 1 - sstep(f.r * 0.5, f.r, Math.sqrt(dx * dx + dz * dz))); }
  const dl = Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz);
  if (dl < 1.7) h = lerp(h, LAKE.h, 1 - sstep(1.0, 1.7, dl));
  return h;
}
/* moguls: fields of bumps, one on Frostpeak's Fox Run and one on a black run of every other mountain (added once the runs exist) */
const MOG_R = 2.9, MOGS = [];
function mogulField(cx, cz, rx, rz, seed) {
  const F = { cx, cz, rx, rz, sx: 6.4, sz: 5.6 }; F.x0 = cx - rx; F.z0 = cz - rz;
  F.ni = Math.ceil(rx * 2 / F.sx) + 2; F.nj = Math.ceil(rz * 2 / F.sz) + 2; F.amp = new Float32Array(F.ni * F.nj);
  const r = mulberry32(seed);
  for (let j = 0; j < F.nj; j++) for (let i = 0; i < F.ni; i++) { const x = F.x0 + i * F.sx + (j % 2) * F.sx / 2, z = F.z0 + j * F.sz; F.amp[j * F.ni + i] = Math.hypot((x - cx) / rx, (z - cz) / rz) < 0.92 ? 0.55 + r() * 0.3 : 0; }
  MOGS.push(F); return F;
}
const MOG = mogulField(125, 110, 55, 125, 99);
function mogulH(x, z) {
  let h = 0;
  for (const F of MOGS) {
    if (x < F.x0 - 4 || x > F.cx + F.rx + 4 || z < F.z0 - 4 || z > F.cz + F.rz + 4) continue;
    const j0 = Math.round((z - F.z0) / F.sz);
    for (let j = j0 - 1; j <= j0 + 1; j++) { if (j < 0 || j >= F.nj) continue;
      const off = (j % 2) * F.sx / 2, i0 = Math.round((x - F.x0 - off) / F.sx);
      for (let i = i0 - 1; i <= i0 + 1; i++) { if (i < 0 || i >= F.ni) continue; const a = F.amp[j * F.ni + i]; if (!a) continue;
        const dx = x - (F.x0 + i * F.sx + off), dz = z - (F.z0 + j * F.sz), q = 1 - (dx * dx + dz * dz) / (MOG_R * MOG_R); if (q > 0) h = Math.max(h, a * q); } }
  }
  return h;
}
function inMoguls(x, z) { for (const F of MOGS) if (Math.hypot((x - F.cx) / F.rx, (z - F.cz) / F.rz) < 0.95) return true; return false; }
let H_MESH = false; // once the terrain tiles exist, stand on the triangles that are actually drawn
function linkDeck(x, z, yHint) { // the walking surface of a bridge deck or tunnel floor, if (x, z) is on one
  if (!PG.size) return null; const pn = pisteNear(x, z); if (pn.run < 0) return null;
  const R = RUNS[pn.run]; if (!R.link || pn.d > R.w / 2 + 0.3) return null;
  const md = R.path[pn.k].mode, y = md === 'tunnel' ? pn.hc + SNOW_D - 0.2 : md === 'bridge' ? pn.hc + SNOW_D - 0.1 : null;
  if (y === null || (yHint !== undefined && Math.abs(yHint - y) > 3)) return null; // walking under a bridge or over a tunnel
  return y;
}
function H(x, z, yHint) { const d = linkDeck(x, z, yHint); if (d !== null) return d; return (H_MESH ? meshH(x, z) : Hm(x, z)) + mogulH(x, z); }

/* ================= ski runs ================= */
const RUNS = [
  { id: 'green', name: 'Meadow Way', col: '#2fa463', w: 44, pts: [[-390, 650], [-320, 500], [-230, 340], [-290, 170], [-200, 0], [-250, -190], [-170, -370], [-230, -520], [-260, -640]] },
  { id: 'blue', name: 'Fox Run', col: '#3d73d9', w: 34, pts: [[-330, 662], [-250, 540], [-150, 420], [-20, 290], [90, 175], [125, 100], [60, -90], [120, -280], [20, -450], [-120, -600], [-190, -650]] },
  { id: 'black', name: 'The Wall', col: '#1d2230', w: 28, pts: [[-282, 672], [-185, 572], [-45, 474], [120, 392], [262, 300], [340, 200], [300, -20], [360, -240], [250, -430], [60, -580], [-110, -655]] }
];
// ten trails per mountain: they leave the summit pad together, fan out across the face, and gather again at the base
const runV = (r, f, u) => r.vS + f * (60 + 0.75 * (f < 0 ? r.rvN : r.rvP) * (1 - u / r.uS));
const GREEN = '#2fa463', BLUE = '#3d73d9', BLACK = '#1d2230';
const DIFF = { g: [GREEN, 24, 'circle'], b: [BLUE, 20, 'square'], k: [BLACK, 17, 'diamond'], d: [BLACK, 14, 'double'] }; // narrow ribbons of groomed snow, so each mountain's own ground shows between them
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
// Connector trails: the ring Pine Ridge -> Frostpeak -> Ember Peak -> Aurora Peak -> Windswept Crags -> Sunset Dunes -> Pine Ridge,
// plus valley trails linking Lowpine to the mountains. Each is graded smoothly; the ground above the grade is cut into a canyon
// (or tunnelled when the cut would be too deep), and where the ground falls away a bridge carries the trail.
const LINK_COL = '#e0a21b', CAVE_D = 32, BRIDGE_D = 3;
const GAPS = [ // what each connector meets in the gap after each mountain (clockwise): canyon ridge, ravine (bridge) or big ridge (tunnel)
  ['Echo Canyon Road', 'Echo Canyon', { h: 24, w: 46, rough: 0.35 }],
  ['Cinder Bridge Run', 'Cinder Bridge', { h: -42, w: 30 }],
  ['Crystal Tunnel Run', 'Crystal Tunnel', { h: 70, w: 70, rough: 0.3 }],
  ['Red Rock Canyon', 'Red Rock Canyon', { h: 22, w: 42, rough: 0.4 }],
  ['Sandstone Tunnel Run', 'Sandstone Tunnel', { h: 62, w: 64, rough: 0.3 }],
  ['Pine Gap Traverse', 'Pine Gap Bridge', { h: -42, w: 30 }]
];
const LINKS = [], FEAT_NAME = {};
REGIONS.forEach((A, i) => {
  const B = NEXT(A), [name, feat, f] = GAPS[i], am = (A.ang + 30) * Math.PI / 180, ray = rr => [RING.cx + Math.sin(am) * rr, RING.cz + Math.cos(am) * rr];
  FEATS.push(Object.assign({ a: ray(RING.R0 + 170), b: ray(RING.R0 + 1500) }, f)); FEAT_NAME[name] = feat;
  // two connectors through every gap: from the top of each mountain down into its neighbour, one each way round the ring
  const route = (P, Q, sd, rad, nm, su, eu, sv) => { const s = toWorld(P, su || P.topU - 30, P.vS + sd * (sv || 140)), e = toWorld(Q, eu || 520, -sd * 420), mid = ray(RING.R0 + rad);
    LINKS.push([nm, [s, [(s[0] + mid[0]) / 2, (s[1] + mid[1]) / 2], mid, [(mid[0] + e[0]) / 2, (mid[1] + e[1]) / 2], e]]); };
  route(A, B, 1, 960, name);
  route(B, A, -1, 760, feat + ' Descent');
  route(A, B, 1, 560, feat + ' Traverse', 950, 300, 360); // a lower, gentler way across from mid-mountain
});
{ const loop = []; for (let k = 0; k <= 36; k++) { const a = (k / 36 * 360 + 5) * Math.PI / 180; loop.push([RING.cx + Math.sin(a) * (RING.R0 - 95), RING.cz + Math.cos(a) * (RING.R0 - 95)]); } LINKS.push(['Lowpine Loop', loop]); } // a trail all round the valley floor
LINKS.forEach(([name, pts]) => RUNS.push({ id: 'link-' + name, name, col: LINK_COL, w: 16, shape: 'circle', link: true, pts }));
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
  const raw = r.path.map(p => r.link ? Hbase(p.x, p.z) : Hraw(p.x, p.z)); // a trail's height is the ground's own height, smoothed along its length
  const win = 5; // close to the land; only the placed landforms and the creek gorge make canyons, tunnels and bridges
  r.path.forEach((p, i) => { let s = 0, n = 0; for (let k = Math.max(0, i - win); k <= Math.min(raw.length - 1, i + win); k++) { s += raw[k]; n++; } p.hc = s / n; });
  r.path.forEach(p => { p.cut = r.link ? Hraw(p.x, p.z) - p.hc : 0; p.mode = p.cut >= CAVE_D ? 'tunnel' : p.cut <= -BRIDGE_D ? 'bridge' : null; });
  if (r.link) { for (let i = 1; i < r.path.length - 1; i++) { const a = r.path[i - 1].mode, b = r.path[i + 1].mode; if (!r.path[i].mode && a && a === b) r.path[i].mode = a; } // no one-point gaps
    for (let i = 0; i < r.path.length;) { const m = r.path[i].mode; let j = i; while (j + 1 < r.path.length && r.path[j + 1].mode === m) j++; if (m && j - i < 5) for (let k = i; k <= j; k++) r.path[k].mode = null; i = j + 1; } } // tiny spans become cuts or embankments instead
});
{
  RUNS.forEach(r => { if (!r.link || !FEAT_NAME[r.name]) return; let best = -1, bv = 0; r.path.forEach((p, i) => { const v = Math.abs(p.cut); if (v > bv) { bv = v; best = i; } });
    if (best >= 0) POIS.push({ id: 'feat-' + r.name, name: FEAT_NAME[r.name], x: r.path[best].x, z: r.path[best].z, r: 34 }); });
  POIS.forEach(p => POI[p.id] = p); }
REGIONS.forEach((r, i) => { if (r.id === 'frost') return; const run = RUNS.find(R => R.region === r.id && R.col === BLACK && R.shape === 'diamond'); if (!run) return; const p = runAt(run, 0.55); mogulField(p.x, p.z, 42, 42, 500 + i); });
function runAt(run, f) { const p = run.path, s = f * run.len; let i = 0; while (i < p.length - 1 && p[i + 1].s < s) i++; return p[i]; }
const PN = { d: 0, run: -1, hc: 0, cut: 0, k: 0 };
function pisteNear(x, z) { // nearest point on any run centreline (projected on segments), with the run's graded height there
  const ci = Math.floor(x / PC), cj = Math.floor(z / PC); let best = 1e18, run = -1, hc = 0, cut = 0, kk = 0;
  for (let a = ci - 1; a <= ci + 1; a++) for (let b = cj - 1; b <= cj + 1; b++) {
    const L = PG.get(a * 4096 + b); if (!L) continue;
    for (let i = 0; i < L.length; i += 2) {
      const path = RUNS[L[i]].path, k = L[i + 1];
      for (const k2 of [k - 1, k + 1]) {
        if (k2 < 0 || k2 >= path.length) continue;
        const p = path[k], q = path[k2], vx = q.x - p.x, vz = q.z - p.z, l2 = vx * vx + vz * vz || 1;
        const t = clamp(((x - p.x) * vx + (z - p.z) * vz) / l2, 0, 1), px = p.x + vx * t, pz = p.z + vz * t, d = (x - px) * (x - px) + (z - pz) * (z - pz);
        if (d < best) { best = d; run = L[i]; hc = p.hc + (q.hc - p.hc) * t; cut = p.cut + (q.cut - p.cut) * t; kk = t < 0.5 ? k : k2; }
      }
    }
  }
  PN.d = Math.sqrt(best); PN.run = run; PN.hc = hc; PN.cut = cut; PN.k = kk; return PN;
}
RUNS.forEach((r, ri) => r.path.forEach((p, k) => { const key = Math.floor(p.x / PC) * 4096 + Math.floor(p.z / PC); if (!PG.has(key)) PG.set(key, []); PG.get(key).push(ri, k); }));
function pisteInfo(x, z) { const p = pisteNear(x, z); return { d: p.d, run: p.run }; }
function onPiste(x, z, pad) { const p = pisteInfo(x, z); return p.run >= 0 && p.d < RUNS[p.run].w / 2 + (pad || 0); }
function slopeAt(x, z) { const e = 1.5; return Math.hypot(Hm(x + e, z) - Hm(x - e, z), Hm(x, z + e) - Hm(x, z - e)) / (2 * e); }
function thawAt(x, z, h) { // 0 = full snow cover, 1 = bare grass and earth; only on the lower slopes and the valley
  const low = 1 - sstep(20, 150, h); if (low <= 0) return 0;
  const rg = regionAt(x, z); if (rg && (rg.id === 'ember' || rg.id === 'dunes' || rg.id === 'aurora' || rg.id === 'crags')) return 0;
  const vb = rg ? 0 : 0.32; // the valley floor is mostly meadow
  const n = fbm(x * 0.0075 + 3, z * 0.0075 - 5) * 0.75 + vnoise(x * 0.03, z * 0.03) * 0.25; // broad meadows, soft edges
  return sstep(-0.02, 0.2, n + low * 0.36 + vb - 0.45);
}
function snowType(x, z, sl) {
  if (Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz) < 1) return 'ice';
  if (Math.hypot(x - POI.icefalls.x, z - POI.icefalls.z) < 40) return 'ice';
  if (inMoguls(x, z)) return 'moguls';
  if (onPiste(x, z)) return 'groomed';
  if (creekD(x, z) < 1) return 'ice'; // the frozen tarn
  if (!(Math.hypot((x + 230) / 360, (z + 715) / 120) < 1) && thawAt(x, z, Hraw(x, z)) > 0.5) return 'thin';
  const r = regionAt(x, z);
  if (!r) return 'powder';
  if (r.id === 'ember') return 'ash';
  if (r.id === 'dunes') return vnoise(x * 0.006 + 2, z * 0.006) > 0.45 ? 'powder' : 'sand';
  if (r.id === 'aurora') return sl < 0.45 && fbm(x * 0.004 + 5, z * 0.004) > 0.22 ? 'blueice' : 'powder'; // broad glacier tongues on the gentler ground, not speckles
  const hh = Hraw(x, z), bn = fbm(x * 0.006 + 7, z * 0.006 - 3); // noise on every threshold so the boundaries wander instead of making stripes
  if (r.id === 'crags') return sl > 0.48 + bn * 0.3 || hh < 300 + bn * 160 ? 'rock' : 'windpack'; // bare rock low and on steep faces, wind-packed snow high up
  if (r.id === 'pine') return hh < r.peak * 0.5 + bn * 140 ? (sl > 0.75 ? 'rock' : 'forest') : sl > 0.85 ? 'rock' : 'powder'; // forest floor below the snow line
  return 'powder';
}
