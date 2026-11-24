/* Frostpeak Frontier: main.js
   Light and weather, the main loop, and starting the game.
   Loaded as a plain script; files share one global scope and load in the order listed in index.html. */
'use strict';

/* ================= light & weather ================= */
const PAL = [
  { t: 0.0, top: '#2a63c4', mid: '#6fa6e6', hor: '#cfe3e6', fog: '#bfd6dc', sun: '#ffe6c2', si: 1.2, hs: '#a9c6ef', hg: '#d2c3a6', el: 0.34, az: -0.5 },
  { t: 0.3, top: '#1f66d2', mid: '#6aaeee', hor: '#d2ebec', fog: '#bcd8de', sun: '#fff6e2', si: 1.38, hs: '#aecdf2', hg: '#d6cbb0', el: 0.85, az: 0.25 },
  { t: 0.6, top: '#3d63b8', mid: '#8fa0d6', hor: '#f2c9a0', fog: '#dcd6d6', sun: '#ffd8ae', si: 1.25, hs: '#bccaee', hg: '#e2cdb6', el: 0.3, az: 0.95 }, // late afternoon: warm light, snow still white
  { t: 0.8, top: '#34457e', mid: '#7f7eb0', hor: '#e8a596', fog: '#bdb4c2', sun: '#ffb594', si: 0.95, hs: '#a3acd6', hg: '#d0aca6', el: 0.12, az: 1.25 },
  { t: 1.0, top: '#2a63c4', mid: '#6fa6e6', hor: '#cfe3e6', fog: '#bfd6dc', sun: '#ffe6c2', si: 1.2, hs: '#a9c6ef', hg: '#d2c3a6', el: 0.34, az: -0.5 }
];
const PALC = PAL.map(p => ({ t: p.t, top: C(p.top), mid: C(p.mid), hor: C(p.hor), fog: C(p.fog), sun: C(p.sun), hs: C(p.hs), hg: C(p.hg), si: p.si, el: p.el, az: p.az }));
const STORM = { fog: C('#b4bbc8'), top: C('#8a95a9'), mid: C('#a3acbb'), hor: C('#b8bfcb') };
const tmpC = new THREE.Color(), tmpC2 = new THREE.Color();
const NIGHT = { top: C('#070f26'), mid: C('#13204a'), hor: C('#2c3766'), fog: C('#1a2347'), sun: C('#9fb4ff'), hs: C('#41548c'), hg: C('#232a4a') };
const ENV = { night: 0, storm: 0, fogK: 1, tint: 0, tc: new THREE.Color('#ffffff') }, ENV_T = { aurora: { night: 1 }, crags: { storm: 0.3 }, ember: { fogK: 1.3, tint: 0.55, tc: '#b8a49a' }, dunes: { fogK: 1.1, tint: 0.45, tc: '#ecd2a4' } };
let lastRegion = null;
function updateEnv(dt) {
  const r = regionAt(state === 'title' ? camera.position.x : P.x, state === 'title' ? camera.position.z : P.z), t = (r && ENV_T[r.id]) || {}, k = 1 - Math.exp(-0.5 * dt);
  ENV.night += ((t.night || 0) - ENV.night) * k; ENV.storm += ((t.storm || 0) - ENV.storm) * k; ENV.fogK += ((t.fogK || 1) - ENV.fogK) * k; ENV.tint += ((t.tint || 0) - ENV.tint) * k; if (t.tc) ENV.tc.lerp(C(t.tc), k);
  skyU.time.value += dt; skyU.aur.value = ENV.night;
}
function applyLight(t, sf) {
  const nk = ENV.night;
  let i = 0; while (i < PALC.length - 2 && PALC[i + 1].t <= t) i++;
  const a = PALC[i], b = PALC[i + 1], k = sstep(0, 1, (t - a.t) / (b.t - a.t));
  const mix = (key, out) => out.copy(a[key]).lerp(b[key], k);
  mix('top', skyU.top.value).lerp(STORM.top, sf); mix('mid', skyU.mid.value).lerp(STORM.mid, sf); mix('hor', skyU.hor.value).lerp(STORM.hor, sf);
  mix('fog', scene.fog.color).lerp(STORM.fog, sf);
  mix('sun', sun.color); mix('sun', skyU.sunCol.value).multiplyScalar(1 - sf * 0.9);
  mix('hs', hemi.color); mix('hg', hemi.groundColor);
  if (nk > 0.001) { skyU.top.value.lerp(NIGHT.top, nk); skyU.mid.value.lerp(NIGHT.mid, nk); skyU.hor.value.lerp(NIGHT.hor, nk); scene.fog.color.lerp(NIGHT.fog, nk);
    sun.color.lerp(NIGHT.sun, nk); skyU.sunCol.value.multiplyScalar(1 - nk); hemi.color.lerp(NIGHT.hs, nk); hemi.groundColor.lerp(NIGHT.hg, nk); }
  sun.intensity = lerp(a.si, b.si, k) * 0.8 * (1 - sf * 0.55) * (1 - nk * 0.62); hemi.intensity = (0.36 + sf * 0.3) * (1 - nk * 0.35);
  const el = lerp(lerp(a.el, b.el, k), 0.75, nk), az = lerp(lerp(a.az, b.az, k), -0.6, nk), dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  skyU.sunDir.value.copy(dir);
  sun.position.set(P.x + dir.x * 300, P.y + dir.y * 300, P.z + dir.z * 300); sun.target.position.set(P.x, P.y, P.z);
  if (ENV.tint > 0.01) { scene.fog.color.lerp(ENV.tc, ENV.tint); skyU.hor.value.lerp(ENV.tc, ENV.tint * 0.6); }
  const far = (LOW ? 3400 : 6500) / ENV.fogK * (1 - nk * 0.3);
  scene.fog.near = lerp(260, 6, sf); scene.fog.far = lerp(far, 150, sf);
  tmpC.copy(skyU.hor.value).lerp(C('#dfe8ff'), 0.3); peakMat.color.copy(tmpC).lerp(STORM.fog, sf * 0.9); peakMat.opacity = 1 - sf * 0.92;
  tmpC2.copy(skyU.hor.value).lerp(C('#ffffff'), 0.35); clouds.forEach(c => { c.material.color.copy(tmpC2); c.material.opacity = 0.7 * (1 - sf * 0.6); });
}

