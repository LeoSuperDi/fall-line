/* Frostpeak Frontier: gameplay.js
   Crystals and items, the pack and shop, quests, races, wildlife, random events, discovery.
   Loaded as a plain script; files share one global scope and load in the order listed in index.html. */
'use strict';

/* ================= world objects ================= */
let gameT = 0, state = 'loading';
const npcs = [];
const MARK = {};
function markTex(ch, bg) { return new THREE.CanvasTexture(mkCanvas(64, 64, g => { g.fillStyle = bg; g.beginPath(); g.arc(32, 32, 28, 0, TAU); g.fill(); g.lineWidth = 4; g.strokeStyle = '#ffffff'; g.stroke(); g.fillStyle = '#ffffff'; g.font = '800 42px "Barlow Condensed", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 32, 35); })); }
function buildNPCs() {
  MARK.offer = new THREE.SpriteMaterial({ map: markTex('!', '#f2661c'), depthTest: false, transparent: true });
  MARK.turn = new THREE.SpriteMaterial({ map: markTex('?', '#2f5e8c'), depthTest: false, transparent: true });
  for (const d of NPCS) {
    const m = makePerson(Object.assign({ ski: '#d9dde8' }, d)); // each person's own outfit and hat
    const y = Hm(d.x, d.z); m.position.set(d.x, y, d.z); scene.add(m);
    const mk = new THREE.Sprite(MARK.offer); mk.scale.set(0.9, 0.9, 1); mk.position.set(d.x, y + (d.small ? 2.0 : 2.5), d.z); mk.renderOrder = 5; scene.add(mk);
    npcs.push(Object.assign({}, d, { y, model: m, mark: mk, yaw: 0 }));
  }
}
function npcById(id) { return npcs.find(n => n.id === id); }

// crystals
const crystals = [];
function placeCrystals() { // Frostpeak's 30 come first, in the same order as before, so old saves still match
  const r = mulberry32(777); let tries = 0;
  while (crystalSpots.length < 30 && tries++ < 6000) {
    const x = (r() * 2 - 1) * 540, z = -620 + r() * 1290;
    if (onPiste(x, z, 10) || slopeAt(x, z) > 0.8 || inMoguls(x, z)) continue;
    if (Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz) < 1.05) continue;
    if (crystalSpots.some(c => Math.hypot(c[0] - x, c[1] - z) < 80)) continue;
    crystalSpots.push([x, z]); reserve(x, z, 5);
  }
  for (const reg of REGIONS) { if (reg.id === 'frost') continue; let n = 0, k = 0; // eight more on each of the other mountains
    while (n < 8 && k++ < 2000) { const [x, z] = toWorld(reg, (150 + r() * 1180) * reg.uS / 1400, (-470 + r() * 940) * reg.rvP / 760);
      if (onPiste(x, z, 10) || slopeAt(x, z) > 0.8 || isReserved(x, z) || crystalSpots.some(c => Math.hypot(c[0] - x, c[1] - z) < 80)) continue;
      crystalSpots.push([x, z]); reserve(x, z, 5); n++; } }
}
const crystalMat = new THREE.MeshBasicMaterial({ color: 0x9be7ff });
const glowTex = new THREE.CanvasTexture(mkCanvas(64, 64, g => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.3, 'rgba(170,230,255,0.5)'); gr.addColorStop(1, 'rgba(170,230,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }));
function makeGem(color, size) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(size, 0), new THREE.MeshBasicMaterial({ color })); m.scale.y = 1.6; g.add(m);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, opacity: 0.9 })); s.scale.setScalar(size * 6); g.add(s);
  g.userData.gem = m; return g;
}
function buildCrystals() { crystalSpots.forEach(([x, z], i) => { const g = makeGem(0x9be7ff, 0.45); g.position.set(x, Hm(x, z) + 1.3, z); scene.add(g); crystals.push({ i, x, z, g }); }); }

