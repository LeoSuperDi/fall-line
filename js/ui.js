/* Frostpeak Frontier: ui.js
   HUD, dialogs, gondola and snowcat travel, the trail map, the journal, menus and controls.
   Loaded as a plain script; files share one global scope and load in the order listed in index.html. */
'use strict';

/* ================= HUD helpers ================= */
function toast(text, kind, dur) {
  const el = document.createElement('div'); el.className = 'toast sign' + (kind ? ' ' + kind : ''); el.textContent = text;
  const box = $('toasts'); box.appendChild(el); while (box.children.length > 4) box.removeChild(box.firstChild);
  setTimeout(() => el.remove(), dur || 2600);
}
function bannerShow(small, big, kind) { // a signpost that swings into view
  const el = document.createElement('div'); el.className = 'post' + (kind ? ' ' + kind : '');
  const board = document.createElement('div'); board.className = 'board sign';
  const s = document.createElement('small'), b = document.createElement('b'); s.textContent = small; b.textContent = big;
  board.append(s, b); el.append(board); $('toasts').prepend(el); setTimeout(() => el.remove(), 3800);
}
function updateQuestCard() {
  const act = activeSteps(), q = $('quest');
  if (act.length) {
    const [id, st] = act[0]; q.classList.remove('explore');
    $('qKind').textContent = act.length > 1 ? 'Quest, 1 of ' + act.length + ' open' : 'Quest';
    $('qName').textContent = QUESTS[id].title; $('qObj').textContent = st.text + stepProgress(id, st);
  } else {
    const giver = npcs.find(n => Object.keys(QUESTS).some(q => QUESTS[q].giver === n.id && canOffer(q)));
    q.classList.add('explore'); $('qKind').textContent = 'Exploring';
    $('qName').textContent = giver ? giver.name + ' has a request' : 'The Frontier is yours';
    $('qObj').textContent = giver ? 'Look for the ! over their head near ' + (POIS.find(p => Math.hypot(p.x - giver.x, p.z - giver.z) < 70) || { name: 'the mountain' }).name + '.' : 'Find crystals, log wildlife and keep an eye out for surprises.';
  }
}
const cmp = $('compass'), cctx = cmp.getContext('2d');
function drawCompass() {
  const w = cmp.clientWidth, h = cmp.clientHeight; if (!w) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (cmp.width !== Math.round(w * dpr)) { cmp.width = Math.round(w * dpr); cmp.height = Math.round(h * dpr); }
  cctx.setTransform(dpr, 0, 0, dpr, 0, 0); cctx.clearRect(0, 0, w, h);
  const bearing = Math.PI - CAM.yaw, span = Math.PI * 0.9;
  const xOf = b => w / 2 + wrapA(b - bearing) / (span / 2) * (w / 2);
  cctx.textAlign = 'center'; cctx.textBaseline = 'middle';
  for (let k = 0; k < 16; k++) { const b = k / 16 * TAU, x = xOf(b); if (x < 4 || x > w - 4) continue; const big = k % 4 === 0;
    if (big) { cctx.fillStyle = k === 0 ? '#f2661c' : '#eef3f8'; cctx.font = '800 17px "Barlow Condensed", sans-serif'; cctx.fillText(['N', 'E', 'S', 'W'][k / 4], x, 15); }
    else { cctx.fillStyle = 'rgba(238,243,248,.45)'; cctx.fillRect(x - 1, 10, 2, k % 2 ? 5 : 9); } }
  cctx.fillStyle = '#eef3f8'; cctx.beginPath(); cctx.moveTo(w / 2 - 6, 0); cctx.lineTo(w / 2 + 6, 0); cctx.lineTo(w / 2, 6); cctx.fill();
  const mark = (x0, z0, col, label, shape) => {
    const b = Math.atan2(x0 - P.x, z0 - P.z), x = xOf(b), d = Math.hypot(x0 - P.x, z0 - P.z);
    const cx = clamp(x, 10, w - 10), out = x < 0 || x > w;
    cctx.fillStyle = col; cctx.globalAlpha = out ? 0.55 : 1; cctx.beginPath();
    if (shape === 'dot') cctx.arc(cx, 30, 3.5, 0, TAU); else { cctx.moveTo(cx, 23); cctx.lineTo(cx + 6, 29); cctx.lineTo(cx, 35); cctx.lineTo(cx - 6, 29); cctx.closePath(); }
    cctx.fill(); cctx.globalAlpha = 1;
    if (label && !out && Math.abs(x - w / 2) < w * 0.3) { cctx.font = '600 12px "Barlow Condensed", sans-serif'; cctx.fillStyle = '#eef3f8'; cctx.fillText(Math.round(d) + ' m', cx, 41); }
  };
  POIS.forEach(p => { if (save.disc.includes(p.id)) mark(p.x, p.z, '#a9c4b8', false, 'dot'); });
  questTargets().slice(0, 6).forEach(t => mark(t.x, t.z, '#f2661c', true));
  if (ev && ev.target) mark(ev.target.x, ev.target.z, '#ffd34d', true);
}
let lastHud = 0, hudTick = 0;
function updateHUD() {
  $('spd').textContent = Math.round(speedKmh());
  $('coins').textContent = save.coins;
  const rgH = regionAt(P.x, P.z), surf = P.snow === 'groomed' && rgH && rgH.id === 'dunes' ? 'Groomed sand' : P.snow === 'groomed' && rgH && rgH.id === 'ember' ? 'Groomed ash' : (SNOW[P.snow] || SNOW.powder).name;
  $('snowChip').textContent = P.air ? 'Airborne' : P.foot ? 'On foot in ' + surf.toLowerCase() + (P.cocoa > 0 ? ', warm from cocoa' : '')
    : surf + (P.crash > 0 ? ', wipeout' : P.brakeA > 0.5 ? ', stopping' : P.tuck > 0.5 ? ', tucked' : P.skidI > 0.4 ? ', skidding' : Math.abs(P.w) > 0.6 && P.s > 8 ? ', carving' : '') + (P.wax > 0 ? ', fresh wax' : '');
  if ((hudTick = (hudTick + 1) % 3) === 0) drawCompass();
  const it = currentInteract(); const pr = $('prompt');
  if (it && state === 'play') { pr.classList.remove('hidden'); $('promptT').textContent = it.label; pr.querySelector('kbd').textContent = isTouch ? 'Tap' : 'E'; } else pr.classList.add('hidden');
  if (gameT - lastHud > 0.25) { lastHud = gameT; updateQuestCard(); }
}

