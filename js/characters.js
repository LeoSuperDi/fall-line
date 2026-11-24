/* Frostpeak Frontier: characters.js
   People and animal models.
   Loaded as a plain script; files share one global scope and load in the order listed in index.html. */
'use strict';

/* ================= people ================= */
function mesh(geo, c, x, y, z, par) { const m = new THREE.Mesh(geo, toon(c)); m.position.set(x, y, z); m.castShadow = true; par.add(m); return m; }
function makePerson(o) {
  const root = new THREE.Group(), tilt = new THREE.Group(), skis = new THREE.Group(), lower = new THREE.Group(), upper = new THREE.Group();
  root.add(tilt); tilt.add(skis); tilt.add(lower); tilt.add(upper);
  const sk = o.ski || '#ffd21f';
  const legs = [];
  for (const sx of [-0.14, 0.14]) {
    mesh(new THREE.BoxGeometry(0.11, 0.04, 1.7), sk, sx, 0.03, 0, skis);
    const tip = mesh(new THREE.BoxGeometry(0.11, 0.04, 0.22), sk, sx, 0.08, -0.92, skis); tip.rotation.x = 0.55;
    const leg = new THREE.Group(); leg.position.set(sx, 1.0, 0); lower.add(leg); legs.push(leg);
    mesh(new THREE.BoxGeometry(0.17, 0.2, 0.3), '#2b3142', 0, -0.85, 0.02, leg);
    mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.78, 7), o.pants || '#2f3a55', 0, -0.38, 0, leg);
  }
  upper.position.y = 0.98;
  mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.62, 10), o.jacket, 0, 0.28, 0, upper);
  mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.08, 10), '#ffffff', 0, 0.12, 0, upper);
  mesh(new THREE.BoxGeometry(0.32, 0.38, 0.16), o.pack || '#5a6b8f', 0, 0.36, 0.23, upper);
  const armL = new THREE.Group(), armR = new THREE.Group();
  for (const [g, sx] of [[armL, -1], [armR, 1]]) {
    g.position.set(sx * 0.25, 0.54, 0); g.rotation.x = -0.45; g.rotation.z = sx * 0.25; upper.add(g);
    mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.5, 6), o.jacket, 0, -0.25, 0, g);
    mesh(new THREE.SphereGeometry(0.075, 8, 6), '#2b3142', 0, -0.52, 0, g);
    const pole = mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.15, 4), '#3a4256', 0, -0.95, 0.18, g); pole.rotation.x = 0.4;
  }
  mesh(new THREE.TorusGeometry(0.13, 0.055, 6, 12), o.scarf || '#e23a5a', 0, 0.64, 0, upper).rotation.x = Math.PI / 2;
  const tail = mesh(new THREE.BoxGeometry(0.09, 0.3, 0.04), o.scarf || '#e23a5a', 0.06, 0.52, 0.16, upper); tail.rotation.x = 0.4;
  const head = new THREE.Group(); head.position.y = 0.82; upper.add(head);
  mesh(new THREE.SphereGeometry(0.15, 12, 10), o.skin || '#f1c9a8', 0, 0, 0, head);
  const hat = mesh(new THREE.SphereGeometry(0.162, 12, 8, 0, TAU, 0, Math.PI / 1.9), o.hat || '#3d6fb6', 0, 0.02, 0, head);
  mesh(new THREE.SphereGeometry(0.065, 8, 6), '#ffffff', 0, 0.19, 0, head);
  if (o.goggles !== false) { const gg = mesh(new THREE.BoxGeometry(0.24, 0.07, 0.06), '#f0b429', 0, 0.02, -0.13, head); gg.rotation.x = -0.1; }
  else { mesh(new THREE.SphereGeometry(0.02, 5, 4), '#26304a', -0.05, 0.02, -0.14, head); mesh(new THREE.SphereGeometry(0.02, 5, 4), '#26304a', 0.05, 0.02, -0.14, head); }
  if (o.beard) mesh(new THREE.ConeGeometry(0.1, 0.22, 7), '#e6e2dc', 0, -0.12, -0.08, head).rotation.x = Math.PI;
  if (o.small) root.scale.setScalar(0.72);
  root.userData = { tilt, skis, lower, upper, armL, armR, head, tail, legs, poles: [armL.children[2], armR.children[2]], jacketMeshes: [upper.children[0], armL.children[0], armR.children[0]] };
  return root;
}
function setJacket(person, c) { person.userData.jacketMeshes.forEach(m => m.material = toon(c)); }

