/* Frostpeak Frontier: sky.js
   Sky dome, sun and ambient light, clouds, distant mountain ranges.
   Loaded as a plain script; files share one global scope and load in the order listed in index.html. */
'use strict';

/* ================= sky, light, distant peaks ================= */
const skyU = { aur: { value: 0 }, time: { value: 0 }, top: { value: C('#5f9fe0') }, mid: { value: C('#9cc2ec') }, hor: { value: C('#e9eef8') }, sunDir: { value: new THREE.Vector3(0.3, 0.5, 0.8).normalize() }, sunCol: { value: C('#fff3dc') } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(15000, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
  fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 hor; uniform vec3 sunDir; uniform vec3 sunCol; uniform float aur; uniform float time; varying vec3 vW;
    void main(){ vec3 d = normalize(vW - cameraPosition); float y = d.y;
      vec3 c = mix(hor, mid, smoothstep(0.0, 0.12, y)); c = mix(c, top, smoothstep(0.12, 0.6, y));
      if (y < 0.0) c = mix(hor, hor * 0.92, smoothstep(0.0, -0.3, y));
      float s = max(dot(d, sunDir), 0.0);
      c += sunCol * (pow(s, 900.0) * 0.9 + pow(s, 40.0) * 0.16 + pow(s, 5.0) * 0.07);
      c += (sin(d.x * 23.0 + d.z * 17.0 + y * 40.0) * 0.5 + 0.5) * 0.012;
      if (aur > 0.01) { // night over Aurora Peak: stars and moving curtains of light
        vec3 q = floor(d * 340.0); float hs = fract(sin(dot(q, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        c += aur * step(0.9982, hs) * smoothstep(0.02, 0.25, y) * (0.6 + 0.4 * sin(time * 3.0 + hs * 60.0));
        float az = atan(d.z, d.x);
        float band = pow(0.5 + 0.5 * sin(az * 5.0 + time * 0.07 + sin(az * 11.0 + time * 0.13) * 1.6), 3.0);
        float curtain = band * smoothstep(0.06, 0.2, y) * smoothstep(0.78, 0.3, y) * (0.55 + 0.45 * sin(y * 40.0 + az * 20.0 + time * 0.5));
        vec3 ac = mix(vec3(0.25, 1.0, 0.62), vec3(0.62, 0.38, 1.0), smoothstep(0.2, 0.55, y));
        c += aur * curtain * ac * 1.1;
      }
      gl_FragColor = vec4(c, 1.0); }`
}));
sky.renderOrder = -1; scene.add(sky);

const hemi = new THREE.HemisphereLight(0xc6d6ff, 0xe8d6c8, 0.42); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d6, 1.15);
sun.castShadow = true;
sun.shadow.mapSize.set(LOW ? 1024 : 1536, LOW ? 1024 : 1536);
Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 600 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
scene.add(sun); scene.add(sun.target);
const amb = new THREE.AmbientLight(0xb8c4e8, 0.08); scene.add(amb);

// painted clouds
const cloudTex = new THREE.CanvasTexture(mkCanvas(256, 128, (g) => {
  const r = mulberry32(3);
  for (let i = 0; i < 26; i++) {
    const x = 30 + r() * 196, y = 62 + r() * 26 - Math.abs(x - 128) * 0.1, rad = 14 + r() * 24;
    const gr = g.createRadialGradient(x - rad * .25, y - rad * .35, rad * .1, x, y, rad);
    gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.6, 'rgba(240,236,252,0.75)'); gr.addColorStop(1, 'rgba(220,214,245,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
  }
}));
const clouds = [];
{
  const r = mulberry32(21);
  for (let i = 0; i < 16; i++) {
    const m = new THREE.SpriteMaterial({ map: cloudTex, fog: false, depthWrite: false, transparent: true, opacity: 0.85, toneMapped: false });
    const s = new THREE.Sprite(m); const sc = 2200 + r() * 2400; s.scale.set(sc, sc * 0.38, 1);
    s.userData = { a: r() * TAU, d: 9500 + r() * 1500, y: 1700 + r() * 1400, sp: (0.004 + r() * 0.006) * (r() < .5 ? 1 : -1) };
    scene.add(s); clouds.push(s);
  }
}
// distant painted mountain ranges: two continuous rings around the world
const peakMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide, transparent: true, toneMapped: false });
function ridge(th, seed) {
  let h = 0, a = 1, f = 2;
  for (let o = 0; o < 5; o++) { h += a * Math.abs(Math.sin(th * f + seed * (o + 1) * 1.7 + Math.sin(th * f * 0.5 + seed) * 1.3)); a *= 0.5; f *= 2.3; }
  return h / 1.9;
}
function rangeRing(R0, hBase, hVar, seed, cols) {
  const N = 360, M = 7, pos = [], col = [], idx = [], c = new THREE.Color();
  for (let i = 0; i <= N; i++) {
    const th = i / N * TAU, sw = 0, pk = hBase + hVar * ridge(th, seed);
    for (let j = 0; j <= M; j++) {
      const f = j / M, rr = R0 - f * 1400 * (0.6 + 0.4 * ridge(th * 3, seed + 2));
      const y = -300 + (pk + 300) * Math.pow(f, 0.85);
      pos.push(Math.sin(th) * rr, y, -930 + Math.cos(th) * rr);
      const snowLine = 0.5 + 0.16 * vnoise(th * 18, seed);
      const lit = 0.5 + 0.5 * Math.sin(th * 7 + seed + Math.sin(th * 23) * 0.6);
      const sn = sstep(snowLine - 0.06, snowLine + 0.06, f);
      c.set(cols[3]).lerp(C(cols[2]), lit); const cs = C(cols[1]).lerp(C(cols[0]), lit); c.lerp(cs, sn);
      c.lerp(C('#c9d3e8'), (1 - sstep(0, 0.45, f)) * 0.75);
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
  const m = new THREE.Mesh(g, peakMat); scene.add(m); return m;
}
rangeRing(9600, 1500, 2600, 4.1, ['#e9e8f6', '#c9cbe8', '#a9b2d6', '#97a2cc']);
rangeRing(7800, 1000, 1900, 1.3, ['#fbfaff', '#d6d8ef', '#8796c2', '#74839f']);