// quest items
const ITEMS = {
  mitten: () => [0.2, 0.47, 0.74].map((f, i) => { const run = RUNS[0], p = runAt(run, f), sd = i % 2 ? 1 : -1; return [p.x - p.tz * sd * (run.w / 2 + 7), p.z + p.tx * sd * (run.w / 2 + 7)]; }),
  mint: () => [0.3, 1.9, 3.4, 5.0].map(a => [LAKE.x + Math.cos(a) * LAKE.rx * 1.12, LAKE.z + Math.sin(a) * LAKE.rz * 1.12])
};
ITEMS.mitten().concat(ITEMS.mint()).forEach(([x, z]) => reserve(x, z, 5));
const itemObjs = [];
function makeItemMesh(kind) {
  const g = new THREE.Group();
  if (kind === 'mitten') { mesh(new THREE.BoxGeometry(0.34, 0.12, 0.42), '#e23a3a', 0, 0.06, 0, g); mesh(new THREE.BoxGeometry(0.12, 0.1, 0.18), '#e23a3a', 0.2, 0.05, -0.06, g); mesh(new THREE.BoxGeometry(0.36, 0.13, 0.1), '#ffffff', 0, 0.07, 0.22, g); }
  else { for (let i = 0; i < 5; i++) { const c = mesh(new THREE.ConeGeometry(0.08, 0.45, 5), '#5fd0c4', Math.cos(i * 1.3) * 0.15, 0.22, Math.sin(i * 1.3) * 0.15, g); c.rotation.z = Math.cos(i * 1.3) * 0.4; } }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: kind === 'mitten' ? 0xffd0c0 : 0x9ff5ee, transparent: true, depthWrite: false })); s.scale.setScalar(2.2); s.position.y = 0.4; g.add(s);
  return g;
}
function syncItems() {
  itemObjs.forEach(o => scene.remove(o.g)); itemObjs.length = 0;
  for (const [qid, st] of activeSteps()) {
    if (st.t !== 'collect') continue;
    ITEMS[st.item]().forEach(([x, z], i) => { const key = st.item + i; if (save.items[key]) return; const g = makeItemMesh(st.item); g.position.set(x, Hm(x, z) + 0.05, z); scene.add(g); itemObjs.push({ key, kind: st.item, x, z, g, qid }); });
  }
}