/* ================= interaction + dialog ================= */
const STATIONS = []; LIFTS.forEach(L => { const sg = Math.sign(L.zb - L.za); STATIONS.push({ x: L.x, z: L.za + 8 * sg, to: L.top, label: 'Ride the gondola up' }, { x: L.x, z: L.zb - 9 * sg, to: L.base, label: 'Ride the gondola down' }); });
function currentInteract() {
  if (P.crash > 0) return null;
  let best = null, bd = 1e9;
  for (const n of npcs) { const d = Math.hypot(n.x - P.x, n.z - P.z); if (d < 4.5 && d < bd) { bd = d; best = { label: 'Talk to ' + n.name, fn: () => talkTo(n) }; } }
  for (const c of CATS) { const d = Math.hypot(c.x - P.x, c.z - P.z); if (d < 7 && d < bd) { bd = d; best = { label: 'Ride the valley snowcat', fn: () => catMenu(c) }; } }
  for (const s of STATIONS) { const d = Math.hypot(s.x - P.x, s.z - P.z); if (d < 13 && d < bd) { bd = d; best = { label: s.label, fn: () => travel(s.to, true) }; } }
  if (activeSteps().some(([, st]) => st.t === 'light')) LANTERNS.forEach((l, i) => { if (save.lit.includes(i)) return; const d = Math.hypot(l.x - P.x, l.z - P.z); if (d < 3.2 && d < bd) { bd = d; best = { label: P.foot ? 'Light the lamp' : 'Take your skis off to light the lamp', fn: () => lightLamp(i) }; } });
  if (ev && ev.interact && Math.hypot(ev.interact.x - P.x, ev.interact.z - P.z) < ev.interact.r) best = { label: ev.interact.label, fn: () => ev.use() };
  return best;
}
function lightLamp(i) {
  if (!P.foot) { toast('You cannot reach the lamp with skis on. Press ' + (isTouch ? 'the ski button' : 'F') + ' to take them off.', 'warn', 2600); return; }
  save.lit.push(i); syncLamps(); sfx.sparkle(); toast('Lamp lit (' + save.lit.length + ' of ' + LANTERNS.length + ')', 'good', 1600); checkAutoSteps(); persist();
}
function catMenu(here) {
  openDialog('Valley snowcat', 'Runs between Lowpine and every mountain', [{ text: 'Where to? The ride takes no time at all, the driver is very proud of that.',
    actions: CATS.filter(c => c !== here).map(c => ({ label: c.name, stop: true, fn: () => { closeDialog(); travel(c.to, false, 'The snowcat rumbles along the valley…'); } })).concat([{ label: 'Stay here', stop: true, fn: () => closeDialog() }]) }]);
}
function interact() { const it = currentInteract(); if (it && state === 'play') it.fn(); }
let dlgPages = [], dlgName = '', dlgRole = '';
function openDialog(name, role, pages) {
  dlgPages = pages.slice(); dlgName = name; dlgRole = role; state = 'dialog'; showPage();
}
function showPage() {
  const pg = dlgPages.shift();
  if (!pg) { closeDialog(); return; }
  $('dialog').classList.remove('hidden'); $('dName').textContent = dlgName; $('dRole').textContent = dlgRole; $('dText').textContent = pg.text;
  const acts = $('dActs'); acts.innerHTML = '';
  const list = pg.actions || [{ label: dlgPages.length ? 'Continue' : 'Bye', pri: true, fn: () => { } }];
  list.forEach(a => { const b = document.createElement('button'); b.className = 'b' + (a.pri ? ' pri' : '') + (a.gold ? ' gold' : ''); b.textContent = a.label; b.onclick = () => { a.fn && a.fn(); if (!a.stop) showPage(); }; acts.appendChild(b); });
  sfx.talk();
  setTimeout(() => { const f = acts.querySelector('button'); f && f.focus(); }, 30);
}
function closeDialog() { $('dialog').classList.add('hidden'); if (state === 'dialog') state = 'play'; persist(); }
function talkTo(n) {
  const pages = [];
  const turnIn = activeSteps().find(([, st]) => st.t === 'talk' && st.npc === n.id);
  if (turnIn) {
    const [qid, st] = turnIn; st.say.forEach(t => pages.push({ text: t }));
    pages[pages.length - 1].actions = [{ label: 'Continue', pri: true, fn: () => advance(qid) }];
  }
  const offerId = Object.keys(QUESTS).find(q => QUESTS[q].giver === n.id && (canOffer(q) || (turnIn && QUESTS[q].req === turnIn[0] && !qs(q))));
  if (offerId) {
    const q = QUESTS[offerId]; q.offer.forEach(t => pages.push({ text: t }));
    pages[pages.length - 1].actions = [{ label: 'Accept: ' + q.title, gold: true, fn: () => startQuest(offerId) }, { label: 'Maybe later', fn: () => { } }];
  }
  if (!pages.length) {
    const mine = activeSteps().find(([qid]) => QUESTS[qid].giver === n.id);
    pages.push({ text: mine ? QUESTS[mine[0]].remind : n.idle[(Math.random() * n.idle.length) | 0] });
    if (n.shop) pages[0].actions = [{ label: 'Look at the shelves', pri: true, stop: true, fn: () => { closeDialog(); openShop(); } }, { label: 'Not today', fn: () => { } }];
  }
  openDialog(n.name, n.role, pages);
}
function updateNPCs(dt) {
  for (const n of npcs) {
    const d = Math.hypot(P.x - n.x, P.z - n.z);
    const target = d < 14 ? Math.atan2(P.x - n.x, -(P.z - n.z)) : n.yaw;
    n.yaw += wrapA(target - n.yaw) * (1 - Math.exp(-4 * dt));
    n.model.rotation.y = -n.yaw;
    n.model.userData.upper.position.y = 0.98 - 0.006 + Math.sin(gameT * 2 + n.x) * 0.012; // breathing
    const has = Object.keys(QUESTS).some(q => QUESTS[q].giver === n.id && canOffer(q));
    const turn = activeSteps().some(([, st]) => st.t === 'talk' && st.npc === n.id);
    n.mark.visible = has || turn; n.mark.material = turn ? MARK.turn : MARK.offer;
    n.mark.position.y = n.y + (n.small ? 2.0 : 2.5) + Math.sin(gameT * 3) * 0.08;
  }
}

