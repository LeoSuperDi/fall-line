/* Frostpeak Frontier: player.js
   Skiing, walking and jumping physics, the camera, and how the skier is posed.
   Loaded as a plain script; files share one global scope and load in the order listed in index.html. */
'use strict';

/* ================= player ================= */
const SNOW = {
  groomed: { name: 'Groomed corduroy', fric: 0.05, grip: 16, hold: 6.5, latFric: 6, turn: 1, resp: 1 },
  powder: { name: 'Fresh powder', fric: 0.55, grip: 11, hold: 5, latFric: 8, turn: .85, resp: .6 },
  ice: { name: 'Ice', fric: 0.02, grip: 4.5, hold: 1.8, latFric: 1.1, turn: .95, resp: 1 },
  moguls: { name: 'Moguls', fric: 0.5, grip: 12, hold: 5.5, latFric: 6, turn: .9, resp: .85, jostle: true },
  deep: { name: 'Bottomless powder', fric: 0.5, grip: 12, hold: 5.5, latFric: 9, turn: .8, resp: .5 },
  blueice: { name: 'Blue glacier ice', fric: 0.01, grip: 3.8, hold: 1.6, latFric: 1, turn: .95, resp: 1 },
  windpack: { name: 'Wind crust', fric: 0.2, grip: 10, hold: 5, latFric: 6, turn: .9, resp: .85, jostle: true },
  ash: { name: 'Ash and cinders', fric: 0.3, grip: 11, hold: 5.5, latFric: 7, turn: .9, resp: .85 },
  sand: { name: 'Wind-blown sand', fric: 0.75, grip: 13, hold: 6, latFric: 8, turn: .9, resp: .8 },
  thin: { name: 'Thin snow over grass', fric: 0.7, grip: 12, hold: 6, latFric: 8, turn: .9, resp: .85 }
};
const P = { x: -425, z: 640, y: 0, h: 0, w: 0, s: 0, lat: 0, vx: 0, vz: 0, tuck: 0, brakeA: 0, brakeSide: 1, wasBrake: false, hold: 0, lastSign: 0, jt: 0,
  crash: 0, spin: 0, spinV: 0, cvx: 0, cvz: 0, inv: 0, snow: 'powder', skidI: 0, sprayAcc: 0, push: 0, pushT: 0, bump: 0,
  foot: false, walkPh: 0, stepAcc: 0, wax: 0, cocoa: 0, air: false, vy: 0, airT: 0, jumpBuf: 0, jumped: false, gvPrev: 0 };