/* ================= pack (inventory) ================= */
const ICON = {
  crystal: '<path d="M12 2l5 7-5 13-5-13z"/><path d="M7 9h10"/>',
  golden: '<path d="M12 2l5 7-5 13-5-13z"/><path d="M7 9h10M12 2v20"/>',
  mitten: '<path d="M8 21V10a4 4 0 0 1 8 0v4l2-2a2 2 0 0 1 3 3l-5 6z"/><path d="M8 17h8"/>',
  mint: '<path d="M12 21V9"/><path d="M12 13c-4 0-6-3-6-6 3 0 6 2 6 6zM12 11c3 0 5-2 5-5-3 0-5 2-5 5z"/>',
  cocoa: '<path d="M5 9h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3c0 2 2 2 2 4M12 3c0 2 2 2 2 4"/>',
  wax: '<path d="M4 15l9-9 5 5-9 9H4z"/><path d="M13 6l2-2 5 5-2 2"/>',
  spyglass: '<path d="M3 14l12-6 2 4-12 6z"/><path d="M15 8l4-2 2 4-4 2M8 16l2 5M7 17l-2 4"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'
};
const ITEM_DEFS = {
  cocoa: { name: 'Hot cocoa', desc: 'Warms you right through. On foot you walk much faster for 90 seconds.', use: true, price: 15 },
  wax: { name: 'Glide wax', desc: 'Rub it on your skis to glide with less drag and a higher top speed for 60 seconds.', use: true, price: 25 },
  spyglass: { name: 'Spyglass', desc: 'Lets you log wildlife from twice as far away. Always on once you own it.', price: 60, once: true },
  golden: { name: 'Golden crystal', desc: 'A rare crystal that only shows up for a moment. Hanne pays well for these.', sell: 40 }
};
function addItem(id, n) { save.inv[id] = (save.inv[id] || 0) + n; }
function useItem(id) {
  if (!save.inv[id]) return;
  if (id === 'wax' && P.foot) { toast('Put your skis on first, then wax them.', 'warn'); return; }
  save.inv[id]--;
  if (id === 'cocoa') { P.cocoa = 90; sfx.sip(); toast('Hot cocoa. You feel ready to walk anywhere.', 'good'); }
  if (id === 'wax') { P.wax = 60; sfx.buy(); toast('Fresh wax on. Your skis feel quick.', 'good'); }
  persist(); renderJournal(); updateHUD();
}
function packEntries() {
  const out = [];
  out.push({ ico: 'map', name: 'Trail map', desc: 'Your map of the Frontier. Fills in as you discover places.', n: save.disc.length + ' of ' + POIS.length + ' places', open: 'map' });
  if (save.crystals.length) out.push({ ico: 'crystal', name: 'Snow crystals', desc: 'Pieces of the old star, according to Tov.', n: save.crystals.length + ' of ' + crystalSpots.length });
  const mit = ITEMS.mitten().filter((_, i) => save.items['mitten' + i]).length, mint = ITEMS.mint().filter((_, i) => save.items['mint' + i]).length;
  if (mit && !(qs('mittens') && qs('mittens').s === 'done')) out.push({ ico: 'mitten', name: "Pip's mittens", desc: 'Red, woolly and slightly damp. Bring them back to Pip.', n: mit + ' of 3' });
  if (mint && !(qs('tea') && qs('tea').s === 'done')) out.push({ ico: 'mint', name: 'Frost mint', desc: 'Glows faintly blue. Old Tov wants it for his tea.', n: mint + ' of 4' });
  for (const id in ITEM_DEFS) if (save.inv[id]) out.push({ id, ico: id, name: ITEM_DEFS[id].name, desc: ITEM_DEFS[id].desc, n: ITEM_DEFS[id].once ? 'Owned' : '× ' + save.inv[id], use: ITEM_DEFS[id].use });
  return out;
}
function slotHTML(e, btn) {
  return `<div class="slot"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">${ICON[e.ico]}</svg></div><b>${e.name}</b><span class="n">${e.n}</span><p>${e.desc}</p>${btn || ''}</div>`;
}
function renderPack() {
  const list = packEntries();
  let html = '<p class="lede">What you are carrying. Hanne sells supplies at the shop in Lowpine Village.</p><div class="pack">';
  html += list.map(e => slotHTML(e, e.use ? `<button class="b" data-use="${e.id}">Use</button>` : e.open ? `<button class="b ghost" data-open="${e.open}">Open</button>` : '')).join('');
  for (let k = list.length; k < 8; k++) html += '<div class="slot empty">Empty</div>';
  return html + '</div>';
}
let shopOpen = false;
function openShop() {
  if (state !== 'play') return;
  state = 'menu'; $('shopOv').classList.remove('hidden'); renderShop();
}
function renderShop() {
  $('shopLede').textContent = 'You have ' + save.coins + ' snowmarks.';
  let html = ['cocoa', 'wax', 'spyglass'].map(id => { const d = ITEM_DEFS[id], owned = d.once && save.inv[id];
    return slotHTML({ ico: id, name: d.name, desc: d.desc, n: owned ? 'Owned' : save.inv[id] ? 'You have ' + save.inv[id] : '' },
      `<div style="display:flex;gap:10px;align-items:center"><span class="price"><i></i>${d.price}</span><button class="b pri" data-buy="${id}" ${owned || save.coins < d.price ? 'disabled' : ''}>${owned ? 'Owned' : 'Buy'}</button></div>`); }).join('');
  if (save.inv.golden) html += slotHTML({ ico: 'golden', name: 'Sell golden crystals', desc: 'Hanne buys them for 40 snowmarks each.', n: 'You have ' + save.inv.golden }, `<button class="b" data-sell="golden">Sell one</button>`);
  const b = $('shopBody'); b.innerHTML = html;
  b.querySelectorAll('[data-buy]').forEach(btn => btn.onclick = () => { const id = btn.dataset.buy, d = ITEM_DEFS[id]; if (save.coins < d.price) return; save.coins -= d.price; addItem(id, 1); sfx.buy(); toast('Bought ' + d.name.toLowerCase() + '.', 'good', 1600); persist(); renderShop(); });
  b.querySelectorAll('[data-sell]').forEach(btn => btn.onclick = () => { if (!save.inv.golden) return; save.inv.golden--; save.coins += 40; sfx.coin(); persist(); renderShop(); });
}
/* ================= quests ================= */
function qs(id) { return save.q[id]; }
function canOffer(id) { const q = QUESTS[id]; return !qs(id) && (!q.req || (qs(q.req) && qs(q.req).s === 'done')); }
function activeSteps() { const out = []; for (const id in save.q) { const s = save.q[id]; if (s.s === 'active') out.push([id, QUESTS[id].steps[s.step]]); } return out; }
function startQuest(id) { save.q[id] = { s: 'active', step: 0, n: 0 }; sfx.quest(); toast('New quest: ' + QUESTS[id].title, 'good'); stepStarted(id); persist(); }
function stepStarted(id) { syncItems(); syncCourse(); checkAutoSteps(); }
function advance(id) {
  const s = save.q[id], q = QUESTS[id]; s.step++; s.n = 0;
  if (s.step >= q.steps.length) {
    s.s = 'done'; save.coins += q.reward.coins || 0;
    if (q.reward.color && !save.colors.includes(q.reward.color)) save.colors.push(q.reward.color);
    if (q.reward.item) addItem(q.reward.item[0], q.reward.item[1]);
    sfx.complete(); bannerShow('Quest complete', q.title, 'done');
    setTimeout(() => toast('+' + q.reward.coins + ' snowmarks' + (q.reward.color ? ', and a new jacket: ' + JACKETS.find(j => j.id === q.reward.color).name : ''), 'good', 4200), 900);
  } else { toast('Next: ' + q.steps[s.step].text); sfx.step(); }
  stepStarted(id); persist();
}
function checkAutoSteps() {
  for (const [id, st] of activeSteps()) {
    const s = save.q[id];
    if (st.t === 'visit' && st.pois.every(p => save.disc.includes(p))) advance(id);
    else if (st.t === 'dex' && SPECIES.filter(sp => save.dex[sp.id]).length >= st.n) advance(id);
    else if (st.t === 'crystals' && save.crystals.length >= st.n) advance(id);
    else if (st.t === 'light' && save.lit.length >= LANTERNS.length) advance(id);
    else if (st.t === 'collect') { s.n = ITEMS[st.item]().filter((_, i) => save.items[st.item + i]).length; if (s.n >= st.n) advance(id); }
  }
}
function stepProgress(id, st) {
  if (st.t === 'collect') return ' (' + (save.q[id].n || 0) + ' of ' + st.n + ')';
  if (st.t === 'visit') return ' (' + st.pois.filter(p => save.disc.includes(p)).length + ' of ' + st.pois.length + ')';
  if (st.t === 'dex') return ' (' + SPECIES.filter(sp => save.dex[sp.id]).length + ' of ' + st.n + ')';
  if (st.t === 'crystals') return ' (' + save.crystals.length + ' of ' + st.n + ')';
  if (st.t === 'light') return ' (' + save.lit.length + ' of ' + LANTERNS.length + ')';
  return '';
}
function questTargets() {
  const out = [];
  for (const [id, st] of activeSteps()) {
    if (st.t === 'talk') { const n = npcById(st.npc); out.push({ x: n.x, z: n.z, label: n.name }); }
    else if (st.t === 'collect') itemObjs.forEach(o => out.push({ x: o.x, z: o.z, label: o.kind === 'mitten' ? 'Mitten' : 'Frost mint' }));
    else if (st.t === 'visit') st.pois.filter(p => !save.disc.includes(p)).forEach(p => out.push({ x: POI[p].x, z: POI[p].z, label: POI[p].name }));
    else if (st.t === 'light') LANTERNS.forEach((l, i) => { if (!save.lit.includes(i)) out.push({ x: l.x, z: l.z, label: 'Lamp' }); });
    else if (st.t === 'course' && course) { const tg = course.running ? (course.gates[course.next] || course.finish) : course.start; out.push({ x: tg.x, z: tg.z, label: course.running ? (course.gates[course.next] ? 'Gate' : 'Finish') : 'Start' }); }
  }
  return out;
}