/* ================= main loop ================= */
function updateWorld(dt) {
  // crystals
  for (const c of crystals) {
    if (!c.g.visible) continue;
    c.g.rotation.y += dt * 1.2; c.g.position.y = Hm(c.x, c.z) + 1.3 + Math.sin(gameT * 2 + c.i) * 0.15;
    if (state === 'play' && Math.hypot(c.x - P.x, c.z - P.z) < 2.6) {
      c.g.visible = false; save.crystals.push(c.i); save.coins += 5; sfx.crystal(); emitBurst(c.x, c.g.position.y, c.z, 24);
      toast('Snow crystal ' + save.crystals.length + ' of ' + crystalSpots.length + ', plus 5 snowmarks', 'good', 1800); checkAutoSteps(); persist();
    }
  }
  for (let i = itemObjs.length - 1; i >= 0; i--) {
    const o = itemObjs[i]; o.g.rotation.y += dt;
    if (state === 'play' && Math.hypot(o.x - P.x, o.z - P.z) < 2.8) { save.items[o.key] = true; scene.remove(o.g); itemObjs.splice(i, 1); sfx.coin(); toast((o.kind === 'mitten' ? 'Found a mitten' : 'Picked frost mint'), 'good', 1600); checkAutoSteps(); persist(); }
  }
  if (shrineCrystal) { shrineCrystal.rotation.y += dt * 0.8; shrineCrystal.position.y = Hm(-90, 210) + 2.2 + Math.sin(gameT) * 0.2; }
  if (campfire) { campfire.light.intensity = 1.4 + Math.sin(gameT * 13) * 0.2 + Math.sin(gameT * 7.3) * 0.15; campfire.flame.scale.y = 1 + Math.sin(gameT * 11) * 0.15; }
  // gondola cabins on every lift
  for (const Lf of LIFTS) {
    if (!Lf.cabins || Math.hypot(Lf.x - camera.position.x, (Lf.za + Lf.zb) / 2 - camera.position.z) > 2600) continue;
    const n = Lf.cabins.count, L = Lf.line, z0 = L[0][0], span = L[L.length - 1][0] - z0;
    for (let i = 0; i < n; i++) {
      const up = i % 2 === 0, f = ((gameT * 0.012 + i / n) % 1), z = up ? z0 + f * span : z0 + span - f * span, ft = (z - z0) / span * (L.length - 1);
      const k = Math.min(L.length - 2, Math.floor(ft)), y = lerp(L[k][1], L[k + 1][1], ft - k);
      dummy.position.set(Lf.x + (up ? 3 : -3), y, z); dummy.rotation.set(0, (up ? 0 : Math.PI) + (span < 0 ? Math.PI : 0), 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); Lf.cabins.setMatrixAt(i, dummy.matrix);
    }
    Lf.cabins.instanceMatrix.needsUpdate = true;
  }
  sky.position.copy(camera.position);
  clouds.forEach(c => { const u = c.userData; u.a += u.sp * dt; c.position.set(camera.position.x + Math.sin(u.a) * u.d, u.y, camera.position.z + Math.cos(u.a) * u.d); });
}
let last = performance.now(), saveT = 0, titleT = 0, prevX = 0, prevZ = 0;
let frameMs = 16, prTimer = 0;
function adaptResolution(dt) { // drop the resolution a little when frames get slow, raise it back when there is room
  frameMs += (dt * 1000 - frameMs) * 0.05; prTimer += dt;
  if (prTimer < 1.5) return;
  if (frameMs > 24 && curPR > MIN_PR) { curPR = Math.max(MIN_PR, curPR - 0.1); renderer.setPixelRatio(curPR); resize(); prTimer = 0; }
  else if (frameMs < 15 && curPR < MAX_PR) { curPR = Math.min(MAX_PR, curPR + 0.1); renderer.setPixelRatio(curPR); resize(); prTimer = -2; }
}
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000; last = now; if (!(dt > 0)) dt = 0; if (dt > 0.1) dt = 0.1;
  adaptResolution(dt);
  if (emberLava) emberLava.material.color.setHSL(0.055 + Math.sin(gameT * 0.8) * 0.01, 1, 0.55 + Math.sin(gameT * 2.3) * 0.04);
  if (state === 'play') {
    const n = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / n, inp = readInput();
    for (let i = 0; i < n; i++) updatePlayer(h, inp);
    gameT += dt;
    courseUpdate(dt, prevX, prevZ); prevX = P.x; prevZ = P.z;
    updateCreatures(dt); updateEvents(dt); checkDiscovery();
    save.time = (save.time + dt / 480) % 1;
    if (P.wax > 0 && (P.wax -= dt) <= 0) toast('Your wax has worn off.', '', 1800);
    if (P.cocoa > 0 && (P.cocoa -= dt) <= 0) toast('The cocoa warmth fades.', '', 1800);
    saveT += dt; if (saveT > 5) { saveT = 0; persist(); }
  } else gameT += dt * (state === 'title' ? 1 : 0);
  storm += (stormTarget - storm) * (1 - Math.exp(-0.5 * dt));
  if (state !== 'title' && state !== 'loading') { posePlayer(dt); updateCamera(dt); updateNPCs(dt); updateHUD(); }
  else if (state === 'title') { titleT += dt; const a = 2.2 + titleT * 0.025, cx = -150 + Math.cos(a) * 90, cz = 300 + Math.sin(a) * 90, cy = H(cx, cz) + 14; camera.position.set(cx, cy, cz); camera.lookAt(cx + Math.cos(a + 1.9) * 300, cy - 30, cz + Math.sin(a + 1.9) * 300); playerModel.visible = false; }
  updateEnv(dt);
  const sky2 = Math.max(storm, ENV.storm);
  applyLight(save.time, sky2);
  updateSpray(dt); updateSnowfall(dt, sky2); updateSparkles(dt, sky2); updateSmoke(dt); updateWorld(dt);
  updateTiles(camera.position.x, camera.position.z, false);
  audioFrame();
  renderer.render(scene, camera);
}