let playerModel = null;
function speedKmh() { return Math.hypot(P.vx, P.vz) * 3.6; }
function grad(x, z) { const e = 0.5; return [(H(x + e, z) - H(x - e, z)) / (2 * e), (H(x, z + e) - H(x, z - e)) / (2 * e)]; }
function crashPlayer() {
  if (P.crash > 0 || P.inv > 0) return;
  if (P.foot) { camShake = 0.5; sfx.crash(); emitBurst(P.x, P.y + 0.5, P.z, 30); P.s = 0; return; }
  P.air = false; P.vy = 0; P.crash = 1.3; P.cvx = P.vx * 0.4; P.cvz = P.vz * 0.4; P.spinV = (Math.random() < .5 ? -1 : 1) * (6 + P.s / 4); P.spin = 0;
  P.s = 0; P.lat = 0; P.w = 0; camShake = 1; trailBreak = true;
  sfx.crash(); emitBurst(P.x, P.y + 0.5, P.z, 40);
  stats.crashes++;
  onCrash();
}
const GRAV = 16;
function land(p) { // touchdown: forgiving, never a crash
  const hard = -p.vy; p.air = false; p.vy = 0; p.jumped = false; p.airT = 0; p.gvPrev = 0; trailBreak = true;
  if (hard > 6) { emitBurst(p.x, p.y + 0.1, p.z, Math.min(40, 8 + hard * 1.5)); sfx.land(hard); camShake = Math.max(camShake, Math.min(0.35, hard / 40)); }
}
function groundStep(p, dt, gy, jumpV) { // returns true while airborne
  p.jumpBuf -= dt;
  if (p.air) {
    p.vy -= GRAV * dt; p.y += p.vy * dt; p.airT += dt;
    if (p.jumpBuf > 0 && !p.jumped && p.airT < 0.14) { p.vy = jumpV; p.jumped = true; p.jumpBuf = 0; sfx.jump(); } // late press right after leaving a crest still counts
    if (p.y <= gy) { p.y = gy; land(p); return false; }
    return true;
  }
  const gv = (gy - p.y) / Math.max(dt, 1e-4);
  if (p.jumpBuf > 0) { p.air = true; p.jumped = true; p.vy = jumpV + Math.max(0, gv * 0.5); p.airT = 0; p.jumpBuf = 0; p.y = Math.max(p.y, gy); sfx.jump(); emitBurst(p.x, gy + 0.1, p.z, 10); return true; }
  if (!p.foot && p.s > 13 && p.gvPrev - gv > 30 * dt && p.gvPrev - gv < 30) { p.air = true; p.jumped = false; p.vy = p.gvPrev; p.airT = 0; p.y = Math.max(p.y, gy); return true; } // crest: the ground drops away faster than you fall
  p.gvPrev = gv; p.y = gy; return false;
}
function walkPlayer(dt, inp, gx, gz) {
  const p = P;
  p.h = wrapA(p.h + inp.steer * 2.4 * dt);
  const dx = Math.sin(p.h), dz = -Math.cos(p.h);
  const up = Math.max(0, gx * dx + gz * dz) * (inp.tuck ? -1 : 1);            // climbing makes you slower
  let target = inp.push ? (p.cocoa > 0 ? 5.2 : 3.3) : inp.tuck ? -1.5 : 0;
  if (p.snow === 'powder') target *= 0.8;
  if (target > 0) target *= clamp(1 - Math.max(0, up) * 1.1, 0.35, 1);
  p.s += (target - p.s) * (1 - Math.exp(-6 * dt));
  p.w = 0; p.lat = 0; p.tuck = 0; p.brakeA = 0; p.skidI = 0; p.push = false;
  p.vx = p.s * dx; p.vz = p.s * dz;
  p.x += p.vx * dt; p.z += p.vz * dt;
  if (p.x < WORLD.x0 + 25 || p.x > WORLD.x1 - 25 || p.z < WORLD.z0 + 25 || p.z > WORLD.z1 - 45) { p.x = clamp(p.x, WORLD.x0 + 25, WORLD.x1 - 25); p.z = clamp(p.z, WORLD.z0 + 25, WORLD.z1 - 45); }
  const hit = nearObs(p.x, p.z, o => { const ddx = p.x - o.x, ddz = p.z - o.z; return ddx * ddx + ddz * ddz < (o.r + 0.4) * (o.r + 0.4); });
  if (hit) { const ddx = p.x - hit.x, ddz = p.z - hit.z, d = Math.hypot(ddx, ddz) || 1; p.x = hit.x + ddx / d * (hit.r + 0.41); p.z = hit.z + ddz / d * (hit.r + 0.41); }
  for (const n of npcs) { const ddx = p.x - n.x, ddz = p.z - n.z, d = Math.hypot(ddx, ddz); if (d < 0.8 && d > 0) { p.x = n.x + ddx / d * 0.8; p.z = n.z + ddz / d * 0.8; } }
  const inAir = groundStep(p, dt, H(p.x, p.z), 5.2);
  const moved = inAir ? 0 : Math.abs(p.s) * dt; p.walkPh += moved * 3.4; p.stepAcc += moved;
  if (p.stepAcc > 0.85) { p.stepAcc = 0; sfx.step2(p.snow); }
  trailBreak = true;
}
function toggleSkis() {
  if (state !== 'play') return;
  if (P.crash > 0) return;
  if (!P.foot && Math.hypot(P.vx, P.vz) > 3) { toast('Slow down to take your skis off.', 'warn', 1800); return; }
  P.foot = !P.foot; P.s = 0; P.lat = 0; P.w = 0; trailBreak = true;
  sfx.click(); toast(P.foot ? 'Skis off. Walk with ' + (isTouch ? 'a drag up' : '↑') + ', and you can head uphill.' : 'Skis on.', '', 2200);
  syncSkiButton(); persist();
}
function syncSkiButton() {
  const b = $('bSkis'); b.setAttribute('aria-label', P.foot ? 'Put skis on' : 'Take skis off');
  $('skiIc').innerHTML = P.foot ? '<path d="M8 4v9l-3 5h7l1-3h3l1 3h3l-1-5-5-2V4z"/>' : '<path d="M6 3l5 18M13 3l5 18"/><path d="M4.5 8.5l4-1M11.5 8.5l4-1"/>';
}
function updatePlayer(dt, inp) {
  const p = P;
  if (p.inv > 0) p.inv -= dt;
  if (p.crash > 0) {
    p.crash -= dt; p.spin += p.spinV * dt; p.spinV *= Math.exp(-2 * dt);
    p.x += p.cvx * dt; p.z += p.cvz * dt; const f = Math.exp(-2.6 * dt); p.cvx *= f; p.cvz *= f;
    p.vx = p.cvx; p.vz = p.cvz; p.y = H(p.x, p.z); p.skidI = 0;
    if (p.crash <= 0) { const [gx, gz] = grad(p.x, p.z); p.h = Math.hypot(gx, gz) > 0.02 ? Math.atan2(-gx, gz) : p.h; p.crash = 0; p.spin = 0; p.s = 2; p.inv = 1.2; }
    return;
  }
  const [gx, gz] = grad(p.x, p.z), gm = Math.hypot(gx, gz);
  p.snow = snowType(p.x, p.z, gm); const S = SNOW[p.snow];
  if (p.foot) { walkPlayer(dt, inp, gx, gz); return; }
  const steer = inp.steer;
  if (Math.abs(steer) > 0.05) { const sg = Math.sign(steer); if (sg !== p.lastSign) { p.hold = 0; p.lastSign = sg; } p.hold += dt; } else { p.hold = 0; p.lastSign = 0; }
  const sharp = 0.5 + 0.5 * Math.min(1, p.hold / 0.45);
  const brake = inp.brake, tuck = inp.tuck && !brake;
  if (brake && !p.wasBrake) p.brakeSide = p.w >= 0 ? 1 : -1;
  p.wasBrake = brake;
  p.tuck = lerp(p.tuck, tuck ? 1 : 0, 1 - Math.exp(-10 * dt));
  p.brakeA = lerp(p.brakeA, brake ? 1 : 0, 1 - Math.exp(-12 * dt));
  const turnMax = 2.4 * S.turn * (1 - 0.5 * p.tuck);
  const resp = 6.5 * S.resp * (1 - 0.35 * p.tuck);
  p.w += (steer * turnMax * sharp - p.w) * (1 - Math.exp(-resp * dt));
  if (S.jostle && p.s > 4) { p.jt -= dt; if (p.jt <= 0) { p.jt = 0.12 + Math.random() * 0.16; p.w += (Math.random() * 2 - 1) * (0.5 + p.s / 25); p.bump = 1; } }
  p.bump *= Math.exp(-8 * dt);
  const dTh = p.w * dt; p.h = wrapA(p.h + dTh);
  let skid = 0;
  if (Math.abs(dTh) > 1e-6 && p.s > 0.5) {
    const need = p.s * Math.abs(dTh) / dt;
    skid = need > S.grip ? 1 - S.grip / need : 0;
    p.s *= Math.max(0, 1 - (0.1 + skid * 0.9) * Math.abs(dTh));
    p.lat += -Math.sign(dTh) * p.s * Math.abs(dTh) * skid * 0.7;
  }
  const dx = Math.sin(p.h), dz = -Math.cos(p.h), nx = Math.cos(p.h), nz = Math.sin(p.h);
  const gd = gx * dx + gz * dz, gn = gx * nx + gz * nz;
  const air = p.air;
  if (!air) p.s += -9.8 * gd / Math.sqrt(1 + gd * gd) * dt;
  const lg = -9.8 * gn / Math.sqrt(1 + gn * gn);
  if (!air && Math.abs(lg) > S.hold) p.lat += Math.sign(lg) * (Math.abs(lg) - S.hold) * dt;
  let scrub = 0;
  if (gm > 0.03 && !air) { const ca = clamp(-gd / gm, -1, 1), sa2 = 1 - ca * ca; scrub = 7 * sa2 * sa2 * clamp(gm / 0.2, 0, 1); }
  const drag = 0.0032 - 0.0016 * p.tuck;
  let dec = (air ? 0 : S.fric * (p.wax > 0 ? 0.45 : 1)) + drag * (p.wax > 0 ? 0.8 : 1) * p.s * p.s + scrub;
  if (brake && !air) dec += 9 * p.brakeA;
  p.push = inp.push && !brake && !air && p.s < 18; // skate and pole hard: up to about 65 km/h on flat ground
  if (p.push) { p.s += (p.s < 6 ? 9 : 6) * dt; p.pushT += dt; }
  p.s = clamp(p.s - dec * dt, 0, p.wax > 0 ? 66 : 60);
  p.lat *= Math.exp(-(S.latFric + (brake ? 4 : 0)) * dt);
  p.vx = p.s * dx + p.lat * nx; p.vz = p.s * dz + p.lat * nz;
  const ox = p.x, oz = p.z;
  p.x += p.vx * dt; p.z += p.vz * dt;
  if (p.x < WORLD.x0 + 25 || p.x > WORLD.x1 - 25 || p.z < WORLD.z0 + 25 || p.z > WORLD.z1 - 45) { p.x = clamp(p.x, WORLD.x0 + 25, WORLD.x1 - 25); p.z = clamp(p.z, WORLD.z0 + 25, WORLD.z1 - 45); p.s *= 0.5; }
  // collisions
  const gyNow = H(p.x, p.z);
  const hit = p.air && p.y - gyNow > 2.2 ? null : nearObs(p.x, p.z, o => { const ddx = p.x - o.x, ddz = p.z - o.z; return ddx * ddx + ddz * ddz < (o.r + 0.45) * (o.r + 0.45); });
  if (hit) {
    if (p.s > 7 && p.inv <= 0) crashPlayer();
    else { const ddx = p.x - hit.x, ddz = p.z - hit.z, d = Math.hypot(ddx, ddz) || 1; p.x = hit.x + ddx / d * (hit.r + 0.46); p.z = hit.z + ddz / d * (hit.r + 0.46); p.s *= 0.4; }
  }
  for (const n of npcs) { const ddx = p.x - n.x, ddz = p.z - n.z, d = Math.hypot(ddx, ddz); if (d < 0.9 && d > 0) { p.x = n.x + ddx / d * 0.9; p.z = n.z + ddz / d * 0.9; p.s *= 0.5; } }
  if (p.crash > 0) return;
  if (groundStep(p, dt, H(p.x, p.z), 7 + Math.min(4, p.s * 0.08))) { p.skidI = 0; trailBreak = true; return; }
  p.skidI = clamp(skid * 1.2 + Math.abs(p.lat) / 6 + (brake && p.s > 2 ? p.brakeA : 0), 0, 1);
  // spray
  const deep = p.snow === 'powder' || p.snow === 'deep';
  p.sprayAcc += (p.skidI * p.s / 9 + (deep ? p.s / (p.snow === 'deep' ? 9 : 18) : 0) + Math.abs(p.w) * p.s / 60) * dt * 40;
  while (p.sprayAcc >= 1) {
    p.sprayAcc -= 1;
    const out = brake ? p.brakeSide : -Math.sign(p.w || p.lat || 1), sp = 2 + Math.random() * 4 * (0.4 + p.skidI);
    emit(p.x - dx * 0.7 + nx * out * 0.2, p.y + 0.1, p.z - dz * 0.7 + nz * out * 0.2,
      nx * out * sp + p.vx * 0.35 + (Math.random() - .5), 1.2 + Math.random() * 2.8, nz * out * sp + p.vz * 0.35 + (Math.random() - .5), 0.5 + Math.random() * 0.4, 0.25 + Math.random() * 0.35);
  }
  trailPush(p, nx, nz);
}

