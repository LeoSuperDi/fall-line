/* Frostpeak Frontier: effects.js
   Snow spray, falling snow, sparkles, ski grooves, chimney smoke and steam.
   Loaded as a plain script; files share one global scope and load in the order listed in index.html. */
'use strict';

/* ================= effects: spray, snowfall, trails, smoke ================= */
const SPN = 500, spPos = new Float32Array(SPN * 3), spA = new Float32Array(SPN), spS = new Float32Array(SPN), spV = new Float32Array(SPN * 3), spL = new Float32Array(SPN), spML = new Float32Array(SPN);
let spIdx = 0;
const spGeo = new THREE.BufferGeometry();
spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3)); spGeo.setAttribute('alpha', new THREE.BufferAttribute(spA, 1)); spGeo.setAttribute('size', new THREE.BufferAttribute(spS, 1));
const spMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { col: { value: C('#ffffff') }, scale: { value: 600 } },
  vertexShader: 'attribute float alpha; attribute float size; varying float vA; uniform float scale; void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * scale / max(0.1, -mv.z); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform vec3 col; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.15, d) * vA; if (a < 0.01) discard; gl_FragColor = vec4(mix(vec3(0.75,0.82,0.95), col, smoothstep(0.5,0.1,d)), a); }' });
const spray = new THREE.Points(spGeo, spMat); spray.frustumCulled = false; scene.add(spray);
function emit(x, y, z, vx, vy, vz, life, size) { const i = spIdx; spIdx = (spIdx + 1) % SPN; spPos[i * 3] = x; spPos[i * 3 + 1] = y; spPos[i * 3 + 2] = z; spV[i * 3] = vx; spV[i * 3 + 1] = vy; spV[i * 3 + 2] = vz; spL[i] = life; spML[i] = life; spS[i] = size; }
function emitBurst(x, y, z, n) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 1 + Math.random() * 5; emit(x, y, z, Math.cos(a) * v, 1 + Math.random() * 4, Math.sin(a) * v, 0.6 + Math.random() * 0.6, 0.4 + Math.random() * 0.5); } }
function updateSpray(dt) {
  for (let i = 0; i < SPN; i++) {
    if (spL[i] <= 0) { spA[i] = 0; continue; }
    spL[i] -= dt; spV[i * 3 + 1] -= 9 * dt; const f = Math.exp(-2.2 * dt); spV[i * 3] *= f; spV[i * 3 + 2] *= f;
    spPos[i * 3] += spV[i * 3] * dt; spPos[i * 3 + 1] += spV[i * 3 + 1] * dt; spPos[i * 3 + 2] += spV[i * 3 + 2] * dt;
    spA[i] = clamp(spL[i] / spML[i] * 1.5, 0, 0.95);
  }
  spGeo.attributes.position.needsUpdate = true; spGeo.attributes.alpha.needsUpdate = true; spGeo.attributes.size.needsUpdate = true;
  spMat.uniforms.scale.value = window.innerHeight * renderer.getPixelRatio() * 0.5;
}
// sparkles: glints scattered on the snow near the camera, twinkling with view angle and time
const SKN = LOW ? 500 : 1100, skPos = new Float32Array(SKN * 3), skPh = new Float32Array(SKN), skR = 46;
const skGeo = new THREE.BufferGeometry(); skGeo.setAttribute('position', new THREE.BufferAttribute(skPos, 3)); skGeo.setAttribute('ph', new THREE.BufferAttribute(skPh, 1));
const skMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  uniforms: { t: { value: 0 }, k: { value: 1 }, scale: { value: 600 } },
  vertexShader: 'attribute float ph; uniform float t; uniform float scale; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); float d = -mv.z; float tw = pow(max(0.0, sin(t * 2.3 + ph * 6.283 + (position.x + position.z) * 0.7)), 18.0); vA = tw * smoothstep(42.0, 10.0, d) * smoothstep(2.5, 6.0, d); gl_PointSize = (2.0 + 5.0 * tw) * scale / 720.0 * clamp(14.0 / d, 0.5, 1.4); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform float k; varying float vA; void main(){ vec2 q = gl_PointCoord - 0.5; float a = max(0.0, 1.0 - (abs(q.x) + abs(q.y)) * 2.2) + smoothstep(0.5, 0.0, length(q)) * 0.4; gl_FragColor = vec4(vec3(1.0, 0.98, 0.92), a * vA * k); }' });