/* ================= start ================= */
function showTitle() {
  state = 'title'; $('hud').classList.add('hidden'); $('title').classList.remove('hidden');
  $('tCont').classList.toggle('hidden', !store.get(SAVE_KEY, null));
}
function beginPlay(fresh) {
  initAudio();
  if (fresh) save = newSave(); else save = Object.assign(newSave(), store.get(SAVE_KEY, {}));
  crystals.forEach(c => c.g.visible = !save.crystals.includes(c.i));
  P.x = save.pos.x; P.z = save.pos.z; P.h = save.pos.h; P.s = 0; P.lat = 0; P.w = 0; P.crash = 0; P.y = H(P.x, P.z); P.air = false; P.vy = 0; P.gvPrev = 0;
  P.foot = !!save.foot; P.wax = 0; P.cocoa = 0; syncSkiButton(); syncLamps(); if (!save.regions) save.regions = [];
  updateTiles(P.x, P.z, true);
  CAM.mode = save.cam || 'third'; CAM.yaw = P.h; trailBreak = true; trCount = 0; rebuildTrail();
  setJacket(playerModel, (JACKETS.find(j => j.id === save.color) || JACKETS[0]).c);
  if (course) { course.objs.forEach(o => scene.remove(o)); course = null; }
  syncItems(); syncCourse();
  if (ev) { ev.cleanup && ev.cleanup(); ev = null; } evTimer = 35; stormTarget = 0;
  $('title').classList.add('hidden'); $('hud').classList.remove('hidden');
  state = 'play'; prevX = P.x; prevZ = P.z; updateCamera(1 / 60, true);
  if (fresh) setTimeout(() => { toast('Bram, the gondola operator, wants a word. Ski over to him and ' + (isTouch ? 'tap the prompt' : 'press E') + '.', '', 5000); }, 400);
  persist();
}
$('tNew').onclick = () => { if (store.get(SAVE_KEY, null) && !$('tNew').dataset.confirm) { $('tNew').dataset.confirm = 1; $('tNew').textContent = 'Start over? Tap again'; return; } $('tNew').dataset.confirm = ''; $('tNew').textContent = 'New journey'; beginPlay(true); };
$('tCont').onclick = () => beginPlay(false);
if (isTouch) $('tHelp').textContent = 'Hold the left or right side of the screen to turn and both sides to stop. Drag down to tuck, drag up to push or walk, and tap Jump to jump. The buttons up top open your pack, map and journal.';

function init() {
  resize(); setMute(AU.muted);
  placeCrystals(); buildLandmarks(); buildCrystals(); buildNPCs();
  buildBorder(); updateTiles(-150, 300, true);
  playerModel = makePerson({ jacket: '#ff5a36', hat: '#26304a', scarf: '#f0b429', ski: '#ffd21f' }); scene.add(playerModel);
  playerModel.traverse(o => { if (o.isMesh) o.castShadow = true; });
  $('loading').classList.add('hidden');
  showTitle();
  requestAnimationFrame(frame);
}
setTimeout(init, 30);