/* ================= race courses ================= */
let course = null;
const bannerMat = {};
function bannerTex(txt, bg) { return new THREE.CanvasTexture(mkCanvas(512, 96, g => { g.fillStyle = bg; g.fillRect(0, 0, 512, 96); g.fillStyle = '#fff'; g.font = '800 60px "Barlow Condensed", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 256, 52); })); }
function makeBanner(p, w, txt, bg) {
  const g = new THREE.Group(), y = Hm(p.x, p.z); g.position.set(p.x, y, p.z); g.rotation.y = Math.atan2(-p.tx, -p.tz); scene.add(g);
  cyl(0.15, 0.15, 6, '#3a4256', -w / 2, 3, 0, g); cyl(0.15, 0.15, 6, '#3a4256', w / 2, 3, 0, g);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.6), new THREE.MeshBasicMaterial({ map: bannerTex(txt, bg), side: THREE.DoubleSide })); m.position.y = 5.4; g.add(m);
  return g;
}
function syncCourse() {
  const want = activeSteps().find(([, st]) => st.t === 'course');
  const id = want ? want[1].id : null;
  if (course && course.id === id) return;
  if (course) { course.objs.forEach(o => scene.remove(o)); course = null; $('timer').classList.add('hidden'); }
  if (!id) return;
  const cd = COURSES[id], run = RUNS[cd.run], objs = [];
  const mkPt = f => { const p = runAt(run, f); return { x: p.x, z: p.z, tx: p.tx, tz: p.tz }; };
  const start = mkPt(cd.f0), finish = mkPt(cd.f1), gates = [];
  objs.push(makeBanner(start, run.w + 2, 'Start', '#f2661c'), makeBanner(finish, run.w + 2, 'Finish', '#1d3a33'));
  if (cd.gates) {
    const n = Math.floor((cd.f1 - cd.f0) * run.len / 42) - 1;
    for (let i = 1; i <= n; i++) {
      const p = mkPt(cd.f0 + (cd.f1 - cd.f0) * i / (n + 1)), sd = i % 2 ? 1 : -1, off = run.w * 0.2 * sd;
      const gx = p.x - p.tz * off, gz = p.z + p.tx * off, col = i % 2 ? '#e23a3a' : '#3d73d9';
      const gg = new THREE.Group(); gg.position.set(gx, Hm(gx, gz), gz); gg.rotation.y = Math.atan2(-p.tx, -p.tz); scene.add(gg); objs.push(gg);
      for (const s of [-1, 1]) { cyl(0.06, 0.06, 2.2, col, s * 3.5, 1.1, 0, gg); const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })); fl.position.set(s * 3.5 - s * 0.6, 1.8, 0); gg.add(fl); }
      gates.push({ x: gx, z: gz, tx: p.tx, tz: p.tz, gap: 7, obj: gg, col });
    }
  }
  course = { id, cd, run, start, finish, gates, objs, running: false, t: 0, missed: 0, next: 0 };
}
function crossed(pt, ox, oz) { const a = (ox - pt.x) * pt.tx + (oz - pt.z) * pt.tz, b = (P.x - pt.x) * pt.tx + (P.z - pt.z) * pt.tz; return a < 0 && b >= 0; }
function lateral(pt) { return Math.abs(-(P.x - pt.x) * pt.tz + (P.z - pt.z) * pt.tx); }
function courseUpdate(dt, ox, oz) {
  if (!course) return;
  const c = course, tm = $('timer');
  if (!c.running) {
    if (crossed(c.start, ox, oz) && lateral(c.start) < c.run.w / 2 + 6) { c.running = true; c.t = 0; c.missed = 0; c.next = 0; c.gates.forEach(g => g.obj.children.forEach(m => m.material && m.material.color && m.material.color.set(g.col))); sfx.go(); toast('Go!', 'good', 1200); tm.classList.remove('hidden'); }
    return;
  }
  c.t += dt;
  while (c.next < c.gates.length && crossed(c.gates[c.next], ox, oz)) {
    const g = c.gates[c.next]; const ok = lateral(g) < g.gap / 2 && P.crash <= 0;
    if (!ok) { c.missed++; toast('Missed gate +3 s', 'warn', 1200); sfx.miss(); } else sfx.gate();
    g.obj.children.forEach(m => m.material && m.material.color && m.material.color.set(ok ? '#5fc88a' : '#a3acb9'));
    c.next++;
  }
  const total = c.t + c.missed * 3;
  tm.innerHTML = fmtTime(total) + '<small>' + (c.gates.length ? 'Gate ' + Math.min(c.next + 1, c.gates.length) + ' of ' + c.gates.length + ', ' : '') + 'beat ' + c.cd.limit + ' s</small>';
  if (crossed(c.finish, ox, oz)) {
    c.running = false; tm.classList.add('hidden');
    if (total <= c.cd.limit) { toast('Finished in ' + fmtTime(total) + '!', 'good', 3000); const a = activeSteps().find(([, st]) => st.t === 'course'); if (a) advance(a[0]); }
    else { toast('Finished in ' + fmtTime(total) + '. Too slow. Try again from the start banner.', 'warn', 4000); sfx.miss(); }
    return;
  }
  if (c.t > c.cd.limit + 40) { c.running = false; tm.classList.add('hidden'); toast('Course timed out. Head back to the start banner.', 'warn', 3000); }
}
function onCrash() { if (course && course.running) toast('Wipeout! The clock keeps running.', 'warn', 1600); else if (Math.random() < 0.35) toast(['Shake it off!', 'Snow in every pocket...', 'Yard sale!'][(Math.random() * 3) | 0], '', 1400); }
function fmtTime(t) { const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1); }