/* ================= creatures ================= */
const SPECIES = [
  { id: 'hare', name: 'Snowshoe Hare', where: 'Forest edges', desc: 'Huge hind feet work like snowshoes, and its coat turns white each winter so it vanishes against the snow.' },
  { id: 'fox', name: 'Silver Fox', where: 'Quiet woods', desc: 'Listens for mice moving under the snow, then leaps and dives in nose-first.' },
  { id: 'ibex', name: 'Alpine Ibex', where: 'High, rocky ground', desc: 'A wild goat that walks up cliffs that look impossible. Males grow long curved horns.' },
  { id: 'ptarmigan', name: 'Ptarmigan', where: 'Near the treeline', desc: 'A plump grouse with feathered feet. On cold nights it burrows into the snow to stay warm.' },
  { id: 'ermine', name: 'Ermine', where: 'Rocks and lake shores', desc: 'A tiny weasel in a white winter coat, except for the black tip of its tail.' }
];
function makeCreature(id) {
  const g = new THREE.Group(), legs = [], wings = [];
  const leg = (x, z, h, r, c) => { const p = new THREE.Group(); p.position.set(x, h, z); g.add(p); mesh(new THREE.CylinderGeometry(r, r * 0.8, h, 5), c, 0, -h / 2, 0, p); legs.push(p); };
  const eye = (x, y, z) => mesh(new THREE.SphereGeometry(0.022, 5, 4), '#1d2230', x, y, z, g);
  if (id === 'hare') {
    mesh(new THREE.SphereGeometry(1, 10, 8), '#f7f8fc', 0, 0.3, 0, g).scale.set(0.24, 0.22, 0.34);
    mesh(new THREE.SphereGeometry(0.14, 10, 8), '#f7f8fc', 0, 0.48, -0.3, g);
    for (const sx of [-0.05, 0.05]) { const e = mesh(new THREE.SphereGeometry(1, 6, 5), '#eef0f6', sx, 0.7, -0.26, g); e.scale.set(0.035, 0.16, 0.06); e.rotation.x = 0.35; mesh(new THREE.SphereGeometry(0.03, 5, 4), '#5b5f6e', sx, 0.84, -0.22, g); }
    mesh(new THREE.SphereGeometry(0.07, 6, 5), '#ffffff', 0, 0.36, 0.33, g);
    eye(-0.07, 0.51, -0.4); eye(0.07, 0.51, -0.4);
    leg(-0.1, 0.18, 0.14, 0.05, '#eef0f6'); leg(0.1, 0.18, 0.14, 0.05, '#eef0f6');
  } else if (id === 'fox') {
    mesh(new THREE.SphereGeometry(1, 10, 8), '#8f98ad', 0, 0.48, 0, g).scale.set(0.2, 0.2, 0.46);
    mesh(new THREE.SphereGeometry(1, 8, 6), '#f2f3f8', 0, 0.4, -0.12, g).scale.set(0.15, 0.13, 0.3);
    mesh(new THREE.SphereGeometry(0.17, 10, 8), '#8f98ad', 0, 0.66, -0.5, g);
    const sn = mesh(new THREE.ConeGeometry(0.08, 0.22, 6), '#f2f3f8', 0, 0.62, -0.7, g); sn.rotation.x = -Math.PI / 2;
    mesh(new THREE.SphereGeometry(0.025, 5, 4), '#1d2230', 0, 0.63, -0.81, g);
    for (const sx of [-0.08, 0.08]) mesh(new THREE.ConeGeometry(0.06, 0.16, 4), '#5d6478', sx, 0.83, -0.48, g);
    eye(-0.07, 0.7, -0.64); eye(0.07, 0.7, -0.64);
    const t = mesh(new THREE.SphereGeometry(1, 8, 6), '#8f98ad', 0, 0.6, 0.62, g); t.scale.set(0.13, 0.13, 0.38); t.rotation.x = -0.6;
    mesh(new THREE.SphereGeometry(0.1, 6, 5), '#ffffff', 0, 0.83, 0.9, g);
    for (const [x, z] of [[-0.1, -0.28], [0.1, -0.28], [-0.1, 0.28], [0.1, 0.28]]) leg(x, z, 0.38, 0.035, '#3d4254');
  } else if (id === 'ibex') {
    mesh(new THREE.SphereGeometry(1, 10, 8), '#8a7563', 0, 1.0, 0, g).scale.set(0.36, 0.38, 0.7);
    mesh(new THREE.SphereGeometry(1, 8, 6), '#e6dccf', 0, 0.86, -0.05, g).scale.set(0.3, 0.22, 0.5);
    const nk = mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.5, 7), '#8a7563', 0, 1.3, -0.58, g); nk.rotation.x = -0.6;
    const hd = mesh(new THREE.SphereGeometry(1, 8, 6), '#7a6656', 0, 1.5, -0.78, g); hd.scale.set(0.15, 0.17, 0.26);
    for (const sx of [-0.07, 0.07]) { const hn = mesh(new THREE.TorusGeometry(0.32, 0.05, 5, 10, Math.PI * 1.05), '#5b4a3c', sx, 1.65, -0.55, g); hn.rotation.y = Math.PI / 2; hn.rotation.z = 0.2; }
    const bd = mesh(new THREE.ConeGeometry(0.05, 0.16, 5), '#5b4a3c', 0, 1.33, -0.92, g); bd.rotation.x = Math.PI;
    eye(-0.12, 1.55, -0.86); eye(0.12, 1.55, -0.86);
    for (const [x, z] of [[-0.18, -0.45], [0.18, -0.45], [-0.18, 0.45], [0.18, 0.45]]) leg(x, z, 0.8, 0.06, '#6f5d4f');
  } else if (id === 'ptarmigan') {
    mesh(new THREE.SphereGeometry(0.22, 10, 8), '#f6f7fb', 0, 0.24, 0, g);
    mesh(new THREE.SphereGeometry(0.12, 8, 6), '#f6f7fb', 0, 0.44, -0.14, g);
    const bk = mesh(new THREE.ConeGeometry(0.03, 0.08, 4), '#2b3142', 0, 0.43, -0.27, g); bk.rotation.x = -Math.PI / 2;
    mesh(new THREE.BoxGeometry(0.06, 0.025, 0.04), '#e0453a', 0, 0.5, -0.2, g);
    eye(-0.06, 0.46, -0.23); eye(0.06, 0.46, -0.23);
    const tl = mesh(new THREE.BoxGeometry(0.2, 0.04, 0.16), '#2b3142', 0, 0.3, 0.24, g); tl.rotation.x = 0.4;
    for (const sx of [-1, 1]) { const w = new THREE.Group(); w.position.set(sx * 0.18, 0.3, 0); g.add(w); mesh(new THREE.BoxGeometry(0.3, 0.03, 0.2), '#ffffff', sx * 0.15, 0, 0, w); wings.push(w); }
  } else {
    mesh(new THREE.SphereGeometry(1, 10, 8), '#fbfbfd', 0, 0.12, 0, g).scale.set(0.07, 0.07, 0.24);
    mesh(new THREE.SphereGeometry(0.065, 8, 6), '#fbfbfd', 0, 0.16, -0.25, g);
    for (const sx of [-0.035, 0.035]) mesh(new THREE.SphereGeometry(0.022, 5, 4), '#f0e6e6', sx, 0.22, -0.24, g);
    eye(-0.03, 0.18, -0.3); eye(0.03, 0.18, -0.3);
    const t = mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.2, 5), '#fbfbfd', 0, 0.15, 0.3, g); t.rotation.x = -1.1;
    mesh(new THREE.SphereGeometry(0.035, 5, 4), '#1d2230', 0, 0.2, 0.39, g);
  }
  g.userData = { legs, wings };
  return g;
}
