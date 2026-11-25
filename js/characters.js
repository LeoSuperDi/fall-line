/* Frostpeak Frontier: characters.js
   People and animal models.
   Loaded as a plain script; files share one global scope and load in the order listed in index.html. */
'use strict';

/* ================= people ================= */
function mesh(geo, c, x, y, z, par) { const m = new THREE.Mesh(geo, toon(c)); m.position.set(x, y, z); m.castShadow = true; par.add(m); return m; }
const shade = (hex, k) => '#' + C(hex).multiplyScalar(k).getHexString(); // a darker or lighter version of a colour
function capsule(r, len, seg) { // a rounded limb: cylinder with ball ends
  const parts = [{ geo: new THREE.CylinderGeometry(r, r * 0.92, len, seg || 8), col: '#ffffff' }, { geo: T(new THREE.SphereGeometry(r, seg || 8, 6), 0, len / 2, 0), col: '#ffffff' }, { geo: T(new THREE.SphereGeometry(r * 0.92, seg || 8, 6), 0, -len / 2, 0), col: '#ffffff' }];
  const g = merge(parts); g.deleteAttribute('color'); return g;
}
const LIMB = { thigh: capsule(0.1, 0.34), shin: capsule(0.085, 0.32), arm: capsule(0.078, 0.24), fore: capsule(0.068, 0.22) };
function makePerson(o) {
  // A skier with real joints: hips, knees, shoulders and elbows, so they can crouch, carve, walk and tuck.
  // Facing -z. Feet at y = 0, hips at 0.92, waist (the `upper` pivot) at 0.98.
  const root = new THREE.Group(), tilt = new THREE.Group(), skis = new THREE.Group(), lower = new THREE.Group(), upper = new THREE.Group();
  root.add(tilt); tilt.add(skis); tilt.add(lower); tilt.add(upper);
  const jacket = o.jacket, trim = o.trim || (C(jacket).getHSL({}).l > 0.6 ? '#2b3555' : '#f4f1ea'), pants = o.pants || '#2c3552', mitt = o.mitts || shade(jacket, 0.55);
  const sk = o.ski || '#ffd21f', jacketMeshes = [];
  const J = (geo, x, y, z, par) => { const m = mesh(geo, jacket, x, y, z, par); jacketMeshes.push(m); return m; };
  const legs = [], knees = [], ankles = [];
  for (const sx of [-0.13, 0.13]) {
    // ski: long base, a darker topsheet stripe, an upturned tip and a binding
    mesh(new THREE.BoxGeometry(0.12, 0.035, 1.72), sk, sx, 0.03, 0.02, skis);
    mesh(new THREE.BoxGeometry(0.05, 0.01, 1.5), shade(sk, 0.62), sx, 0.052, 0.06, skis);
    const tip = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 10, 1, false, 0, Math.PI), sk, sx, 0.09, -0.9, skis); tip.rotation.z = Math.PI / 2; tip.scale.set(1, 1, 1.4);
    mesh(new THREE.BoxGeometry(0.1, 0.05, 0.32), '#3a4256', sx, 0.06, 0.04, skis);
    // leg: thigh from the hip, shin from the knee, a chunky boot at the ankle
    const hip = new THREE.Group(); hip.position.set(sx, 0.92, 0); lower.add(hip); legs.push(hip);
    mesh(LIMB.thigh, pants, 0, -0.2, 0, hip);
    const knee = new THREE.Group(); knee.position.y = -0.42; hip.add(knee); knees.push(knee);
    mesh(LIMB.shin, pants, 0, -0.18, 0, knee);
    const ankle = new THREE.Group(); ankle.position.y = -0.36; knee.add(ankle); ankles.push(ankle); // keeps the boot flat on the ski whatever the knee does
    mesh(new THREE.BoxGeometry(0.17, 0.24, 0.27), '#2b3142', 0, 0, -0.02, ankle);
    mesh(new THREE.BoxGeometry(0.175, 0.04, 0.2), trim, 0, 0.07, -0.02, ankle); // buckle strap
    mesh(new THREE.BoxGeometry(0.18, 0.06, 0.33), '#1e2330', 0, -0.11, -0.03, ankle); // sole
  }
  upper.position.y = 0.98;
  mesh(new THREE.SphereGeometry(1, 12, 8), pants, 0, -0.02, 0, upper).scale.set(0.21, 0.14, 0.16); // seat
  J(new THREE.SphereGeometry(1, 14, 10), 0, 0.3, 0, upper).scale.set(0.255, 0.33, 0.2); // puffy jacket body
  J(new THREE.TorusGeometry(0.2, 0.05, 8, 18), 0, 0.06, 0, upper).rotation.x = Math.PI / 2; // hem
  mesh(new THREE.TorusGeometry(0.235, 0.032, 6, 20), trim, 0, 0.3, 0, upper).rotation.x = Math.PI / 2; // chest stripe
  mesh(new THREE.BoxGeometry(0.02, 0.42, 0.02), shade(jacket, 0.5), 0, 0.3, -0.196, upper); // zip
  J(new THREE.TorusGeometry(0.12, 0.06, 8, 16), 0, 0.6, 0, upper).rotation.x = Math.PI / 2; // collar
  const pack = mesh(new THREE.BoxGeometry(0.32, 0.4, 0.15), o.pack || '#56688d', 0, 0.34, 0.21, upper); pack.scale.set(1, 1, 1);
  mesh(new THREE.BoxGeometry(0.26, 0.12, 0.05), shade(o.pack || '#56688d', 0.7), 0, 0.24, 0.29, upper); // pocket
  for (const sx of [-0.11, 0.11]) { const st = mesh(new THREE.BoxGeometry(0.04, 0.36, 0.02), '#2b3142', sx, 0.38, -0.17, upper); st.rotation.x = -0.12; } // straps
  const armL = new THREE.Group(), armR = new THREE.Group(), poles = [], elbows = [];
  for (const [g, sx] of [[armL, -1], [armR, 1]]) {
    g.position.set(sx * 0.27, 0.52, 0); g.rotation.x = -0.45; g.rotation.z = sx * 0.22; upper.add(g);
    J(new THREE.SphereGeometry(0.095, 10, 8), 0, 0, 0, g); // puffy shoulder
    J(LIMB.arm, 0, -0.15, 0, g);
    const el = new THREE.Group(); el.position.y = -0.3; el.rotation.x = -0.55; g.add(el); elbows.push(el);
    J(LIMB.fore, 0, -0.13, 0, el);
    mesh(new THREE.TorusGeometry(0.07, 0.025, 6, 12), trim, 0, -0.24, 0, el).rotation.x = Math.PI / 2; // cuff
    mesh(new THREE.SphereGeometry(0.085, 10, 8), mitt, 0, -0.31, -0.01, el);
    const pole = new THREE.Group(); pole.position.set(0, -0.31, -0.01); pole.rotation.x = 0.55; el.add(pole); poles.push(pole);
    mesh(new THREE.CylinderGeometry(0.016, 0.014, 1.2, 5), '#c9ced8', 0, -0.55, 0, pole);
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 6), '#2b3142', 0, -0.02, 0, pole); // grip
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 8), '#2b3142', 0, -1.08, 0, pole); // basket
  }
  // scarf with a tail that streams behind at speed
  mesh(new THREE.TorusGeometry(0.115, 0.045, 6, 14), o.scarf || '#e23a5a', 0, 0.66, 0, upper).rotation.x = Math.PI / 2;
  const tail = mesh(new THREE.BoxGeometry(0.09, 0.3, 0.035), o.scarf || '#e23a5a', 0.06, 0.55, 0.15, upper); tail.rotation.x = 0.4;
  // head: a slightly big head reads as friendly at a distance
  const head = new THREE.Group(); head.position.y = 0.84; upper.add(head);
  mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8), o.skin || '#f1c9a8', 0, -0.13, 0, head);
  mesh(new THREE.SphereGeometry(0.165, 16, 12), o.skin || '#f1c9a8', 0, 0, 0, head);
  mesh(new THREE.SphereGeometry(0.03, 6, 5), shade(o.skin || '#f1c9a8', 0.85), 0, -0.02, -0.165, head); // nose
  for (const sx of [-0.085, 0.085]) mesh(new THREE.SphereGeometry(0.03, 6, 5), '#f0a3a0', sx, -0.05, -0.135, head).scale.set(1, 0.6, 0.5); // cheeks
  const ht = o.hatType || (o.goggles !== false ? 'helmet' : 'beanie');
  if (ht === 'helmet') {
    mesh(new THREE.SphereGeometry(0.18, 16, 10, 0, TAU, 0, Math.PI / 1.85), o.hat || '#e9ecf3', 0, 0.025, 0.005, head); // helmet
    mesh(new THREE.BoxGeometry(0.05, 0.06, 0.26), shade(o.hat || '#e9ecf3', 0.75), 0, 0.17, 0.02, head); // helmet ridge
    mesh(new THREE.TorusGeometry(0.172, 0.02, 6, 20), '#2b3142', 0, 0.035, 0, head).rotation.x = Math.PI / 2; // strap
    const lens = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, -0.95, 1.9, 1.2, 0.75), new THREE.MeshBasicMaterial({ color: o.lens || 0xf2994a, side: THREE.DoubleSide }));
    lens.scale.setScalar(0.178); lens.rotation.y = Math.PI; lens.position.y = 0.03; head.add(lens);
    const glint = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.016), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); glint.position.set(-0.05, 0.075, -0.17); glint.rotation.z = 0.3; head.add(glint);
  } else {
    const hc = o.hat || '#3d6fb6';
    if (ht === 'beanie' || ht === 'earflap') { mesh(new THREE.SphereGeometry(0.172, 14, 8, 0, TAU, 0, Math.PI / 2.1), hc, 0, 0.035, 0, head);
      if (ht === 'beanie') { mesh(new THREE.TorusGeometry(0.168, 0.03, 6, 20), shade(hc, 0.75), 0, 0.045, 0, head).rotation.x = Math.PI / 2; mesh(new THREE.SphereGeometry(0.06, 8, 6), '#f4f1ea', 0, 0.21, 0, head); }
      else for (const sx of [-1, 1]) { const f = mesh(new THREE.BoxGeometry(0.05, 0.16, 0.12), shade(hc, 0.8), sx * 0.165, -0.02, 0.01, head); f.rotation.z = sx * 0.15; mesh(new THREE.SphereGeometry(0.035, 6, 5), '#efe6d6', sx * 0.17, -0.1, 0.01, head); } }
    else if (ht === 'wide') { mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.025, 20), hc, 0, 0.1, 0, head); mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.13, 14), hc, 0, 0.17, 0, head); mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.03, 14), shade(hc, 0.6), 0, 0.12, 0, head); }
    else if (ht === 'hardhat') { mesh(new THREE.SphereGeometry(0.185, 14, 8, 0, TAU, 0, Math.PI / 2), hc, 0, 0.06, 0, head); mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.02, 18), hc, 0, 0.06, -0.02, head); mesh(new THREE.BoxGeometry(0.04, 0.05, 0.3), shade(hc, 0.8), 0, 0.23, 0, head); mesh(new THREE.BoxGeometry(0.2, 0.06, 0.04), '#2b3142', 0, 0.03, -0.17, head); }
    else if (ht === 'hood') { const h = mesh(new THREE.SphereGeometry(0.21, 14, 10, 0, TAU, 0, Math.PI / 1.6), hc, 0, 0.02, 0.03, head); h.scale.set(1, 1.05, 1.1); mesh(new THREE.TorusGeometry(0.16, 0.055, 8, 18), o.fur || '#efe6d6', 0, 0.0, -0.13, head); }
    for (const sx of [-0.06, 0.06]) { mesh(new THREE.SphereGeometry(0.026, 8, 6), '#1f2433', sx, 0.01, -0.152, head); mesh(new THREE.SphereGeometry(0.009, 5, 4), '#ffffff', sx + 0.008, 0.02, -0.176, head); }
    mesh(new THREE.TorusGeometry(0.035, 0.008, 4, 10, Math.PI), '#9a5b52', 0, -0.07, -0.152, head).rotation.z = Math.PI; // smile
  }
  if (o.beard) { const b = mesh(new THREE.SphereGeometry(0.13, 10, 8), '#e6e2dc', 0, -0.1, -0.06, head); b.scale.set(1, 1.1, 0.8); }
  if (o.small) root.scale.setScalar(0.72);
  // a slight athletic stance by default, so people standing around do not look like posts
  legs.forEach(h => h.rotation.x = 0.12); knees.forEach(k => k.rotation.x = -0.24); ankles.forEach(a => a.rotation.x = 0.12);
  root.userData = { tilt, skis, lower, upper, armL, armR, head, tail, legs, knees, ankles, elbows, poles, jacketMeshes };
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