const sparkles = new THREE.Points(skGeo, skMat); sparkles.frustumCulled = false; scene.add(sparkles);
for (let i = 0; i < SKN; i++) { skPh[i] = Math.random(); skPos[i * 3 + 1] = -999; }
let skCx = 1e9, skCz = 1e9;
function updateSparkles(dt, storm) {
  const cx = camera.position.x, cz = camera.position.z;
  skMat.uniforms.t.value += dt + Math.hypot(cx - skCx, cz - skCz) * 0.02 * (skCx < 1e8 ? 1 : 0);
  skMat.uniforms.k.value = clamp(sun.intensity * 1.1, 0, 1) * (1 - storm);
  skMat.uniforms.scale.value = window.innerHeight * renderer.getPixelRatio();
  skCx = cx; skCz = cz;
  for (let n = 0; n < 60; n++) { // keep a few re-seeded each frame so the field follows you
    const i = (Math.random() * SKN) | 0, x = skPos[i * 3], z = skPos[i * 3 + 2];
    if (skPos[i * 3 + 1] < -900 || Math.hypot(x - cx, z - cz) > skR) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * skR, nx = cx + Math.cos(a) * r, nz = cz + Math.sin(a) * r;
      skPos[i * 3] = nx; skPos[i * 3 + 1] = H(nx, nz) + 0.04; skPos[i * 3 + 2] = nz; }
  }
  skGeo.attributes.position.needsUpdate = true;
}
// falling snow
const SFN = LOW ? 500 : 1000, sfPos = new Float32Array(SFN * 3), sfBox = 70;
for (let i = 0; i < SFN; i++) { sfPos[i * 3] = (Math.random() - .5) * sfBox; sfPos[i * 3 + 1] = Math.random() * 40; sfPos[i * 3 + 2] = (Math.random() - .5) * sfBox; }
const sfGeo = new THREE.BufferGeometry(); sfGeo.setAttribute('position', new THREE.BufferAttribute(sfPos, 3));
const flakeTex = new THREE.CanvasTexture(mkCanvas(32, 32, g => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }));
const sfMat = new THREE.PointsMaterial({ size: 0.16, map: flakeTex, transparent: true, depthWrite: false, opacity: 0.4 });
const snowfall = new THREE.Points(sfGeo, sfMat); snowfall.frustumCulled = false; scene.add(snowfall);
let windX = 0.6;
function updateSnowfall(dt, storm) {
  const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z, fall = 1.4 + storm * 2.5, wx = windX * (1 + storm * 6);
  for (let i = 0; i < SFN; i++) {
    let x = sfPos[i * 3] + wx * dt + Math.sin(gameT + i) * 0.2 * dt, y = sfPos[i * 3 + 1] - fall * dt, z = sfPos[i * 3 + 2] + wx * 0.4 * dt;
    if (y < cy - 15) y += 40;
    x = cx + ((x - cx + sfBox * 1.5) % sfBox + sfBox) % sfBox - sfBox / 2;
    z = cz + ((z - cz + sfBox * 1.5) % sfBox + sfBox) % sfBox - sfBox / 2;
    if (y > cy + 25) y -= 40;
    sfPos[i * 3] = x; sfPos[i * 3 + 1] = y; sfPos[i * 3 + 2] = z;
  }
  sfGeo.attributes.position.needsUpdate = true;
  sfMat.opacity = 0.35 + storm * 0.6; sfMat.size = 0.14 + storm * 0.1;
}
// ski tracks: each ski cuts a real groove, with the snow pushed up into little berms either side
const TRN = 360, NV = 7, trX = new Float32Array(TRN * 2), trZ = new Float32Array(TRN * 2), trY = new Float32Array(TRN * 2), trBrk = new Uint8Array(TRN), trWArr = new Float32Array(TRN), trDeep = new Float32Array(TRN), trCol = new Float32Array(TRN * 3);
let trCount = 0, trailBreak = true, trDist = 0, lastTrail = { x: 0, z: 0 }, trW = 0.06;
// across one track: snow surface, a thin lip of pushed-up snow, the shadowed inner wall, the pressed floor, and back out.
// The mesh sits almost flat on the snow (it can't go below the ground), so the dent is told by light and shadow, not height.
const XS = [-1.7, -1.2, -0.65, 0, 0.65, 1.2, 1.7], XH = [0.01, 0.05, 0.02, 0.012, 0.02, 0.05, 0.01], XC = ['foot', 'lip', 'wall', 'floor', 'wall', 'lip', 'foot'];
const trGeo = new THREE.BufferGeometry(), trPosA = new Float32Array(TRN * 2 * NV * 3), trColA = new Float32Array(TRN * 2 * NV * 3);
trGeo.setAttribute('position', new THREE.BufferAttribute(trPosA, 3)); trGeo.setAttribute('color', new THREE.BufferAttribute(trColA, 3));
trGeo.setIndex(new THREE.BufferAttribute(new Uint32Array(TRN * 2 * (NV - 1) * 6), 1));
const trail = new THREE.Mesh(trGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -6 }) /* the strip faces down for some directions of travel, so draw both sides */);
trail.frustumCulled = false; trail.renderOrder = 1; scene.add(trail);
const TRAIL_FADE = C('#dfe6f1'), TR_BERM = C('#fbfcfe'), TR_FOOT = C('#e1e7f1'), TR_WALL = C('#a3b2d2'), TRAIL_COL = { groomed: C('#8597c2'), powder: C('#6f84ba'), deep: C('#6478b2'), ice: C('#c4d6ea'), blueice: C('#9cc6e4'), sand: C('#b07a45'), ash: C('#5b575c') };
function trailPush(p, nx, nz) {
  trDist += Math.hypot(p.x - lastTrail.x, p.z - lastTrail.z); lastTrail.x = p.x; lastTrail.z = p.z;
  if (trDist < 0.7 && !trailBreak) return; trDist = 0;
  if (p.s < 0.5 && !trailBreak) return;
  if (trCount === TRN) { trX.copyWithin(0, 2); trZ.copyWithin(0, 2); trY.copyWithin(0, 2); trBrk.copyWithin(0, 1); trWArr.copyWithin(0, 1); trDeep.copyWithin(0, 1); trCol.copyWithin(0, 3); trCount--; }
  const i = trCount++, off = 0.14 + p.brakeA * 0.1;
  for (let k = 0; k < 2; k++) { const sd = k ? 1 : -1, x = p.x + nx * off * sd, z = p.z + nz * off * sd; trX[i * 2 + k] = x; trZ[i * 2 + k] = z; trY[i * 2 + k] = meshH(x, z) + mogulH(x, z) + 0.04; }
  trBrk[i] = trailBreak ? 1 : 0; trailBreak = false;
  const c = TRAIL_COL[p.snow] || TRAIL_COL.powder; trCol[i * 3] = c.r; trCol[i * 3 + 1] = c.g; trCol[i * 3 + 2] = c.b;
  trWArr[i] = (p.snow === 'powder' || p.snow === 'deep' || p.snow === 'sand' ? 0.2 : 0.11) + p.brakeA * 0.1 + p.skidI * 0.06; // wide enough to read from the camera; powder takes a bigger bite
  trDeep[i] = { powder: 1.6, deep: 2.1, sand: 1.2, ash: 1.1, thin: 0.6, ice: 0.25, blueice: 0.25, groomed: 0.45, windpack: 0.7 }[p.snow] || 1;
  rebuildTrail();
}
function rebuildTrail() {
  const idx = trGeo.index.array; let ii = 0;
  for (let i = 0; i < trCount; i++) {
    const fade = clamp((trCount - 1 - i) / TRN * 1.3, 0, 1), dp = trDeep[i], w = trWArr[i] * (0.8 + dp * 0.35);
    for (let k = 0; k < 2; k++) {
      const j = i * 2 + k, pj = Math.max(0, i - 1) * 2 + k, qj = Math.min(trCount - 1, i + 1) * 2 + k;
      let tx = trX[qj] - trX[pj], tz = trZ[qj] - trZ[pj]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      for (let q = 0; q < NV; q++) {
        const v = ((i * 2 + k) * NV + q) * 3, o = XS[q] * w;
        trPosA[v] = trX[j] - tz * o; trPosA[v + 1] = trY[j] + XH[q] * dp * (1 - fade * 0.7); trPosA[v + 2] = trZ[j] + tx * o;
        const kc = XC[q], src = kc === 'lip' ? TR_BERM : kc === 'foot' ? TR_FOOT : kc === 'wall' ? TR_WALL : null;
        const cr = src ? src.r : trCol[i * 3], cg = src ? src.g : trCol[i * 3 + 1], cb = src ? src.b : trCol[i * 3 + 2];
        trColA[v] = lerp(cr, TRAIL_FADE.r, fade); trColA[v + 1] = lerp(cg, TRAIL_FADE.g, fade); trColA[v + 2] = lerp(cb, TRAIL_FADE.b, fade);
      }
      if (i > 0 && !trBrk[i]) for (let q = 0; q < NV - 1; q++) { const a = ((i - 1) * 2 + k) * NV + q, b = (i * 2 + k) * NV + q; idx[ii++] = a; idx[ii++] = b; idx[ii++] = a + 1; idx[ii++] = a + 1; idx[ii++] = b; idx[ii++] = b + 1; }
    }
  }
  trGeo.setDrawRange(0, ii);
  trGeo.index.needsUpdate = true; trGeo.attributes.position.needsUpdate = true; trGeo.attributes.color.needsUpdate = true;
}
// chimney smoke + spring steam
const puffTex = new THREE.CanvasTexture(mkCanvas(64, 64, g => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }));
const puffs = [];
function updateSmoke(dt) {
  for (const s of smokes) {
    s.t = (s.t || Math.random()) - dt;
    if (s.t <= 0 && Math.hypot(s.x - P.x, s.z - P.z) < 400) {
      s.t = s.steam ? 0.35 : 0.5;
      const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, opacity: 0.7, color: s.steam ? 0xffffff : 0xdde0ea }));
      m.position.set(s.x + (Math.random() - .5) * 0.6, s.y, s.z + (Math.random() - .5) * 0.6); m.userData = { life: 3, v: s.steam ? 0.9 : 1.4 }; m.scale.setScalar(1.2); scene.add(m); puffs.push(m);
    }
  }
  for (let i = puffs.length - 1; i >= 0; i--) {
    const m = puffs[i], u = m.userData; u.life -= dt;
    m.position.y += u.v * dt; m.position.x += windX * 0.6 * dt; m.scale.setScalar(m.scale.x + dt * 1.2); m.material.opacity = clamp(u.life / 3, 0, 1) * 0.6;
    if (u.life <= 0) { scene.remove(m); m.material.dispose(); puffs.splice(i, 1); }
  }
}