/* ================= travel ================= */
let fadeT = 0;
function travel(to, viaLift, msg) {
  if (state !== 'play' && state !== 'map') return;
  const fade = $('fade'); fade.style.opacity = 1;
  setTimeout(() => {
    const s = SPAWNS[to]; P.x = s[0]; P.z = s[1]; P.h = s[2]; P.s = 0; P.lat = 0; P.w = 0; P.crash = 0; P.y = H(P.x, P.z); P.air = false; P.vy = 0; P.gvPrev = 0;
    updateTiles(P.x, P.z, true);
    trailBreak = true; CAM.yaw = P.h; prevX = P.x; prevZ = P.z; updateCamera(1 / 60, true); persist();
    if (viaLift || msg) toast(msg || 'The gondola hums along its cable…', '', 2000);
    setTimeout(() => { fade.style.opacity = 0; }, 150);
  }, 480);
}

/* ================= map ================= */
const mapCv = $('mapCv'), MW = 760, MH = 552;
const mu = x => (x - WORLD.x0) / (WORLD.x1 - WORLD.x0) * MW, mv = z => (WORLD.z1 - z) / (WORLD.z1 - WORLD.z0) * MH;
let mapBase = null;
function buildMapBase() {
  const SW = MW >> 1, SH = MH >> 1, small = mkCanvas(SW, SH, (g) => {
    const img = g.createImageData(SW, SH), d = img.data;
    for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) {
      const x = WORLD.x0 + (i + 0.5) / SW * (WORLD.x1 - WORLD.x0), z = WORLD.z1 - (j + 0.5) / SH * (WORLD.z1 - WORLD.z0), h = Hraw(x, z);
      const hx = Hraw(x + 8, z) - h, hz = Hraw(x, z + 8) - h, shade = clamp(0.9 - hx * 0.03 + hz * 0.02, 0.55, 1.08);
      let r = 236, gg = 240, b = 250; const rg = regionAt(x, z);
      const st = snowType(x, z, Math.hypot(hx, hz) / 8); if (st === 'blueice') { r = 200; gg = 226; b = 242; }
      const tc = treeChance(x, z, h); if (tc > 0.35) { const k = clamp((tc - 0.35) * 1.6, 0, 0.8); r = lerp(r, 92, k); gg = lerp(gg, 140, k); b = lerp(b, 128, k); }
      if (Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz) < 1) { r = 170; gg = 214; b = 236; }
      const o = (j * SW + i) * 4; d[o] = r * shade; d[o + 1] = gg * shade; d[o + 2] = b * shade; d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
  mapBase = mkCanvas(MW, MH, (g) => {
    g.imageSmoothingEnabled = true; g.drawImage(small, 0, 0, MW, MH);
    RUNS.forEach(run => { g.strokeStyle = run.col; g.lineWidth = Math.max(2, run.w / (WORLD.x1 - WORLD.x0) * MW * 1.4); g.lineCap = 'round'; g.lineJoin = 'round'; g.globalAlpha = 0.8; g.beginPath(); run.path.forEach((p, i) => i ? g.lineTo(mu(p.x), mv(p.z)) : g.moveTo(mu(p.x), mv(p.z))); g.stroke(); });
    g.globalAlpha = 1; g.strokeStyle = '#3a4256'; g.setLineDash([5, 4]); g.lineWidth = 1.6;
    LIFTS.forEach(L => { g.beginPath(); g.moveTo(mu(L.x), mv(L.za)); g.lineTo(mu(L.x), mv(L.zb)); g.stroke(); }); g.setLineDash([]);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 22px "Barlow Condensed", sans-serif';
    REGIONS.forEach(r => { const [x, z] = toWorld(r, r.uS * 0.5, 60); g.lineWidth = 5; g.strokeStyle = 'rgba(238,243,248,.85)'; g.strokeText(r.name, mu(x), mv(z)); g.fillStyle = '#1d3a33'; g.fillText(r.name, mu(x), mv(z)); });
  });
}
function drawMap() {
  if (!mapBase) buildMapBase();
  const g = mapCv.getContext('2d'); g.drawImage(mapBase, 0, 0);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const p of POIS) {
    const x = mu(p.x), y = mv(p.z), known = save.disc.includes(p.id);
    if (!known) { g.fillStyle = 'rgba(29,58,51,.4)'; g.font = '800 18px "Barlow Condensed", sans-serif'; g.fillText('?', x, y); continue; }
    g.fillStyle = p.camp ? '#1d3a33' : '#56696d'; g.beginPath(); if (p.camp) { g.moveTo(x, y - 9); g.lineTo(x + 9, y + 6); g.lineTo(x - 9, y + 6); g.closePath(); } else g.arc(x, y, 5, 0, TAU); g.fill();
    g.font = '700 15px "Barlow Condensed", sans-serif'; g.lineWidth = 4; g.strokeStyle = 'rgba(238,243,248,.92)'; g.strokeText(p.name, x, y + 18); g.fillStyle = '#17262a'; g.fillText(p.name, x, y + 18);
  }
  for (const n of npcs) { if (!n.mark.visible) continue; g.fillStyle = n.mark.material === MARK.turn ? '#2f5e8c' : '#f2661c'; g.beginPath(); g.arc(mu(n.x), mv(n.z), 6, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = '800 10px Nunito'; g.fillText(n.mark.material === MARK.turn ? '?' : '!', mu(n.x), mv(n.z) + 1); }
  questTargets().forEach(t => { g.fillStyle = '#f2661c'; g.beginPath(); const x = mu(t.x), y = mv(t.z); g.moveTo(x, y - 7); g.lineTo(x + 7, y); g.lineTo(x, y + 7); g.lineTo(x - 7, y); g.fill(); });
  if (ev && ev.target) { g.fillStyle = '#ff5a36'; g.beginPath(); g.arc(mu(ev.target.x), mv(ev.target.z), 6, 0, TAU); g.fill(); }
  const px = mu(P.x), py = mv(P.z);
  g.save(); g.translate(px, py); g.rotate(P.h); g.fillStyle = '#f2661c'; g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, 11); g.lineTo(7, -7); g.lineTo(0, -3); g.lineTo(-7, -7); g.closePath(); g.stroke(); g.fill(); g.restore();
}
mapCv.addEventListener('click', e => {
  const r = mapCv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * MW, y = (e.clientY - r.top) / r.height * MH;
  for (const p of POIS) if (p.camp && save.disc.includes(p.id) && Math.hypot(mu(p.x) - x, mv(p.z) - y) < 22) {
    if (ev && ev.name === 'Avalanche') { toast("Can't travel during an avalanche!", 'warn'); return; }
    closeOv(); travel(p.id); toast('Travelling to ' + p.name + '...', '', 1600); return;
  }
});

