/* Frostpeak Frontier: scene.js
   Renderer, scene, camera, toon materials and painted textures.
   Loaded as a plain script; files share one global scope and load in the order listed in index.html. */
'use strict';

/* ================= renderer / scene ================= */
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW, powerPreference: 'high-performance' });
const MAX_PR = Math.min(window.devicePixelRatio || 1, LOW ? 1 : 1.5); let curPR = MAX_PR;
renderer.setPixelRatio(curPR);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xdfe7f2, 60, 700);
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 22000);
function resize() { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < h ? 72 : 60; camera.updateProjectionMatrix(); }
window.addEventListener('resize', resize);

const gradMap = (() => { const v = [80, 122, 164, 204, 238], d = new Uint8Array(v.length * 4); v.forEach((x, i) => { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = x; d[i * 4 + 3] = 255; }); const t = new THREE.DataTexture(d, v.length, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
const MC = {};
function toon(c, extra) { const k = c + (extra ? JSON.stringify(extra) : ''); return MC[k] || (MC[k] = new THREE.MeshToonMaterial(Object.assign({ color: c, gradientMap: gradMap }, extra || {}))); }
const toonV = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradMap });
const C = (c) => new THREE.Color(c);
function mkCanvas(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return c; }

/* painterly snow texture: soft mottling, wind ripples, brush strokes and sparkle */
const paintTex = new THREE.CanvasTexture(mkCanvas(512, 512, (g) => {
  const S = 512, r = mulberry32(5);
  g.fillStyle = '#f2f5fa'; g.fillRect(0, 0, S, S);
  const wrapDraw = (fn) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.save(); g.translate(ox, oy); fn(); g.restore(); } };
  for (let i = 0; i < 70; i++) { // big soft cool/warm blotches
    const x = r() * S, y = r() * S, rad = 30 + r() * 70, cool = r() < 0.6;
    wrapDraw(() => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, cool ? 'rgba(160,178,222,0.10)' : 'rgba(236,222,236,0.10)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); });
  }
  g.lineCap = 'round';
  for (let i = 0; i < 190; i++) { // wind ripples: long gentle arcs, mostly one direction
    const x = r() * S, y = r() * S, len = 50 + r() * 110, a = -0.25 + (r() - 0.5) * 0.5, bend = (r() - 0.5) * 18;
    wrapDraw(() => {
      g.strokeStyle = `rgba(120,142,200,${0.13 + r() * 0.1})`; g.lineWidth = 2 + r() * 3;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * len / 2 - Math.sin(a) * bend, y + Math.sin(a) * len / 2 + Math.cos(a) * bend, x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y - 2.5); g.quadraticCurveTo(x + Math.cos(a) * len / 2 - Math.sin(a) * bend, y - 2.5 + Math.sin(a) * len / 2 + Math.cos(a) * bend, x + Math.cos(a) * len, y - 2.5 + Math.sin(a) * len); g.stroke();
    });
  }
  for (let i = 0; i < 520; i++) { // short painterly dabs
    const x = r() * S, y = r() * S, len = 6 + r() * 20, a = r() * Math.PI;
    g.strokeStyle = r() < .5 ? `rgba(150,168,215,${0.07 + r() * 0.1})` : `rgba(205,190,230,${0.06 + r() * 0.08})`;
    g.lineWidth = 2 + r() * 4;
    wrapDraw(() => { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke(); });
  }
  for (let i = 0; i < 420; i++) { const x = r() * S, y = r() * S, b = r(); g.fillStyle = b < 0.15 ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,.6)'; g.fillRect(x, y, b < 0.15 ? 2 : 1.2, b < 0.15 ? 2 : 1.2); }
}));
paintTex.wrapS = paintTex.wrapT = THREE.RepeatWrapping;
paintTex.anisotropy = 8;