/* ================= camera ================= */
const CAM = { mode: 'third', yaw: 0, pos: new THREE.Vector3(), look: new THREE.Vector3(), roll: 0 };
let camShake = 0;
function updateCamera(dt, snap) {
  const p = P, sp = Math.hypot(p.vx, p.vz);
  if (p.crash <= 0) CAM.yaw += wrapA(p.h - CAM.yaw) * (1 - Math.exp(-(snap ? 99 : 5) * dt));
  const dx = Math.sin(CAM.yaw), dz = -Math.cos(CAM.yaw);
  const tp = new THREE.Vector3(), tl = new THREE.Vector3();
  if (CAM.mode === 'third') {
    const dist = P.foot ? 4.8 : 6.2 + sp * 0.08, hgt = P.foot ? 2.1 : 2.5 + sp * 0.035;
    tp.set(p.x - dx * dist, 0, p.z - dz * dist); tp.y = Math.max(p.y + hgt, H(tp.x, tp.z) + 1.6, H(p.x + dx * 5, p.z + dz * 5) + 1.0);
    tl.set(p.x + dx * 5, Math.max(p.y + 1.1, H(p.x + dx * 5, p.z + dz * 5) + 1.3), p.z + dz * 5);
    CAM.pos.lerp(tp, snap ? 1 : 1 - Math.exp(-9 * dt)); CAM.look.lerp(tl, snap ? 1 : 1 - Math.exp(-12 * dt));
    CAM.roll += (0 - CAM.roll) * (1 - Math.exp(-6 * dt));
  } else {
    const eye = 1.62 - 0.5 * p.tuck;
    tp.set(p.x + dx * 0.15, p.y + eye, p.z + dz * 0.15);
    tl.set(p.x + dx * 12, H(p.x + dx * 12, p.z + dz * 12) + 1.2, p.z + dz * 12);
    CAM.pos.copy(tp); CAM.look.lerp(tl, snap ? 1 : 1 - Math.exp(-14 * dt));
    CAM.roll += (clamp(p.w * p.s / 40, -0.3, 0.3) - CAM.roll) * (1 - Math.exp(-6 * dt));
  }
  camera.position.copy(CAM.pos);
  if (p.crash > 0 && CAM.mode === 'first') camera.position.y -= 0.9;
  if (camShake > 0) { const a = camShake * 0.35; camera.position.x += (Math.random() - .5) * a; camera.position.y += (Math.random() - .5) * a; camShake = Math.max(0, camShake - dt * 1.6); }
  camera.lookAt(CAM.look);
  if (CAM.mode === 'first') camera.rotateZ(-CAM.roll + (p.crash > 0 ? Math.sin(p.spin) * 0.6 : 0));
}
function posePlayer(dt) {
  const m = playerModel, u = m.userData, p = P;
  const sink = p.air || p.foot ? 0 : ({ powder: 0.12, deep: 0.2, sand: 0.08, ash: 0.06 }[p.snow] || 0);
  m.position.set(p.x, p.y - sink, p.z);
  m.rotation.y = -p.h;
  const lean = p.crash > 0 ? 0 : clamp(p.w * p.s / 30, -0.55, 0.55);
  u.tilt.rotation.z = -lean;
  const [gx, gz] = grad(p.x, p.z), dx = Math.sin(p.h), dz = -Math.cos(p.h);
  u.skis.rotation.x = p.air ? clamp(Math.atan2(p.vy, Math.max(4, p.s)) * 0.6, -0.5, 0.4) : Math.atan(gx * dx + gz * dz);
  u.skis.rotation.y = p.brakeA * p.brakeSide * 0.9;
  u.skis.visible = !p.foot; u.poles.forEach(pl => pl.visible = !p.foot);
  const stride = p.foot ? Math.sin(p.walkPh) * clamp(Math.abs(p.s) / 3, 0, 1) : 0;
  u.legs[0].rotation.x = stride * 0.55; u.legs[1].rotation.x = -stride * 0.55;
  u.upper.position.y = 0.98 - 0.32 * p.tuck + (p.foot ? Math.abs(stride) * 0.04 : 0); u.upper.rotation.x = p.foot ? -0.05 : -0.55 * p.tuck - 0.12;
  u.lower.scale.y = 1 - 0.3 * p.tuck;
  const pa = p.push ? Math.sin(p.pushT * 7) * 0.6 : 0;
  if (p.air) { u.armL.rotation.x = -1.1; u.armR.rotation.x = -1.1; u.upper.position.y = 0.86; u.lower.scale.y = 0.8; } else if (p.foot) { u.armL.rotation.x = -stride * 0.5 - 0.05; u.armR.rotation.x = stride * 0.5 - 0.05; } else { u.armL.rotation.x = -0.45 - 0.5 * p.tuck + pa; u.armR.rotation.x = -0.45 - 0.5 * p.tuck + pa; }
  u.tail.rotation.x = 0.4 + Math.min(1.1, p.s / 18) + Math.sin(gameT * 14) * 0.08 * Math.min(1, p.s / 10);
  if (p.crash > 0) { u.tilt.rotation.z = Math.sin(p.spin) * 1.2; u.tilt.rotation.x = Math.cos(p.spin * 0.7) * 0.8; m.position.y += Math.abs(Math.sin(p.spin)) * 0.3; }
  else u.tilt.rotation.x = 0;
  m.visible = CAM.mode === 'third' && !(p.inv > 0 && Math.floor(p.inv * 10) % 2);
}