/* ================= creatures ================= */
const creatures = [];
function zoneOK(sp, x, z) {
  const h = Hm(x, z); if (onPiste(x, z, 4) || x < WORLD.x0 + 40 || x > WORLD.x1 - 40 || z < WORLD.z0 + 40 || z > WORLD.z1 - 40) return false;
  if (sp === 'hare' || sp === 'fox') return treeDensity(x, z) > 0.4 && h < 360;
  if (sp === 'ibex') return h > 230 && (slopeAt(x, z) > 0.42 || h > 330);
  if (sp === 'ptarmigan') return h > 190 && h < 400;
  return Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz) < 2.2 || slopeAt(x, z) > 0.5 || Math.hypot(x - POI.grotto.x, z - POI.grotto.z) < 90;
}
function spawnCreature(sp, x, z) {
  const g = makeCreature(sp); g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const c = { sp, g, x, z, h: Math.random() * TAU, state: 'idle', t: 1 + Math.random() * 3, speed: 0, seen: false, alt: 0, ph: Math.random() * 10 };
  g.position.set(x, Hm(x, z), z); scene.add(g); creatures.push(c); return c;
}
let spawnT = 0;
function updateCreatures(dt) {
  spawnT -= dt;
  if (spawnT <= 0 && creatures.length < 10) {
    spawnT = 2.5;
    const sp = ['hare', 'hare', 'fox', 'fox', 'ibex', 'ptarmigan', 'ptarmigan', 'ermine', 'ermine'][(Math.random() * 9) | 0];
    for (let k = 0; k < 14; k++) { const a = Math.random() * TAU, d = 90 + Math.random() * 150, x = P.x + Math.cos(a) * d, z = P.z + Math.sin(a) * d; if (zoneOK(sp, x, z) && clearOf(x, z, 1.5)) { spawnCreature(sp, x, z); break; } }
  }
  const ps = Math.hypot(P.vx, P.vz);
  for (let i = creatures.length - 1; i >= 0; i--) {
    const c = creatures[i], dx = c.x - P.x, dz = c.z - P.z, d = Math.hypot(dx, dz);
    if (d > 340) { scene.remove(c.g); creatures.splice(i, 1); continue; }
    if (!c.seen && d < (save.inv.spyglass ? 48 : 24) && P.crash <= 0) logCreature(c);
    c.t -= dt;
    if (c.state !== 'flee' && (d < 6 || (d < 14 + ps * 0.7 && ps > 4))) { c.state = 'flee'; c.t = 3 + Math.random(); c.h = Math.atan2(dx, -dz) + (Math.random() - .5) * 0.6; c.speed = { hare: 9, fox: 8, ibex: 6, ptarmigan: 10, ermine: 6 }[c.sp]; }
    if (c.t <= 0) {
      if (c.state === 'walk' || c.state === 'flee') { c.state = 'idle'; c.speed = 0; c.t = 1.5 + Math.random() * 3; }
      else { c.state = 'walk'; c.h += (Math.random() - .5) * 2; c.speed = c.sp === 'ibex' ? 1.2 : 1.6; c.t = 1.5 + Math.random() * 2.5; }
    }
    if (c.speed > 0) {
      const nx = c.x + Math.sin(c.h) * c.speed * dt, nz = c.z - Math.cos(c.h) * c.speed * dt;
      if (clearOf(nx, nz, 0.4) && Math.abs(nx) < 610) { c.x = nx; c.z = nz; } else c.h += 1.5;
    }
    const fly = c.sp === 'ptarmigan' && c.state === 'flee';
    c.alt = lerp(c.alt, fly ? 4 + Math.sin(c.t) : 0, 1 - Math.exp(-2 * dt));
    c.ph += dt * (c.speed > 0 ? 4 + c.speed : 1);
    const hop = (c.sp === 'hare' || c.sp === 'ermine') && c.speed > 0 ? Math.abs(Math.sin(c.ph * 1.3)) * 0.22 : 0;
    c.g.position.set(c.x, Hm(c.x, c.z) + c.alt + hop, c.z); c.g.rotation.y = -c.h;
    c.g.userData.legs.forEach((l, k) => l.rotation.x = c.speed > 0 ? Math.sin(c.ph * 1.4 + k * Math.PI) * 0.6 : 0);
    c.g.userData.wings.forEach((w, k) => w.rotation.z = fly ? Math.sin(c.ph * 6) * 0.9 * (k ? 1 : -1) : 0);
  }
}
function logCreature(c) {
  c.seen = true; const sp = SPECIES.find(s => s.id === c.sp), first = !save.dex[c.sp];
  save.dex[c.sp] = (save.dex[c.sp] || 0) + 1;
  if (first) { bannerShow('New wildlife note', sp.name); sfx.chirp(); save.coins += 10; } else toast('Spotted a ' + sp.name.toLowerCase() + ' again (' + save.dex[c.sp] + ' sightings).', '', 1800);
  checkAutoSteps(); persist();
}