/* ================= journal ================= */
let jTab = 'q';
const WHERE = { 'mira': 'at Ranger Camp on the east side', 'tov': "at the Hermit's Cabin in the west woods", 'pip': 'at the Base Lodge', 'oskar': 'in Lowpine Village', 'hanne': 'in Lowpine Village' };
function renderJournal() {
  const b = $('jBody'); let html = '';
  if (jTab === 'q') {
    const act = activeSteps();
    html += act.length ? act.map(([id, st]) => `<div class="qitem"><b>${QUESTS[id].title}</b><p>${st.text}${stepProgress(id, st)}</p><p class="hint">${QUESTS[id].remind}</p></div>`).join('')
      : '<div class="qitem"><b>Nothing on the go</b><p>Anyone with a ! over their head has something for you.</p></div>';
    const avail = Object.keys(QUESTS).filter(canOffer);
    if (avail.length) html += '<h3>Heard around the mountain</h3>' + avail.map(id => { const n = NPCS.find(x => x.id === QUESTS[id].giver); return `<div class="qitem"><b>${n.name} could use a hand</b><p>${n.role}, ${WHERE[n.id] || 'up at Summit Station'}.</p></div>`; }).join('');
    const done = Object.keys(save.q).filter(id => save.q[id].s === 'done');
    if (done.length) html += '<h3>Finished</h3>' + done.map(id => `<div class="qitem done"><b>${QUESTS[id].title}</b></div>`).join('');
    html += `<h3>So far</h3><div class="tally"><div><b>${save.disc.length}<small style="font-size:18px;color:#56696d"> / ${POIS.length}</small></b><span>places found</span></div><div><b>${save.crystals.length}<small style="font-size:18px;color:#56696d"> / ${crystalSpots.length}</small></b><span>snow crystals</span></div><div><b>${SPECIES.filter(s => save.dex[s.id]).length}<small style="font-size:18px;color:#56696d"> / ${SPECIES.length}</small></b><span>animals logged</span></div></div>`;
  } else if (jTab === 'p') {
    html = renderPack();
  } else if (jTab === 'd') {
    html = '<div class="dex">' + SPECIES.map(s => save.dex[s.id] ? `<div><b>${s.name}</b><small>${s.where}, seen ${save.dex[s.id]} ${save.dex[s.id] === 1 ? 'time' : 'times'}</small><p>${s.desc}</p></div>`
      : `<div class="unk"><b>Not logged yet</b><small>${s.where}</small><p>Get within about ${save.inv.spyglass ? 45 : 20} metres to write it down.</p></div>`).join('') + '</div>';
  } else {
    html = `<p class="lede">You have ${save.coins} snowmarks. Finishing quests earns the special jackets.</p><div class="sw">` + JACKETS.map(j => {
      const own = save.colors.includes(j.id), on = save.color === j.id;
      const sub = own ? (on ? 'Wearing it' : 'Yours') : j.quest ? 'From ' + QUESTS[j.quest].title : j.price + ' snowmarks';
      return `<button data-j="${j.id}" class="${on ? 'on' : ''}" ${!own && (j.quest || save.coins < j.price) ? 'disabled' : ''}><i style="background:${j.c}"></i><span><b>${j.name}</b><small>${sub}</small></span></button>`;
    }).join('') + '</div>';
  }
  b.innerHTML = html;
  b.querySelectorAll('[data-j]').forEach(btn => btn.onclick = () => {
    const j = JACKETS.find(x => x.id === btn.dataset.j);
    if (!save.colors.includes(j.id)) { if (save.coins < j.price) return; save.coins -= j.price; save.colors.push(j.id); sfx.coin(); }
    save.color = j.id; setJacket(playerModel, j.c); persist(); renderJournal();
  });
  b.querySelectorAll('[data-use]').forEach(btn => btn.onclick = () => useItem(btn.dataset.use));
  b.querySelectorAll('[data-open]').forEach(btn => btn.onclick = () => { closeOv(); openOv('mapOv'); });
}
function setTab(t) { jTab = t; document.querySelectorAll('#jTabs button').forEach(x => x.classList.toggle('on', x.dataset.t === t)); renderJournal(); }
document.querySelectorAll('#jTabs button').forEach(b => b.onclick = () => setTab(b.dataset.t));