/* ================= random events ================= */
let ev = null, evTimer = 35, storm = 0, stormTarget = 0;
const evMarkers = [];
function pickSpot(minD, maxD, dirBias) {
  for (let k = 0; k < 40; k++) {
    const a = dirBias != null ? dirBias + (Math.random() - .5) * 1.6 : Math.random() * TAU, d = minD + Math.random() * (maxD - minD);
    const x = P.x + Math.sin(a) * d, z = P.z - Math.cos(a) * d;
    if (regionAt(x, z) && clearOf(x, z, 2) && slopeAt(x, z) < 0.7) return [x, z];
  }
  return null;
}
const EVENTS = {
  storm() { stormTarget = 1; toast('A snow squall is rolling in. Visibility is dropping.', 'warn', 3500); sfx.gust(); return { name: 'Snow squall', t: 50, update(dt) { this.t -= dt; if (this.t < 8) stormTarget = 0; if (this.t <= 0) this.done = true; } }; },
  herd() {
    const sp = ['hare', 'ibex', 'ptarmigan', 'fox'][(Math.random() * 4) | 0], a = P.h, ax = P.x + Math.sin(a) * 60, az = P.z - Math.cos(a) * 60;
    const side = Math.random() < .5 ? 1 : -1; let n = 0;
    for (let i = 0; i < 4; i++) { const x = ax + Math.cos(a) * side * (30 + i * 4), z = az + Math.sin(a) * side * (30 + i * 4) + (Math.random() - .5) * 6; if (!clearOf(x, z, 1)) continue; const c = spawnCreature(sp, x, z); c.state = 'flee'; c.t = 6; c.speed = 4.5; c.h = a + (side > 0 ? -Math.PI / 2 : Math.PI / 2); n++; }
    if (n) toast('Fresh tracks... something is crossing the slope ahead!', '', 3200);
    return { name: 'Animal crossing', t: 10, update(dt) { this.t -= dt; if (this.t <= 0) this.done = true; } };
  },
  avalanche() {
    const front = { z: P.z + 170, v: 16 };
    const puffsA = [];
    for (let i = 0; i < 22; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0.95, color: 0xffffff })); s.scale.set(90, 55, 1); scene.add(s); puffsA.push([s, P.x - 600 + i * 57 + Math.random() * 20, Math.random() * TAU]); }
    toast('RUMBLE... Avalanche above you! Ski downhill, fast!', 'warn', 4200); sfx.rumble(); camShake = 0.6;
    return { name: 'Avalanche', t: 26, front,
      update(dt) {
        this.t -= dt; front.v = Math.min(27, front.v + dt * 0.6); front.z -= front.v * dt;
        for (const [s, x, ph] of puffsA) s.position.set(x + Math.sin(gameT + ph) * 6, H(x, front.z) + 18 + Math.sin(gameT * 2 + ph) * 3, front.z + Math.cos(gameT * 1.5 + ph) * 8);
        const gap = front.z - P.z; camShake = Math.max(camShake, clamp(1 - gap / 120, 0, 0.8));
        const tm = $('timer'); tm.classList.remove('hidden'); tm.classList.add('warn'); tm.innerHTML = 'Avalanche ' + Math.max(0, Math.round(gap)) + ' m behind!<small>Ski downhill and keep your speed</small>';
        $('danger').style.opacity = clamp(1 - gap / 140, 0, 1) * (0.7 + Math.sin(gameT * 8) * 0.3);
        if (gap < 1.5 && P.crash <= 0) { P.inv = 0; crashPlayer(); toast('Caught by the slide! Shake it off.', 'warn', 3000); this.t = 1.2; this.caught = true; }
        if (front.z < -560) this.t = Math.min(this.t, 1);
        if (this.t <= 0) { if (!this.caught) { save.coins += 30; toast('You outran the avalanche! +30 snowmarks', 'good', 3200); sfx.complete(); } this.done = true; }
      },
      cleanup() { puffsA.forEach(([s]) => { scene.remove(s); s.material.dispose(); }); const tm = $('timer'); tm.classList.add('hidden'); tm.classList.remove('warn'); $('danger').style.opacity = 0; } };
  },
  lost() {
    const spot = pickSpot(110, 200); if (!spot) return null;
    const m = makePerson({ jacket: ['#7a5bd6', '#20a67a', '#f2b705'][(Math.random() * 3) | 0], hat: '#ffffff', ski: '#d9dde8' });
    m.position.set(spot[0], Hm(spot[0], spot[1]) + 0.15, spot[1]); m.userData.tilt.rotation.z = 1.35; scene.add(m);
    const mk = new THREE.Sprite(MARK.offer); mk.scale.set(1.2, 1.2, 1); mk.position.set(spot[0], Hm(spot[0], spot[1]) + 2.4, spot[1]); scene.add(mk);
    toast('Someone is calling for help! A skier is stuck nearby.', 'warn', 3600); sfx.call();
    return { name: 'Skier in trouble', t: 120, target: { x: spot[0], z: spot[1], label: 'Stuck skier' }, interact: { x: spot[0], z: spot[1], r: 4, label: 'Help the stuck skier' },
      use() { this.done = true; save.coins += 25; openDialog('Stuck skier', 'Visitor', [{ text: "Oh, thank you! My binding popped off and I sank to my waist. Here, take these snowmarks. And watch out for soft spots!" }]); toast('+25 snowmarks', 'good'); sfx.coin(); },
      update(dt) { this.t -= dt; mk.position.y += Math.sin(gameT * 3) * 0.004; if (this.t <= 0) { toast('The stuck skier dug themselves out.', '', 2500); this.done = true; } },
      cleanup() { scene.remove(m); scene.remove(mk); } };
  },
  golden() {
    const spot = pickSpot(80, 150, P.h); if (!spot) return null;
    const g = makeGem(0xffd34d, 0.7); g.position.set(spot[0], Hm(spot[0], spot[1]) + 1.5, spot[1]); scene.add(g);
    toast('A golden crystal is glinting nearby! Grab it in 40 seconds.', 'good', 3600); sfx.sparkle();
    return { name: 'Golden crystal', t: 40, target: { x: spot[0], z: spot[1], label: 'Golden crystal' },
      update(dt) {
        this.t -= dt; g.rotation.y += dt * 2; g.position.y = Hm(spot[0], spot[1]) + 1.5 + Math.sin(gameT * 3) * 0.2;
        if (Math.hypot(P.x - spot[0], P.z - spot[1]) < 3) { save.coins += 10; addItem('golden', 1); toast('Golden crystal. It is in your pack, and 10 snowmarks.', 'good', 2800); sfx.coin(); emitBurst(spot[0], g.position.y, spot[1], 30); this.done = true; }
        else if (this.t <= 0) { toast('The golden crystal faded away.', '', 2200); this.done = true; }
      }, cleanup() { scene.remove(g); } };
  },
  rival() {
    let x = P.x, z = P.z;
    for (let i = 0; i < 95; i++) { const [gx, gz] = grad(x, z), m = Math.hypot(gx, gz) || 1; x -= gx / m * 4; z -= gz / m * 4; }
    if (!regionAt(x, z)) return null;
    const flag = new THREE.Group(); flag.position.set(x, Hm(x, z), z); scene.add(flag);
    cyl(0.07, 0.07, 4, '#3a4256', 0, 2, 0, flag); const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), new THREE.MeshBasicMaterial({ color: 0xe23a3a, side: THREE.DoubleSide })); fl.position.set(0.8, 3.4, 0); flag.add(fl);
    const r = makePerson({ jacket: '#2b3555', hat: '#e23a3a', scarf: '#f0b429', ski: '#ff5a36' }); scene.add(r);
    const rv = { x: P.x + Math.cos(P.h) * 3, z: P.z + Math.sin(P.h) * 3, s: Math.max(6, P.s) };
    toast('A rival skier pulls up: "Race you to the red flag!"', 'warn', 3600); sfx.go();
    return { name: 'Race to the flag', t: 70, target: { x, z, label: 'Red flag' },
      update(dt) {
        this.t -= dt;
        const dR = Math.hypot(x - rv.x, z - rv.z), dP = Math.hypot(x - P.x, z - P.z);
        const want = clamp(19 + (dR - dP) * 0.06, 12, 30); rv.s += clamp(want - rv.s, -4 * dt, 4 * dt);
        const hx = (x - rv.x) / (dR || 1), hz = (z - rv.z) / (dR || 1);
        rv.x += hx * rv.s * dt + Math.sin(gameT * 1.4) * 4 * dt; rv.z += hz * rv.s * dt;
        r.position.set(rv.x, H(rv.x, rv.z), rv.z); r.rotation.y = -Math.atan2(hx, -hz); r.userData.tilt.rotation.z = -Math.cos(gameT * 1.4) * 0.35; r.userData.upper.rotation.x = -0.3;
        if (dP < 9) { save.coins += 40; toast('You beat the rival! +40 snowmarks', 'good', 3000); sfx.complete(); this.done = true; }
        else if (dR < 4) { toast('The rival got there first. Rematch some other time!', 'warn', 3000); this.done = true; }
        else if (this.t <= 0) this.done = true;
      }, cleanup() { scene.remove(flag); scene.remove(r); } };
  }
};
function updateEvents(dt) {
  if (ev) { ev.update(dt); if (ev.done) { ev.cleanup && ev.cleanup(); ev = null; evTimer = 40 + Math.random() * 45; } return; }
  if (course && course.running) return;
  evTimer -= dt; if (evTimer > 0) return;
  const pool = ['herd', 'golden', 'lost', 'storm', 'herd', 'golden'];
  const here = regionAt(P.x, P.z);
  if (here && here.row > 0 && P.z > -250 && P.s > 8) pool.push('avalanche');
  if (here && here.id === 'crags') pool.push('storm');
  if (P.s > 6 && P.z > -300) pool.push('rival', 'rival');
  const type = pool[(Math.random() * pool.length) | 0];
  ev = EVENTS[type]();
  if (!ev) evTimer = 8;
}

/* ================= discovery ================= */
function checkDiscovery() {
  const rg = regionAt(P.x, P.z);
  if (rg && !save.regions.includes(rg.id)) { save.regions.push(rg.id); if (rg.id !== 'frost') { bannerShow('Welcome to', rg.name); sfx.discover(); } persist(); }
  for (const p of POIS) {
    if (save.disc.includes(p.id)) continue;
    if (Math.hypot(P.x - p.x, P.z - p.z) < p.r) {
      save.disc.push(p.id); bannerShow('Discovered', p.name); sfx.discover(); save.coins += 15;
      checkAutoSteps(); persist();
    }
  }
}