/* ================= overlays ================= */
let prevState = 'play';
function openOv(id, tab) { if (state !== 'play') return; prevState = state; state = id === 'pauseOv' ? 'paused' : 'menu'; $(id).classList.remove('hidden'); if (id === 'journal') setTab(tab || (jTab === 'p' ? 'q' : jTab)); if (id === 'mapOv') drawMap(); }
function closeOv() { ['journal', 'mapOv', 'pauseOv', 'shopOv'].forEach(i => $(i).classList.add('hidden')); if (state === 'menu' || state === 'paused') state = 'play'; }
$('bMap').onclick = () => openOv('mapOv'); $('bJournal').onclick = () => openOv('journal'); $('quest').onclick = () => openOv('journal');
$('bJump').onclick = () => { P.jumpBuf = 0.18; }; if (isTouch) $('bJump').classList.remove('hidden');
$('bPause').onclick = () => openOv('pauseOv'); $('bPack').onclick = () => openOv('journal', 'p'); $('bSkis').onclick = () => toggleSkis(); $('sClose').onclick = closeOv; $('pResume').onclick = closeOv; $('jClose').onclick = closeOv; $('mClose').onclick = closeOv;
$('bCam').onclick = () => toggleCam(); $('bMute').onclick = () => { initAudio(); setMute(!AU.muted); };
$('prompt').onclick = () => interact();
$('pTitle').onclick = () => { persist(); closeOv(); showTitle(); };
function toggleCam() { CAM.mode = CAM.mode === 'third' ? 'first' : 'third'; updateCamera(1 / 60, true); toast(CAM.mode === 'first' ? 'First-person view' : 'Third-person view', '', 1200); }

/* ================= input ================= */
const keys = {};
window.addEventListener('keydown', e => {
  const c = e.code;
  if (state === 'play' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(c)) e.preventDefault();
  if (c === 'Space' && state === 'play') { e.preventDefault(); if (!e.repeat) P.jumpBuf = 0.18; }
  if (!e.repeat) {
    if (state === 'play') {
      if (c === 'KeyE' || c === 'Enter') interact();
      else if (c === 'KeyM') openOv('mapOv'); else if (c === 'KeyJ' || c === 'Tab') { e.preventDefault(); openOv('journal'); }
      else if (c === 'KeyC') toggleCam(); else if (c === 'KeyP' || c === 'Escape') openOv('pauseOv');
      else if (c === 'KeyI') openOv('journal', 'p'); else if (c === 'KeyF') toggleSkis();
    } else if (state === 'menu' || state === 'paused') { if (c === 'Escape' || c === 'KeyM' || c === 'KeyJ' || c === 'KeyP' || c === 'KeyI') closeOv(); }
    else if (state === 'dialog' && c === 'Escape') closeDialog();
    if (c === 'KeyN' && state !== 'title') setMute(!AU.muted);
  }
  keys[c] = true;
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; touches.clear(); });
const touches = new Map();
function onTouch(e) {
  e.preventDefault(); initAudio();
  for (const t of e.changedTouches) {
    if (e.type === 'touchstart') touches.set(t.identifier, { x: t.clientX, y: t.clientY, sx: t.clientX, sy: t.clientY });
    else if (e.type === 'touchmove') { const o = touches.get(t.identifier); if (o) { o.x = t.clientX; o.y = t.clientY; } }
    else touches.delete(t.identifier);
  }
}
['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(n => canvas.addEventListener(n, onTouch, { passive: false }));
function readInput() {
  let tl = false, tr = false, tt = false, tp = false;
  const W = window.innerWidth;
  for (const t of touches.values()) { const dy = t.y - t.sy; if (dy > 40) tt = true; else if (dy < -40) tp = true; else if (t.x < W / 2) tl = true; else tr = true; }
  let l = keys.ArrowLeft || keys.KeyA, r = keys.ArrowRight || keys.KeyD, brake = keys.ShiftLeft || keys.ShiftRight || keys.KeyX || false;
  if (tl && tr) brake = true; else { l = l || tl; r = r || tr; }
  return { steer: (r ? 1 : 0) - (l ? 1 : 0), tuck: keys.ArrowDown || keys.KeyS || tt, brake, push: keys.ArrowUp || keys.KeyW || tp };
}
